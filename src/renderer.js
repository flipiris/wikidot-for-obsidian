"use strict";
const {rebaseCSS}=require("./css");
const {minimalPalette}=require("./contrast");
const {prepareSource}=require("./syntax");
const {fontSize, unixName, attr} = require("./common");
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function safeUrl(value, base = "https://scp-wiki-cn.wikidot.com/") {
  try { const url = new URL(value, base); return ["https:", "http:"].includes(url.protocol) ? url.href : ""; } catch { return ""; }
}
// [[html]] and [[embed]] are the only places raw markup is allowed. Scripts,
// event handlers and meta redirects are removed so the sandbox policy holds.
function sanitizeHTML(text) {
  return String(text)
    .replace(/<script[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<style[\s\S]*?<\/style\s*>/gi, "")
    .replace(/<(?:meta|base|link)\b[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(?:href|src|action)\s*=\s*(?:"|')?\s*javascript:[^"'>\s]*/gi, "");
}
const ALIGN = {"=": "center", ">": "right", "<": "left", "==": "justify"};
const COLOR = /^[#\w(),.%\s-]+$/;
// common.fontSize accepts the full keyword set; keep the historical pixel
// equivalents for the two relative keywords used by existing stylesheets.
function cssSize(value) {
  const size = fontSize(value);
  return size === "smaller" ? "0.8em" : size === "larger" ? "1.2em" : size;
}
function parseArgs(text) {
  const attrs = {};
  const raw = String(text || "").replace(/\s+([a-z_][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"']+))/gi, (all, key, dq, sq, bare) => {
    attrs[key.toLowerCase()] = dq ?? sq ?? bare ?? "";
    return "";
  }).trim();
  return { value: raw.split(/\s+/)[0] || "", attrs, raw };
}
function render(source, options = {}) {
  const warnings = new Set(), css = [], fragments = [], headings = [], footnotes = [];
  let sawFootnotes = false, tabCount = 0;
  source = source.replace(/\r\n?/g, "\n").replace(/\u0000/g, "");
  const original = source, offsets = [0];
  for (let index = 0; index < source.length; index++) if (source[index] === "\n") offsets.push(index + 1);
  function mark(html, start, end) {
    if (!options.editable) return html;
    const from = offsets[start] ?? original.length, to = end < offsets.length ? offsets[end] - 1 : original.length;
    return html.replace(/^<([a-z][\w-]*)/i, `<$1 data-wd-block="true" data-wd-start="${from}" data-wd-end="${Math.max(from, to)}"`);
  }
  const base = safeUrl(options.base || "https://scp-wiki-cn.wikidot.com/") || "https://scp-wiki-cn.wikidot.com/";
  const page = String(options.page || "").trim();
  // Attachments live under local--files/<page>/ on the reference site.
  function attachment(value) {
    const name = String(value || "").trim();
    if (!name || /^[a-z][a-z0-9+.-]*:/i.test(name) || name.startsWith("/") || name.startsWith(":") || !page) return "";
    return safeUrl("local--files/" + encodeURIComponent(page) + "/" + name.split("/").map(encodeURIComponent).join("/"), base);
  }
  function fragment(html) { return `\u0000${fragments.push(html) - 1}\u0000`; }
  function contentBase() { return options.contentBase || base; }
  function attrs(text, allowed = ["class", "id", "style", "title", "colspan", "rowspan", "align", "width", "height"]) {
    let output = "";
    for (const m of String(text || "").matchAll(/\b([a-z][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
      const name = m[1].toLowerCase(), value = m[2] ?? m[3];
      if (allowed.includes(name) || name.startsWith("data-") || name.startsWith("aria-")) output += ` ${name}="${escape(value)}"`;
    }
    return output;
  }
  source = prepareSource(source, options.tags || []);
  function lineAt(index) { return source.slice(0, index).split("\n").length - 1; }
  function opaque(html, raw, at) {
    const start = lineAt(at);
    return fragment(mark(html, start, start + raw.split("\n").length)) + "\n".repeat((raw.match(/\n/g) || []).length);
  }
  // Opaque blocks are extracted first so markup examples stay literal.
  source = source.replace(/\[\[code(?:\s+[^\]]*)?\]\]([\s\S]*?)\[\[\/code\]\]/gi, (raw, body, at) => opaque(`<pre><code>${escape(body.replace(/^\n/, "").replace(/\n$/, ""))}</code></pre>`, raw, at));
  source = source.replace(/\[\[html\]\]([\s\S]*?)\[\[\/html\]\]/gi, (raw, body, at) => opaque(`<div class="wd-html">${sanitizeHTML(body.replace(/^\n/, "").replace(/\n$/, ""))}</div>`, raw, at));
  source = source.replace(/\[\[embed(?:audio|video)?\]\]([\s\S]*?)\[\[\/embed(?:audio|video)?\]\]/gi, (raw, body, at) => {
    // Hidden interwiki style synchronizers only message the website sidebar;
    // their theme CSS has already been included in the local document.
    if (/^\s*<iframe\b[^>]*\bstyle\s*=\s*["'][^"']*display\s*:\s*none[^"']*["'][^>]*>\s*<\/iframe>\s*$/i.test(body)) {
      return options.editable ? opaque('<div class="wd-source-module">Hidden embed · 点击编辑</div>', raw, at) : "\n".repeat((raw.match(/\n/g) || []).length);
    }
    return opaque(`<div class="wd-embed">${sanitizeHTML(body.replace(/^\n/, "").replace(/\n$/, ""))}</div>`, raw, at);
  });
  source = source.replace(/\[\[module\s+CSS\b([^\]]*)\]\]((?:(?!\[\[module\b)[\s\S])*?)\[\[\/module\]\]/gi, (raw, args, body, at) => {
    if (!/\bdisable\s*=\s*["']?true\b/i.test(args)) css.push(rebaseCSS(body, contentBase()));
    if (options.editable) return opaque('<div class="wd-source-module">CSS module · 点击编辑</div>', raw, at);
    return (/\bshow\s*=\s*["']?true\b/i.test(args) ? fragment(`<pre><code>${escape(body)}</code></pre>`) : "") + "\n".repeat((raw.match(/\n/g) || []).length);
  });
  // Non-CSS modules with a body never render their source as page text.
  // The body may not span another [[module …]]: body-less modules such as
  // [[module Rate]] would otherwise swallow the page up to a later closer.
  source = source.replace(/\[\[module\s+([^\s\]]+)([^\]]*)\]\]((?:(?!\[\[module\b)[\s\S])*?)\[\[\/module\]\]/gi, (raw, name, args, body, at) => {
    warnings.add(`模块 [[module ${name}]] 不在本地执行，只显示占位`);
    return opaque(`<span class="wd-module-chip" title="本地预览不执行此模块">Module · ${escape(name)}</span>`, raw, at);
  });

  const lines = source.split("\n");
  let cursor = 0;
  const closePattern = name => new RegExp(`^\\[\\[\\/${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]\\]$`, "i");
  const OPEN = /^\[\[(div_?|span_?|size|collapsible|tabview|tabs|tab|table|row|cell|hcell|thead|tbody|math|footnote|bibliography|gallery|quote|ul|ol|li|note|=|>|<|==)(?:\s+([^\]]*))?\]\]$/i;

  // Lists are indentation driven: a level's first marker decides whether that
  // level is <ul> or <ol>, and a marker change at the same indent starts a
  // sibling list. A trailing " _" folds the following line into the item.
  function buildList(entries) {
    const roots = [], stack = [];
    for (const entry of entries) {
      while (stack.length && stack[stack.length - 1].depth > entry.depth) stack.pop();
      const top = stack[stack.length - 1];
      const item = { parts: entry.parts, children: [] };
      if (!top) {
        const list = { type: entry.type, depth: entry.depth, items: [item] };
        roots.push(list); stack.push(list);
      } else if (top.depth === entry.depth) {
        if (top.type === entry.type) top.items.push(item);
        else {
          stack.pop();
          const list = { type: entry.type, depth: entry.depth, items: [item] };
          const parent = stack[stack.length - 1];
          if (parent) parent.items[parent.items.length - 1].children.push(list);
          else roots.push(list);
          stack.push(list);
        }
      } else {
        const list = { type: entry.type, depth: entry.depth, items: [item] };
        top.items[top.items.length - 1].children.push(list);
        stack.push(list);
      }
    }
    return roots;
  }
  function readList(startIndex) {
    const entries = [];
    let index = startIndex;
    while (index < lines.length) {
      const m = /^([ \t]*)([*#])[ \t]+(.*)$/.exec(lines[index]);
      if (!m) break;
      const parts = [];
      let text = m[3];
      index++;
      while (true) {
        const continues = / _\s*$/.test(text);
        if (continues) text = text.replace(/ _\s*$/, "");
        parts.push(text);
        if (!continues || index >= lines.length || !lines[index].trim()) break;
        text = lines[index++].trim();
      }
      entries.push({ depth: m[1].length, type: m[2], parts });
    }
    return { list: buildList(entries), next: index };
  }
  function renderListTree(list) {
    const tag = list.type === "#" ? "ol" : "ul";
    const items = list.items.map(item => `<li>${item.parts.map(inline).join("<br>")}${item.children.map(renderListTree).join("")}</li>`).join("");
    return `<${tag}>${items}</${tag}>`;
  }
  function readDefList(startIndex) {
    const entries = [];
    let index = startIndex;
    while (index < lines.length) {
      const m = /^[ \t]*:[ \t]*([^:\n]*?)[ \t]*:[ \t]*(.*)$/.exec(lines[index]);
      if (!m) break;
      const parts = [];
      let text = m[2];
      index++;
      while (true) {
        const continues = / _\s*$/.test(text);
        if (continues) text = text.replace(/ _\s*$/, "");
        parts.push(text);
        if (!continues || index >= lines.length || !lines[index].trim()) break;
        text = lines[index++].trim();
      }
      entries.push({ term: m[1], parts });
    }
    return { entries, next: index };
  }
  // Quote nesting comes from the number of leading ">" characters. A trailing
  // " \" joins the next physical line with a space, exactly like Wikidot.
  function readQuote(startIndex) {
    const entries = [];
    let index = startIndex;
    while (index < lines.length) {
      const m = /^(>+)[ \t]?(.*)$/.exec(lines[index]);
      if (!m) break;
      let text = m[2];
      index++;
      while (/ \\\s*$/.test(text)) {
        text = text.replace(/ \\\s*$/, "");
        if (index >= lines.length || !lines[index].trim()) break;
        text += " " + lines[index++].trim();
      }
      entries.push({ depth: m[1].length, text });
    }
    return { entries, next: index };
  }
  function quoteHTML(entries, depth) {
    let out = "", index = 0;
    while (index < entries.length) {
      if (entries[index].depth > depth) {
        const run = [];
        while (index < entries.length && entries[index].depth > depth) run.push(entries[index++]);
        out += `<blockquote>${quoteHTML(run, depth + 1)}</blockquote>`;
        continue;
      }
      const paragraphs = [];
      let current = [];
      while (index < entries.length && entries[index].depth === depth) {
        const text = entries[index++].text;
        if (!text.trim()) {
          if (current.length) { paragraphs.push(current.join("<br>")); current = []; }
          continue;
        }
        current.push(inline(text));
      }
      if (current.length) paragraphs.push(current.join("<br>"));
      // A single paragraph keeps Wikidot's compact <blockquote>text</blockquote>;
      // empty "> " lines split it into real paragraphs.
      out += paragraphs.length === 1 ? paragraphs[0] : paragraphs.map(p => `<p>${p}</p>`).join("");
    }
    return out;
  }
  // Simple tables: a run of 2n pipes before a cell means the cell spans n
  // columns; cells starting with ~ are headers and <,>,= set the alignment.
  function tableCells(raw) {
    const parts = [];
    let index = 0, buffer = "";
    while (index < raw.length) {
      if (raw[index] === "|") {
        let run = 0;
        while (raw[index] === "|") { run++; index++; }
        if (run >= 2) {
          if (buffer) parts.push({ text: buffer });
          buffer = "";
          parts.push({ pipes: run });
        } else buffer += "|".repeat(run);
      } else buffer += raw[index++];
    }
    if (buffer) parts.push({ text: buffer });
    const cells = [];
    let colspan = 1, ready = false;
    for (const part of parts) {
      if (part.pipes !== undefined) { colspan = Math.max(1, Math.floor(part.pipes / 2)); ready = true; }
      else if (ready) { cells.push(tableCell(part.text, colspan)); ready = false; }
    }
    return cells;
  }
  function tableCell(src, colspan) {
    let text = String(src).trim(), head = false, align = "";
    if (text.startsWith("~")) head = true;
    const rest = head ? text.slice(1) : text;
    const m = /^\s*([<>=])\s*/.exec(rest);
    if (m) { align = {"<": "left", ">": "right", "=": "center"}[m[1]]; text = rest.slice(m[0].length); }
    else text = rest;
    return { head, align, colspan, text: text.trim() };
  }
  function renderTable(rows) {
    return `<table>${rows.map(cells => `<tr>${cells.map(cell => {
      const tag = cell.head ? "th" : "td";
      const extra = (cell.colspan > 1 ? ` colspan="${cell.colspan}"` : "") + (cell.align ? ` style="text-align:${cell.align}"` : "");
      return `<${tag}${extra}>${inline(cell.text).replace(/\n/g, "<br>\n")}</${tag}>`;
    }).join("")}</tr>`).join("")}</table>`;
  }
  function readTable(startIndex) {
    const rows = [];
    let index = startIndex;
    while (index < lines.length && /^\s*\|\|/.test(lines[index])) {
      let row = lines[index++];
      while (/ _\s*$/.test(row) && index < lines.length) row = row.replace(/ _\s*$/, "") + "\n" + lines[index++];
      rows.push(tableCells(row));
    }
    return { rows, next: index };
  }

  // Wikidot matches each block type independently, so one stray or missing
  // closer must not derail every later block. A closer that belongs to an
  // outer block ends the inner ones implicitly, and alignment closers are
  // interchangeable inside an open alignment block ([[>]]…[[/=]] is common).
  const canonical = name => name === "tabs" ? "tabview" : name.replace(/_$/, "");
  function parseNodes(stop, ancestors = []) {
    const nodes = [];
    let paragraph = null;
    const flush = () => { if (paragraph) { nodes.push(paragraph); paragraph = null; } };
    while (cursor < lines.length) {
      const raw = lines[cursor], trimmed = raw.trim();
      let m;
      if ((m = /^\[\[\/([a-z_]+|=|>|<|==)\]\]$/i.exec(trimmed))) {
        const name = canonical(m[1].toLowerCase());
        flush();
        if (stop && name === stop) { cursor++; return { nodes, closed: true }; }
        if (ancestors.includes(name)) { warnings.add(`[[${stop}]] 未闭合，已在外层 [[/${name}]] 处自动结束`); return { nodes, closed: true }; }
        if (stop && ALIGN[stop] && ALIGN[name]) { cursor++; warnings.add(`[[${stop}]] 以 [[/${name}]] 结束，按对齐块处理`); return { nodes, closed: true }; }
        cursor++;
        warnings.add(`多余的结束标记 [[/${m[1]}]]：没有对应的开始标记，已忽略`);
        continue;
      }
      const start = cursor; cursor++;
      if (!trimmed) { flush(); continue; }
      if ((m = /^\u0000(\d+)\u0000$/.exec(trimmed))) { flush(); nodes.push({ kind: "opaque", html: fragments[Number(m[1])], start, end: cursor }); continue; }
      // span/size are inline on Wikidot and stay part of the paragraph.
      if ((m = /^\[\[(div|collapsible|table|row|cell|hcell|math|footnote|bibliography|gallery|ul|ol|li|note)(?:\s+([^\]]*))?\]\]\s*((?:(?!\[\[|\]\]).)+?)\s*\[\[\/\1\]\]$/i.exec(trimmed))) {
        flush();
        nodes.push({ kind: "inline-tag", name: m[1].toLowerCase(), arg: (m[2] || "").trim(), text: m[3], start, end: cursor });
        continue;
      }
      if ((m = OPEN.exec(trimmed))) {
        flush();
        const name = canonical(m[1].toLowerCase()), arg = (m[2] || "").trim();
        const inner = parseNodes(name, stop ? [...ancestors, stop] : ancestors);
        if (!inner.closed) warnings.add(`未闭合的块：[[${name}]]，缺少 [[/${name}]]`);
        nodes.push({ kind: "tag", name, arg, children: inner.nodes, start, end: cursor });
        continue;
      }
      if ((m = /^\[\[col(?:\s+([^\]]*))?\]\]$/i.exec(trimmed))) { flush(); nodes.push({ kind: "tag", name: "col", arg: (m[1] || "").trim(), children: [], start, end: cursor }); continue; }
      if ((m = /^\[\[(f?)([<>])?toc(?:\s+[^\]]*)?\]\]$/i.exec(trimmed))) { flush(); nodes.push({ kind: "toc", float: (m[1] ? "f" : "") + (m[2] || ""), start, end: cursor }); continue; }
      if (/^\[\[footnoteblock\]\]$/i.test(trimmed)) { flush(); nodes.push({ kind: "footnoteblock", start, end: cursor }); continue; }
      if (/^\[\[module\s+rate\s*\]\]$/i.test(trimmed)) { flush(); nodes.push({ kind: "rate", start, end: cursor }); continue; }
      if (/^\[!--/.test(trimmed)) {
        flush();
        if (!trimmed.includes("--]")) while (cursor < lines.length && !lines[cursor++].includes("--]")) {}
        nodes.push({ kind: "comment", start, end: cursor });
        continue;
      }
      if (/^\[\[include\b/i.test(trimmed)) {
        flush();
        let last = cursor - 1;
        while (last < lines.length - 1 && !/\]\]\s*$/.test(lines[last])) {
          if (/^\s*\[\[(?:include|module|div|code|html|embed)\b/i.test(lines[last + 1])) break;
          last++;
        }
        const target = /^\[\[include\s+([^\s|\]]+)/i.exec(trimmed)?.[1] || "";
        cursor = last + 1;
        nodes.push({ kind: "include", target, start, end: cursor });
        continue;
      }
      if (trimmed === "@@@@" || trimmed === "@@ @@") { flush(); nodes.push({ kind: "intentional-blank", start, end: cursor }); continue; }
      if ((m = /^\[\[#\s*([^\]\n]+?)\s*\]\]$/.exec(trimmed))) { flush(); nodes.push({ kind: "anchor", spec: m[1], start, end: cursor }); continue; }
      if ((m = /^\[\[(f<image|f>image|=image|<image|>image|image)\s+([^\]]*)\]\]$/i.exec(trimmed))) {
        flush();
        const float = m[1].startsWith("f") ? m[1][1] : m[1].startsWith("=") ? "=" : /^[<>]/.test(m[1]) ? "a" + m[1][0] : "";
        nodes.push({ kind: "image", float, spec: m[2], start, end: cursor });
        continue;
      }
      if ((m = /^\[\[iframe\s+([^\]]*)\]\]$/i.exec(trimmed))) { flush(); nodes.push({ kind: "iframe", spec: m[1], start, end: cursor }); continue; }
      if ((m = /^\[\[file\s+([^\]]*)\]\]$/i.exec(trimmed))) { flush(); nodes.push({ kind: "file", spec: m[1], start, end: cursor }); continue; }
      if ((m = /^\[\[anchor\s+([^\]]*)\]\]$/i.exec(trimmed))) { flush(); nodes.push({ kind: "anchor", spec: m[1], start, end: cursor }); continue; }
      if ((m = /^\[\[module\s+([^\s\]]+)([^\]]*)\]\]$/i.exec(trimmed))) { flush(); nodes.push({ kind: "module", name: m[1], start, end: cursor }); continue; }
      if ((m = /^(\+{1,6})(\*)?\s+(.+)$/.exec(raw))) { flush(); nodes.push({ kind: "heading", level: m[1].length, hidden: !!m[2], text: m[3], start, end: cursor }); continue; }
      if (/^-{3,}\s*$/.test(raw)) { flush(); nodes.push({ kind: "hr", start, end: cursor }); continue; }
      if ((m = /^~{4,}([<>])?\s*$/.exec(raw))) { flush(); nodes.push({ kind: "clear", side: m[1] || "", start, end: cursor }); continue; }
      // "= text" is Wikidot's one-line centering shorthand.
      if ((m = /^= (.*)$/.exec(raw))) { flush(); nodes.push({ kind: "center", text: m[1], start, end: cursor }); continue; }
      if (/^\[\[(?:button|social)\b[^\]]*\]\]$/i.test(trimmed)) { flush(); continue; }
      if (/^\s*\|\|/.test(raw)) {
        flush();
        const table = readTable(start);
        cursor = table.next;
        nodes.push({ kind: "table", rows: table.rows, start, end: cursor });
        continue;
      }
      if (/^[ \t]*[*#][ \t]+/.test(raw)) {
        flush();
        const list = readList(start);
        cursor = list.next;
        nodes.push({ kind: "list", lists: list.list, start, end: cursor });
        continue;
      }
      if (/^[ \t]*:[ \t]*[^:\n]+[ \t]*:/.test(raw)) {
        flush();
        const dl = readDefList(start);
        cursor = dl.next;
        nodes.push({ kind: "dl", entries: dl.entries, start, end: cursor });
        continue;
      }
      if (/^>/.test(raw)) {
        flush();
        const quote = readQuote(start);
        cursor = quote.next;
        nodes.push({ kind: "quote", entries: quote.entries, start, end: cursor });
        continue;
      }
      if (!paragraph) paragraph = { kind: "p", lines: [], start, end: start };
      paragraph.lines.push(raw);
      paragraph.end = cursor;
    }
    flush();
    return { nodes, closed: false };
  }

  function closeInline(text, from, name) {
    const re = new RegExp(`\\[\\[(\\/?)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}_?(?=[\\s\\]])[^\\]]*\\]\\]`, "gi");
    re.lastIndex = from;
    let depth = 1, m;
    while ((m = re.exec(text))) {
      depth += m[1] ? -1 : 1;
      if (!depth) return { start: m.index, end: m.index + m[0].length };
    }
    return null;
  }
  // [[span]], [[size]] and [[a]] may nest, so a regex would stop at the first
  // closer. Find the balanced closer and recurse into the content instead.
  function balancedInline(raw, index) {
    for (const name of ["span", "size", "a"]) {
      const open = new RegExp(`^\\[\\[${name}_?(?=[\\s\\]])[^\\]]*\\]\\]`, "i").exec(raw.slice(index));
      if (!open) continue;
      // Without a closer the container covers the rest of the paragraph,
      // like the browser's auto-closing, instead of leaking raw source.
      const close = closeInline(raw, index + open[0].length, name) || { start: raw.length, end: raw.length };
      const arg = open[0].slice(name.length + 2, -2).replace(/^_/, "").trim();
      const children = raw.slice(index + open[0].length, close.start);
      let html;
      if (name === "span") html = `<span${attrs(arg)}>${inline(children)}</span>`;
      else if (name === "size") {
        const size = cssSize(arg.split(/\s+/)[0]);
        html = `<span${size ? ` style="font-size:${size}"` : ""}>${inline(children)}</span>`;
      } else {
        const href = safeUrl(attr(arg, "href") || "", base);
        html = href ? `<a href="${escape(href)}"${attrs(arg, ["class", "id", "style", "title", "target"])} target="_blank" rel="noopener noreferrer">${inline(children)}</a>` : inline(children);
      }
      return { html, length: close.end - index };
    }
    return null;
  }

  // The preview lives in a sandboxed iframe, so every generated link opens in a
  // new tab with rel="noopener noreferrer"; internal and external links behave
  // the same and nothing can navigate the preview itself away.
  function inline(raw) {
    const rules = [
      [/@@([^\n]*?)@@/y, m => escape(m[1])],
      // @<…>@ keeps HTML entities such as &nbsp; or &#9608; working.
      [/@<([^\n]*?)>@/y, m => escape(m[1]).replace(/&amp;(#\d+|#x[0-9a-f]+|[a-z]+\d*);/gi, "&$1;")],
      [/\[\[\/(?:span|size|a)_?\]\]/iy, () => ""],
      [/\[\[date\s+(\d+)(?:\s+[^\]]*)?\]\]/iy, m => { const d = new Date(Number(m[1]) * 1000); return `<span class="odate">${escape(isNaN(d) ? m[1] : d.toISOString().slice(0, 16).replace("T", " "))}</span>`; }],
      [/\(\(bibcite\s+([\w-]+)\)\)/iy, m => `<a class="bibcite" href="#bibitem-${escape(m[1])}">[${escape(m[1])}]</a>`],
      [/\[\[(?:button|social)\b[^\]]*\]\]/iy, () => ""],
      [/\[\[\[([^\]\n|]+?)(?:\s*\|\s*([^\]\n|]*?))?\]\]\]/y, m => {
        let target = m[1].trim();
        const hasLabel = m[2] !== undefined;
        if (target.startsWith("*")) target = target.slice(1).trim();
        const external = /^(?:https?:)?\/\//i.test(target);
        let href;
        if (external || target.startsWith("/")) href = safeUrl(target, base);
        else href = safeUrl(base + unixName(target), base);
        if (!href) return escape(m[0]);
        let label;
        if (hasLabel) label = m[2].trim() || unixName(target);
        else if (!external && target.includes(":")) label = target.slice(target.indexOf(":") + 1).trim();
        else if (!external) label = target.split("#")[0];
        else label = target;
        return `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer">${escape(label)}</a>`;
      }],
      [/\[\[#\s*([^\]\n]+?)\s*\]\]/y, m => `<a id="${escape(m[1].trim().split(/\s+/)[0])}"></a>`],
      [/\[\[\*user\s+([^\]\n]+?)\s*\]\]/y, m => {
        const name = m[1].trim();
        return `<span class="avatar"></span><span class="printuser"><a href="https://www.wikidot.com/user:info/${escape(unixName(name))}" target="_blank" rel="noopener noreferrer">${escape(name)}</a></span>`;
      }],
      [/\[\[user\s+([^\]\n]+?)\s*\]\]/y, m => {
        const name = m[1].trim();
        return `<span class="printuser"><a href="https://www.wikidot.com/user:info/${escape(unixName(name))}" target="_blank" rel="noopener noreferrer">${escape(name)}</a></span>`;
      }],
      [/\[\*?(https?:\/\/[^\s\]]+)(?:\s+([^\]]+))?\]/y, m => {
        const href = safeUrl(m[1], base);
        return href ? `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer">${inline(m[2] || m[1])}</a>` : escape(m[0]);
      }],
      [/\[#([\w.-]+)(?:\s+([^\]]+))?\]/y, m => `<a href="#${escape(m[1])}" target="_blank" rel="noopener noreferrer">${inline(m[2] || m[1])}</a>`],
      [/\[#\s+([^\]]*?)\]/y, m => `<a class="wd-empty-link" href="#">${inline(m[1] || "")}</a>`],
      [/\[(\/[^\s\]]+)(?:\s+([^\]]+))?\]/y, m => {
        const href = safeUrl(m[1], base);
        return href ? `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer">${inline(m[2] || m[1])}</a>` : escape(m[0]);
      }],
      [/\[([\w.+-]+@[\w.-]+\.\w+)(?:\s+([^\]]+))?\]/y, m => `<a href="mailto:${escape(m[1])}">${inline(m[2] || m[1])}</a>`],
      [/\[wikipedia:([^\s\]]+)(?:\s+([^\]]+))?\]/y, m => {
        const href = safeUrl("https://en.wikipedia.org/wiki/" + encodeURIComponent(m[1]));
        return href ? `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer">${inline(m[2] || m[1])}</a>` : escape(m[0]);
      }],
      [/\[\[footnote\]\]([\s\S]*?)\[\[\/footnote\]\]/y, m => { const number = footnotes.push(inline(m[1])); return `<sup class="wd-footnote-ref" id="wd-footnote-ref-${number}"><a href="#wd-footnote-${number}">${number}</a></sup>`; }],
      [/\[\[=image\s+([^\]]*)\]\]/y, m => imageHTML(parseArgs(m[1]), "=")],
      [/\[\[([<>])image\s+([^\]]*)\]\]/y, m => imageHTML(parseArgs(m[2]), "a" + m[1])],
      [/\[\[f([<>])image\s+([^\]]*)\]\]/y, m => imageHTML(parseArgs(m[2]), m[1])],
      [/\[\[image\s+([^\]]*)\]\]/y, m => imageHTML(parseArgs(m[1]), "")],
      [/\[\[\$([\s\S]*?)\$\]\]/y, m => `<span class="wd-math-inline" title="LaTeX">${escape(m[1].trim())}</span>`],
      [/\*\*([^\n]+?)\*\*/y, m => `<strong>${inline(m[1])}</strong>`],
      [/(?<![:/])\/\/([^\n]+?)\/\//y, m => `<em>${inline(m[1])}</em>`],
      [/(?<=\s)--(?=\s)/y, () => "—"],
      [/__([^\n]+?)__/y, m => `<u>${inline(m[1])}</u>`],
      [/--([^\n]+?)--/y, m => `<s>${inline(m[1])}</s>`],
      [/\{\{([^\n]+?)\}\}/y, m => `<code>${escape(m[1])}</code>`],
      [/\^\^([^\n]+?)\^\^/y, m => `<sup>${inline(m[1])}</sup>`],
      [/,,((?:(?!,,)[^\n])*?)''/y, m => `„${inline(m[1])}”`],
      [/``([^\n]*?)''/y, m => `“${inline(m[1])}”`],
      [/`([^\n]*?)'/y, m => `‘${inline(m[1])}’`],
      [/<<([^\n]*?)>>/y, m => `«${inline(m[1])}»`],
      [/>>([^\n]*?)<</y, m => `»${inline(m[1])}«`],
      [/\.\.\./y, () => "…"],
      [/,,([^\n]+?),,/y, m => `<sub>${inline(m[1])}</sub>`],
      [/#\#([^|\n#]+)\|([^\n#]*?)\#\#/y, m => {
        const parts = m[2].split("|");
        const foreground = m[1].trim(), background = parts.length > 1 ? parts[0].trim() : "", text = parts.length > 1 ? parts.slice(1).join("|") : parts[0];
        // Wikidot accepts bare hex such as ##9900FF|text##.
        const hex = value => /^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? "#" + value : value;
        if (!COLOR.test(hex(foreground)) || (background && !COLOR.test(hex(background)))) return escape(m[0]);
        const style = `color:${hex(foreground)}${background ? ";background:" + hex(background) : ""}`;
        return `<span style="${escape(style)}">${inline(text)}</span>`;
      }],
      [/(?<![A-Za-z0-9_@\/:.-])https?:\/\/[^\s<>"'）)】\]，。；！？、]+/y, m => bareURL(m[0])],
      [/\*https?:\/\/[^\s<>"'）)】\]，。；！？、]+/y, m => bareURL(m[0].slice(1))],
      [/\[\[([^\]\n]+)\]\]/y, m => { warnings.add(`未支持的行内语法：[[${m[1]}]]`); return escape(m[0]); }]
    ];
    function bareURL(value) {
      const href = value.replace(/[.,;:!?]+$/, ""), trail = value.slice(href.length);
      const url = safeUrl(href, base);
      return url ? `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(href)}</a>${escape(trail)}` : escape(value);
    }
    let out = "", index = 0;
    while (index < raw.length) {
      if (raw[index] === "[" && raw[index + 1] === "[") {
        const balanced = balancedInline(raw, index);
        if (balanced) { out += balanced.html; index += balanced.length; continue; }
      }
      let hit = null;
      for (const [re, build] of rules) {
        re.lastIndex = index;
        const m = re.exec(raw);
        if (m && m.index === index) { hit = { m, build }; break; }
      }
      if (!hit) { out += escape(raw[index]); index++; continue; }
      out += hit.build(hit.m);
      index += hit.m[0].length;
    }
    return out;
  }

  function imageHTML({ value, attrs: flags }, float) {
    const src = String(value || "").trim();
    let url = "";
    if (/^(?:https?:)?\/\//i.test(src)) url = safeUrl(src, contentBase());
    else if (src.startsWith("/")) url = safeUrl("local--files" + src, base);
    else if (src && !/^[a-z][a-z0-9+.-]*:/i.test(src)) url = attachment(src);
    const dim = v => /^\d+(?:\.\d+)?$/.test(v) ? v + "px" : v;
    const size = (flags.size || "").toLowerCase();
    const floatStyle = float === "<" || float === ">" ? `float:${float === "<" ? "left" : "right"};margin:${float === "<" ? ".4em 1em .4em 0" : ".4em 0 .4em 1em"}` : float === "=" ? "display:block;margin:1em auto" : "";
    const side = { "a<": "left", "a>": "right" }[float];
    const aligned = html => side ? `<div class="image-container align${side}" style="text-align:${side}">${html}</div>` : html;
    const style = [
      flags.style || "",
      flags.width ? `width:${dim(flags.width)}` : "",
      flags.height ? `height:${dim(flags.height)}` : "",
      floatStyle,
      /^(small|medium)$/.test(size) ? "max-width:" + (size === "small" ? "180px" : "320px") : ""
    ].filter(Boolean).join(";");
    const alt = flags.alt || flags.title || "";
    const cls = ["image", flags.class || ""].filter(Boolean).join(" ");
    if (!url) return `<span class="wd-image-missing" title="${escape(src)}">图片：${escape(src || "(缺少地址)")}</span>`;
    const title = flags.title ? ` title="${escape(flags.title)}"` : "";
    const img = `<img src="${escape(url)}" alt="${escape(alt)}" class="${escape(cls)}"${title}${style ? ` style="${escape(style)}"` : ""} loading="lazy">`;
    if (!flags.link) return aligned(img);
    const rawLink = flags.link.trim();
    let link = "";
    if (rawLink.startsWith("#")) link = rawLink;
    else {
      const target = rawLink.startsWith("*") ? rawLink.slice(1).trim() : rawLink;
      if (/^(?:https?:)?\/\//i.test(target) || target.startsWith("/")) link = safeUrl(target, base);
      else link = safeUrl(base + unixName(target), base);
    }
    return aligned(link ? `<a href="${escape(link)}" target="_blank" rel="noopener noreferrer">${img}</a>` : img);
  }

  function rawText(nodes) {
    return nodes.map(node => node.kind === "p" ? node.lines.join("\n") : node.kind === "raw" ? node.text : "").filter(Boolean).join("\n").trim();
  }

  // A paragraph is one inline run so spans and footnotes may cross lines;
  // every source newline still becomes a line break, as on Wikidot.
  function paragraphHTML(lines) {
    return inline(lines.map(line => line.replace(/ _\s*$/, "")).join("\n")).replace(/\n/g, "<br>\n");
  }
  // Inline containers render paragraphs without their <p> wrappers.
  function renderInline(nodes) {
    return nodes.map(node => {
      if (node.kind === "p") return paragraphHTML(node.lines);
      if (node.kind === "raw") return inline(node.text);
      return renderNode(node);
    }).join("");
  }

  function renderTag(node) {
    const children = renderNodes(node.children);
    switch (node.name) {
      case "div": return `<div${attrs(node.arg)}>${children}</div>`;
      case "span": return `<span${attrs(node.arg)}>${renderInline(node.children)}</span>`;
      case "size": { const size = cssSize(node.arg); return `<span${size ? ` style="font-size:${size}"` : ""}>${renderInline(node.children)}</span>`; }
      case "ul": return `<ul${attrs(node.arg)}>${children}</ul>`;
      case "ol": return `<ol${attrs(node.arg)}>${children}</ol>`;
      case "li": return `<li${attrs(node.arg)}>${renderInline(node.children)}</li>`;
      case "note": return `<div class="wiki-note">${children}</div>`;
      case "quote": return `<blockquote>${children}</blockquote>`;
      case "collapsible": {
        const show = attr(node.arg, "show") ?? "+ show block";
        const hide = attr(node.arg, "hide") ?? "- hide block";
        const folded = String(attr(node.arg, "folded") || "").toLowerCase();
        const location = String(attr(node.arg, "hideLocation") || "top").toLowerCase();
        const bottom = location === "bottom" || location === "both";
        return `<details class="collapsible-block"${folded === "no" ? " open" : ""}><summary><span class="collapsible-block-show">${escape(show)}</span><span class="collapsible-block-hide">${escape(hide)}</span></summary>${children}${bottom ? `<div class="collapsible-block-hide-bottom"><span>${escape(hide)}</span></div>` : ""}</details>`;
      }
      case "tabview": {
        const tabs = node.children.filter(child => child.kind === "tag" && child.name === "tab");
        const other = node.children.filter(child => !(child.kind === "tag" && child.name === "tab") && child.kind !== "blank");
        if (!tabs.length) return children;
        const group = `wd-tv-${++tabCount}`;
        return `<div class="yui-navset wd-tabview">` +
          tabs.map((tab, index) => `<input type="radio" name="${group}" id="${group}-${index}"${index === 0 ? " checked" : ""}>`).join("") +
          `<ul class="yui-nav">` + tabs.map((tab, index) => `<li><label for="${group}-${index}">${inline(tab.arg || `标签 ${index + 1}`)}</label></li>`).join("") + `</ul>` +
          `<div class="yui-content">` + tabs.map(tab => `<div class="wd-tab-panel">${renderNodes(tab.children)}</div>`).join("") + `</div>` +
          (other.length ? renderNodes(other) : "") + `</div>`;
      }
      case "tab": return `<div class="wd-tab-panel">${children}</div>`;
      case "table": return `<table${attrs(node.arg)}>${children}</table>`;
      case "thead": return `<thead>${children}</thead>`;
      case "tbody": return `<tbody>${children}</tbody>`;
      case "row": return `<tr${attrs(node.arg)}>${children}</tr>`;
      case "cell": return `<td${attrs(node.arg)}>${children}</td>`;
      case "hcell": return `<th${attrs(node.arg)}>${children}</th>`;
      case "col": return `<col${attrs(node.arg)}>`;
      case "math": return `<span class="wd-math" title="LaTeX">${escape(rawText(node.children))}</span>`;
      case "footnote": {
        const number = footnotes.push(inline(rawText(node.children)));
        return `<sup class="wd-footnote-ref" id="wd-footnote-ref-${number}"><a href="#wd-footnote-${number}">${number}</a></sup>`;
      }
      case "bibliography": {
        const title = /\btitle\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(node.arg);
        return `<div class="wd-bibliography">${title ? `<div class="wd-bib-title">${inline(title[1] ?? title[2])}</div>` : ""}${children}</div>`;
      }
      case "gallery": return `<div class="wd-gallery">${children}</div>`;
      default:
        if (ALIGN[node.name]) return `<div style="text-align:${ALIGN[node.name]}">${children}</div>`;
        warnings.add(`未支持的块：[[${node.name}]]`);
        return children;
    }
  }

  function renderNode(node) {
    switch (node.kind) {
      case "blank": return "";
      case "raw": return inline(node.text);
      case "opaque": return node.html;
      case "p": return mark(`<p>${paragraphHTML(node.lines)}</p>`, node.start, node.end);
      case "center": return mark(`<div style="text-align:center">${inline(node.text)}</div>`, node.start, node.end);
      case "clear": return mark(`<div style="clear:${node.side === "<" ? "left" : node.side === ">" ? "right" : "both"};height:0;font-size:1px"></div>`, node.start, node.end);
      case "heading": {
        const id = "toc" + headings.length;
        headings.push({ level: node.level, id, label: node.text, hidden: node.hidden });
        return mark(`<h${node.level} id="${id}"><span>${inline(node.text)}</span></h${node.level}>`, node.start, node.end);
      }
      case "hr": return mark("<hr>", node.start, node.end);
      case "table": return mark(renderTable(node.rows), node.start, node.end);
      case "list": return mark(node.lists.map(renderListTree).join(""), node.start, node.end);
      case "dl": return mark(`<dl>${node.entries.map(entry => `<dt>${inline(entry.term)}</dt><dd>${entry.parts.map(inline).join("<br>")}</dd>`).join("")}</dl>`, node.start, node.end);
      case "quote": return mark(quoteHTML(node.entries, 0), node.start, node.end);
      case "intentional-blank": return mark("<p>&nbsp;</p>", node.start, node.end);
      case "toc": return mark(`<div id="toc"${node.float === "f>" ? ' style="float:right"' : node.float === "f<" ? ' style="float:left"' : ""}><!--WD_TOC--></div>`, node.start, node.end);
      case "rate": return mark('<div class="page-rate-widget-box" title="本地评分占位，不会投票"><span class="rate-points">评分: <span class="number">+0</span></span><span class="rateup btn"><span>+</span></span><span class="ratedown btn"><span>−</span></span><span class="cancel btn"><span>×</span></span></div>', node.start, node.end);
      case "comment": return options.editable ? mark('<div class="wd-source-module">Comment · 点击编辑</div>', node.start, node.end) : "";
      case "include": warnings.add(`未展开的 include：${node.target || "(缺少页面)"}`); return mark(`<div class="wd-include-missing" title="本地预览未展开此 include">Include · ${escape(node.target)}</div>`, node.start, node.end);
      case "module": warnings.add(`模块 [[module ${node.name}]] 不在本地执行，只显示占位`); return mark(`<span class="wd-module-chip" title="本地预览不执行此模块">Module · ${escape(node.name)}</span>`, node.start, node.end);
      case "image": return mark(imageHTML(parseArgs(node.spec), node.float), node.start, node.end);
      case "iframe": {
        const { value, attrs: flags } = parseArgs(node.spec);
        const href = safeUrl(value, contentBase());
        if (!href) return mark(`<span class="wd-image-missing">iframe：${escape(value)}</span>`, node.start, node.end);
        const style = [flags.style, flags.width ? `width:${flags.width}` : "", flags.height ? `height:${flags.height}` : ""].filter(Boolean).join(";");
        return mark(`<iframe src="${escape(href)}" sandbox="" loading="lazy" referrerpolicy="no-referrer"${style ? ` style="${escape(style)}"` : ""}></iframe>`, node.start, node.end);
      }
      case "file": {
        const parts = node.spec.split("|"), name = parts[0].trim(), label = (parts[1] || name).trim();
        const href = page ? safeUrl("local--files/" + encodeURIComponent(page) + "/" + name.split("/").map(encodeURIComponent).join("/"), contentBase()) : safeUrl("local--files/" + name, contentBase());
        return mark(`<a class="wd-file" href="${escape(href)}" target="_blank" rel="noopener noreferrer">${escape(label)}</a>`, node.start, node.end);
      }
      case "anchor": return mark(`<a id="${escape(node.spec.trim().split(/\s+/)[0])}"></a>`, node.start, node.end);
      case "footnoteblock": sawFootnotes = true; return mark('<div class="wd-footnotes"><!--WD_FOOTNOTES--></div>', node.start, node.end);
      case "tag": return mark(renderTag(node), node.start, node.end);
      case "inline-tag": return mark(renderTag({ name: node.name, arg: node.arg, children: [{ kind: "raw", text: node.text, start: node.start, end: node.end }] }), node.start, node.end);
      default: return "";
    }
  }

  function renderNodes(nodes) { return nodes.map(renderNode).join(""); }
  function footnotesHTML() {
    if (!footnotes.length) return "";
    return `<div class="wd-footnotes"><div class="wd-bib-title">注释</div><ol>${footnotes.map((body, index) => `<li id="wd-footnote-${index + 1}">${body} <a class="wd-footnote-back" href="#wd-footnote-ref-${index + 1}">↩</a></li>`).join("")}</ol></div>`;
  }

  let html = renderNodes(parseNodes(null).nodes);
  // Each [[toc]] / [[f>toc]] / [[f<toc]] placeholder keeps its own float style.
  html = html.replace(/<!--WD_TOC-->/g, () => '<div id="toc-action-bar"></div><div class="title">目录</div><div id="toc-list">' + headings.filter(h => !h.hidden).map(h => `<div style="margin-left:${(h.level - 1)}em"><a href="#${h.id}">${inline(h.label)}</a></div>`).join("") + "</div>");
  if (html.includes("<!--WD_FOOTNOTES-->")) html = html.replace(/<div class="wd-footnotes"><!--WD_FOOTNOTES--><\/div>/g, () => footnotesHTML());
  else if (footnotes.length && !sawFootnotes) html += footnotesHTML();
  // Minimal picks a backdrop that matches the page's own colours, so pages
  // written for a dark theme stay readable without the site shell.
  const contrast = minimalPalette(options.overrideCSS ?? css.join("\n"), !!options.dark, options.minimalContrast !== false);
  const palette = contrast.palette;
  // A sandbox without allow-scripts contains CSS and blocks all active content.
  const policy = "default-src 'none'; style-src 'unsafe-inline' https:; font-src https: data:; img-src https: http: data:; frame-src https:; base-uri 'none'; form-action 'none'; script-src 'none'";
  const style = `html{${palette}}body{margin:0;font-family:serif;line-height:1.8}*,::before,::after{box-sizing:border-box}#container{width:100%;max-width:900px;margin:0 auto;padding:clamp(12px,4vw,32px)}#page-content{overflow-wrap:anywhere;min-width:0}#page-content img,#page-content video,#page-content iframe,#page-content embed{max-width:100%}#page-content img{height:auto}#page-content table{max-width:100%}#page-content [style*="grid-template-columns"]>*{min-width:0}@media(max-width:520px){#page-content [style*="grid-template-columns"]{grid-template-columns:minmax(0,1fr)!important}}p{margin:0 0 1em}pre{white-space:pre-wrap;overflow-wrap:anywhere;padding:12px;background:#8881}table{border-collapse:collapse}td,th{border:1px solid #8887;padding:5px 10px}blockquote{border-left:3px solid #8887;margin-left:0;padding-left:1em}summary{cursor:pointer}.unsupported{border:1px dashed #bd852a}a{color:#a24f5d}`;
  const safeCSS = (options.overrideCSS ?? css.join("\n")).replace(/<\/style/gi, "<\\/style");
  const shell = options.template;
  const safeStyle = value => value.replace(/<\/style/gi, "<\\/style");
  const title = escape(options.title || "未命名 Wikidot");
  const body = shell ? shell.body.replace("WIKIDOT_EDITOR_TITLE", () => title).replace("WIKIDOT_EDITOR_FILENAME", () => escape(options.page || options.title || "未命名 Wikidot")).replace(shell.marker, () => html) : `<div id="container"><div id="main-content"><div id="page-title">${title}</div><div id="page-content">${html}</div></div></div>`;
  const previewStyle = shell ? 'pre{white-space:pre-wrap;overflow-wrap:break-word}.unsupported{border:1px dashed #bd852a}#page-content{overflow-wrap:break-word}' : style;
  const document = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${escape(policy)}"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${safeStyle(previewStyle)}</style><style>${safeStyle(componentCSS())}</style>${shell ? `<style>${safeStyle(rebaseCSS(shell.headCSS, shell.referenceURL))}</style>` : ""}<style>${safeCSS}</style></head><body id="${escape(shell?.bodyId || "html-body")}" class="${escape(shell?.bodyClass || "")}">${body}</body></html>`;
  return { html, css, warnings: [...warnings], document, palette: shell ? "" : contrast.reason };
}
function componentCSS() {
  let tabs = "";
  for (let index = 1; index <= 12; index++) tabs += `.wd-tabview>input:nth-of-type(${index}):checked~.yui-content>div:nth-child(${index}){display:block}`;
  return `.wd-tabview>input{display:none}.wd-tabview .yui-nav{display:flex;flex-wrap:wrap;list-style:none;padding:0;margin:0 0 .8em}.wd-tabview .yui-nav li{margin:0 2px 0 0}.wd-tabview .yui-nav label{display:block;padding:.3em .9em;border:1px solid #8886;border-radius:3px 3px 0 0;cursor:pointer}.wd-tabview .yui-content>div{display:none}${tabs}.wd-gallery{display:flex;flex-wrap:wrap;gap:.6em;align-items:flex-start}.wd-gallery img{max-width:100%;height:auto}.wd-math,.wd-math-inline{font-family:serif;font-style:italic}.wd-math{display:inline-block;padding:0 .2em}.wd-footnotes{font-size:.9em;border-top:1px solid #8884;margin-top:2em;padding-top:.5em}.wd-footnotes ol{margin:.4em 0 0;padding-left:1.6em}.wd-footnote-back{margin-left:.4em;text-decoration:none}.wd-module-chip,.wd-include-missing{display:inline-block;font:12px/1.6 sans-serif;background:#8881;border-radius:3px;padding:0 6px;margin:2px 0}.wd-include-missing{color:#a24f5d}.wd-image-missing{display:inline-block;font:12px/1.6 sans-serif;color:#a24f5d;border:1px dashed #a24f5d;border-radius:3px;padding:0 6px}.wd-html,.wd-embed{margin:.4em 0}.wd-bibliography{border-top:1px solid #8884;margin-top:2em;padding-top:.5em}.wd-bib-title{font-weight:700;margin-bottom:.3em}.collapsible-block-show{display:inline}.collapsible-block-hide{display:none}details[open] .collapsible-block-show{display:none}details[open] .collapsible-block-hide{display:inline}.collapsible-block-hide-bottom{display:none;margin-top:.6em}details[open] .collapsible-block-hide-bottom{display:block}.wiki-note{border-left:3px solid #8886;background:#8881;margin:1em 0;padding:.5em 1em}.printuser .avatar{display:inline-block;width:1em;height:1em;margin-right:.3em;background:#8883;border-radius:50%}`;
}
module.exports = { render, escape, safeUrl, rebaseCSS, sanitizeHTML };
