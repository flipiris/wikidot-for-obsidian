"use strict";
// Pure helpers behind the editor completion menu: they never touch the view, so
// the snippets, the class scan and the pairing rule stay testable in Node.
const PAIRED = new Set(["=", "==", ">", "<", "div", "collapsible", "tabview", "tab", "table", "row", "cell", "hcell", "thead", "tbody", "math", "footnote", "bibliography", "gallery", "code", "html", "embed", "quote"]);
const TAGS = ["div", "span", "size", "collapsible", "tabview", "tab", "table", "row", "cell", "hcell", "col", "thead", "tbody", "math", "footnote", "footnoteblock", "bibliography", "gallery", "code", "html", "embed", "include", "module", "toc", "anchor", "image", "iframe", "file", "rate", "=", "==", ">", "<"];
const ATTRS = ["class", "id", "style", "show", "hide", "folded", "size", "link", "alt", "title", "colspan", "rowspan", "align", "width", "height"];
const CSS_FILES = new Set(["css", "js", "mjs", "png", "jpg", "jpeg", "gif", "svg", "webp", "woff", "woff2", "ttf", "otf", "eot"]);
function snippet(label, detail, source) {
  const caret = source.indexOf("\u0000");
  return { label, detail, type: "keyword", text: source.replace("\u0000", ""), cursor: caret < 0 ? source.length : caret };
}
const SLASH = [
  snippet("加粗", "**文字**", "**\u0000**"),
  snippet("斜体", "//文字//", "//\u0000//"),
  snippet("下划线", "__文字__", "__\u0000__"),
  snippet("删除线", "--文字--", "--\u0000--"),
  snippet("等宽", "{{文字}}", "{{\u0000}}"),

  snippet("[[div]]", "成对 div 块", "[[div]]\n\u0000\n[[/div]]"),
  snippet("[[div class]]", "带类名的 div", "[[div class=\"\u0000\"]]\n[[/div]]"),
  snippet("[[div style]]", "带内联样式的 div", "[[div style=\"\u0000\"]]\n[[/div]]"),
  snippet("[[span]]", "行内 span", "[[span]]\u0000[[/span]]"),
  snippet("[[size]]", "字号", "[[size 120%]]\u0000[[/size]]"),
  snippet("[[collapsible]]", "折叠块", "[[collapsible show=\"显示更多\"]]\n\u0000\n[[/collapsible]]"),
  snippet("[[tabview]]", "标签页", "[[tabview]]\n[[tab 标签一]]\n\u0000\n[[/tab]]\n[[tab 标签二]]\n[[/tab]]\n[[/tabview]]"),
  snippet("简单表格", "两列表格 · Tab 换格", "||~ 标题一 ||~ 标题二 ||\n|| \u0000 ||  ||"),
  snippet("[[table]]", "高级表格", "[[table]]\n[[row]]\n[[hcell]]标题[[/hcell]]\n[[cell]]\u0000[[/cell]]\n[[/row]]\n[[/table]]"),
  snippet("[[module CSS]]", "页内 CSS", "[[module CSS]]\n\u0000\n[[/module]]"),
  snippet("[[module rate]]", "评分占位", "[[module rate]]"),
  snippet("[[include]]", "引用页面", "[[include :scp-wiki-cn:\u0000]]"),
  snippet("[[code]]", "代码块", "[[code]]\n\u0000\n[[/code]]"),
  snippet("[[html]]", "原始 HTML", "[[html]]\n\u0000\n[[/html]]"),
  snippet("[[footnote]]", "脚注", "[[footnote]]\u0000[[/footnote]]"),
  snippet("[[math]]", "公式", "[[math]]\u0000[[/math]]"),
  snippet("[[image]]", "图片", "[[image \u0000]]"),
  snippet("[[iframe]]", "内嵌网页", "[[iframe \u0000]]"),
  snippet("[[anchor]]", "锚点", "[[anchor \u0000]]"),
  snippet("[[toc]]", "目录", "[[toc]]"),
  snippet("[[=]] 居中", "对齐块", "[[=]]\n\u0000\n[[/=]]"),
  snippet("[[>]] 右对齐", "对齐块", "[[>]]\n\u0000\n[[/>]]"),
  snippet("[[<]] 左对齐", "对齐块", "[[<]]\n\u0000\n[[/<]]"),
  snippet("[[==]] 两端对齐", "对齐块", "[[==]]\n\u0000\n[[/==]]"),
  snippet("----", "分隔线", "----")
];
const priority=["加粗","斜体","下划线","删除线","等宽","[[=]] 居中","[[>]] 右对齐","[[<]] 左对齐","[[==]] 两端对齐","[[size]]","[[span]]","----","[[div]]","[[div class]]","[[div style]]","[[collapsible]]","[[tabview]]"];
SLASH.sort((a,b)=>(priority.includes(a.label)?priority.indexOf(a.label):100)-(priority.includes(b.label)?priority.indexOf(b.label):100));
function autoInlineFor(text,pos){
 if(insideCode(text,pos))return null;
 const before=text.slice(0,pos),line=before.slice(before.lastIndexOf("\n")+1);
 const pairs={"**":"**","//":"//","__":"__","--":"--","{{":"}}","^^":"^^",",,":",,"};
 const open=line.slice(-2),close=pairs[open];
 if(!close||text.slice(pos,pos+2)===close||open==="--")return null;
 if(open==="//"&&/[:/]\/\/$/.test(line))return null;
 if(text[pos]&&!/[\s.,!?，。！？)）\]]/.test(text[pos]))return null;
 const earlier=line.slice(0,-2).split(open).length-1;
 return earlier%2===0?close:null;
}
function collectClasses(text) {
  const found = new Map();
  for (const m of String(text).matchAll(/\[\[(?:div|span|tab|tabview|table|row|cell|hcell|collapsible)\b[^\]]*?\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    for (const name of (m[1] ?? m[2] ?? "").split(/\s+/)) if (name) found.set(name, (found.get(name) || 0) + 1);
  }
  for (const block of String(text).matchAll(/\[\[module\s+CSS\b[\s\S]*?\[\[\/module\]\]/gi)) {
    for (const m of block[0].matchAll(/(?<![\w/.-])\.(-?[_a-zA-Z][\w-]*)/g)) {
      if (CSS_FILES.has(m[1].toLowerCase())) continue;
      found.set(m[1], (found.get(m[1]) || 0) + 1);
    }
  }
  return [...found.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count }));
}
function openTags(text, pos) {
  const stack = [], re = /\[\[(\/?)([a-zA-Z]+|==|=|>|<)(?=[\s\]])[^\]]*\]\]/g;
  let m;
  while ((m = re.exec(text)) && m.index < pos) {
    const name = m[2].toLowerCase();
    if (!PAIRED.has(name)) continue;
    if (m[1]) { const index = stack.lastIndexOf(name); if (index >= 0) stack.splice(index, 1); }
    else stack.push(name);
  }
  return stack;
}
function insideCode(text, pos) {
  const before = String(text).slice(0, pos);
  return (before.match(/\[\[code\b/gi) || []).length > (before.match(/\[\[\/code\]\]/gi) || []).length;
}
function tagContext(text, open, pos) {
  const raw = text.slice(open + 2, pos);
  const name = /^(?:[a-zA-Z]+|==|=|>|<)?/.exec(raw)[0];
  if (raw === name) return { kind: "tag", from: open + 2, to: pos, prefix: name };
  const classOpen = /(?:^|\s)class\s*=\s*("|')/.exec(raw);
  if (classOpen) {
    const valueStart = open + 2 + classOpen.index + classOpen[0].length;
    const rest = text.slice(valueStart, pos);
    if (!rest.includes(classOpen[1])) {
      const cut = Math.max(rest.lastIndexOf(" "), rest.lastIndexOf("\u3000"));
      return { kind: "class", from: valueStart + cut + 1, to: pos, value: rest, prefix: text.slice(valueStart + cut + 1, pos) };
    }
  }
  if (/\s/.test(raw)) {
    const cut = raw.lastIndexOf(" ");
    return { kind: "attr", from: open + 2 + cut + 1, to: pos, prefix: text.slice(open + 2 + cut + 1, pos) };
  }
  return { kind: "tag", from: open + 2, to: pos, prefix: name };
}
function analyze(text, pos) {
  const before = text.slice(0, pos);
  const open = before.lastIndexOf("[["), close = before.lastIndexOf("]]");
  if (open >= 0 && open > close) {
    const raw = before.slice(open + 2);
    if (raw.startsWith("/")) return { kind: "close", from: open + 3, to: pos, prefix: text.slice(open + 3, pos) };
    return tagContext(text, open, pos);
  }
  const previous = before.slice(-1);
  if (previous === "/" || previous === "\uFF0F") {
    const head = before.slice(0, -1);
    const lineStart = head.lastIndexOf("\n") + 1;
    if (!head.slice(lineStart).trim()) return { kind: "slash", from: pos - 1, to: pos, prefix: "" };
  }
  return null;
}
function completions(text, pos) {
  const info = analyze(text, pos);
  if (!info) return null;
  if (info.kind === "slash") return { from: info.from, to: info.to, options: SLASH };
  if (info.kind === "tag") {
    const prefix = info.prefix.toLowerCase();
    return { from: info.from, to: info.to, options: TAGS.filter(tag => tag.startsWith(prefix)).map(tag => ({ label: tag, detail: "Wikidot 标签", type: "keyword", text: tag })) };
  }
  if (info.kind === "close") {
    const stack = openTags(text, pos), prefix = info.prefix.toLowerCase();
    const ordered = [...new Set([...stack].reverse().concat(TAGS))].filter(tag => PAIRED.has(tag) && tag.startsWith(prefix));
    return { from: info.from, to: info.to, options: ordered.map(tag => ({ label: "[[/" + tag + "]]", detail: stack.includes(tag) ? "关闭当前打开的块" : "结束标记", type: "keyword", text: tag + "]]" })) };
  }
  if (info.kind === "class") {
    const used = new Set(String(info.value || info.prefix).split(/\s+/).filter(Boolean));
    const prefix = info.prefix.toLowerCase();
    const options = collectClasses(text).filter(item => !used.has(item.name) && item.name.toLowerCase().startsWith(prefix)).map(item => ({ label: item.name, detail: "页面中已用 ×" + item.count, type: "text", text: item.name }));
    if (!options.length) return null;
    return { from: info.from, to: info.to, options };
  }
  if (info.kind === "attr") {
    const prefix = info.prefix.toLowerCase();
    const options = ATTRS.filter(name => name.startsWith(prefix)).map(name => ({ label: name, detail: "属性", type: "property", text: name + '=""', cursor: name.length + 2 }));
    return options.length ? { from: info.from, to: info.to, options } : null;
  }
  return null;
}
function autoCloseFor(text, pos) {
  const lineStart = text.lastIndexOf("\n", pos - 1) + 1;
  const lineEndIndex = text.indexOf("\n", pos);
  const lineEnd = lineEndIndex < 0 ? text.length : lineEndIndex;
  if (pos !== lineEnd) return null;
  const m = /^\s*\[\[([a-zA-Z]+|==|=|>|<)(?=[\s\]])[^\]]*\]\]$/.exec(text.slice(lineStart, pos));
  if (!m) return null;
  const tag = m[1].toLowerCase();
  if (!PAIRED.has(tag)) return null;
  if (insideCode(text, pos)) return null;
  // A close on the very next non-empty line already belongs to this block;
  // a close further down may belong to an outer block, so pairing still helps.
  const following = text.slice(pos).split("\n").slice(1).find(line => line.trim());
  if (following && new RegExp("^\\s*\\[\\[/" + tag + "\\]\\]\\s*$", "i").test(following)) return null;
  return tag;
}
function completionSource(context) {
  const result = completions(context.state.doc.toString(), context.pos);
  if (!result) return null;
  return {
    from: result.from, to: result.to,
    options: result.options.map(option => ({
      label: option.label, detail: option.detail, type: option.type,
      apply: (view, completion, from, to) => view.dispatch({
        changes: { from, to, insert: option.text },
        selection: { anchor: from + (option.cursor ?? option.text.length) }
      })
    }))
  };
}
module.exports = { autoInlineFor, PAIRED, TAGS, ATTRS, SLASH, collectClasses, openTags, insideCode, analyze, completions, autoCloseFor, completionSource };
