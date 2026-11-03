"use strict";
// Wikidot (FTML) -> ordinary GitHub flavoured Markdown.
//
// The conversion is deliberately forgiving: FTML produced by include-expansion
// regularly contains unbalanced or half-written tags, and the preview should
// still show readable text instead of raw wiki syntax.

const common = require("./common");

const DEFAULT_BASE = "https://scp-wiki-cn.wikidot.com/";
const STASH_PREFIX = "\u0000STASH";
const STASH_SUFFIX = "\u0000";

function normalizeOptions(options) {
  const input = options && typeof options === "object" ? options : {};
  let base = typeof input.base === "string" && input.base.trim() ? input.base.trim() : DEFAULT_BASE;
  if (!/\/$/.test(base)) base += "/";
  return {
    base,
    page: typeof input.page === "string" && input.page ? input.page : undefined,
  };
}

function stashValue(state, value) {
  state.stash.push(value);
  return "\n\n" + STASH_PREFIX + (state.stash.length - 1) + STASH_SUFFIX + "\n\n";
}

function restoreStash(text, state) {
  // Restore in reverse: a table may legally contain a code placeholder.
  for (let i = state.stash.length - 1; i >= 0; i--) {
    const token = STASH_PREFIX + i + STASH_SUFFIX;
    if (text.indexOf(token) !== -1) text = text.split(token).join(state.stash[i]);
  }
  return text;
}

function originOf(base) {
  try {
    return new URL(base).origin;
  } catch (error) {
    const match = /^(https?:\/\/[^/]+)/i.exec(String(base || ""));
    return match ? match[1] : "";
  }
}

/* ------------------------------------------------------------------ *
 * Stage 1: opaque blocks and syntax that must disappear before lines
 * are interpreted.
 * ------------------------------------------------------------------ */

function protectCode(text, state) {
  return text.replace(
    /\[\[code\b([^\]]*)\]\]\s*([\s\S]*?)\[\[\/code\s*\]\]/gi,
    (match, args, raw) => {
      let body = raw;
      if (body.startsWith("\n")) body = body.slice(1);
      if (body.endsWith("\n")) body = body.slice(0, -1);
      let lang = "";
      const type = common.attr(args, "type");
      if (type) lang = String(type).trim().split(/\s+/)[0];
      // Never let the fence collide with backticks inside the code.
      let longest = 0;
      const runs = body.match(/`+/g);
      if (runs) for (const run of runs) longest = Math.max(longest, run.length);
      const fence = "`".repeat(Math.max(3, longest + 1));
      const value = fence + lang + "\n" + body + (body ? "\n" : "") + fence;
      return stashValue(state, value);
    }
  );
}

function removeComments(text) {
  text = text.replace(/\[!--[\s\S]*?--\]/g, "");
  // An unterminated comment is still a comment.
  return text.replace(/\[!--[\s\S]*$/g, "");
}

function removeOpaqueBlocks(text) {
  const omitted = "\n\n<!-- html block omitted -->\n\n";
  text = text.replace(/\[\[html\b[^\]]*\]\][\s\S]*?\[\[\/html\s*\]\]/gi, () => omitted);
  text = text.replace(/\[\[embed\b[^\]]*\]\][\s\S]*?\[\[\/embed\s*\]\]/gi, () => omitted);
  // Unclosed variants: drop the opening tag but keep whatever came after.
  text = text.replace(/\[\[(?:html|embed)\b[^\]]*\]\]/gi, "\n<!-- html block omitted -->\n");
  return text.replace(/\[\[\/(?:html|embed)\s*\]\]/gi, "");
}

function removeModules(text) {
  // CSS modules are configuration, not content. They are always removed whole.
  text = text.replace(/\[\[module\s+css\b[^\]]*\]\][\s\S]*?\[\[\/module\s*\]\]/gi, "");

  // Other modules are normally self-closing ([[module rate]]) but ListPages
  // and friends come with a body. Pair an opener with the next closer only
  // when no other opener sits between them; that keeps a bodyless module from
  // swallowing unrelated later content.
  const re = /\[\[(\/?)(module)\b([^\]]*)\]\]/gi;
  const tokens = [];
  let match;
  while ((match = re.exec(text))) {
    tokens.push({
      index: match.index,
      end: match.index + match[0].length,
      close: match[1] === "/",
    });
  }
  if (!tokens.length) return text;

  let out = "";
  let cursor = 0;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    out += text.slice(cursor, token.index);
    if (token.close) {
      cursor = token.end;
      continue;
    }
    if (i + 1 < tokens.length && tokens[i + 1].close) {
      cursor = tokens[i + 1].end;
      i += 1;
    } else {
      cursor = token.end;
    }
  }
  return out + text.slice(cursor);
}

function removeIncludes(text) {
  // The include tag may span many lines: consume through the first ]].
  text = text.replace(/\[\[include\b[\s\S]*?\]\]/gi, "");
  // Unterminated include: remove the rest of the source line only.
  return text.replace(/\[\[include\b[^\n]*/gi, "");
}

function extractFootnotes(text, state) {
  text = text.replace(
    /\[\[footnote\b[^\]]*\]\]([\s\S]*?)\[\[\/footnote\s*\]\]/gi,
    (match, body) => {
      state.footnotes.push(body);
      return "[^" + state.footnotes.length + "]";
    }
  );
  text = text.replace(/\[\[footnote\b[^\]]*\]\]/gi, "");
  return text.replace(/\[\[\/footnote\s*\]\]/gi, "");
}

/* ------------------------------------------------------------------ *
 * Advanced [[table]] blocks
 * ------------------------------------------------------------------ */

function cleanCellText(text) {
  let value = transformSpecialTags(String(text || ""));
  value = stripContainerTags(value);
  return value.replace(/\s+/g, " ").trim();
}

function renderInlineCell(text, state) {
  return inline(text, state).replace(/\|/g, "\\|").trim();
}

function parseAdvancedRow(text) {
  const cells = [];
  const re = /\[\[(h?cell)\b[^\]]*\]\]([\s\S]*?)\[\[\/(?:h?cell)\s*\]\]/gi;
  let match;
  while ((match = re.exec(text))) {
    cells.push({ raw: match[2], header: match[1].toLowerCase() === "hcell" });
  }
  return cells;
}

function renderAdvancedTable(body, state) {
  const rows = [];
  const rowRe = /\[\[row\b[^\]]*\]\]([\s\S]*?)\[\[\/row\s*\]\]/gi;
  let rowMatch;
  while ((rowMatch = rowRe.exec(body))) rows.push(parseAdvancedRow(rowMatch[1]));
  if (!rows.length) rows.push(parseAdvancedRow(body));
  if (!rows.some((row) => row.length)) return "";

  const singleLine = rows.every((row) =>
    row.every((cell) => !cell.raw.trim().includes("\n") && !cell.raw.includes("\u0000STASH"))
  );

  if (singleLine) {
    let headerIndex = rows.findIndex((row) => row.some((cell) => cell.header));
    if (headerIndex < 0) headerIndex = 0;
    const columns = Math.max(...rows.map((row) => row.length), 1);
    const renderRow = (row) => {
      const cells = [];
      for (let i = 0; i < columns; i++) {
        const cell = row[i];
        cells.push(cell ? renderInlineCell(cleanCellText(cell.raw), state) : "");
      }
      return "| " + cells.join(" | ") + " |";
    };
    const lines = [renderRow(rows[headerIndex])];
    lines.push("| " + new Array(columns).fill("---").join(" | ") + " |");
    for (let i = 0; i < rows.length; i++) {
      if (i === headerIndex) continue;
      lines.push(renderRow(rows[i]));
    }
    return lines.join("\n");
  }

  // Cells with real block content: flatten the whole table into paragraphs.
  const parts = [];
  for (const row of rows) {
    for (const cell of row) {
      const raw = cell.raw.trim();
      if (!raw) continue;
      const rendered = convertFragment(raw, state);
      if (rendered) parts.push(rendered);
    }
  }
  return parts.join("\n\n");
}

function replaceAdvancedTables(text, state) {
  return text.replace(
    /\[\[table\b[^\]]*\]\]([\s\S]*?)\[\[\/table\s*\]\]/gi,
    (match, body) => {
      const rendered = renderAdvancedTable(body, state);
      return rendered ? stashValue(state, rendered) : "";
    }
  );
}

/* ------------------------------------------------------------------ *
 * Stage 2: container tags
 * ------------------------------------------------------------------ */

function transformSpecialTags(text) {
  text = text.replace(/\[\[collapsible\b([^\]]*)\]\]/gi, (match, args) => {
    const show = common.attr(args, "show");
    return "\n\n<details><summary>" + (show === undefined ? "show" : show) +
      "</summary>\n\n";
  });
  text = text.replace(/\[\[\/collapsible\s*\]\]/gi, "\n\n</details>\n\n");
  text = text.replace(/\[\[tab\s+([^\]\n]+?)\]\]/gi, (match, name) =>
    "\n\n**" + name.trim() + "**\n\n"
  );
  text = text.replace(/\[\[\/tab\s*\]\]/gi, "\n");
  return text;
}

function stripContainerTags(text) {
  text = text.replace(
    /\[\[\/?(?:div_?|span_?|size|note|quote|tabview|tab|table|row|h?cell|bibliography|footnoteblock|toc|f[<>]toc|collapsible|module)(?=[\s\]])[^\]]*\]\]/gi,
    ""
  );
  // Alignment / centering markers with no body.
  text = text.replace(/\[\[\/?=+\]\]/g, "");
  text = text.replace(/\[\[\/?[<>]\]\]/g, "");
  return text.replace(/\[\[\/?f[<>]\]\]/g, "");
}

/* ------------------------------------------------------------------ *
 * Inline conversion
 * ------------------------------------------------------------------ */

function escapeLiteral(value) {
  return String(value).replace(/([\\`*_{}\[\]<>()#+.!|~-])/g, "\\$1");
}

function codeSpan(value) {
  const text = String(value);
  if (text.indexOf("`") < 0) return "`" + text + "`";
  return "`` " + text + " ``";
}

function splitImageArgs(value) {
  const text = String(value || "").trim();
  if (!text) return { url: "", attrs: "" };
  if (text[0] === '"' || text[0] === "'") {
    const quote = text[0];
    const end = text.indexOf(quote, 1);
    if (end >= 0) return { url: text.slice(1, end), attrs: text.slice(end + 1) };
    return { url: text.slice(1), attrs: "" };
  }
  const match = /^(\S+)([\s\S]*)$/.exec(text);
  return match ? { url: match[1], attrs: match[2] } : { url: text, attrs: "" };
}

function resolveImageUrl(url, opts) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return "https:" + value;
  if (value.startsWith("/")) return originOf(opts.base) + value;
  if (opts.page) return opts.base + "local--files/" + opts.page + "/" + value.replace(/^\.\//, "");
  return value;
}

function inline(input, state) {
  const s = String(input == null ? "" : input);
  const n = s.length;
  let out = "";
  let i = 0;

  while (i < n) {
    const rest = s.slice(i);

    if (s[i] === "\u0000") {
      const token = /^\u0000STASH\d+\u0000/.exec(rest);
      if (token) {
        out += token[0];
        i += token[0].length;
        continue;
      }
    }

    // [[[page|label]]]
    if (rest.startsWith("[[[")) {
      const match = /^\[\[\[\*?([^\]|]+?)(?:\|([^\]]*?))?\]\]\]/.exec(rest);
      if (match) {
        const page = match[1].trim();
        const label = (match[2] === undefined ? page : match[2]).trim() || page;
        out += "[" + inline(label, state) + "](" + state.opts.base + common.unixName(page) + ")";
        i += match[0].length;
        continue;
      }
    }

    // [[image ...]], [[=image ...]], [[f<image ...]], ...
    if (rest.startsWith("[[")) {
      const image = /^\[\[(=image|f<image|f>image|<image|>image|image)(?=[\s\]])([^\]]*)\]\]/i.exec(rest);
      if (image) {
        const args = splitImageArgs(image[2]);
        const url = resolveImageUrl(args.url, state.opts);
        const alt = common.attr(args.attrs, "alt");
        out += "![" + String(alt === undefined ? "" : alt).replace(/\]/g, "\\]") + "](" + url + ")";
        i += image[0].length;
        continue;
      }

      // [[a href="..."] ]label[[/a]]
      const anchorTag = /^\[\[a\b([^\]]*)\]\]/i.exec(rest);
      if (anchorTag) {
        const after = i + anchorTag[0].length;
        const close = /\[\[\/a\s*\]\]/i.exec(s.slice(after));
        if (close) {
          const label = s.slice(after, after + close.index);
          const href = common.attr(anchorTag[1], "href");
          out += href ? "[" + inline(label, state) + "](" + href + ")" : inline(label, state);
          i = after + close.index + close[0].length;
          continue;
        }
      }

      // [[user name]] / [[*user name]]
      const user = /^\[\[\*?user\b([^\]]*)\]\]/i.exec(rest);
      if (user) {
        const bits = user[1].trim().split("|");
        const name = bits[0].trim();
        const label = bits.length > 1 ? bits[1].trim() : name;
        out += label || name;
        i += user[0].length;
        continue;
      }

      // [[# anchor]]
      const anchor = /^\[\[#\s*([^\]]*?)\]\]/.exec(rest);
      if (anchor) {
        const id = anchor[1].trim().replace(/"/g, "&quot;");
        out += '<a id="' + id + '"></a>';
        i += anchor[0].length;
        continue;
      }

      // A footnote that survived the block pass (e.g. in a table cell).
      const footnote = /^\[\[footnote\b([^\]]*)\]\]/i.exec(rest);
      if (footnote) {
        const after = i + footnote[0].length;
        const close = /\[\[\/footnote\s*\]\]/i.exec(s.slice(after));
        if (close) {
          state.footnotes.push(s.slice(after, after + close.index));
          out += "[^" + state.footnotes.length + "]";
          i = after + close.index + close[0].length;
          continue;
        }
      }

      // Unknown or leftover tag: drop it.
      const tagEnd = s.indexOf("]]", i + 2);
      if (tagEnd >= 0) {
        i = tagEnd + 2;
        continue;
      }
      out += "[[";
      i += 2;
      continue;
    }

    // [https://x label], [*https://x label], [#anchor label], [/path label]
    if (s[i] === "[" && s[i + 1] !== "[" && s[i + 1] !== undefined) {
      const link = /^\[\*?(https?:\/\/[^\s\]]+|#[^\s\]]+|\/[^\s\]]+)\s*([^\]]*?)\]/.exec(rest);
      if (link) {
        const target = link[1];
        const label = link[2].trim() || target;
        let href = target;
        if (target.startsWith("#")) href = target;
        else if (target.startsWith("/")) href = originOf(state.opts.base) + target;
        out += "[" + inline(label, state) + "](" + href + ")";
        i += link[0].length;
        continue;
      }
    }

    // Bare URL: copy verbatim so that // inside it is never treated as italic.
    if (rest.startsWith("http://") || rest.startsWith("https://")) {
      const url = /^https?:\/\/[^\s<>\[\]"']+/i.exec(rest);
      if (url) {
        out += url[0];
        i += url[0].length;
        continue;
      }
    }

    if (rest.startsWith("**")) {
      const end = s.indexOf("**", i + 2);
      if (end >= 0) {
        out += "**" + inline(s.slice(i + 2, end), state) + "**";
        i = end + 2;
        continue;
      }
      out += "**";
      i += 2;
      continue;
    }

    if (rest.startsWith("//")) {
      const end = s.indexOf("//", i + 2);
      if (end >= 0) {
        out += "*" + inline(s.slice(i + 2, end), state) + "*";
        i = end + 2;
        continue;
      }
      out += "//";
      i += 2;
      continue;
    }

    if (rest.startsWith("__")) {
      const end = s.indexOf("__", i + 2);
      if (end >= 0) {
        out += "<u>" + inline(s.slice(i + 2, end), state) + "</u>";
        i = end + 2;
        continue;
      }
      out += "__";
      i += 2;
      continue;
    }

    if (rest.startsWith("^^")) {
      const end = s.indexOf("^^", i + 2);
      if (end >= 0) {
        out += "<sup>" + inline(s.slice(i + 2, end), state) + "</sup>";
        i = end + 2;
        continue;
      }
      out += "^^";
      i += 2;
      continue;
    }

    if (rest.startsWith(",,")) {
      const end = s.indexOf(",,", i + 2);
      if (end >= 0) {
        out += "<sub>" + inline(s.slice(i + 2, end), state) + "</sub>";
        i = end + 2;
        continue;
      }
      out += ",,";
      i += 2;
      continue;
    }

    if (rest.startsWith("{{")) {
      const end = s.indexOf("}}", i + 2);
      if (end >= 0) {
        out += codeSpan(s.slice(i + 2, end));
        i = end + 2;
        continue;
      }
      out += "{{";
      i += 2;
      continue;
    }

    if (rest.startsWith("##")) {
      const end = s.indexOf("##", i + 2);
      if (end > i + 2) {
        const parts = s.slice(i + 2, end).split("|");
        if (parts.length >= 2) {
          const text = parts.length >= 3 ? parts.slice(2).join("|") : parts[1];
          out += inline(text, state);
          i = end + 2;
          continue;
        }
      }
      out += "##";
      i += 2;
      continue;
    }

    if (rest.startsWith("@@")) {
      const end = s.indexOf("@@", i + 2);
      if (end >= 0) {
        out += escapeLiteral(s.slice(i + 2, end));
        i = end + 2;
        continue;
      }
      out += "@";
      i += 1;
      continue;
    }

    if (rest.startsWith("@<")) {
      const end = s.indexOf(">@", i + 2);
      if (end >= 0) {
        out += escapeLiteral(s.slice(i + 2, end));
        i = end + 2;
        continue;
      }
      out += "@";
      i += 1;
      continue;
    }

    // -- surrounded by spaces is an em dash; otherwise it is strike-through.
    if (rest.startsWith("--")) {
      if (i > 0 && /\s/.test(s[i - 1]) && i + 2 < n && /\s/.test(s[i + 2])) {
        out += "\u2014";
        i += 2;
        continue;
      }
      const end = s.indexOf("--", i + 2);
      if (end >= 0) {
        out += "~~" + inline(s.slice(i + 2, end), state) + "~~";
        i = end + 2;
        continue;
      }
      out += "--";
      i += 2;
      continue;
    }

    if (rest.startsWith("...")) {
      out += "\u2026";
      i += 3;
      continue;
    }

    // ``text'' -> curly quoted text
    if (rest.startsWith("``")) {
      const end = s.indexOf("''", i + 2);
      if (end > i + 2) {
        out += "\u201c" + s.slice(i + 2, end) + "\u201d";
        i = end + 2;
        continue;
      }
    }
    if (s[i] === "`") {
      const end = s.indexOf("''", i + 1);
      if (end > i + 1) {
        out += "\u201c" + s.slice(i + 1, end) + "\u201d";
        i = end + 2;
        continue;
      }
    }

    out += s[i];
    i += 1;
  }

  return out;
}

/* ------------------------------------------------------------------ *
 * Stage 3: line based block structure
 * ------------------------------------------------------------------ */

function isListLine(line) {
  return /^[ \t]*[*#]\s+/.test(line);
}

function isSpecialLine(line) {
  const text = line.trim();
  if (!text) return true;
  if (/^\u0000STASH\d+\u0000$/.test(text)) return true;
  if (text.startsWith("||")) return true;
  if (isListLine(line)) return true;
  if (/^\s*>/.test(line)) return true;
  if (/^\+{1,6}\*?\s+/.test(line)) return true;
  if (/^=(?!=)\s+/.test(line)) return true;
  if (/^:\s*[^:]+?\s*:\s*/.test(line)) return true;
  if (/^-{4,}\s*$/.test(text)) return true;
  if (/^@@\s*@@$/.test(text)) return true;
  if (/^<!--/.test(text)) return true;
  if (/^<\/?details(?:\s|>)/i.test(text)) return true;
  return false;
}

function collectList(lines, start, state) {
  const out = [];
  let i = start;
  while (i < lines.length) {
    const match = /^([ \t]*)([*#])\s+(.*)$/.exec(lines[i]);
    if (!match) break;
    const depth = match[1].length;
    const indent = " ".repeat(depth * (match[2] === "*" ? 2 : 3));
    let content = match[3];
    let needsBreak = / _$/.test(content);
    if (needsBreak) content = content.replace(/ _$/, "");
    let line = indent + (match[2] === "*" ? "- " : "1. ") + inline(content, state);

    while (needsBreak) {
      line += "<br>";
      i += 1;
      if (i >= lines.length) {
        needsBreak = false;
        break;
      }
      const next = lines[i];
      if (!next.trim() || isListLine(next) || isSpecialLine(next)) {
        i -= 1;
        needsBreak = false;
        break;
      }
      let text = next.trim();
      needsBreak = / _$/.test(text);
      if (needsBreak) text = text.replace(/ _$/, "");
      line += inline(text, state);
    }

    out.push(line);
    i += 1;
  }
  return { md: out.join("\n"), next: i };
}

function collectQuotes(lines, start, state) {
  const out = [];
  let i = start;
  while (i < lines.length) {
    const match = /^\s*(>+)\s?(.*)$/.exec(lines[i]);
    if (!match) break;
    const prefix = "> ".repeat(match[1].length);
    out.push((prefix + inline(match[2], state)).replace(/\s+$/, ""));
    i += 1;
  }
  return { md: out.join("\n"), next: i };
}

function tableCell(text, state) {
  return inline(text, state).replace(/\|/g, "\\|").trim();
}

function collectSimpleTable(lines, start, state) {
  const rows = [];
  let i = start;
  while (i < lines.length && lines[i].trim().startsWith("||")) {
    let body = lines[i].trim();
    if (body.startsWith("||")) body = body.slice(2);
    if (body.endsWith("||")) body = body.slice(0, -2);
    const cells = body.split("||").map((cell) => cell.trim().replace(/^~\s*/, ""));
    rows.push(cells);
    i += 1;
  }
  if (!rows.length) return { md: "", next: i };

  const columns = Math.max(...rows.map((row) => row.length), 1);
  const renderRow = (row) => {
    const cells = [];
    for (let c = 0; c < columns; c++) {
      cells.push(c < row.length ? tableCell(row[c], state) : "");
    }
    return "| " + cells.join(" | ") + " |";
  };
  const output = [renderRow(rows[0])];
  output.push("| " + new Array(columns).fill("---").join(" | ") + " |");
  for (let r = 1; r < rows.length; r++) output.push(renderRow(rows[r]));
  return { md: output.join("\n"), next: i };
}

function processLines(text, state) {
  const lines = text.split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (/^\u0000STASH\d+\u0000$/.test(trimmed)) {
      blocks.push(trimmed);
      i += 1;
      continue;
    }

    if (trimmed.startsWith("||")) {
      const table = collectSimpleTable(lines, i, state);
      if (table.md) blocks.push(table.md);
      i = table.next;
      continue;
    }

    if (isListLine(line)) {
      const list = collectList(lines, i, state);
      blocks.push(list.md);
      i = list.next;
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quote = collectQuotes(lines, i, state);
      blocks.push(quote.md);
      i = quote.next;
      continue;
    }

    let match = /^(\+{1,6})\*?\s+(.*)$/.exec(line);
    if (match) {
      blocks.push("#".repeat(match[1].length) + " " + inline(match[2], state));
      i += 1;
      continue;
    }

    match = /^=(?!=)\s+(.*)$/.exec(line);
    if (match) {
      blocks.push(inline(match[1], state));
      i += 1;
      continue;
    }

    match = /^:\s*([^:]+?)\s*:\s*(.*)$/.exec(line);
    if (match) {
      const definitions = [];
      while (i < lines.length) {
        const item = /^:\s*([^:]+?)\s*:\s*(.*)$/.exec(lines[i]);
        if (!item) break;
        definitions.push(
          "**" + inline(item[1].trim(), state) + "**: " + inline(item[2].trim(), state)
        );
        i += 1;
      }
      blocks.push(definitions.join("\n"));
      continue;
    }

    if (/^-{4,}\s*$/.test(trimmed)) {
      blocks.push("---");
      i += 1;
      continue;
    }

    if (/^@@\s*@@$/.test(trimmed)) {
      i += 1;
      continue;
    }

    if (/^<!--/.test(trimmed)) {
      blocks.push(trimmed);
      i += 1;
      continue;
    }

    if (/^<\/?details(?:\s|>)/i.test(trimmed)) {
      blocks.push(trimmed);
      i += 1;
      continue;
    }

    // Ordinary paragraph: every source line is one line in the paragraph and
    // gets a CommonMark hard break before its successor.
    const paragraph = [];
    while (i < lines.length) {
      const current = lines[i];
      if (!current.trim() || isSpecialLine(current)) break;
      const converted = inline(current, state).replace(/\s+$/, "");
      if (converted) paragraph.push(converted);
      i += 1;
    }
    if (paragraph.length) blocks.push(paragraph.join("\\\n"));
  }

  return blocks.join("\n\n");
}

/* ------------------------------------------------------------------ *
 * Footnotes, fragments, top level
 * ------------------------------------------------------------------ */

function renderFootnote(raw, state) {
  let text = String(raw || "").replace(/\s+/g, " ").trim();
  text = stripContainerTags(text);
  return inline(text, state).replace(/\s+/g, " ").trim();
}

function convertFragment(raw, state) {
  let text = String(raw || "");
  text = transformSpecialTags(text);
  text = stripContainerTags(text);
  return processLines(text, state).trim();
}

function finalScrub(text) {
  // Safety net for half-written tags: the preview must never show raw
  // [[div / [[span / [[/ ... syntax again.
  text = text.replace(/\[\[\/?(?:div|span)\b[^\n]*/gi, "");
  return text.replace(/\[\[\/[^\n]*/g, "");
}

function toMarkdown(source, options = { base: DEFAULT_BASE }) {
  const opts = normalizeOptions(options);
  const state = { footnotes: [], stash: [], opts };

  let text = String(source == null ? "" : source).replace(/\r\n?/g, "\n");
  text = protectCode(text, state);
  text = removeComments(text);
  text = removeOpaqueBlocks(text);
  text = removeModules(text);
  text = removeIncludes(text);
  text = extractFootnotes(text, state);
  text = replaceAdvancedTables(text, state);
  text = transformSpecialTags(text);
  text = stripContainerTags(text);

  let output = processLines(text, state);

  if (state.footnotes.length) {
    const definitions = state.footnotes.map((raw, index) =>
      "[^" + (index + 1) + "]: " + renderFootnote(raw, state)
    );
    output += (output ? "\n\n" : "") + definitions.join("\n");
  }

  output = output.replace(/\n{3,}/g, "\n\n").replace(/^\n+/, "").replace(/\n+$/, "");
  // Scrub while code/tables are still placeholders so their contents survive
  // verbatim, then put the opaque blocks back.
  output = finalScrub(output);
  output = restoreStash(output, state);
  output = output.replace(/^\n+/, "").replace(/\n+$/, "");

  return output ? output + "\n" : "";
}

module.exports={toMarkdown};