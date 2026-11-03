"use strict";
const { Plugin, TextFileView, Notice, PluginSettingTab, Setting, Modal, requestUrl, normalizePath } = require("obsidian");
const { render, safeUrl, rebaseCSS } = (() => { const module = { exports: {} };
"use strict";
const {rebaseCSS}=(() => { const module = { exports: {} };
"use strict";
function quotedEnd(text,start) {
  const quote=text[start];let i=start+1;
  while(i<text.length){if(text[i]==="\\")i+=2;else if(text[i++]===quote)break;}
  return i;
}
function commentEnd(text,start){const end=text.indexOf("*/",start+2);return end<0?text.length:end+2;}
function urlAt(text,start) {
  const open=/^url\s*\(/i.exec(text.slice(start));if(!open)return null;
  let i=start+open[0].length;while(/\s/.test(text[i]||"")&&i<text.length)i++;
  const valueStart=i;let value;
  if(text[i]==='"'||text[i]==="'"){const end=quotedEnd(text,i);value=text.slice(i+1,end-1);i=end;}
  else {while(i<text.length&&text[i]!==")"){if(text[i]==="\\")i++;i++;}value=text.slice(valueStart,i).trim();}
  while(/\s/.test(text[i]||"")&&i<text.length)i++;
  return text[i]===")"?{start,end:i+1,value}:null;
}
function imports(css) {
  const found=[];let i=0;
  while(i<css.length){
    if(css.startsWith("/*",i)){i=commentEnd(css,i);continue;}
    if(css[i]==='"'||css[i]==="'"){i=quotedEnd(css,i);continue;}
    const m=/^@import\b\s*/i.exec(css.slice(i));
    if(!m){i++;continue;}
    const start=i;let pos=i+m[0].length,url,end;
    const token=urlAt(css,pos);
    if(token){url=token.value;pos=token.end;}
    else if(css[pos]==='"'||css[pos]==="'"){end=quotedEnd(css,pos);url=css.slice(pos+1,end-1);pos=end;}
    else {i+=m[0].length;continue;}
    const conditionStart=pos;let depth=0;
    while(pos<css.length){
      if(css.startsWith("/*",pos)){pos=commentEnd(css,pos);continue;}
      if(css[pos]==='"'||css[pos]==="'"){pos=quotedEnd(css,pos);continue;}
      if(css[pos]==="(")depth++;else if(css[pos]===")")depth--;
      if(css[pos]===";"&&!depth)break;pos++;
    }
    if(pos<css.length)found.push({start,end:pos+1,url,condition:css.slice(conditionStart,pos).trim()});
    i=pos+1;
  }
  return found;
}
function rebaseCSS(css,base) {
  function absolute(value){try{const url=new URL(value,base);return ["https:","http:"].includes(url.protocol)?url.href:"";}catch{return "";}}
  const patches=[];let i=0;
  while(i<css.length){
    if(css.startsWith("/*",i)){i=commentEnd(css,i);continue;}
    if(css[i]==='"'||css[i]==="'"){i=quotedEnd(css,i);continue;}
    const token=(i===0||!/[\w-]/.test(css[i-1]))?urlAt(css,i):null;
    if(token){if(!/^data:|^#/i.test(token.value))patches.push({start:i,end:token.end,text:`url(${JSON.stringify(absolute(token.value))})`});i=token.end;}else i++;
  }
  for(const item of imports(css)){
    const m=/^@import\b\s*/i.exec(css.slice(item.start));const start=item.start+m[0].length;
    if(css[start]==='"'||css[start]==="'")patches.push({start,end:quotedEnd(css,start),text:JSON.stringify(absolute(item.url))});
  }
  for(const patch of patches.sort((a,b)=>b.start-a.start))css=css.slice(0,patch.start)+patch.text+css.slice(patch.end);
  return css;
}
module.exports={imports,rebaseCSS};

return module.exports; })();
const {minimalPalette}=(() => { const module = { exports: {} };
"use strict";
// Minimal preview has no site shell, so pages written for a dark theme (light
// text on a dark #container) become unreadable on the plain background.
// The preview iframe has no scripts, so the decision is made statically from
// the page CSS: find the text colour and background the page assigns to its
// main containers and pick a matching backdrop.
const NAMED = { black: "#000", white: "#fff", gray: "#808080", grey: "#808080", silver: "#c0c0c0", red: "#f00", maroon: "#800000", navy: "#000080", darkgray: "#a9a9a9", darkgrey: "#a9a9a9", lightgray: "#d3d3d3", lightgrey: "#d3d3d3", dimgray: "#696969", whitesmoke: "#f5f5f5", gainsboro: "#dcdcdc", snow: "#fffafa", ivory: "#fffff0", beige: "#f5f5dc", wheat: "#f5deb3", linen: "#faf0e6" };
const TARGET = /^(?::root|html|body|#html-body|#skrollr-body|#container|#container-wrap|#content-wrap|#main-content|#page-content|#page-content\s+p|p|\.content-panel|\.page-content)$/i;
function parseColor(value) {
  let text = String(value || "").trim().toLowerCase().replace(/\s*!important$/, "");
  if (NAMED[text]) text = NAMED[text];
  let m;
  if ((m = /^#([0-9a-f]{3,4})$/.exec(text))) return [...m[1].slice(0, 3)].map(c => parseInt(c + c, 16)).concat(m[1].length === 4 ? parseInt(m[1][3] + m[1][3], 16) / 255 : 1);
  if ((m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/.exec(text))) return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)).concat(m[2] ? parseInt(m[2], 16) / 255 : 1);
  if ((m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(text))) {
    const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [+m[1], +m[2], +m[3], a];
  }
  if ((m = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(text))) {
    const h = +m[1] / 360, s = +m[2] / 100, l = +m[3] / 100;
    const f = n => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); };
    const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [f(0), f(8), f(4), a];
  }
  return null;
}
function luminance([r, g, b]) {
  const c = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}
// Collects simple top-level rules (inside @media too) and custom properties.
function rules(css) {
  const out = [], vars = Object.create(null);
  const text = String(css || "").replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of text.matchAll(/([^{}@;]+)\{([^{}]*)\}/g)) {
    const selectors = m[1].split(",").map(s => s.trim()).filter(Boolean);
    const decls = Object.create(null);
    for (const part of m[2].split(";")) {
      const i = part.indexOf(":"); if (i < 0) continue;
      const name = part.slice(0, i).trim().toLowerCase(), value = part.slice(i + 1).trim();
      if (name.startsWith("--")) vars[name] = value; else decls[name] = value;
    }
    out.push({ selectors, decls });
  }
  return { list: out, vars };
}
function resolve(value, vars, depth = 0) {
  if (!value || depth > 8) return value;
  return String(value).replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/g, (_, name, fallback) => resolve(vars[name] ?? fallback ?? "", vars, depth + 1));
}
function backgroundColor(value, vars) {
  const text = resolve(value, vars);
  if (!text) return null;
  const direct = parseColor(text);
  if (direct) return direct;
  // A shorthand or gradient: take its first recognisable colour.
  for (const m of text.matchAll(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b[a-z]+\b/gi)) { const c = parseColor(m[0]); if (c) return c; }
  return null;
}
function analyze(css) {
  const { list, vars } = rules(css);
  let text = null, background = null;
  for (const rule of list) {
    if (!rule.selectors.some(s => TARGET.test(s))) continue;
    const color = rule.decls.color && parseColor(resolve(rule.decls.color, vars));
    if (color && color[3] > 0.5) text = color;
    const bg = backgroundColor(rule.decls["background-color"] || rule.decls.background, vars);
    if (bg && bg[3] > 0.5) background = bg;
  }
  return { text, background };
}
// Returns the html{} declarations used by Minimal.
function minimalPalette(css, dark = false, enabled = true) {
  const light = "color-scheme:light;background:#faf9f6;color:#35343a", darkPalette = "color-scheme:dark;background:#202024;color:#e2e2e5";
  const fallback = dark ? darkPalette : light;
  if (!enabled) return { palette: fallback, reason: "" };
  const { text, background } = analyze(css);
  // The page paints its own backdrop; only make the outer frame match it.
  if (background) {
    const isDark = luminance(background) < 0.2;
    return { palette: `color-scheme:${isDark ? "dark" : "light"};background:rgb(${background.slice(0, 3).map(Math.round).join(",")});color:${isDark ? "#e2e2e5" : "#35343a"}`, reason: "page-background" };
  }
  if (text) {
    const lum = luminance(text);
    if (lum > 0.45) return { palette: darkPalette, reason: "light-text" };
    if (lum < 0.12) return { palette: light, reason: "dark-text" };
  }
  return { palette: fallback, reason: "" };
}
module.exports = { parseColor, luminance, analyze, minimalPalette };

return module.exports; })();
const {prepareSource}=(() => { const module = { exports: {} };
"use strict";
const blank=text=>text.replace(/[^\n]/g,"");
function stripComments(text){return text.replace(/\[\[code(?:\s+[^\]]*)?\]\][\s\S]*?\[\[\/code\]\]|\[!--[\s\S]*?--\]/gi,raw=>/^\[!--/.test(raw)?blank(raw):raw);}
// [[iftags]] blocks nest. An [[iftags]] without terms never matches at the
// top level (Wikidot's empty "any" list), but is transparent when nested.
// Themes rely on this: [[ift{$param}gs …]] only becomes a real tag once the
// include parameter is substituted, and wraps an empty [[iftags]] switch.
// Tag lines prefixed by blockquote markers are removed with their prefix.
function selectTags(text,tags=[]) {
  const available=new Set(tags),stack=[];let output="",end=0,active=true;
  const tokens=/\[\[code(?:\s+[^\]]*)?\]\][\s\S]*?\[\[\/code\]\]|^[ \t]*>[> \t]*\[\[(\/?)iftags(?:\s+([^\]]*))?\]\][ \t]*$|\[\[(\/?)iftags(?:\s+([^\]]*))?\]\]|^[ \t>]*\[\[\/?ift\{\$[^}\]]*\}gs\b[^\]]*\]\][ \t]*$/gim;let m;
  while((m=tokens.exec(text))){
    output+=active?text.slice(end,m.index):blank(text.slice(end,m.index));end=tokens.lastIndex;
    const close=m[1]??m[3],args=m[2]??m[4];
    if(close===undefined){output+=active&&!/^[ \t>]*\[\[\/?ift\{/.test(m[0])?m[0]:blank(m[0]);continue;}
    if(close){active=stack.length?stack.pop():active;}
    else{
      const terms=(args||"").trim().split(/[, ]+/).filter(Boolean);
      const required=terms.filter(t=>t[0]==="+"),excluded=terms.filter(t=>t[0]==="-"),any=terms.filter(t=>!/[+-]/.test(t[0]));
      const matches=terms.length?required.every(t=>available.has(t.slice(1)))&&excluded.every(t=>!available.has(t.slice(1)))&&(!any.length||any.some(t=>available.has(t))):stack.length>0;
      stack.push(active);active=active&&matches;
    }
    output+=blank(m[0]);
  }
  return output+(active?text.slice(end):blank(text.slice(end)));
}
// Wikidot expressions: [[#if c | then | else]], [[#ifexpr e | then | else]]
// and [[#expr e]]. Conditions are false when empty, "false", "null" or "0".
// Expressions use a small arithmetic/logic grammar; nothing is ever eval'd.
function evaluate(expr){
  const tokens=String(expr).match(/\d+(?:\.\d+)?|<=|>=|!=|<>|==|and|or|not|[-+*/%()<>=!]/gi)||[];
  if(tokens.join("").replace(/\s/g,"")!==String(expr).replace(/\s/g,""))throw Error("bad");
  let i=0;const peek=()=>tokens[i]?.toLowerCase(),take=()=>tokens[i++];
  const or=()=>{let v=and();while(peek()==="or"){take();const r=and();v=(v||r)?1:0;}return v;};
  const and=()=>{let v=cmp();while(peek()==="and"){take();const r=cmp();v=(v&&r)?1:0;}return v;};
  const cmp=()=>{let v=add();while(["<",">","<=",">=","=","==","!=","<>"].includes(peek())){const o=take(),r=add();v=({"<":v<r,">":v>r,"<=":v<=r,">=":v>=r,"=":v===r,"==":v===r,"!=":v!==r,"<>":v!==r})[o]?1:0;}return v;};
  const add=()=>{let v=mul();while(peek()==="+"||peek()==="-"){const o=take(),r=mul();v=o==="+"?v+r:v-r;}return v;};
  const mul=()=>{let v=unary();while(["*","/","%"].includes(peek())){const o=take(),r=unary();v=o==="*"?v*r:o==="/"?v/r:v%r;}return v;};
  const unary=()=>{const t=peek();if(t==="-"){take();return -unary();}if(t==="+"){take();return unary();}if(t==="not"||t==="!"){take();return unary()?0:1;}if(t==="("){take();const v=or();if(take()!==")")throw Error("bad");return v;}const n=take();if(n===undefined||!/^\d/.test(n))throw Error("bad");return Number(n);};
  const value=or();if(i!==tokens.length||!Number.isFinite(value))throw Error("bad");return value;
}
function expressions(text){
  const falsy=v=>/^(?:|false|null|0)$/i.test(v.trim());
  const re=/\[\[#(if|ifexpr|expr)\s([^\[\]]*)\]\]/gi;
  for(let round=0;round<20&&re.test(text);round++){
    re.lastIndex=0;
    text=text.replace(re,(raw,kind,body)=>{
      const parts=body.split("|"),cond=parts[0];
      if(kind.toLowerCase()==="if")return (falsy(cond)?parts[2]:parts[1])?.trim()??"";
      let value;try{value=evaluate(cond);}catch{return kind.toLowerCase()==="expr"?"Expression error":(parts[2]?.trim()??"");}
      if(kind.toLowerCase()==="expr")return String(Math.round(value*1e10)/1e10);
      return (value?parts[1]:parts[2])?.trim()??"";
    });
  }
  return text;
}
function prepareSource(text,tags=[]) {
  // Comments in code examples stay literal, while inactive documentation must
  // disappear before its includes or CSS modules are ever processed.
  return expressions(selectTags(stripComments(text),tags));
}
module.exports={stripComments,selectTags,prepareSource,expressions,evaluate};

return module.exports; })();
const {fontSize, unixName, attr} = (() => { const module = { exports: {} };
"use strict";
// Helpers shared by the Preview renderer and the Live editing decorator.
const SIZE_KEYWORDS = new Set(["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "smaller", "larger"]);
function fontSize(value) {
  const text = String(value || "").trim().toLowerCase();
  if (SIZE_KEYWORDS.has(text)) return text;
  if (/^\d+(?:\.\d+)?(?:px|em|rem|%|pt|ex|vw|vh)$/.test(text)) return text;
  if (/^\d+(?:\.\d+)?$/.test(text)) return text + "%";
  return "";
}
// Wikidot page names: lower case ASCII, every other run of characters becomes
// a single hyphen, and hyphens next to a category colon are dropped.
function unixName(value) {
  return String(value || "").toLowerCase()
    .replace(/[^a-z0-9:_#-]+/g, "-").replace(/-+/g, "-")
    .replace(/-*:-*/g, ":").replace(/^[-:]+|-+$/g, "");
}
// Finds the closer that balances an already consumed opener of `name`.
function findClose(text, from, name) {
  const re = new RegExp(`\\[\\[(\\/?)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s\\]])[^\\]]*\\]\\]`, "gi");
  re.lastIndex = from;
  let depth = 1, m;
  while ((m = re.exec(text))) {
    depth += m[1] ? -1 : 1;
    if (!depth) return { start: m.index, end: m.index + m[0].length };
  }
  return null;
}
function attr(text, name) {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"']+))`, "i").exec(String(text || ""));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}
module.exports = { fontSize, unixName, findClose, attr, SIZE_KEYWORDS };

return module.exports; })();
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

return module.exports; })();
const { expandIncludes } = (() => { const module = { exports: {} };
"use strict";
const {prepareSource}=(() => { const module = { exports: {} };
"use strict";
const blank=text=>text.replace(/[^\n]/g,"");
function stripComments(text){return text.replace(/\[\[code(?:\s+[^\]]*)?\]\][\s\S]*?\[\[\/code\]\]|\[!--[\s\S]*?--\]/gi,raw=>/^\[!--/.test(raw)?blank(raw):raw);}
// [[iftags]] blocks nest. An [[iftags]] without terms never matches at the
// top level (Wikidot's empty "any" list), but is transparent when nested.
// Themes rely on this: [[ift{$param}gs …]] only becomes a real tag once the
// include parameter is substituted, and wraps an empty [[iftags]] switch.
// Tag lines prefixed by blockquote markers are removed with their prefix.
function selectTags(text,tags=[]) {
  const available=new Set(tags),stack=[];let output="",end=0,active=true;
  const tokens=/\[\[code(?:\s+[^\]]*)?\]\][\s\S]*?\[\[\/code\]\]|^[ \t]*>[> \t]*\[\[(\/?)iftags(?:\s+([^\]]*))?\]\][ \t]*$|\[\[(\/?)iftags(?:\s+([^\]]*))?\]\]|^[ \t>]*\[\[\/?ift\{\$[^}\]]*\}gs\b[^\]]*\]\][ \t]*$/gim;let m;
  while((m=tokens.exec(text))){
    output+=active?text.slice(end,m.index):blank(text.slice(end,m.index));end=tokens.lastIndex;
    const close=m[1]??m[3],args=m[2]??m[4];
    if(close===undefined){output+=active&&!/^[ \t>]*\[\[\/?ift\{/.test(m[0])?m[0]:blank(m[0]);continue;}
    if(close){active=stack.length?stack.pop():active;}
    else{
      const terms=(args||"").trim().split(/[, ]+/).filter(Boolean);
      const required=terms.filter(t=>t[0]==="+"),excluded=terms.filter(t=>t[0]==="-"),any=terms.filter(t=>!/[+-]/.test(t[0]));
      const matches=terms.length?required.every(t=>available.has(t.slice(1)))&&excluded.every(t=>!available.has(t.slice(1)))&&(!any.length||any.some(t=>available.has(t))):stack.length>0;
      stack.push(active);active=active&&matches;
    }
    output+=blank(m[0]);
  }
  return output+(active?text.slice(end):blank(text.slice(end)));
}
// Wikidot expressions: [[#if c | then | else]], [[#ifexpr e | then | else]]
// and [[#expr e]]. Conditions are false when empty, "false", "null" or "0".
// Expressions use a small arithmetic/logic grammar; nothing is ever eval'd.
function evaluate(expr){
  const tokens=String(expr).match(/\d+(?:\.\d+)?|<=|>=|!=|<>|==|and|or|not|[-+*/%()<>=!]/gi)||[];
  if(tokens.join("").replace(/\s/g,"")!==String(expr).replace(/\s/g,""))throw Error("bad");
  let i=0;const peek=()=>tokens[i]?.toLowerCase(),take=()=>tokens[i++];
  const or=()=>{let v=and();while(peek()==="or"){take();const r=and();v=(v||r)?1:0;}return v;};
  const and=()=>{let v=cmp();while(peek()==="and"){take();const r=cmp();v=(v&&r)?1:0;}return v;};
  const cmp=()=>{let v=add();while(["<",">","<=",">=","=","==","!=","<>"].includes(peek())){const o=take(),r=add();v=({"<":v<r,">":v>r,"<=":v<=r,">=":v>=r,"=":v===r,"==":v===r,"!=":v!==r,"<>":v!==r})[o]?1:0;}return v;};
  const add=()=>{let v=mul();while(peek()==="+"||peek()==="-"){const o=take(),r=mul();v=o==="+"?v+r:v-r;}return v;};
  const mul=()=>{let v=unary();while(["*","/","%"].includes(peek())){const o=take(),r=unary();v=o==="*"?v*r:o==="/"?v/r:v%r;}return v;};
  const unary=()=>{const t=peek();if(t==="-"){take();return -unary();}if(t==="+"){take();return unary();}if(t==="not"||t==="!"){take();return unary()?0:1;}if(t==="("){take();const v=or();if(take()!==")")throw Error("bad");return v;}const n=take();if(n===undefined||!/^\d/.test(n))throw Error("bad");return Number(n);};
  const value=or();if(i!==tokens.length||!Number.isFinite(value))throw Error("bad");return value;
}
function expressions(text){
  const falsy=v=>/^(?:|false|null|0)$/i.test(v.trim());
  const re=/\[\[#(if|ifexpr|expr)\s([^\[\]]*)\]\]/gi;
  for(let round=0;round<20&&re.test(text);round++){
    re.lastIndex=0;
    text=text.replace(re,(raw,kind,body)=>{
      const parts=body.split("|"),cond=parts[0];
      if(kind.toLowerCase()==="if")return (falsy(cond)?parts[2]:parts[1])?.trim()??"";
      let value;try{value=evaluate(cond);}catch{return kind.toLowerCase()==="expr"?"Expression error":(parts[2]?.trim()??"");}
      if(kind.toLowerCase()==="expr")return String(Math.round(value*1e10)/1e10);
      return (value?parts[1]:parts[2])?.trim()??"";
    });
  }
  return text;
}
function prepareSource(text,tags=[]) {
  // Comments in code examples stay literal, while inactive documentation must
  // disappear before its includes or CSS modules are ever processed.
  return expressions(selectTags(stripComments(text),tags));
}
module.exports={stripComments,selectTags,prepareSource,expressions,evaluate};

return module.exports; })();
const {unixName}=(() => { const module = { exports: {} };
"use strict";
// Helpers shared by the Preview renderer and the Live editing decorator.
const SIZE_KEYWORDS = new Set(["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "smaller", "larger"]);
function fontSize(value) {
  const text = String(value || "").trim().toLowerCase();
  if (SIZE_KEYWORDS.has(text)) return text;
  if (/^\d+(?:\.\d+)?(?:px|em|rem|%|pt|ex|vw|vh)$/.test(text)) return text;
  if (/^\d+(?:\.\d+)?$/.test(text)) return text + "%";
  return "";
}
// Wikidot page names: lower case ASCII, every other run of characters becomes
// a single hyphen, and hyphens next to a category colon are dropped.
function unixName(value) {
  return String(value || "").toLowerCase()
    .replace(/[^a-z0-9:_#-]+/g, "-").replace(/-+/g, "-")
    .replace(/-*:-*/g, ":").replace(/^[-:]+|-+$/g, "");
}
// Finds the closer that balances an already consumed opener of `name`.
function findClose(text, from, name) {
  const re = new RegExp(`\\[\\[(\\/?)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s\\]])[^\\]]*\\]\\]`, "gi");
  re.lastIndex = from;
  let depth = 1, m;
  while ((m = re.exec(text))) {
    depth += m[1] ? -1 : 1;
    if (!depth) return { start: m.index, end: m.index + m[0].length };
  }
  return null;
}
function attr(text, name) {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"']+))`, "i").exec(String(text || ""));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}
module.exports = { fontSize, unixName, findClose, attr, SIZE_KEYWORDS };

return module.exports; })();
function includeURL(target, base) {
  let origin = new URL(base).origin, page = target.trim();
  if (page.startsWith(":")) {
    const match = /^:([a-z0-9.-]+):(.+)$/i.exec(page);
    if (!match) throw Error("跨站 include 格式应为 :站点:页面");
    const host = match[1].includes(".") ? match[1] : match[1] + ".wikidot.com";
    if (!/^[a-z0-9-]+\.wikidot\.com$/i.test(host)) throw Error("跨站 include 当前只支持 Wikidot 子域名");
    origin = "https://" + host; page = match[2];
  }
  // Wikidot normalises the name with toUnixName before looking it up, so
  // "Component:Image Block" and "component:image-block" are the same page.
  if (!/[\s/?#\\]/.test(page.trim())) page = unixName(page) || page;
  if (!page || /[\s/?#\\]/.test(page) || page === "." || page === "..") throw Error("无效的 include 页面名称");
  return origin + "/" + encodeURIComponent(page).replace(/%3A/gi, ":");
}
async function expandIncludes(source, getSource, options = {}) {
  const warnings = [], dependencies = new Set();
  const base = options.base || "https://scp-wiki-cn.wikidot.com/";
  let count = 0, size = 0;
  // Request every include of one level together; expansion itself stays
  // sequential, so output order and limits are unchanged.
  const requests = new Map();
  const load = url => { if (!requests.has(url)) requests.set(url, Promise.resolve().then(() => getSource(url))); return requests.get(url); };
  function prefetch(text, context) {
    if (options.prefetch === false) return;
    for (const m of text.matchAll(/^\[\[include\s+(\S+)/gim)) {
      try { load(includeURL(m[1].replace(/\]\]$/, ""), context)).catch(() => {}); } catch {}
    }
  }
  async function expand(text, context, stack) {
    text=prepareSource(text,options.tags||[]);
    prefetch(text, context);
    // Wikidot expands column-zero includes even inside code blocks. Indented
    // examples and inline includes remain literal, following the public syntax.
    // Same shape as Wikidot's rule: the tag starts a line and runs, possibly
    // over several lines, to the first "]]" that ends a line. A single "]"
    // inside a value (e.g. "hover-enlarge=--]") does not end the tag.
    const re = /^\[\[include\s+([\s\S]+?)\]\][\t ]*$/gm;
    let output = "", end = 0, match;
    while ((match = re.exec(text))) {
      output += text.slice(end, match.index); end = re.lastIndex;
      const parts = match[1].split("|"); const first=parts.shift().trim();
      const target=/^\S+/.exec(first)?.[0]||"";
      const params = Object.create(null);
      const initial=first.slice(target.length).trim();
      for(const m of initial.matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(.*?))(?=\s+[^\s=]+\s*=|$)/g))params[m[1]]=m[2]??m[3]??m[4].trim();
      // Wikidot ignores empty values and names outside [a-z0-9_-], leaving
      // their {$placeholders} literal.
      for (const part of parts) { const i = part.indexOf("="); if (i > 0) params[part.slice(0,i).trim()] = part.slice(i+1).trim(); }
      for (const key of Object.keys(params)) if (params[key] === "" || !/^[a-z0-9_-]+$/i.test(key)) delete params[key];
      try {
        const url = includeURL(target, context);
        if (stack.includes(url)) throw Error("循环引用：" + [...stack, url].join(" → "));
        if (stack.length >= (options.maxDepth || 10)) throw Error("嵌套 include 超过深度限制");
        if (++count > (options.maxCount || 40)) throw Error("include 数量超过限制");
        const raw = await load(url);
        if (typeof raw !== "string") throw Error("没有取得可用的页面源码");
        size += raw.length; if (size > (options.maxSize || 2000000)) throw Error("include 总内容超过限制");
        dependencies.add(url);
        const substituted = raw.replace(/\{\$([^}\r\n]+)\}/g, (all, name) => Object.hasOwn(params, name) ? params[name] : all);
        // Wikidot surrounds every included page with blank lines, so it never
        // merges into the paragraph before or after it.
        const inCode = (text.slice(0, match.index).match(/\[\[code\b/gi) || []).length > (text.slice(0, match.index).match(/\[\[\/code\]\]/gi) || []).length;
        const pad = inCode || options.padIncludes === false ? "" : "\n\n";
        output += pad + await expand(options.transformSource ? options.transformSource(substituted,url) : substituted, url, [...stack,url]) + pad;
      } catch (error) {
        warnings.push(`include ${target}：${error.message}`);
        // Keep errors visible and literal, not as new executable wikitext.
        output += "\n\n[[div class=\"error-block\"]]\n@@" + ("Include 不可用：" + target + " · " + error.message).replace(/@@/g, "@ @") + "@@\n[[/div]]\n\n";
      }
    }
    return output + text.slice(end);
  }
  return { source: await expand(source.replace(/\r\n?/g,"\n"), base, []), warnings, dependencies: [...dependencies] };
}
module.exports = { includeURL, expandIncludes };

return module.exports; })();
const { createRemoteClient, publicPageURL, localTemplateFromHTML, serializeTemplate } = (() => { const module = { exports: {} };
"use strict";
const {imports}=(() => { const module = { exports: {} };
"use strict";
function quotedEnd(text,start) {
  const quote=text[start];let i=start+1;
  while(i<text.length){if(text[i]==="\\")i+=2;else if(text[i++]===quote)break;}
  return i;
}
function commentEnd(text,start){const end=text.indexOf("*/",start+2);return end<0?text.length:end+2;}
function urlAt(text,start) {
  const open=/^url\s*\(/i.exec(text.slice(start));if(!open)return null;
  let i=start+open[0].length;while(/\s/.test(text[i]||"")&&i<text.length)i++;
  const valueStart=i;let value;
  if(text[i]==='"'||text[i]==="'"){const end=quotedEnd(text,i);value=text.slice(i+1,end-1);i=end;}
  else {while(i<text.length&&text[i]!==")"){if(text[i]==="\\")i++;i++;}value=text.slice(valueStart,i).trim();}
  while(/\s/.test(text[i]||"")&&i<text.length)i++;
  return text[i]===")"?{start,end:i+1,value}:null;
}
function imports(css) {
  const found=[];let i=0;
  while(i<css.length){
    if(css.startsWith("/*",i)){i=commentEnd(css,i);continue;}
    if(css[i]==='"'||css[i]==="'"){i=quotedEnd(css,i);continue;}
    const m=/^@import\b\s*/i.exec(css.slice(i));
    if(!m){i++;continue;}
    const start=i;let pos=i+m[0].length,url,end;
    const token=urlAt(css,pos);
    if(token){url=token.value;pos=token.end;}
    else if(css[pos]==='"'||css[pos]==="'"){end=quotedEnd(css,pos);url=css.slice(pos+1,end-1);pos=end;}
    else {i+=m[0].length;continue;}
    const conditionStart=pos;let depth=0;
    while(pos<css.length){
      if(css.startsWith("/*",pos)){pos=commentEnd(css,pos);continue;}
      if(css[pos]==='"'||css[pos]==="'"){pos=quotedEnd(css,pos);continue;}
      if(css[pos]==="(")depth++;else if(css[pos]===")")depth--;
      if(css[pos]===";"&&!depth)break;pos++;
    }
    if(pos<css.length)found.push({start,end:pos+1,url,condition:css.slice(conditionStart,pos).trim()});
    i=pos+1;
  }
  return found;
}
function rebaseCSS(css,base) {
  function absolute(value){try{const url=new URL(value,base);return ["https:","http:"].includes(url.protocol)?url.href:"";}catch{return "";}}
  const patches=[];let i=0;
  while(i<css.length){
    if(css.startsWith("/*",i)){i=commentEnd(css,i);continue;}
    if(css[i]==='"'||css[i]==="'"){i=quotedEnd(css,i);continue;}
    const token=(i===0||!/[\w-]/.test(css[i-1]))?urlAt(css,i):null;
    if(token){if(!/^data:|^#/i.test(token.value))patches.push({start:i,end:token.end,text:`url(${JSON.stringify(absolute(token.value))})`});i=token.end;}else i++;
  }
  for(const item of imports(css)){
    const m=/^@import\b\s*/i.exec(css.slice(item.start));const start=item.start+m[0].length;
    if(css[start]==='"'||css[start]==="'")patches.push({start,end:quotedEnd(css,start),text:JSON.stringify(absolute(item.url))});
  }
  for(const patch of patches.sort((a,b)=>b.start-a.start))css=css.slice(0,patch.start)+patch.text+css.slice(patch.end);
  return css;
}
module.exports={imports,rebaseCSS};

return module.exports; })();
const MARKER = "<!--WIKIDOT_EDITOR_CONTENT-->";
async function inlineStyles(css,base,getCSS,options={}) {
  const warnings=[],seen=new Set();let bytes=0;
  async function expand(text,url,stack) {
    let out="",end=0;
    for(const item of imports(text)) {
      out+=options.rebase?options.rebase(text.slice(end,item.start),url):text.slice(end,item.start);end=item.end;
      try{
        const target=new URL(item.url,url);
        if(target.protocol==="http:")target.protocol="https:";
        if(target.protocol!=="https:"||target.username||target.password||target.port||!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(target.hostname)||/\.(local|lan|internal)$/i.test(target.hostname))throw Error("不支持的样式地址");
        if(stack.includes(target.href)||stack.length>=8)throw Error("样式循环引用或嵌套过深");
        if(!seen.has(target.href)&&seen.size>=40)throw Error("样式引用过多");seen.add(target.href);
        const remote=await getCSS(target.href);bytes+=remote.length;if(bytes>4000000)throw Error("样式内容过大");
        const content=await expand(remote,target.href,[...stack,target.href]);
        out+=item.condition?`@media ${item.condition}{\n${content}\n}`:content;
      }catch(error){warnings.push("样式读取失败："+item.url+" · "+error.message);}
    }
    return out+(options.rebase?options.rebase(text.slice(end),url):text.slice(end));
  }
  return {css:await expand(css,base,[]),warnings};
}
function publicPageURL(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.port || !/^[a-z0-9-]+\.wikidot\.com$/i.test(url.hostname)) throw Error("请使用公开 Wikidot 站点的 HTTPS 页面地址");
  url.hash = ""; url.search = "";
  return url.href;
}
function sourceFromResponse(json, parse) {
  if (json.status !== "ok" || typeof json.body !== "string") throw Error(json.message || "公开源码接口未返回有效结果");
  const doc = parse(json.body);
  const element = doc.querySelector(".page-source");
  if (!element) throw Error("该页面没有公开源码或已被删除");
  // Server inserts both a <br> and a literal newline. Keep exactly one newline.
  for (const br of element.querySelectorAll("br")) {
    const following = br.nextSibling;
    br.replaceWith(following?.nodeType === 3 && /^\r?\n/.test(following.nodeValue || "") ? "" : "\n");
  }
  let text = element.textContent;
  if (text.startsWith("\n\t")) text = text.slice(2);
  return text.replace(/\r\n?/g, "\n").replace(/\u00a0/g," ");
}
function templateFromHTML(html, pageURL, parse, local=false) {
  const doc = parse(html), url = publicPageURL(pageURL);
  const page = doc.getElementById("page-content"), main = doc.getElementById("main-content");
  if (!page || !main) throw Error("参考页面缺少 Wikidot 正文容器");
  const headCSS = local?[...doc.head.querySelectorAll("style")].map(el=>el.textContent).join("\n"):doc.getElementById("internal-style")?.textContent || "";
  const title = doc.getElementById("page-title")?.textContent.trim() || doc.title;
  // Only the site's base styles are inherited. Page-authored module CSS and
  // the reference article itself must not leak into the new draft.
  if(!local){
    main.replaceChildren();
    const heading = doc.createElement("div"); heading.id = "page-title"; heading.textContent = "WIKIDOT_EDITOR_TITLE";
    const content = doc.createElement("div"); content.id = "page-content";
    content.appendChild(doc.createComment("WIKIDOT_EDITOR_CONTENT"));main.append(heading,content);
  }else if(!page.innerHTML.includes(MARKER))throw Error("本地 HTML 的 #page-content 中缺少 "+MARKER);
  // Local shells preserve site chrome, including search and page controls.
  // The preview sandbox and CSP keep scripts and form submissions disabled.
  const remove=local?"script,object,embed,meta,base":"script,style,iframe,object,embed,form,input,button,textarea,select,link,meta,base,#login-status,#odialog-container,#extrac-div-1,#extrac-div-2,#extrac-div-3,.ads,.ad-container";
  for (const el of doc.body.querySelectorAll(remove)) el.remove();
  if(local)for(const frame of doc.body.querySelectorAll("iframe"))frame.setAttribute("sandbox","");
  for (const el of [doc.body, ...doc.body.querySelectorAll("*")]) {
    for (const attr of [...el.attributes]) {
      const key = attr.name.toLowerCase();
      if (key.startsWith("on") || ["srcdoc","nonce","integrity","srcset","action","formaction"].includes(key)) el.removeAttribute(attr.name);
      else if (["href","src","poster"].includes(key)) {
        if(local&&key==="href"&&attr.value.startsWith("#"))continue;
        if(local&&key==="src"&&el.tagName==="IMG"&&/^data:image\/(?:png|jpeg|gif|webp|svg\+xml);base64,/i.test(attr.value))continue;
        try { const dest = new URL(attr.value, url); if (!["https:","http:"].includes(dest.protocol)) el.removeAttribute(attr.name); else el.setAttribute(attr.name, dest.href.replace(/^http:/,"https:")); }
        catch { el.removeAttribute(attr.name); }
      }
    }
    if (el.tagName === "A") { el.setAttribute("target","_blank"); el.setAttribute("rel","noopener noreferrer"); }
  }
  return { body: doc.body.innerHTML, headCSS, referenceURL:url, referenceTitle:title, bodyClass:doc.body.className, bodyId:doc.body.id || "html-body", marker:MARKER };
}
function serializeTemplate(shell) {
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return `<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8"><meta name="wikidot-editor-origin" content="${escape(shell.referenceURL)}"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WIKIDOT_EDITOR_TITLE</title><style id="internal-style">${shell.headCSS.replace(/<\/style/gi,"<\\/style")}</style></head><body id="${escape(shell.bodyId)}" class="${escape(shell.bodyClass)}">${shell.body}</body></html>`;
}
function localTemplateFromHTML(html,fallback,parse){
  const doc=parse(html),origin=doc.querySelector('meta[name="wikidot-editor-origin"]')?.getAttribute("content")||fallback;
  return templateFromHTML(html,origin,parse,true);
}
const UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36";
function createRemoteClient(request, parse, options = {}) {
  const cache = new Map(), pending = new Map(), timeout = options.timeout || 18000;
  // Wikidot occasionally answers 5xx or stalls under load; retry those once
  // or twice with a short pause instead of failing the whole include.
  async function fetch(options, attempt = 0) {
    try { return await fetchOnce(options); }
    catch (error) {
      const transient = /超时|HTTP 5\d\d|HTTP 429|network|ECONN|ETIMEDOUT/i.test(error.message || "");
      if (!transient || attempt >= (options.retries ?? 2)) throw error;
      await new Promise(resolve => setTimeout(resolve, 600 * (attempt + 1)));
      return fetch(options, attempt + 1);
    }
  }
  async function fetchOnce(options) {
    let timer;
    try {
      const {retries,...plain}=options;
      // Wikidot answers 503 to the ajax connector unless the client looks like
      // a browser, so always send a browser-style User-Agent.
      plain.headers={"User-Agent":UA,...(plain.headers||{})};
      const result = await Promise.race([request({...plain,throw:false}), new Promise((_,reject) => { timer=setTimeout(() => reject(Error("读取超时，可稍后刷新重试")), timeout); })]);
      if (result.status < 200 || result.status >= 300) throw Error("HTTP " + result.status);
      if (result.text.length > 3000000) throw Error("远程页面过大");
      return result;
    } finally { clearTimeout(timer); }
  }
  async function memo(key, factory) {
    const item = cache.get(key);
    if (item) return item.value;
    if (pending.has(key)) return pending.get(key);
    const task = (async()=>{
      const saved=await options.storage?.read(key);if(saved!==undefined&&saved!==null){cache.set(key,{value:saved});return saved;}
      const value=await factory();await options.storage?.write(key,value);cache.set(key,{value});return value;
    })().finally(() => pending.delete(key));
    pending.set(key,task); return task;
  }
  const styles=(css,base)=>inlineStyles(css,base,url=>memo("css:"+url,async()=>(await fetch({url,method:"GET"})).text),{rebase:options.rebaseCSS});
  return {
    async clear(persistent=false) { cache.clear();if(persistent)await options.storage?.clear(); },
    async forget(key) { cache.delete(key);await options.storage?.remove?.(key); },
    has(key) { return cache.has(key); },
    styles,
    async source(input) {
      const url = publicPageURL(input);
      return memo("source:"+url, async () => {
        const page = await fetch({url,method:"GET"});
        const id = /WIKIREQUEST\.info\.pageId\s*=\s*(\d+)/.exec(page.text)?.[1] || /\bpageId\s*[:=]\s*(\d+)/.exec(page.text)?.[1];
        if (!id) throw Error(/id="page-content"[\s\S]{0,400}(?:does not exist|不存在|尚未创建)/i.test(page.text) ? "页面不存在" : "页面不存在或无法取得页面编号");
        const token = "wikidoteditor" + Math.random().toString(36).slice(2);
        const response = await fetch({url:new URL("/ajax-module-connector.php",url).href,method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded","Cookie":"wikidot_token7="+token,"Referer":url},body:new URLSearchParams({moduleName:"viewsource/ViewSourceModule",page_id:id,wikidot_token7:token}).toString()});
        let json; try {json=JSON.parse(response.text);} catch {throw Error("源码接口返回了非 JSON 内容");}
        return sourceFromResponse(json,parse);
      });
    },
    async template(input) { const url=publicPageURL(input); return memo("template:"+url, async () => {
      const shell=templateFromHTML((await fetch({url,method:"GET"})).text,url,parse);
      const resolved=await styles(shell.headCSS,url);shell.headCSS=resolved.css;shell.resourceWarnings=resolved.warnings;return shell;
    }); }
  };
}
module.exports = { MARKER, publicPageURL, sourceFromResponse, templateFromHTML, localTemplateFromHTML, serializeTemplate, createRemoteClient, inlineStyles };

return module.exports; })();
const { createEditor } = (() => { const module = { exports: {} };
"use strict";
const {EditorSelection,EditorState,Compartment,StateField,StateEffect,Prec}=require("@codemirror/state");
const {EditorView,Decoration,WidgetType,keymap,dropCursor}=require("@codemirror/view");
const {history,defaultKeymap,historyKeymap,indentWithTab}=require("@codemirror/commands");
const {parseLive,activeLines,revealed,matchingTagPosition,rows,frameStyle,frameClass,touches}=(() => { const module = { exports: {} };
"use strict";
// Live editing model. Decorations preserve native text and cursor positions;
// document CSS is only applied by the separate Preview renderer.
//
// Layout rule: Live editing never adds visual lines. Tags are replaced in
// place. A block opener swallows its own line break and a closer swallows the
// break before it, so `[[div]]\ntext\n[[/div]]` is drawn as one framed row
// with a "div" label in the corner, like a rendered Obsidian code block. When
// the cursor reaches either tag, both tags come back as source rows inside the
// same frame.
const {fontSize,unixName,findClose,attr}=(() => { const module = { exports: {} };
"use strict";
// Helpers shared by the Preview renderer and the Live editing decorator.
const SIZE_KEYWORDS = new Set(["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "smaller", "larger"]);
function fontSize(value) {
  const text = String(value || "").trim().toLowerCase();
  if (SIZE_KEYWORDS.has(text)) return text;
  if (/^\d+(?:\.\d+)?(?:px|em|rem|%|pt|ex|vw|vh)$/.test(text)) return text;
  if (/^\d+(?:\.\d+)?$/.test(text)) return text + "%";
  return "";
}
// Wikidot page names: lower case ASCII, every other run of characters becomes
// a single hyphen, and hyphens next to a category colon are dropped.
function unixName(value) {
  return String(value || "").toLowerCase()
    .replace(/[^a-z0-9:_#-]+/g, "-").replace(/-+/g, "-")
    .replace(/-*:-*/g, ":").replace(/^[-:]+|-+$/g, "");
}
// Finds the closer that balances an already consumed opener of `name`.
function findClose(text, from, name) {
  const re = new RegExp(`\\[\\[(\\/?)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s\\]])[^\\]]*\\]\\]`, "gi");
  re.lastIndex = from;
  let depth = 1, m;
  while ((m = re.exec(text))) {
    depth += m[1] ? -1 : 1;
    if (!depth) return { start: m.index, end: m.index + m[0].length };
  }
  return null;
}
function attr(text, name) {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"']+))`, "i").exec(String(text || ""));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}
module.exports = { fontSize, unixName, findClose, attr, SIZE_KEYWORDS };

return module.exports; })();
const ALIGN={"=":"center",">":"right","<":"left","==":"justify"};
const RAW=new Set(["code","html","embed","math"]);
// Blocks drawn as framed boxes; the others only hide their tags.
const BOX=new Set(["div","note","gallery","bibliography","code","html","embed","math","quote","ul","ol"]);
const NAMES="div|collapsible|tabview|tab|table|row|cell|hcell|thead|tbody|ul|ol|li|note|gallery|bibliography|footnote|span|size|a|quote|code|html|embed|math|==|=|>|<";
const OPEN_LINE=new RegExp(`^\\[\\[(${NAMES})(?=[\\s\\]])([^\\]]*)\\]\\]$`,"i");
const CLOSE_LINE=new RegExp(`^\\[\\[\\/(${NAMES})\\]\\]$`,"i");
const INLINE_CONTAINER=/\[\[(span|size|a|footnote|div|note|collapsible|li|cell|hcell)(?=[\s\]])([^\]]*)\]\]/y;
const TOKEN=/\[\[(f?[<>]toc|toc|footnoteblock|#|anchor|f?[<>=]?image|iframe|file|\*?user)(?=[\s\]])([^\]]*)\]\]/y;
// Only layout/typography declarations are admitted into the editor, never page CSS.
function layoutStyle(args){
 const allowed=/^(?:text-align|width|max-width|min-width|height|min-height|margin(?:-(?:left|right|top|bottom))?|padding(?:-(?:left|right|top|bottom))?|color|background-color|border(?:-radius)?|font-size|line-height|opacity)$/;
 return (attr(args,"style")||"").split(";").filter(part=>{const i=part.indexOf(":");return i>0&&allowed.test(part.slice(0,i).trim().toLowerCase())&&!/url\s*\(|expression|[{}<>]/i.test(part);}).join(";");
}
function colorValue(value){const text=String(value||"").trim();return /^[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(text)?"#"+text:text;}
function blockLabel(kind,args){
  const cls=attr(args,"class"),id=attr(args,"id");
  const sel=(cls?cls.split(/\s+/).filter(Boolean).map(c=>"."+c).join(""):"")+(id?"#"+id:"");
  switch(kind){
    case "collapsible":return "collapsible · "+(attr(args,"show")||"+ show block");
    case "code":{const type=attr(args,"type");return "code"+(type?" · "+type:"");}
    case "tab":return args.trim();
    default:return kind+(sel?" "+sel:"");
  }
}
function tokenLabel(name,args){
  const value=args.trim(),first=value.split(/\s+/)[0]||"";
  switch(name.toLowerCase().replace(/^f(?=[<>])/,"")){
    case "footnoteblock":return "脚注";
    case "#":case "anchor":return "⚓ "+first;
    case "iframe":return "iframe · "+(/^https?:\/\/([^/]+)/i.exec(first)?.[1]||first);
    case "file":return "📎 "+(value.split("|")[1]||first).trim();
    case "user":case "*user":return "@"+value;
    default:return "🖼 "+(first.split("/").pop()||"图片");
  }
}
function plain(text){return String(text).replace(/\[\[[^\]]*\]\]|\*\*|\/\/|__|--|\{\{|\}\}|\^\^|,,|@@/g,"").replace(/##[^|#]+\|([^#]*)##/g,"$1").trim();}
function parseLive(source,options={}) {
  const {localRules,styleFor}=(() => { const module = { exports: {} };
"use strict";
const {attr}=(() => { const module = { exports: {} };
"use strict";
// Helpers shared by the Preview renderer and the Live editing decorator.
const SIZE_KEYWORDS = new Set(["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "smaller", "larger"]);
function fontSize(value) {
  const text = String(value || "").trim().toLowerCase();
  if (SIZE_KEYWORDS.has(text)) return text;
  if (/^\d+(?:\.\d+)?(?:px|em|rem|%|pt|ex|vw|vh)$/.test(text)) return text;
  if (/^\d+(?:\.\d+)?$/.test(text)) return text + "%";
  return "";
}
// Wikidot page names: lower case ASCII, every other run of characters becomes
// a single hyphen, and hyphens next to a category colon are dropped.
function unixName(value) {
  return String(value || "").toLowerCase()
    .replace(/[^a-z0-9:_#-]+/g, "-").replace(/-+/g, "-")
    .replace(/-*:-*/g, ":").replace(/^[-:]+|-+$/g, "");
}
// Finds the closer that balances an already consumed opener of `name`.
function findClose(text, from, name) {
  const re = new RegExp(`\\[\\[(\\/?)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s\\]])[^\\]]*\\]\\]`, "gi");
  re.lastIndex = from;
  let depth = 1, m;
  while ((m = re.exec(text))) {
    depth += m[1] ? -1 : 1;
    if (!depth) return { start: m.index, end: m.index + m[0].length };
  }
  return null;
}
function attr(text, name) {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"']+))`, "i").exec(String(text || ""));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}
module.exports = { fontSize, unixName, findClose, attr, SIZE_KEYWORDS };

return module.exports; })();
const LAYOUT=/^(?:display|grid-template-columns|grid-template-rows|grid-auto-flow|grid-column|grid-row|gap|column-gap|row-gap|flex-direction|flex-wrap|flex|order|justify-content|justify-items|align-items|align-self|width|min-width|max-width|height|min-height|max-height|margin(?:-(?:left|right|top|bottom|inline|block))?|padding(?:-(?:left|right|top|bottom|inline|block))?|text-align|float|clear|box-sizing)$/;
function declarations(css,positioning=false,painting=false){
 const result=[];
 for(const part of String(css||"").split(";")){
  const i=part.indexOf(":");if(i<0)continue;
  const name=part.slice(0,i).trim().toLowerCase(),value=part.slice(i+1).trim().replace(/\s*!important\s*$/i,"");
  if(!(LAYOUT.test(name)||(painting&&/^(?:color|background-color|border(?:-radius)?|font-size|line-height|opacity)$/.test(name))||(positioning&&/^(?:position|top|right|bottom|left)$/.test(name)))||!value||/url\s*\(|expression|[{}<>]|var\(/i.test(value))continue;
  if(name==="display"&&!/^(?:grid|inline-grid|flex|inline-flex|block|inline-block|flow-root)$/.test(value))continue;
  if(name==="position"&&!/^(?:relative|absolute|fixed|sticky)$/.test(value))continue;
  // Negative margins pull blocks over each other; without the page's own
  // painting that only produces overlapping text, so they need positioning.
  if(!positioning&&/^margin/.test(name)&&/(^|\s)-\d/.test(value)){const safe=value.replace(/(^|\s)-\d[\w.%]*/g,"$10");result.push(name+":"+safe);continue;}
  result.push(name+":"+value);
 }
 return result.join(";");
}
function localRules(source){
 const rules=[];
 for(const module of source.replace(/\[\[code\b[^\]]*\]\][\s\S]*?\[\[\/code\]\]/gi,"").matchAll(/\[\[module\s+CSS[^\]]*\]\]([\s\S]*?)\[\[\/module\]\]/gi)){
  if(/\bdisable\s*=\s*["']?true/i.test(module[0].slice(0,module[0].indexOf(']]'))))continue;
  const css=module[1].replace(/\/\*[\s\S]*?\*\//g,"");
  for(const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g))for(const selector of match[1].split(",")){
   const s=selector.trim();if(!/^(?:div)?(?:\.[\w-]+)+$/.test(s))continue;
   rules.push({classes:[...s.matchAll(/\.([\w-]+)/g)].map(m=>m[1]),css:match[2]});
  }
 }
 return rules;
}
function styleFor(args,rules,positioning=false,painting=false){
 const classes=new Set((attr(args,"class")||"").split(/\s+/));
 return declarations(rules.filter(r=>r.classes.every(c=>classes.has(c))).map(r=>r.css).concat(attr(args,"style")||"").join(";"),positioning,painting);
}
module.exports={declarations,localRules,styleFor};

return module.exports; })(),layoutRules=localRules(source);
  const lines=[],marks=[],hidden=[],folds=[],chips=[],headings=[],tabviews=[],collapsibles=[],tables=[],divs=[],stack=[];
  // Mask comments before parsing so their brackets and CSS cannot affect nesting.
  const comments=[];
  const masked=source.replace(/\[\[(code|html|embed|math)\b[^\]]*\]\][\s\S]*?(?:\[\[\/\1\]\]|$)|@@[\s\S]*?@@|@<[\s\S]*?>@|\[!--[\s\S]*?(?:--\]|$)/gi,(text,...args)=>{
    const at=args[args.length-2];
    if(!text.startsWith("[!--"))return text;
    comments.push({from:at,to:at+text.length});return text.replace(/[^\n]/g," ");
  });
  const rawLines=masked.split("\n"),starts=[],tagLine=new Set();
  {let at=0;for(const text of rawLines){starts.push(at);at+=text.length+1;}}
  let raw=null,counters=[];
  function mark(from,to,cls,style=""){if(to>from&&(cls||style))marks.push({from,to,cls,style});}
  function hide(from,to,line){if(to>from)hidden.push({from,to,line});}
  const boxDepth=()=>stack.filter(s=>s.box).length;
  const alignStyle=()=>{for(let i=stack.length-1;i>=0;i--)if(stack[i].align)return "text-align:"+stack[i].align;return "";};
  const RULES=[
    {re:/@@([^\n]*?)@@/y,kind:"literal"},
    {re:/@<([^\n]*?)>@/y,kind:"literal"},
    {re:/\[!--[^\n]*?--\]/y,kind:"comment"},
    {re:/\[\[\[(\*?)([^\]\n|]+?)(?:\s*\|\s*([^\]\n]*?))?\s*\]\]\]/y,kind:"pagelink"},
    {re:/\[(\*?)((?:https?:\/\/|\/|#)[^\s\]]*)(?:\s+([^\]\n]+))?\]/y,kind:"url"},
    {re:/\[([\w.+-]+@[\w.-]+\.\w+)(?:\s+([^\]\n]+))?\]/y,kind:"mail"},
    {re:/\[\[\$([^\n]*?)\$\]\]/y,kind:"math"},
    {re:/\*\*([^\n]+?)\*\*/y,kind:"strong"},
    {re:/(?<![:/])\/\/([^\n]+?)\/\//y,kind:"em"},
    {re:/__([^\n]+?)__/y,kind:"underline"},
    {re:/--([^\n]+?)--/y,kind:"strike"},
    {re:/\{\{([^\n]+?)\}\}/y,kind:"code"},
    {re:/\^\^([^\n]+?)\^\^/y,kind:"sup"},
    {re:/,,([^\n]+?),,/y,kind:"sub"},
    {re:/##([^|\n#]+)\|([^\n#]*?)##/y,kind:"color"},
    {re:/(\*?)(https?:\/\/[^\s\]\[|<>"']+)/y,kind:"bare"}
  ];
  const WRAP={strong:"wd-live-strong",em:"wd-live-em",underline:"wd-live-underline",strike:"wd-live-strike",sup:"wd-live-sup",sub:"wd-live-sub"};
  function inline(text,at,line){
    let index=0;
    while(index<text.length){
      if(text.startsWith("[[",index)&&!text.startsWith("[[[",index)){
        TOKEN.lastIndex=index;let m=TOKEN.exec(text);
        if(m){
          const start=at+index,end=start+m[0].length,toc=/toc$/i.test(m[1]);
          chips.push({kind:toc?"toc":/image$/i.test(m[1])?"image":"token",source:m[0],from:start,to:end,revealFrom:start,revealTo:end,line,label:toc?"目录":tokenLabel(m[1],m[2]),float:/^f</i.test(m[1])?"left":/^f>/i.test(m[1])?"right":""});
          index+=m[0].length;continue;
        }
        INLINE_CONTAINER.lastIndex=index;m=INLINE_CONTAINER.exec(text);
        if(m){
          const name=m[1].toLowerCase(),close=findClose(text,index+m[0].length,name);
          if(close){
            const from=at+index+m[0].length,to=at+close.start;
            let cls="",style="";
            if(name==="size"){const size=fontSize(m[2]);if(size){cls="wd-live-size";style="font-size:"+size;}}
            else if(name==="a")cls="wd-live-link";
            else if(name==="footnote")cls="wd-live-footnote";
            hide(at+index,from,line);mark(from,to,cls,style);hide(to,at+close.end,line);
            inline(text.slice(index+m[0].length,close.start),from,line);
            index=close.end;continue;
          }
        }
      }
      let hit=null;
      for(const rule of RULES){rule.re.lastIndex=index;const m=rule.re.exec(text);if(m&&m.index===index){hit={rule,m};break;}}
      if(!hit){index++;continue;}
      const m=hit.m,start=at+m.index,end=start+m[0].length;
      switch(hit.rule.kind){
        case "literal":{const content=m[1],from=start+2;mark(from,from+content.length,"wd-live-literal");hide(start,from,line);hide(from+content.length,end,line);break;}
        case "comment":mark(start,end,"wd-live-comment");break;
        case "pagelink":{
          const pipe=m[0].indexOf("|"),label=m[3]?.trim();
          if(label){const from=start+pipe+1+m[0].slice(pipe+1).indexOf(label);mark(from,from+label.length,"wd-live-link");hide(start,from,line);hide(from+label.length,end,line);}
          else{
            // `[[[page]]]` and `[[[page|]]]` both show the page name itself.
            const target=m[2],from=start+3+m[1].length+m[0].slice(3+m[1].length).indexOf(target);
            mark(from,from+target.length,"wd-live-link");hide(start,from,line);hide(from+target.length,end,line);
          }
          break;
        }
        case "url":{
          const label=m[3]||m[2],from=label===m[3]?start+m[0].lastIndexOf(label):start+1+m[1].length;
          mark(from,from+label.length,"wd-live-link");hide(start,from,line);hide(from+label.length,end,line);break;
        }
        case "mail":{const label=m[2]||m[1],from=start+m[0].lastIndexOf(label);mark(from,from+label.length,"wd-live-link");hide(start,from,line);hide(from+label.length,end,line);break;}
        case "math":{const from=start+3;hide(start,from,line);mark(from,from+m[1].length,"wd-live-math");hide(from+m[1].length,end,line);break;}
        case "bare":{const from=start+m[1].length;hide(start,from,line);mark(from,end,"wd-live-link");break;}
        case "code":{const content=m[1],from=start+2;hide(start,from,line);mark(from,from+content.length,"wd-live-code");hide(from+content.length,end,line);break;}
        case "color":{
          const parts=m[2].split("|"),background=parts.length>1?colorValue(parts[0]):"",content=parts.length>1?parts.slice(1).join("|"):parts[0];
          const from=start+m[0].lastIndexOf(content);
          mark(from,from+content.length,"",`color:${colorValue(m[1])}${background?";background:"+background:""}`);
          hide(start,from,line);hide(from+content.length,end,line);
          inline(content,from,line);break;
        }
        default:{
          const content=m[1],from=start+2;
          hide(start,from,line);mark(from,from+content.length,WRAP[hit.rule.kind]||"");hide(from+content.length,end,line);
          inline(content,from,line);
        }
      }
      index+=m[0].length;
    }
  }
  const lineInfo=(i,extra={})=>({from:starts[i],to:starts[i]+rawLines[i].length,number:i,spaceTop:false,spaceBottom:false,cls:"",style:alignStyle(),depth:boxDepth(),top:[],bottom:[],...extra});
  // Folds keep their whole source; lines inside them are not decorated.
  function fold(line,i,last,kind){
    const from=starts[i],end=starts[last]+rawLines[last].length,first=rawLines[i].trim();
    const label=kind==="Comment"?"[!-- … --]":last>i&&!/\]\]$/.test(first)?first+" …":first;
    folds.push({from,to:end,label,kind,lines:last-i+1,line:i,last,firstTo:starts[i]+rawLines[i].length});
    line.cls="wd-live-fold-line";line.spaceTop=true;line.spaceBottom=last===i;
    for(let j=i+1;j<=last;j++)lines.push(lineInfo(j,{cls:"wd-live-fold-line",spaceBottom:j===last}));
  }
  for(let i=0;i<rawLines.length;i++){
    const text=rawLines[i],from=starts[i],to=from+text.length;
    const line=lineInfo(i);lines.push(line);
    const trimmed=text.trim(),lead=text.length-text.trimStart().length,tagFrom=from+lead,tagTo=from+text.trimEnd().length;let match;
    const closeTag=kind=>{
      // Same recovery as Preview: alignment closers are interchangeable, and
      // a closer of an outer block implicitly ends unclosed inner blocks.
      let open=stack[stack.length-1];
      if(!open)return false;
      if(open.kind!==kind&&!(ALIGN[open.kind]&&ALIGN[kind])){
        let at=stack.length-1;while(at>=0&&stack[at].kind!==kind)at--;
        if(at<0||stack.slice(at+1).some(s=>RAW.has(s.kind)))return false;
        while(stack.length-1>at){
          const inner=stack.pop();
          if(inner.box){line.bottom.push(inner.level);}
          chips[inner.chip].implicit=true;
        }
        open=stack[stack.length-1];
      }
      stack.pop();tagLine.add(i);
      line.style=open.align?"text-align:"+open.align:alignStyle();line.cls="wd-live-tag-line";
      if(!/^(?:span|size|a|tab|row|cell|hcell|thead|tbody|li)$/.test(kind))line.spaceBottom=true;
      if(open.box){line.depth=Math.max(open.level,...line.bottom);line.bottom.push(open.level);}
      const index=chips.push({kind:"close",tag:kind,from,to,revealFrom:tagFrom,revealTo:tagTo,line:i,label:"/"+kind,box:open.box,level:open.level,pair:open.chip})-1;
      chips[open.chip].pair=index;
      if(kind==="tab"&&open.tab){open.tab.to=i<rawLines.length-1?starts[i+1]:to;open.tab.close=index;}
      if(kind==="div")divs.push({from:chips[open.chip].revealFrom,to:tagTo,first:chips[open.chip].line,last:i,open:open.chip,close:index,args:open.args,layout:open.layout,source:source.slice(chips[open.chip].revealFrom,tagTo)});
      if(kind==="table"){
        const start=chips[open.chip].revealFrom,sourceText=source.slice(start,tagTo),cells=[];
        const re=/\[\[(h?cell)(?=[\s\]])[^\]]*\]\]/gi;let m;
        while((m=re.exec(sourceText)))cells.push({from:start+m.index+m[0].length});
        tables.push({from:start,to:tagTo,first:chips[open.chip].line,last:i,source:sourceText,cells,simple:false});
      }
      if(kind==="collapsible")collapsibles.push({from:chips[open.chip].from,to,open:open.chip,close:index,args:open.args});
      if(kind==="tabview"&&open.tabview)tabviews.push(open.tabview);
      return true;
    };
    if(raw){
      if((match=CLOSE_LINE.exec(trimmed))&&match[1].toLowerCase()===raw){raw=null;closeTag(match[1].toLowerCase());}
      else line.cls="wd-live-code-line";
      continue;
    }
    if(/^\[\[include\b/i.test(trimmed)){
      let last=i;
      while(last<rawLines.length-1&&!/\]\]\s*$/.test(rawLines[last])){
        if(/^\s*\[\[(?:include|module|div|code)\b/i.test(rawLines[last+1]))break;
        last++;
      }
      if(/\]\]\s*$/.test(rawLines[last])){fold(line,i,last,"Include · "+(/^\[\[include\s+([^\s|\]]+)/i.exec(trimmed)?.[1]||""));i=last;continue;}
    }
    if(/^\[\[module\s+\S+/i.test(trimmed)||/^\[!--/.test(trimmed)){
      const comment=trimmed.startsWith("[!--"),module=/^\[\[module\s+([^\s\]]+)/i.exec(trimmed)?.[1],endPattern=comment?/--\]/:/\[\[\/module\]\]/i;let last=i;
      while(last<rawLines.length-1&&!endPattern.test(rawLines[last])){
        if(!comment&&/^\s*\[\[module\b/i.test(rawLines[last+1]))break;
        last++;
      }
      const closed=endPattern.test(rawLines[last]);
      if(!closed&&!comment&&module?.toLowerCase()!=="css")last=i;
      if(closed||(!comment&&module?.toLowerCase()!=="css")){fold(line,i,last,comment?"Comment":module);i=last;continue;}
    }
    if(/^\s*\|\|/.test(text)){
      const {simpleCells}=(() => { const module = { exports: {} };
"use strict";
// Source offsets shared by live table clicks and keyboard navigation.
function simpleCells(text,offset=0){
 const pipes=[...text.matchAll(/\|{2,}/g)],cells=[];
 for(let i=0;i<pipes.length-1;i++){
  const from=pipes[i].index+pipes[i][0].length,to=pipes[i+1].index,raw=text.slice(from,to);
  let lead=/^\s*(?:~\s*)?(?:[<>=]\s*)?/.exec(raw)[0].length;
  cells.push({from:offset+from+lead,to:offset+to,span:Math.max(1,Math.floor(pipes[i][0].length/2))});
 }
 return cells;
}
function tableKey(source,pos,key,backward=false,tables=[]){
 const table=tables.find(t=>pos>=t.from&&pos<=t.to&&t.simple);
 if(!table)return null;
 const cells=table.cells;let index=cells.findIndex((c,i)=>pos<=c.to&&(i===0||pos>cells[i-1].to));
 if(index<0&&cells.length&&pos>cells.at(-1).to)index=cells.length-1;
 if(index<0)return null;
 if(key==="Enter"&&pos!==table.to)return null;
 const target=key==="Enter"?cells.length:index+(backward?-1:1);
 if(target<0)return {selection:{anchor:Math.max(0,table.from-1)}};
 if(target<cells.length)return {selection:{anchor:cells[target].from}};
 if(backward)return null;
 const last=source.slice(table.from,table.to).split("\n").at(-1),columns=simpleCells(last).reduce((n,c)=>n+c.span,0);
 const insert="\n||"+"  ||".repeat(columns);
 return {changes:{from:table.to,insert},selection:{anchor:table.to+4}};
}
module.exports={simpleCells,tableKey};

return module.exports; })(),first=i,cells=[];
      let last=i;
      while(true){
        cells.push(...simpleCells(rawLines[last],starts[last]));
        if(/ _\s*$/.test(rawLines[last]))break; // continuation remains native source until closed
        if(last+1>=rawLines.length||!/^\s*\|\|/.test(rawLines[last+1]))break;
        last++;
      }
      line.cls="wd-live-table-line";line.spaceTop=true;line.spaceBottom=last===i;
      for(let j=i+1;j<=last;j++)lines.push(lineInfo(j,{cls:"wd-live-table-line",spaceBottom:j===last}));
      if(!/ _\s*$/.test(rawLines[last]))tables.push({from,to:starts[last]+rawLines[last].length,first,last,source:source.slice(from,starts[last]+rawLines[last].length),cells,simple:true});
      i=last;continue;
    }
    if((match=OPEN_LINE.exec(trimmed))){
      const kind=match[1].toLowerCase(),args=match[2]||"",layout=kind==="div"&&options.layout!==false?styleFor(args,layoutRules,options.positioning):"",box=BOX.has(kind)&&(kind!=="div"||options.frames!==false);
      const entry={kind,args,layout,align:ALIGN[kind]||"",box,level:boxDepth()+(box?1:0),chip:chips.length};
      const parent=stack[stack.length-1];
      if(kind==="tabview")entry.tabview={from,chip:chips.length,tabs:[]};
      if(kind==="tab"&&parent?.tabview){entry.tab={name:args.trim()||"标签 "+(parent.tabview.tabs.length+1),from,open:chips.length};parent.tabview.tabs.push(entry.tab);}
      stack.push(entry);tagLine.add(i);
      if(!/^(?:span|size|a|tab|row|cell|hcell|thead|tbody|li)$/.test(kind))line.spaceTop=true;
      if(RAW.has(kind))raw=kind;
      line.style=alignStyle();line.depth=boxDepth();line.cls="wd-live-tag-line";if(box)line.top.push(entry.level);
      chips.push({kind:"open",tag:kind,from,to,revealFrom:tagFrom,revealTo:tagTo,line:i,label:blockLabel(kind,args),box,args,layout,level:entry.level,raw:RAW.has(kind)});
      counters=[];continue;
    }
    if((match=CLOSE_LINE.exec(trimmed))){
      const kind=match[1].toLowerCase();
      if(!closeTag(kind)){
        // Pairing hint: an unmatched closer is flagged in place instead of
        // silently changing the nesting of every following line.
        line.cls="wd-live-unmatched";line.style="";
        chips.push({kind:"warn",from:tagFrom,to:tagTo,revealFrom:tagFrom,revealTo:tagTo,line:i,label:"⚠ 多余的 /"+kind});
      }
      counters=[];continue;
    }
    if(!trimmed)line.cls="wd-live-empty-line";
    let content=text,contentAt=from;
    if((match=/^(\s*)([*#])\s+/.exec(text))){
      const level=match[1].length,ordered=match[2]==="#";
      counters=counters.slice(0,level+1);counters[level]=(counters[level]||0)+1;
      line.cls="wd-live-list";
      chips.push({kind:"bullet",from,to:from+match[0].length,line:i,lineMode:true,label:ordered?counters[level]+".":"•",indent:level});
      content=text.slice(match[0].length);contentAt+=match[0].length;
    }else{
      counters=[];
      if((match=/^(\+{1,6})(\*?)\s+/.exec(text))){
        // As with Markdown headings in this vault, the marker sits at the right
        // edge and only appears while the line is being edited.
        const level=match[1].length;
        line.cls=`wd-live-heading wd-live-h${level}`;
        mark(from,from+match[0].length,"wd-live-heading-mark");
        hide(from,from+match[0].length,i);content=text.slice(match[0].length);contentAt+=match[0].length;
        headings.push({level,text:plain(content),from:contentAt,hidden:!!match[2]});
      }
      else if((match=/^(>+) ?/.exec(text))){line.cls="wd-live-quote wd-live-quote-"+Math.min(match[1].length,4);hide(from,from+match[0].length,i);content=text.slice(match[0].length);contentAt+=match[0].length;}
      else if((match=/^:\s+(.+?)\s+:(?:\s+|$)/.exec(text))){
        line.cls="wd-live-dl";const term=match[1],termAt=from+text.indexOf(term,1);
        hide(from,termAt,i);mark(termAt,termAt+term.length,"wd-live-dt");
        chips.push({kind:"sep",from:termAt+term.length,to:from+match[0].length,line:i,lineMode:true,label:"："});
        inline(term,termAt,i);content=text.slice(match[0].length);contentAt=from+match[0].length;
      }
      else if(/^\s*\|\|/.test(text))line.cls="wd-live-table-line";
      else if(/^-{3,}\s*$/.test(text)){line.cls="wd-live-rule";line.spaceTop=true;line.spaceBottom=true;hide(from,to,i);continue;}
    }
    if(/^\[\[(?:f?[<>=]?image|f?[<>]?toc)\b/i.test(trimmed)){line.spaceTop=true;line.spaceBottom=true;}
    inline(content,contentAt,i);
  }
  // Incomplete outer divs still own their descendants while drafting.
  for(const open of stack)if(open.kind==="div"){
    const chip=chips[open.chip];
    divs.push({from:chip.revealFrom,to:source.length,first:chip.line,last:rawLines.length-1,open:open.chip,args:open.args,layout:open.layout,source:source.slice(chip.revealFrom)});
    if(open.box)lines.at(-1).bottom.push(open.level);
  }
  // Render one coherent subtree, rather than a layout widget inside source frames.
  for(const block of divs)if(!block.layout&&divs.some(child=>child.from>block.from&&child.to<=block.to&&child.layout))block.layout="display:block";
  // Line joins: every opener absorbs the break after it and every closer the
  // break before it, unless that break is already taken. An empty block is a
  // single framed row; sibling blocks stay on separate rows.
  const joined=new Set();
  for(const chip of chips)if(chip.kind==="open"&&chip.line<rawLines.length-1&&rawLines[chip.line+1].trim()!==""&&!joined.has(chip.line)){chip.to=starts[chip.line+1];chip.join=chip.line;joined.add(chip.line);}
  for(const chip of chips)if(chip.kind==="close"&&chip.line>0&&rawLines[chip.line-1].trim()!==""&&!joined.has(chip.line-1)){chip.from=starts[chip.line]-1;chip.join=chip.line-1;joined.add(chip.line-1);}
  // An inactive tab hides its lines plus one free line break next to them,
  // so switching tabs never leaves an empty row behind.
  for(const view of tabviews)for(const tab of view.tabs){
    if(tab.close===undefined)continue;
    const s=chips[tab.open].line,e=chips[tab.close].line,end=starts[e]+rawLines[e].length;
    // Only one tab of a view is visible, so hidden tabs may share a break;
    // the editor merges overlapping hide ranges.
    if(s>0&&!joined.has(s-1)){tab.hideFrom=starts[s]-1;tab.hideTo=end;}
    else if(e<rawLines.length-1&&!joined.has(e)){tab.hideFrom=starts[s];tab.hideTo=starts[e+1];}
    else{tab.hideFrom=starts[s];tab.hideTo=end;}
    tab.first=s;tab.last=e;tab.contentFrom=s<rawLines.length-1?starts[s+1]:end;
  }
  folds.forEach((f,index)=>{for(let j=f.line;j<=f.last;j++)lines[j].fold=index;});
  return {comments,lines,marks,hidden,folds,chips,headings,tabviews,collapsibles,tables,divs,layoutRules,length:source.length};
}
function activeLines(model,ranges){const active=new Set();for(const line of model.lines)if(ranges.some(r=>r.from<=line.to&&r.to>=line.from))active.add(line.number);return active;}
function touches(ranges,from,to){return ranges.some(r=>r.from<=to&&r.to>=from);}
// A paired block exposes both boundaries while editing anywhere within it.
// Line alignment/typography remains independent from source visibility.
function revealed(model,chip,ranges,active){
  if(chip.lineMode)return active.has(chip.line);
  const pair=chip.pair!==undefined?model.chips[chip.pair]:null;
  if(pair){
    const open=chip.kind==="open"?chip:pair,close=chip.kind==="open"?pair:chip;
    if(open.tag==="div")return touches(ranges,open.revealFrom,open.revealTo)||touches(ranges,close.revealFrom,close.revealTo);
    return touches(ranges,open.revealFrom,close.revealTo);
  }
  return touches(ranges,chip.revealFrom??chip.from,chip.revealTo??chip.to);
}
function matchingTagPosition(model,pos){
  const chip=model.chips.find(c=>c.pair!==undefined&&pos>=c.revealFrom&&pos<=c.revealTo);
  return chip?model.chips[chip.pair].revealFrom:null;
}
// Visual rows: source lines merged across hidden breaks. `broken` holds line
// numbers whose trailing break is hidden, `gone` lines hidden entirely and
// `opened` the start positions of expanded folds, drawn one level deeper.
function rows(model,{broken=new Set(),gone=new Set(),opened=new Set()}={}){
  const result=[];let current=null;
  for(const line of model.lines){
    if(!current)current={at:line.from,lines:[],depth:0,top:[],bottom:[],spaceTop:false,spaceBottom:false,cls:"",style:""};
    current.lines.push(line);
    if(!gone.has(line.number)){
      let depth=line.depth,cls=line.cls;const top=[...line.top],bottom=[...line.bottom];
      const fold=line.fold!==undefined?model.folds[line.fold]:null;
      if(fold&&opened.has(fold.from)){depth++;cls="wd-live-code-line";if(line.number===fold.line)top.push(depth);if(line.number===fold.last)bottom.push(depth);}
      current.spaceTop ||= line.spaceTop;current.spaceBottom ||= line.spaceBottom;
      current.depth=Math.max(current.depth,depth);current.top.push(...top);current.bottom.push(...bottom);
      if(!current.cls||current.cls==="wd-live-tag-line")current.cls=cls||current.cls;
      if(!current.style)current.style=line.style;
    }
    if(!broken.has(line.number)){result.push(current);current=null;}
  }
  if(current)result.push(current);
  return result;
}
const STEP=12;
// The outermost frame uses real borders (rounded through classes); inner
// levels are painted as background layers so nesting needs no extra DOM.
function frameStyle(row){
  if(!row.depth)return "";
  const paint="linear-gradient(var(--wd-box-border),var(--wd-box-border))",img=[],pos=[],size=[];
  const layer=(p,z)=>{img.push(paint);pos.push(p);size.push(z);};
  for(let k=2;k<=row.depth;k++){
    const x=(k-1)*STEP,top=row.top.includes(k),bottom=row.bottom.includes(k);
    const y=top?3:0,h=`calc(100% - ${(top?3:0)+(bottom?3:0)}px)`,w=`calc(100% - ${2*x}px)`;
    if(top)layer(`left ${x}px top 3px`,`${w} 1px`);
    if(bottom)layer(`left ${x}px bottom 3px`,`${w} 1px`);
    layer(`left ${x}px top ${y}px`,`1px ${h}`);layer(`right ${x}px top ${y}px`,`1px ${h}`);
  }
  const pad=row.depth*STEP+2,parts=[`padding-left:${pad}px`,`padding-right:${pad}px`];
  if(row.top.length)parts.push(`padding-top:${22}px`);
  if(img.length)parts.push(`background-image:${img.join(",")}`,`background-position:${pos.join(",")}`,`background-size:${size.join(",")}`,"background-repeat:no-repeat");
  return parts.join(";");
}
function frameClass(row){
  if(!row.depth)return "";
  return "wd-live-box"+(row.top.includes(1)?" wd-live-box-top":"")+(row.bottom.includes(1)?" wd-live-box-bottom":"")+(row.top.some(k=>k>1)?" wd-live-box-inner-top":"")+(row.bottom.some(k=>k>1)?" wd-live-box-inner-bottom":"");
}
module.exports={matchingTagPosition,layoutStyle,parseLive,activeLines,revealed,rows,frameStyle,frameClass,touches,STEP,unixName};

return module.exports; })();
const {completionSource,autoCloseFor,autoInlineFor,analyze}=(() => { const module = { exports: {} };
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

return module.exports; })();
const {createCompletionPopup}=(() => { const module = { exports: {} };
"use strict";
// A self-contained completion popup. CodeMirror's own autocomplete extension is
// not reliably visible inside a TextFileView here, so the editor drives this
// small list directly from the document context.
const {completions} = (() => { const module = { exports: {} };
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

return module.exports; })();
function createCompletionPopup(view, doc) {
  let el = null, state = null, index = 0;
  const win = doc.defaultView || null;
  function close() { if (el) { el.remove(); el = null; state = null; } }
  function paint() {
    if (!el || !state) return;
    [...el.children].forEach((child, i) => {
      child.style.background = i === index ? "var(--background-modifier-hover)" : "transparent";
      child.style.color = i === index ? "var(--text-normal)" : "var(--text-muted)";
    });
    const active = el.children[index];
    if (active && active.scrollIntoView) active.scrollIntoView({ block: "nearest" });
  }
  function choose(i) {
    if (!state || !state.options[i]) return;
    const option = state.options[i];
    const { from, to } = state;
    close();
    view.dispatch({ changes: { from, to, insert: option.text }, selection: { anchor: from + (option.cursor ?? option.text.length) } });
    view.focus();
  }
  function open(result, pos) {
    close();
    el = doc.createElement("div");
    el.className = "wikidot-completion";
    Object.assign(el.style, {
      position: "fixed", zIndex: "9999", minWidth: "200px", maxWidth: "360px", maxHeight: "260px", overflow: "auto",
      padding: "4px", background: "var(--background-primary)", border: "1px solid var(--background-modifier-border)",
      borderRadius: "6px", boxShadow: "0 6px 20px rgba(0,0,0,.22)", fontFamily: '"Maple Mono NL", var(--font-monospace), monospace', fontSize: "12px"
    });
    result.options.forEach((option, i) => {
      const item = doc.createElement("div");
      item.textContent = option.label;
      if (option.detail) {
        const detail = doc.createElement("span");
        detail.textContent = "  " + option.detail;
        detail.style.color = "var(--text-faint)";
        item.appendChild(detail);
      }
      Object.assign(item.style, { padding: "4px 8px", borderRadius: "4px", cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" });
      item.addEventListener("mousedown", event => { event.preventDefault(); event.stopPropagation(); choose(i); });
      el.appendChild(item);
    });
    doc.body.appendChild(el);
    state = result; index = 0;
    const coords = view.coordsAtPos(pos);
    if (coords && win) {
      const width = el.offsetWidth || 220, height = el.offsetHeight || 0;
      const left = Math.max(4, Math.min(coords.left, win.innerWidth - width - 8));
      const top = coords.bottom + height + 12 > win.innerHeight ? Math.max(4, coords.top - height - 4) : coords.bottom + 4;
      el.style.left = left + "px";
      el.style.top = top + "px";
    }
    paint();
  }
  function sync() {
    const pos = view.state.selection.main.head;
    const result = completions(view.state.doc.toString(), pos);
    if (!result || !result.options.length) { close(); return; }
    if(state&&state.from===result.from&&state.to===result.to&&JSON.stringify(state.options)===JSON.stringify(result.options))return;
    open(result, pos);
  }
  function handleKey(event) {
    if (event.isComposing) return false;
    if (!el) return false;
    if (event.key === "ArrowDown") { index = (index + 1) % state.options.length; paint(); return true; }
    if (event.key === "ArrowUp") { index = (index - 1 + state.options.length) % state.options.length; paint(); return true; }
    if (event.key === "Enter" || event.key === "Tab") { choose(index); return true; }
    if (event.key === "Escape") { close(); return true; }
    return false;
  }
  return { sync, close, handleKey, get open() { return !!el; } };
}
module.exports = { createCompletionPopup };

return module.exports; })();
const {createSelectionMenu}=(() => { const module = { exports: {} };
"use strict";
const ACTIONS=[
 {id:"bold",label:"加粗",open:"**",close:"**"},
 {id:"italic",label:"斜体",open:"//",close:"//"},
 {id:"underline",label:"下划线",open:"__",close:"__"},
 {id:"strike",label:"删除线",open:"--",close:"--"},
 {id:"mono",label:"等宽",open:"{{",close:"}}"},
 {id:"center",label:"居中",block:"="},
 {id:"right",label:"右对齐",block:">"},
 {id:"left",label:"左对齐",block:"<"},
 {id:"justify",label:"两端对齐",block:"=="},
 {id:"div",label:"div 块",block:"div"}
];
function wrapSelection(text,from,to,id){
 const action=ACTIONS.find(a=>a.id===id);if(!action||from<0||to>text.length||from>=to)return null;
 // When block formatting follows inline formatting, keep its surrounding pair
 // inside the block rather than stranding ** or // in adjacent paragraphs.
 if(action.block){
  const pairs=[["**","**"],["//","//"],["__","__"],["--","--"],["{{","}}"]];let expanded=true;
  while(expanded){expanded=false;for(const [open,close] of pairs)if(from>=2&&text.slice(from-2,from)===open&&text.slice(to,to+2)===close){from-=2;to+=2;expanded=true;break;}}
 }
 const selected=text.slice(from,to);let insert,bodyFrom,bodyTo;
 if(action.block){
  const prefix=(from>0&&text[from-1]!=="\n"?"\n":"")+"[["+action.block+"]]\n";
  const suffix=(selected.endsWith("\n")?"":"\n")+"[[/"+action.block+"]]"+(to<text.length&&text[to]!=="\n"?"\n":"");
  insert=prefix+selected+suffix;bodyFrom=from+prefix.length;bodyTo=bodyFrom+selected.length;
 }else{
  // Inline syntax cannot span Wikidot paragraphs. Wrap nonempty lines separately.
  const parts=selected.split("\n");insert=parts.map(line=>line.trim()?action.open+line+action.close:line).join("\n");
  bodyFrom=from;bodyTo=from+insert.length;
  if(parts.length===1){bodyFrom+=action.open.length;bodyTo-=action.close.length;}
 }
 return {changes:{from,to,insert},selection:{anchor:bodyFrom,head:bodyTo},userEvent:"input.selection-format",scrollIntoView:true};
}
function createSelectionMenu(view,doc){
 let el=null,destroyed=false,queued=false,dismissed=null;
 const win=doc.defaultView;
 function close(){if(el){el.remove();el=null;}}
 function key(){const s=view.state.selection.main;return s.from+":"+s.to;}
 function dismiss(){dismissed={doc:view.state.doc,key:key()};close();}
 function apply(id){
  const s=view.state.selection.main,change=wrapSelection(view.state.doc.toString(),s.from,s.to,id);
  if(!change)return;view.dispatch(change);view.focus();schedule();
 }
 function sync(){
  if(destroyed)return;
  const selection=view.state.selection,s=selection.main;
  if(selection.ranges.length!==1||s.empty||view.state.doc.toString().slice(s.from,s.to).trim()===""){close();return;}
  if(dismissed?.doc===view.state.doc&&dismissed.key===key())return;
  if(!el){
   el=doc.createElement("div");el.className="wikidot-selection-menu";el.style.visibility="hidden";el.setAttribute("contenteditable","false");el.setAttribute("role","toolbar");el.setAttribute("aria-label","选中文本样式");
   for(const action of ACTIONS){
    const button=doc.createElement("button");button.type="button";button.textContent=action.label;button.title=action.block?"在选区首尾插入成对块标签":"为选中文本添加"+action.label;
    button.addEventListener("mousedown",event=>{event.preventDefault();event.stopPropagation();});
    button.addEventListener("click",()=>apply(action.id));
    el.appendChild(button);
   }
   el.addEventListener("keydown",event=>{
    if(event.key==="Escape"){event.preventDefault();dismiss();view.focus();}
    else if(["ArrowLeft","ArrowRight","Home","End"].includes(event.key)){
     event.preventDefault();const buttons=[...el.children],index=buttons.indexOf(doc.activeElement);
     buttons[event.key==="Home"?0:event.key==="End"?buttons.length-1:(index+(event.key==="ArrowRight"?1:-1)+buttons.length)%buttons.length].focus();
    }
   });
   doc.body.appendChild(el);
  }
  const start=view.coordsAtPos(s.from),end=view.coordsAtPos(s.to);if(!start||!end||!win){close();return;}
  if((start.bottom<0&&end.bottom<0)||(start.top>win.innerHeight&&end.top>win.innerHeight)){close();return;}
  const width=el.offsetWidth||400,height=el.offsetHeight||36;
  const top=start.top-height-8>=4?start.top-height-8:Math.min(win.innerHeight-height-4,end.bottom+8);
  el.style.left=Math.max(4,Math.min(start.left,win.innerWidth-width-8))+"px";el.style.top=Math.max(4,top)+"px";el.style.visibility="visible";
 }
 function schedule(){if(destroyed||queued)return;queued=true;queueMicrotask(()=>{queued=false;sync();});}
 function outside(event){if(el&&!el.contains(event.target)&&!view.dom?.contains(event.target))dismiss();}
 doc.addEventListener("mousedown",outside,true);doc.addEventListener("scroll",schedule,true);win?.addEventListener("resize",schedule);
 return {sync,schedule,apply,close,handleKey(event){
  if(event.key==="Escape"&&el){dismiss();return true;}
  if(event.altKey&&event.shiftKey&&event.key.toLowerCase()==="m"){sync();if(!el)return false;el.firstElementChild.focus();return true;}return false;
 },destroy(){destroyed=true;close();doc.removeEventListener("mousedown",outside,true);doc.removeEventListener("scroll",schedule,true);win?.removeEventListener("resize",schedule);},get open(){return !!el;}};
}
module.exports={ACTIONS,wrapSelection,createSelectionMenu};

return module.exports; })();
function createEditor({host,text,onChange,getContext=()=>({})}) {
  const rich=new Compartment();
  const refreshContext=StateEffect.define();
  const pointerEnd=StateEffect.define();
  const selectTab=StateEffect.define();
  const toggleCollapse=StateEffect.define();
  const toggleModule=StateEffect.define();
  const doc=host.ownerDocument;
  let pointer=null;
  const parse=source=>parseLive(source,{layout:getContext().liveLayout!==false,positioning:!!getContext().livePositioning,frames:getContext().liveFrames!==false});
  const el=(tag,cls,textValue)=>{const node=doc.createElement(tag);if(cls)node.className=cls;if(textValue!==undefined)node.textContent=textValue;node.setAttribute("contenteditable","false");return node;};
  const press=(node,fn)=>{
    node.addEventListener("mousedown",event=>{if(event.button!==0)return;event.preventDefault();event.stopPropagation();fn(event);});
    node.addEventListener("keydown",event=>{if(event.key!=="Enter"&&event.key!==" ")return;event.preventDefault();event.stopPropagation();fn(event);});
  };
  // Folded MODULE / include / comment: a bordered source-like chip such as
  // `[[module css]]`. Multi-line folds expand into framed source on click.
  class FoldWidget extends WidgetType {
    constructor(fold,opened=false){super();this.fold=fold;this.opened=opened;}
    eq(other){return this.opened===other.opened&&this.fold.from===other.fold.from&&this.fold.to===other.fold.to&&this.fold.label===other.fold.label&&this.fold.lines===other.fold.lines;}
    toDOM(view){
      const fold=this.fold,node=el("span",this.opened?"wikidot-live-fold-toggle":"wikidot-live-fold",this.opened?`▾ 收起 · ${fold.lines} 行`:fold.label);
      node.setAttribute("role","button");node.setAttribute("tabindex","0");node.setAttribute("aria-expanded",String(this.opened));
      node.title=this.opened?"收起源码":fold.lines>1?`展开并编辑源码（${fold.lines} 行）`:"展开并编辑源码";
      press(node,()=>{
        const change={effects:toggleModule.of({from:fold.from,open:!this.opened})};
        if(!this.opened||view.state.selection.ranges.some(r=>r.from<=fold.to&&r.to>=fold.from))change.selection={anchor:fold.from};
        view.dispatch(change);view.focus();
      });
      return node;
    }
    ignoreEvent(){return true;}
  }
  // Corner label of a framed block, and small inline markers.
  class LabelWidget extends WidgetType {
    constructor(chip,cls){super();this.chip=chip;this.cls=cls;}
    eq(other){return this.cls===other.cls&&this.chip.label===other.chip.label&&this.chip.revealFrom===other.chip.revealFrom&&this.chip.indent===other.chip.indent&&this.chip.level===other.chip.level;}
    toDOM(view){
      const chip=this.chip,node=el("span",this.cls,chip.label);
      if(chip.box)node.style?.setProperty("--wd-label-top","0px");
      if(chip.indent)node.setAttribute("style",`margin-left:${chip.indent*1.4}em`);
      if(chip.kind==="open"||chip.kind==="token"||chip.kind==="warn"){
        node.setAttribute("role","button");node.title=chip.kind==="open"?"编辑标签与属性":"编辑源码";
        press(node,()=>{view.dispatch({selection:{anchor:chip.revealFrom},scrollIntoView:true});view.focus();});
      }
      return node;
    }
    ignoreEvent(){return this.chip.kind!=="bullet"&&this.chip.kind!=="sep";}
  }
  class TocWidget extends WidgetType {
    constructor(chip,headings){super();this.chip=chip;this.headings=headings;this.key=chip.float+JSON.stringify(headings.map(h=>[h.level,h.text,h.from]));}
    eq(other){return this.key===other.key;}
    toDOM(view){
      const box=el("span","wikidot-live-toc"+(this.chip.float?" is-float-"+this.chip.float:""));
      const title=el("span","wikidot-live-toc-title","目录");title.title="编辑 [[toc]]";
      press(title,()=>{view.dispatch({selection:{anchor:this.chip.from}});view.focus();});
      box.appendChild(title);
      if(!this.headings.length)box.appendChild(el("span","wikidot-live-toc-empty","尚无标题"));
      for(const heading of this.headings){
        const item=el("span","wikidot-live-toc-item",heading.text||"（空标题）");
        item.setAttribute("style",`padding-left:${(heading.level-1)*1.2}em`);item.setAttribute("role","link");
        press(item,()=>{view.dispatch({selection:{anchor:heading.from},scrollIntoView:true});view.focus();});
        box.appendChild(item);
      }
      return box;
    }
    ignoreEvent(){return true;}
  }
  class TabsWidget extends WidgetType {
    constructor(tabview,active){super();this.tabview=tabview;this.active=active;this.key=active+JSON.stringify(tabview.tabs.map(t=>t.name));}
    eq(other){return this.key===other.key&&this.tabview.from===other.tabview.from;}
    toDOM(view){
      const bar=el("span","wikidot-live-tabs");
      this.tabview.tabs.forEach((tab,index)=>{
        const button=el("span","wikidot-live-tab"+(index===this.active?" is-active":""),tab.name);
        button.setAttribute("tabindex","0");button.setAttribute("role","tab");button.setAttribute("aria-selected",String(index===this.active));
        press(button,()=>{
          const change={effects:selectTab.of({from:this.tabview.from,index})};
          // Leave a hidden tab before it disappears.
          if(view.state.selection.ranges.some(r=>r.from<=this.tabview.tabs[this.active]?.to&&r.to>=this.tabview.tabs[this.active]?.from))change.selection={anchor:tab.contentFrom};
          view.dispatch(change);view.focus();
        });
        bar.appendChild(button);
      });
      return bar;
    }
    ignoreEvent(){return true;}
  }
  class CollapseWidget extends WidgetType {
    constructor(block,expanded,bottom=false){super();this.block=block;this.expanded=expanded;this.bottom=bottom;}
    eq(other){return this.block.from===other.block.from&&this.block.args===other.block.args&&this.expanded===other.expanded&&this.bottom===other.bottom;}
    toDOM(view){
      const {attr}=(() => { const module = { exports: {} };
"use strict";
// Helpers shared by the Preview renderer and the Live editing decorator.
const SIZE_KEYWORDS = new Set(["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "smaller", "larger"]);
function fontSize(value) {
  const text = String(value || "").trim().toLowerCase();
  if (SIZE_KEYWORDS.has(text)) return text;
  if (/^\d+(?:\.\d+)?(?:px|em|rem|%|pt|ex|vw|vh)$/.test(text)) return text;
  if (/^\d+(?:\.\d+)?$/.test(text)) return text + "%";
  return "";
}
// Wikidot page names: lower case ASCII, every other run of characters becomes
// a single hyphen, and hyphens next to a category colon are dropped.
function unixName(value) {
  return String(value || "").toLowerCase()
    .replace(/[^a-z0-9:_#-]+/g, "-").replace(/-+/g, "-")
    .replace(/-*:-*/g, ":").replace(/^[-:]+|-+$/g, "");
}
// Finds the closer that balances an already consumed opener of `name`.
function findClose(text, from, name) {
  const re = new RegExp(`\\[\\[(\\/?)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s\\]])[^\\]]*\\]\\]`, "gi");
  re.lastIndex = from;
  let depth = 1, m;
  while ((m = re.exec(text))) {
    depth += m[1] ? -1 : 1;
    if (!depth) return { start: m.index, end: m.index + m[0].length };
  }
  return null;
}
function attr(text, name) {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"']+))`, "i").exec(String(text || ""));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}
module.exports = { fontSize, unixName, findClose, attr, SIZE_KEYWORDS };

return module.exports; })(),b=this.block;
      const node=el("span","wikidot-live-collapse",attr(b.args,this.expanded?"hide":"show")||(this.expanded?"− hide block":"+ show block"));
      node.setAttribute("role","button");node.setAttribute("tabindex","0");node.setAttribute("aria-expanded",String(this.expanded));
      press(node,()=>{view.dispatch({effects:toggleCollapse.of({from:b.from,open:!this.expanded}),selection:{anchor:Math.min(view.state.doc.length,b.to+1)}});view.focus();});
      return node;
    }
    ignoreEvent(){return true;}
  }
  class ImageWidget extends WidgetType {
    constructor(chip){super();this.chip=chip;this.context=getContext();}
    eq(other){return this.chip.source===other.chip.source&&JSON.stringify(this.context)===JSON.stringify(other.context);}
    toDOM(view){
      const box=el("span","wikidot-live-image"),{render}=(() => { const module = { exports: {} };
"use strict";
const {rebaseCSS}=(() => { const module = { exports: {} };
"use strict";
function quotedEnd(text,start) {
  const quote=text[start];let i=start+1;
  while(i<text.length){if(text[i]==="\\")i+=2;else if(text[i++]===quote)break;}
  return i;
}
function commentEnd(text,start){const end=text.indexOf("*/",start+2);return end<0?text.length:end+2;}
function urlAt(text,start) {
  const open=/^url\s*\(/i.exec(text.slice(start));if(!open)return null;
  let i=start+open[0].length;while(/\s/.test(text[i]||"")&&i<text.length)i++;
  const valueStart=i;let value;
  if(text[i]==='"'||text[i]==="'"){const end=quotedEnd(text,i);value=text.slice(i+1,end-1);i=end;}
  else {while(i<text.length&&text[i]!==")"){if(text[i]==="\\")i++;i++;}value=text.slice(valueStart,i).trim();}
  while(/\s/.test(text[i]||"")&&i<text.length)i++;
  return text[i]===")"?{start,end:i+1,value}:null;
}
function imports(css) {
  const found=[];let i=0;
  while(i<css.length){
    if(css.startsWith("/*",i)){i=commentEnd(css,i);continue;}
    if(css[i]==='"'||css[i]==="'"){i=quotedEnd(css,i);continue;}
    const m=/^@import\b\s*/i.exec(css.slice(i));
    if(!m){i++;continue;}
    const start=i;let pos=i+m[0].length,url,end;
    const token=urlAt(css,pos);
    if(token){url=token.value;pos=token.end;}
    else if(css[pos]==='"'||css[pos]==="'"){end=quotedEnd(css,pos);url=css.slice(pos+1,end-1);pos=end;}
    else {i+=m[0].length;continue;}
    const conditionStart=pos;let depth=0;
    while(pos<css.length){
      if(css.startsWith("/*",pos)){pos=commentEnd(css,pos);continue;}
      if(css[pos]==='"'||css[pos]==="'"){pos=quotedEnd(css,pos);continue;}
      if(css[pos]==="(")depth++;else if(css[pos]===")")depth--;
      if(css[pos]===";"&&!depth)break;pos++;
    }
    if(pos<css.length)found.push({start,end:pos+1,url,condition:css.slice(conditionStart,pos).trim()});
    i=pos+1;
  }
  return found;
}
function rebaseCSS(css,base) {
  function absolute(value){try{const url=new URL(value,base);return ["https:","http:"].includes(url.protocol)?url.href:"";}catch{return "";}}
  const patches=[];let i=0;
  while(i<css.length){
    if(css.startsWith("/*",i)){i=commentEnd(css,i);continue;}
    if(css[i]==='"'||css[i]==="'"){i=quotedEnd(css,i);continue;}
    const token=(i===0||!/[\w-]/.test(css[i-1]))?urlAt(css,i):null;
    if(token){if(!/^data:|^#/i.test(token.value))patches.push({start:i,end:token.end,text:`url(${JSON.stringify(absolute(token.value))})`});i=token.end;}else i++;
  }
  for(const item of imports(css)){
    const m=/^@import\b\s*/i.exec(css.slice(item.start));const start=item.start+m[0].length;
    if(css[start]==='"'||css[start]==="'")patches.push({start,end:quotedEnd(css,start),text:JSON.stringify(absolute(item.url))});
  }
  for(const patch of patches.sort((a,b)=>b.start-a.start))css=css.slice(0,patch.start)+patch.text+css.slice(patch.end);
  return css;
}
module.exports={imports,rebaseCSS};

return module.exports; })();
const {minimalPalette}=(() => { const module = { exports: {} };
"use strict";
// Minimal preview has no site shell, so pages written for a dark theme (light
// text on a dark #container) become unreadable on the plain background.
// The preview iframe has no scripts, so the decision is made statically from
// the page CSS: find the text colour and background the page assigns to its
// main containers and pick a matching backdrop.
const NAMED = { black: "#000", white: "#fff", gray: "#808080", grey: "#808080", silver: "#c0c0c0", red: "#f00", maroon: "#800000", navy: "#000080", darkgray: "#a9a9a9", darkgrey: "#a9a9a9", lightgray: "#d3d3d3", lightgrey: "#d3d3d3", dimgray: "#696969", whitesmoke: "#f5f5f5", gainsboro: "#dcdcdc", snow: "#fffafa", ivory: "#fffff0", beige: "#f5f5dc", wheat: "#f5deb3", linen: "#faf0e6" };
const TARGET = /^(?::root|html|body|#html-body|#skrollr-body|#container|#container-wrap|#content-wrap|#main-content|#page-content|#page-content\s+p|p|\.content-panel|\.page-content)$/i;
function parseColor(value) {
  let text = String(value || "").trim().toLowerCase().replace(/\s*!important$/, "");
  if (NAMED[text]) text = NAMED[text];
  let m;
  if ((m = /^#([0-9a-f]{3,4})$/.exec(text))) return [...m[1].slice(0, 3)].map(c => parseInt(c + c, 16)).concat(m[1].length === 4 ? parseInt(m[1][3] + m[1][3], 16) / 255 : 1);
  if ((m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/.exec(text))) return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)).concat(m[2] ? parseInt(m[2], 16) / 255 : 1);
  if ((m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(text))) {
    const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [+m[1], +m[2], +m[3], a];
  }
  if ((m = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(text))) {
    const h = +m[1] / 360, s = +m[2] / 100, l = +m[3] / 100;
    const f = n => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); };
    const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [f(0), f(8), f(4), a];
  }
  return null;
}
function luminance([r, g, b]) {
  const c = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}
// Collects simple top-level rules (inside @media too) and custom properties.
function rules(css) {
  const out = [], vars = Object.create(null);
  const text = String(css || "").replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of text.matchAll(/([^{}@;]+)\{([^{}]*)\}/g)) {
    const selectors = m[1].split(",").map(s => s.trim()).filter(Boolean);
    const decls = Object.create(null);
    for (const part of m[2].split(";")) {
      const i = part.indexOf(":"); if (i < 0) continue;
      const name = part.slice(0, i).trim().toLowerCase(), value = part.slice(i + 1).trim();
      if (name.startsWith("--")) vars[name] = value; else decls[name] = value;
    }
    out.push({ selectors, decls });
  }
  return { list: out, vars };
}
function resolve(value, vars, depth = 0) {
  if (!value || depth > 8) return value;
  return String(value).replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/g, (_, name, fallback) => resolve(vars[name] ?? fallback ?? "", vars, depth + 1));
}
function backgroundColor(value, vars) {
  const text = resolve(value, vars);
  if (!text) return null;
  const direct = parseColor(text);
  if (direct) return direct;
  // A shorthand or gradient: take its first recognisable colour.
  for (const m of text.matchAll(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b[a-z]+\b/gi)) { const c = parseColor(m[0]); if (c) return c; }
  return null;
}
function analyze(css) {
  const { list, vars } = rules(css);
  let text = null, background = null;
  for (const rule of list) {
    if (!rule.selectors.some(s => TARGET.test(s))) continue;
    const color = rule.decls.color && parseColor(resolve(rule.decls.color, vars));
    if (color && color[3] > 0.5) text = color;
    const bg = backgroundColor(rule.decls["background-color"] || rule.decls.background, vars);
    if (bg && bg[3] > 0.5) background = bg;
  }
  return { text, background };
}
// Returns the html{} declarations used by Minimal.
function minimalPalette(css, dark = false, enabled = true) {
  const light = "color-scheme:light;background:#faf9f6;color:#35343a", darkPalette = "color-scheme:dark;background:#202024;color:#e2e2e5";
  const fallback = dark ? darkPalette : light;
  if (!enabled) return { palette: fallback, reason: "" };
  const { text, background } = analyze(css);
  // The page paints its own backdrop; only make the outer frame match it.
  if (background) {
    const isDark = luminance(background) < 0.2;
    return { palette: `color-scheme:${isDark ? "dark" : "light"};background:rgb(${background.slice(0, 3).map(Math.round).join(",")});color:${isDark ? "#e2e2e5" : "#35343a"}`, reason: "page-background" };
  }
  if (text) {
    const lum = luminance(text);
    if (lum > 0.45) return { palette: darkPalette, reason: "light-text" };
    if (lum < 0.12) return { palette: light, reason: "dark-text" };
  }
  return { palette: fallback, reason: "" };
}
module.exports = { parseColor, luminance, analyze, minimalPalette };

return module.exports; })();
const {prepareSource}=(() => { const module = { exports: {} };
"use strict";
const blank=text=>text.replace(/[^\n]/g,"");
function stripComments(text){return text.replace(/\[\[code(?:\s+[^\]]*)?\]\][\s\S]*?\[\[\/code\]\]|\[!--[\s\S]*?--\]/gi,raw=>/^\[!--/.test(raw)?blank(raw):raw);}
// [[iftags]] blocks nest. An [[iftags]] without terms never matches at the
// top level (Wikidot's empty "any" list), but is transparent when nested.
// Themes rely on this: [[ift{$param}gs …]] only becomes a real tag once the
// include parameter is substituted, and wraps an empty [[iftags]] switch.
// Tag lines prefixed by blockquote markers are removed with their prefix.
function selectTags(text,tags=[]) {
  const available=new Set(tags),stack=[];let output="",end=0,active=true;
  const tokens=/\[\[code(?:\s+[^\]]*)?\]\][\s\S]*?\[\[\/code\]\]|^[ \t]*>[> \t]*\[\[(\/?)iftags(?:\s+([^\]]*))?\]\][ \t]*$|\[\[(\/?)iftags(?:\s+([^\]]*))?\]\]|^[ \t>]*\[\[\/?ift\{\$[^}\]]*\}gs\b[^\]]*\]\][ \t]*$/gim;let m;
  while((m=tokens.exec(text))){
    output+=active?text.slice(end,m.index):blank(text.slice(end,m.index));end=tokens.lastIndex;
    const close=m[1]??m[3],args=m[2]??m[4];
    if(close===undefined){output+=active&&!/^[ \t>]*\[\[\/?ift\{/.test(m[0])?m[0]:blank(m[0]);continue;}
    if(close){active=stack.length?stack.pop():active;}
    else{
      const terms=(args||"").trim().split(/[, ]+/).filter(Boolean);
      const required=terms.filter(t=>t[0]==="+"),excluded=terms.filter(t=>t[0]==="-"),any=terms.filter(t=>!/[+-]/.test(t[0]));
      const matches=terms.length?required.every(t=>available.has(t.slice(1)))&&excluded.every(t=>!available.has(t.slice(1)))&&(!any.length||any.some(t=>available.has(t))):stack.length>0;
      stack.push(active);active=active&&matches;
    }
    output+=blank(m[0]);
  }
  return output+(active?text.slice(end):blank(text.slice(end)));
}
// Wikidot expressions: [[#if c | then | else]], [[#ifexpr e | then | else]]
// and [[#expr e]]. Conditions are false when empty, "false", "null" or "0".
// Expressions use a small arithmetic/logic grammar; nothing is ever eval'd.
function evaluate(expr){
  const tokens=String(expr).match(/\d+(?:\.\d+)?|<=|>=|!=|<>|==|and|or|not|[-+*/%()<>=!]/gi)||[];
  if(tokens.join("").replace(/\s/g,"")!==String(expr).replace(/\s/g,""))throw Error("bad");
  let i=0;const peek=()=>tokens[i]?.toLowerCase(),take=()=>tokens[i++];
  const or=()=>{let v=and();while(peek()==="or"){take();const r=and();v=(v||r)?1:0;}return v;};
  const and=()=>{let v=cmp();while(peek()==="and"){take();const r=cmp();v=(v&&r)?1:0;}return v;};
  const cmp=()=>{let v=add();while(["<",">","<=",">=","=","==","!=","<>"].includes(peek())){const o=take(),r=add();v=({"<":v<r,">":v>r,"<=":v<=r,">=":v>=r,"=":v===r,"==":v===r,"!=":v!==r,"<>":v!==r})[o]?1:0;}return v;};
  const add=()=>{let v=mul();while(peek()==="+"||peek()==="-"){const o=take(),r=mul();v=o==="+"?v+r:v-r;}return v;};
  const mul=()=>{let v=unary();while(["*","/","%"].includes(peek())){const o=take(),r=unary();v=o==="*"?v*r:o==="/"?v/r:v%r;}return v;};
  const unary=()=>{const t=peek();if(t==="-"){take();return -unary();}if(t==="+"){take();return unary();}if(t==="not"||t==="!"){take();return unary()?0:1;}if(t==="("){take();const v=or();if(take()!==")")throw Error("bad");return v;}const n=take();if(n===undefined||!/^\d/.test(n))throw Error("bad");return Number(n);};
  const value=or();if(i!==tokens.length||!Number.isFinite(value))throw Error("bad");return value;
}
function expressions(text){
  const falsy=v=>/^(?:|false|null|0)$/i.test(v.trim());
  const re=/\[\[#(if|ifexpr|expr)\s([^\[\]]*)\]\]/gi;
  for(let round=0;round<20&&re.test(text);round++){
    re.lastIndex=0;
    text=text.replace(re,(raw,kind,body)=>{
      const parts=body.split("|"),cond=parts[0];
      if(kind.toLowerCase()==="if")return (falsy(cond)?parts[2]:parts[1])?.trim()??"";
      let value;try{value=evaluate(cond);}catch{return kind.toLowerCase()==="expr"?"Expression error":(parts[2]?.trim()??"");}
      if(kind.toLowerCase()==="expr")return String(Math.round(value*1e10)/1e10);
      return (value?parts[1]:parts[2])?.trim()??"";
    });
  }
  return text;
}
function prepareSource(text,tags=[]) {
  // Comments in code examples stay literal, while inactive documentation must
  // disappear before its includes or CSS modules are ever processed.
  return expressions(selectTags(stripComments(text),tags));
}
module.exports={stripComments,selectTags,prepareSource,expressions,evaluate};

return module.exports; })();
const {fontSize, unixName, attr} = (() => { const module = { exports: {} };
"use strict";
// Helpers shared by the Preview renderer and the Live editing decorator.
const SIZE_KEYWORDS = new Set(["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "smaller", "larger"]);
function fontSize(value) {
  const text = String(value || "").trim().toLowerCase();
  if (SIZE_KEYWORDS.has(text)) return text;
  if (/^\d+(?:\.\d+)?(?:px|em|rem|%|pt|ex|vw|vh)$/.test(text)) return text;
  if (/^\d+(?:\.\d+)?$/.test(text)) return text + "%";
  return "";
}
// Wikidot page names: lower case ASCII, every other run of characters becomes
// a single hyphen, and hyphens next to a category colon are dropped.
function unixName(value) {
  return String(value || "").toLowerCase()
    .replace(/[^a-z0-9:_#-]+/g, "-").replace(/-+/g, "-")
    .replace(/-*:-*/g, ":").replace(/^[-:]+|-+$/g, "");
}
// Finds the closer that balances an already consumed opener of `name`.
function findClose(text, from, name) {
  const re = new RegExp(`\\[\\[(\\/?)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s\\]])[^\\]]*\\]\\]`, "gi");
  re.lastIndex = from;
  let depth = 1, m;
  while ((m = re.exec(text))) {
    depth += m[1] ? -1 : 1;
    if (!depth) return { start: m.index, end: m.index + m[0].length };
  }
  return null;
}
function attr(text, name) {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"']+))`, "i").exec(String(text || ""));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}
module.exports = { fontSize, unixName, findClose, attr, SIZE_KEYWORDS };

return module.exports; })();
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

return module.exports; })();
      // Reuse the preview's URL, attachment and dimension handling.
      const html=render(this.chip.source,this.context).html;
      const parsed=doc.createElement("template");parsed.innerHTML=html;
      const image=parsed.content.querySelector("img");
      if(image){image.referrerPolicy="no-referrer";image.addEventListener("load",()=>view.requestMeasure());image.addEventListener("error",()=>{box.textContent="图片加载失败 · "+this.chip.label;view.requestMeasure();});box.appendChild(image);}
      else box.textContent=this.chip.label;
      box.title="点击编辑图片源码";press(box,()=>{view.dispatch({selection:{anchor:this.chip.from}});view.focus();});return box;
    }
    ignoreEvent(){return true;}
  }
  class TableWidget extends WidgetType {
    constructor(table){super();this.table=table;this.context=getContext();}
    eq(other){return this.table.from===other.table.from&&this.table.source===other.table.source&&JSON.stringify(this.context)===JSON.stringify(other.context);}
    toDOM(view){
      const box=el("div","wikidot-live-table"),{render}=(() => { const module = { exports: {} };
"use strict";
const {rebaseCSS}=(() => { const module = { exports: {} };
"use strict";
function quotedEnd(text,start) {
  const quote=text[start];let i=start+1;
  while(i<text.length){if(text[i]==="\\")i+=2;else if(text[i++]===quote)break;}
  return i;
}
function commentEnd(text,start){const end=text.indexOf("*/",start+2);return end<0?text.length:end+2;}
function urlAt(text,start) {
  const open=/^url\s*\(/i.exec(text.slice(start));if(!open)return null;
  let i=start+open[0].length;while(/\s/.test(text[i]||"")&&i<text.length)i++;
  const valueStart=i;let value;
  if(text[i]==='"'||text[i]==="'"){const end=quotedEnd(text,i);value=text.slice(i+1,end-1);i=end;}
  else {while(i<text.length&&text[i]!==")"){if(text[i]==="\\")i++;i++;}value=text.slice(valueStart,i).trim();}
  while(/\s/.test(text[i]||"")&&i<text.length)i++;
  return text[i]===")"?{start,end:i+1,value}:null;
}
function imports(css) {
  const found=[];let i=0;
  while(i<css.length){
    if(css.startsWith("/*",i)){i=commentEnd(css,i);continue;}
    if(css[i]==='"'||css[i]==="'"){i=quotedEnd(css,i);continue;}
    const m=/^@import\b\s*/i.exec(css.slice(i));
    if(!m){i++;continue;}
    const start=i;let pos=i+m[0].length,url,end;
    const token=urlAt(css,pos);
    if(token){url=token.value;pos=token.end;}
    else if(css[pos]==='"'||css[pos]==="'"){end=quotedEnd(css,pos);url=css.slice(pos+1,end-1);pos=end;}
    else {i+=m[0].length;continue;}
    const conditionStart=pos;let depth=0;
    while(pos<css.length){
      if(css.startsWith("/*",pos)){pos=commentEnd(css,pos);continue;}
      if(css[pos]==='"'||css[pos]==="'"){pos=quotedEnd(css,pos);continue;}
      if(css[pos]==="(")depth++;else if(css[pos]===")")depth--;
      if(css[pos]===";"&&!depth)break;pos++;
    }
    if(pos<css.length)found.push({start,end:pos+1,url,condition:css.slice(conditionStart,pos).trim()});
    i=pos+1;
  }
  return found;
}
function rebaseCSS(css,base) {
  function absolute(value){try{const url=new URL(value,base);return ["https:","http:"].includes(url.protocol)?url.href:"";}catch{return "";}}
  const patches=[];let i=0;
  while(i<css.length){
    if(css.startsWith("/*",i)){i=commentEnd(css,i);continue;}
    if(css[i]==='"'||css[i]==="'"){i=quotedEnd(css,i);continue;}
    const token=(i===0||!/[\w-]/.test(css[i-1]))?urlAt(css,i):null;
    if(token){if(!/^data:|^#/i.test(token.value))patches.push({start:i,end:token.end,text:`url(${JSON.stringify(absolute(token.value))})`});i=token.end;}else i++;
  }
  for(const item of imports(css)){
    const m=/^@import\b\s*/i.exec(css.slice(item.start));const start=item.start+m[0].length;
    if(css[start]==='"'||css[start]==="'")patches.push({start,end:quotedEnd(css,start),text:JSON.stringify(absolute(item.url))});
  }
  for(const patch of patches.sort((a,b)=>b.start-a.start))css=css.slice(0,patch.start)+patch.text+css.slice(patch.end);
  return css;
}
module.exports={imports,rebaseCSS};

return module.exports; })();
const {minimalPalette}=(() => { const module = { exports: {} };
"use strict";
// Minimal preview has no site shell, so pages written for a dark theme (light
// text on a dark #container) become unreadable on the plain background.
// The preview iframe has no scripts, so the decision is made statically from
// the page CSS: find the text colour and background the page assigns to its
// main containers and pick a matching backdrop.
const NAMED = { black: "#000", white: "#fff", gray: "#808080", grey: "#808080", silver: "#c0c0c0", red: "#f00", maroon: "#800000", navy: "#000080", darkgray: "#a9a9a9", darkgrey: "#a9a9a9", lightgray: "#d3d3d3", lightgrey: "#d3d3d3", dimgray: "#696969", whitesmoke: "#f5f5f5", gainsboro: "#dcdcdc", snow: "#fffafa", ivory: "#fffff0", beige: "#f5f5dc", wheat: "#f5deb3", linen: "#faf0e6" };
const TARGET = /^(?::root|html|body|#html-body|#skrollr-body|#container|#container-wrap|#content-wrap|#main-content|#page-content|#page-content\s+p|p|\.content-panel|\.page-content)$/i;
function parseColor(value) {
  let text = String(value || "").trim().toLowerCase().replace(/\s*!important$/, "");
  if (NAMED[text]) text = NAMED[text];
  let m;
  if ((m = /^#([0-9a-f]{3,4})$/.exec(text))) return [...m[1].slice(0, 3)].map(c => parseInt(c + c, 16)).concat(m[1].length === 4 ? parseInt(m[1][3] + m[1][3], 16) / 255 : 1);
  if ((m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/.exec(text))) return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)).concat(m[2] ? parseInt(m[2], 16) / 255 : 1);
  if ((m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(text))) {
    const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [+m[1], +m[2], +m[3], a];
  }
  if ((m = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(text))) {
    const h = +m[1] / 360, s = +m[2] / 100, l = +m[3] / 100;
    const f = n => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); };
    const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [f(0), f(8), f(4), a];
  }
  return null;
}
function luminance([r, g, b]) {
  const c = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}
// Collects simple top-level rules (inside @media too) and custom properties.
function rules(css) {
  const out = [], vars = Object.create(null);
  const text = String(css || "").replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of text.matchAll(/([^{}@;]+)\{([^{}]*)\}/g)) {
    const selectors = m[1].split(",").map(s => s.trim()).filter(Boolean);
    const decls = Object.create(null);
    for (const part of m[2].split(";")) {
      const i = part.indexOf(":"); if (i < 0) continue;
      const name = part.slice(0, i).trim().toLowerCase(), value = part.slice(i + 1).trim();
      if (name.startsWith("--")) vars[name] = value; else decls[name] = value;
    }
    out.push({ selectors, decls });
  }
  return { list: out, vars };
}
function resolve(value, vars, depth = 0) {
  if (!value || depth > 8) return value;
  return String(value).replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/g, (_, name, fallback) => resolve(vars[name] ?? fallback ?? "", vars, depth + 1));
}
function backgroundColor(value, vars) {
  const text = resolve(value, vars);
  if (!text) return null;
  const direct = parseColor(text);
  if (direct) return direct;
  // A shorthand or gradient: take its first recognisable colour.
  for (const m of text.matchAll(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b[a-z]+\b/gi)) { const c = parseColor(m[0]); if (c) return c; }
  return null;
}
function analyze(css) {
  const { list, vars } = rules(css);
  let text = null, background = null;
  for (const rule of list) {
    if (!rule.selectors.some(s => TARGET.test(s))) continue;
    const color = rule.decls.color && parseColor(resolve(rule.decls.color, vars));
    if (color && color[3] > 0.5) text = color;
    const bg = backgroundColor(rule.decls["background-color"] || rule.decls.background, vars);
    if (bg && bg[3] > 0.5) background = bg;
  }
  return { text, background };
}
// Returns the html{} declarations used by Minimal.
function minimalPalette(css, dark = false, enabled = true) {
  const light = "color-scheme:light;background:#faf9f6;color:#35343a", darkPalette = "color-scheme:dark;background:#202024;color:#e2e2e5";
  const fallback = dark ? darkPalette : light;
  if (!enabled) return { palette: fallback, reason: "" };
  const { text, background } = analyze(css);
  // The page paints its own backdrop; only make the outer frame match it.
  if (background) {
    const isDark = luminance(background) < 0.2;
    return { palette: `color-scheme:${isDark ? "dark" : "light"};background:rgb(${background.slice(0, 3).map(Math.round).join(",")});color:${isDark ? "#e2e2e5" : "#35343a"}`, reason: "page-background" };
  }
  if (text) {
    const lum = luminance(text);
    if (lum > 0.45) return { palette: darkPalette, reason: "light-text" };
    if (lum < 0.12) return { palette: light, reason: "dark-text" };
  }
  return { palette: fallback, reason: "" };
}
module.exports = { parseColor, luminance, analyze, minimalPalette };

return module.exports; })();
const {prepareSource}=(() => { const module = { exports: {} };
"use strict";
const blank=text=>text.replace(/[^\n]/g,"");
function stripComments(text){return text.replace(/\[\[code(?:\s+[^\]]*)?\]\][\s\S]*?\[\[\/code\]\]|\[!--[\s\S]*?--\]/gi,raw=>/^\[!--/.test(raw)?blank(raw):raw);}
// [[iftags]] blocks nest. An [[iftags]] without terms never matches at the
// top level (Wikidot's empty "any" list), but is transparent when nested.
// Themes rely on this: [[ift{$param}gs …]] only becomes a real tag once the
// include parameter is substituted, and wraps an empty [[iftags]] switch.
// Tag lines prefixed by blockquote markers are removed with their prefix.
function selectTags(text,tags=[]) {
  const available=new Set(tags),stack=[];let output="",end=0,active=true;
  const tokens=/\[\[code(?:\s+[^\]]*)?\]\][\s\S]*?\[\[\/code\]\]|^[ \t]*>[> \t]*\[\[(\/?)iftags(?:\s+([^\]]*))?\]\][ \t]*$|\[\[(\/?)iftags(?:\s+([^\]]*))?\]\]|^[ \t>]*\[\[\/?ift\{\$[^}\]]*\}gs\b[^\]]*\]\][ \t]*$/gim;let m;
  while((m=tokens.exec(text))){
    output+=active?text.slice(end,m.index):blank(text.slice(end,m.index));end=tokens.lastIndex;
    const close=m[1]??m[3],args=m[2]??m[4];
    if(close===undefined){output+=active&&!/^[ \t>]*\[\[\/?ift\{/.test(m[0])?m[0]:blank(m[0]);continue;}
    if(close){active=stack.length?stack.pop():active;}
    else{
      const terms=(args||"").trim().split(/[, ]+/).filter(Boolean);
      const required=terms.filter(t=>t[0]==="+"),excluded=terms.filter(t=>t[0]==="-"),any=terms.filter(t=>!/[+-]/.test(t[0]));
      const matches=terms.length?required.every(t=>available.has(t.slice(1)))&&excluded.every(t=>!available.has(t.slice(1)))&&(!any.length||any.some(t=>available.has(t))):stack.length>0;
      stack.push(active);active=active&&matches;
    }
    output+=blank(m[0]);
  }
  return output+(active?text.slice(end):blank(text.slice(end)));
}
// Wikidot expressions: [[#if c | then | else]], [[#ifexpr e | then | else]]
// and [[#expr e]]. Conditions are false when empty, "false", "null" or "0".
// Expressions use a small arithmetic/logic grammar; nothing is ever eval'd.
function evaluate(expr){
  const tokens=String(expr).match(/\d+(?:\.\d+)?|<=|>=|!=|<>|==|and|or|not|[-+*/%()<>=!]/gi)||[];
  if(tokens.join("").replace(/\s/g,"")!==String(expr).replace(/\s/g,""))throw Error("bad");
  let i=0;const peek=()=>tokens[i]?.toLowerCase(),take=()=>tokens[i++];
  const or=()=>{let v=and();while(peek()==="or"){take();const r=and();v=(v||r)?1:0;}return v;};
  const and=()=>{let v=cmp();while(peek()==="and"){take();const r=cmp();v=(v&&r)?1:0;}return v;};
  const cmp=()=>{let v=add();while(["<",">","<=",">=","=","==","!=","<>"].includes(peek())){const o=take(),r=add();v=({"<":v<r,">":v>r,"<=":v<=r,">=":v>=r,"=":v===r,"==":v===r,"!=":v!==r,"<>":v!==r})[o]?1:0;}return v;};
  const add=()=>{let v=mul();while(peek()==="+"||peek()==="-"){const o=take(),r=mul();v=o==="+"?v+r:v-r;}return v;};
  const mul=()=>{let v=unary();while(["*","/","%"].includes(peek())){const o=take(),r=unary();v=o==="*"?v*r:o==="/"?v/r:v%r;}return v;};
  const unary=()=>{const t=peek();if(t==="-"){take();return -unary();}if(t==="+"){take();return unary();}if(t==="not"||t==="!"){take();return unary()?0:1;}if(t==="("){take();const v=or();if(take()!==")")throw Error("bad");return v;}const n=take();if(n===undefined||!/^\d/.test(n))throw Error("bad");return Number(n);};
  const value=or();if(i!==tokens.length||!Number.isFinite(value))throw Error("bad");return value;
}
function expressions(text){
  const falsy=v=>/^(?:|false|null|0)$/i.test(v.trim());
  const re=/\[\[#(if|ifexpr|expr)\s([^\[\]]*)\]\]/gi;
  for(let round=0;round<20&&re.test(text);round++){
    re.lastIndex=0;
    text=text.replace(re,(raw,kind,body)=>{
      const parts=body.split("|"),cond=parts[0];
      if(kind.toLowerCase()==="if")return (falsy(cond)?parts[2]:parts[1])?.trim()??"";
      let value;try{value=evaluate(cond);}catch{return kind.toLowerCase()==="expr"?"Expression error":(parts[2]?.trim()??"");}
      if(kind.toLowerCase()==="expr")return String(Math.round(value*1e10)/1e10);
      return (value?parts[1]:parts[2])?.trim()??"";
    });
  }
  return text;
}
function prepareSource(text,tags=[]) {
  // Comments in code examples stay literal, while inactive documentation must
  // disappear before its includes or CSS modules are ever processed.
  return expressions(selectTags(stripComments(text),tags));
}
module.exports={stripComments,selectTags,prepareSource,expressions,evaluate};

return module.exports; })();
const {fontSize, unixName, attr} = (() => { const module = { exports: {} };
"use strict";
// Helpers shared by the Preview renderer and the Live editing decorator.
const SIZE_KEYWORDS = new Set(["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "smaller", "larger"]);
function fontSize(value) {
  const text = String(value || "").trim().toLowerCase();
  if (SIZE_KEYWORDS.has(text)) return text;
  if (/^\d+(?:\.\d+)?(?:px|em|rem|%|pt|ex|vw|vh)$/.test(text)) return text;
  if (/^\d+(?:\.\d+)?$/.test(text)) return text + "%";
  return "";
}
// Wikidot page names: lower case ASCII, every other run of characters becomes
// a single hyphen, and hyphens next to a category colon are dropped.
function unixName(value) {
  return String(value || "").toLowerCase()
    .replace(/[^a-z0-9:_#-]+/g, "-").replace(/-+/g, "-")
    .replace(/-*:-*/g, ":").replace(/^[-:]+|-+$/g, "");
}
// Finds the closer that balances an already consumed opener of `name`.
function findClose(text, from, name) {
  const re = new RegExp(`\\[\\[(\\/?)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s\\]])[^\\]]*\\]\\]`, "gi");
  re.lastIndex = from;
  let depth = 1, m;
  while ((m = re.exec(text))) {
    depth += m[1] ? -1 : 1;
    if (!depth) return { start: m.index, end: m.index + m[0].length };
  }
  return null;
}
function attr(text, name) {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"']+))`, "i").exec(String(text || ""));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}
module.exports = { fontSize, unixName, findClose, attr, SIZE_KEYWORDS };

return module.exports; })();
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

return module.exports; })();
      const parsed=doc.createElement("template");parsed.innerHTML=render(this.table.source,this.context).html;
      const table=parsed.content.querySelector("table");
      if(!table){box.textContent=this.table.source;return box;}
      // Page-authored styles must not position content over the editor UI.
      for(const node of [table,...table.querySelectorAll("*")]){
        node.removeAttribute("id");node.removeAttribute("class");
        const align=node.style.textAlign;node.removeAttribute("style");if(align)node.style.textAlign=align;
        if(node.tagName==="IMG"){node.referrerPolicy="no-referrer";node.addEventListener("load",()=>view.requestMeasure());}
      }
      const cells=[...table.querySelectorAll("th,td")];
      cells.forEach((cell,index)=>{cell.tabIndex=0;cell.title="编辑单元格源码";press(cell,()=>{view.dispatch({selection:{anchor:this.table.cells[index]?.from??this.table.from},scrollIntoView:true});view.focus();});});
      box.appendChild(table);box.setAttribute("aria-label","Wikidot 表格，点击单元格编辑");return box;
    }
    ignoreEvent(){return true;}
  }
  class LayoutWidget extends WidgetType {
    constructor(block,rules){super();this.block=block;this.rules=rules;this.context=getContext();}
    eq(other){return this.block.from===other.block.from&&this.block.source===other.block.source&&JSON.stringify(this.rules)===JSON.stringify(other.rules)&&JSON.stringify(this.context)===JSON.stringify(other.context);}
    toDOM(view){
      const box=el("div","wikidot-live-layout"+(this.context.liveFrames!==false?" is-framed":"")),{render}=(() => { const module = { exports: {} };
"use strict";
const {rebaseCSS}=(() => { const module = { exports: {} };
"use strict";
function quotedEnd(text,start) {
  const quote=text[start];let i=start+1;
  while(i<text.length){if(text[i]==="\\")i+=2;else if(text[i++]===quote)break;}
  return i;
}
function commentEnd(text,start){const end=text.indexOf("*/",start+2);return end<0?text.length:end+2;}
function urlAt(text,start) {
  const open=/^url\s*\(/i.exec(text.slice(start));if(!open)return null;
  let i=start+open[0].length;while(/\s/.test(text[i]||"")&&i<text.length)i++;
  const valueStart=i;let value;
  if(text[i]==='"'||text[i]==="'"){const end=quotedEnd(text,i);value=text.slice(i+1,end-1);i=end;}
  else {while(i<text.length&&text[i]!==")"){if(text[i]==="\\")i++;i++;}value=text.slice(valueStart,i).trim();}
  while(/\s/.test(text[i]||"")&&i<text.length)i++;
  return text[i]===")"?{start,end:i+1,value}:null;
}
function imports(css) {
  const found=[];let i=0;
  while(i<css.length){
    if(css.startsWith("/*",i)){i=commentEnd(css,i);continue;}
    if(css[i]==='"'||css[i]==="'"){i=quotedEnd(css,i);continue;}
    const m=/^@import\b\s*/i.exec(css.slice(i));
    if(!m){i++;continue;}
    const start=i;let pos=i+m[0].length,url,end;
    const token=urlAt(css,pos);
    if(token){url=token.value;pos=token.end;}
    else if(css[pos]==='"'||css[pos]==="'"){end=quotedEnd(css,pos);url=css.slice(pos+1,end-1);pos=end;}
    else {i+=m[0].length;continue;}
    const conditionStart=pos;let depth=0;
    while(pos<css.length){
      if(css.startsWith("/*",pos)){pos=commentEnd(css,pos);continue;}
      if(css[pos]==='"'||css[pos]==="'"){pos=quotedEnd(css,pos);continue;}
      if(css[pos]==="(")depth++;else if(css[pos]===")")depth--;
      if(css[pos]===";"&&!depth)break;pos++;
    }
    if(pos<css.length)found.push({start,end:pos+1,url,condition:css.slice(conditionStart,pos).trim()});
    i=pos+1;
  }
  return found;
}
function rebaseCSS(css,base) {
  function absolute(value){try{const url=new URL(value,base);return ["https:","http:"].includes(url.protocol)?url.href:"";}catch{return "";}}
  const patches=[];let i=0;
  while(i<css.length){
    if(css.startsWith("/*",i)){i=commentEnd(css,i);continue;}
    if(css[i]==='"'||css[i]==="'"){i=quotedEnd(css,i);continue;}
    const token=(i===0||!/[\w-]/.test(css[i-1]))?urlAt(css,i):null;
    if(token){if(!/^data:|^#/i.test(token.value))patches.push({start:i,end:token.end,text:`url(${JSON.stringify(absolute(token.value))})`});i=token.end;}else i++;
  }
  for(const item of imports(css)){
    const m=/^@import\b\s*/i.exec(css.slice(item.start));const start=item.start+m[0].length;
    if(css[start]==='"'||css[start]==="'")patches.push({start,end:quotedEnd(css,start),text:JSON.stringify(absolute(item.url))});
  }
  for(const patch of patches.sort((a,b)=>b.start-a.start))css=css.slice(0,patch.start)+patch.text+css.slice(patch.end);
  return css;
}
module.exports={imports,rebaseCSS};

return module.exports; })();
const {minimalPalette}=(() => { const module = { exports: {} };
"use strict";
// Minimal preview has no site shell, so pages written for a dark theme (light
// text on a dark #container) become unreadable on the plain background.
// The preview iframe has no scripts, so the decision is made statically from
// the page CSS: find the text colour and background the page assigns to its
// main containers and pick a matching backdrop.
const NAMED = { black: "#000", white: "#fff", gray: "#808080", grey: "#808080", silver: "#c0c0c0", red: "#f00", maroon: "#800000", navy: "#000080", darkgray: "#a9a9a9", darkgrey: "#a9a9a9", lightgray: "#d3d3d3", lightgrey: "#d3d3d3", dimgray: "#696969", whitesmoke: "#f5f5f5", gainsboro: "#dcdcdc", snow: "#fffafa", ivory: "#fffff0", beige: "#f5f5dc", wheat: "#f5deb3", linen: "#faf0e6" };
const TARGET = /^(?::root|html|body|#html-body|#skrollr-body|#container|#container-wrap|#content-wrap|#main-content|#page-content|#page-content\s+p|p|\.content-panel|\.page-content)$/i;
function parseColor(value) {
  let text = String(value || "").trim().toLowerCase().replace(/\s*!important$/, "");
  if (NAMED[text]) text = NAMED[text];
  let m;
  if ((m = /^#([0-9a-f]{3,4})$/.exec(text))) return [...m[1].slice(0, 3)].map(c => parseInt(c + c, 16)).concat(m[1].length === 4 ? parseInt(m[1][3] + m[1][3], 16) / 255 : 1);
  if ((m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/.exec(text))) return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)).concat(m[2] ? parseInt(m[2], 16) / 255 : 1);
  if ((m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(text))) {
    const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [+m[1], +m[2], +m[3], a];
  }
  if ((m = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(text))) {
    const h = +m[1] / 360, s = +m[2] / 100, l = +m[3] / 100;
    const f = n => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); };
    const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [f(0), f(8), f(4), a];
  }
  return null;
}
function luminance([r, g, b]) {
  const c = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}
// Collects simple top-level rules (inside @media too) and custom properties.
function rules(css) {
  const out = [], vars = Object.create(null);
  const text = String(css || "").replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of text.matchAll(/([^{}@;]+)\{([^{}]*)\}/g)) {
    const selectors = m[1].split(",").map(s => s.trim()).filter(Boolean);
    const decls = Object.create(null);
    for (const part of m[2].split(";")) {
      const i = part.indexOf(":"); if (i < 0) continue;
      const name = part.slice(0, i).trim().toLowerCase(), value = part.slice(i + 1).trim();
      if (name.startsWith("--")) vars[name] = value; else decls[name] = value;
    }
    out.push({ selectors, decls });
  }
  return { list: out, vars };
}
function resolve(value, vars, depth = 0) {
  if (!value || depth > 8) return value;
  return String(value).replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/g, (_, name, fallback) => resolve(vars[name] ?? fallback ?? "", vars, depth + 1));
}
function backgroundColor(value, vars) {
  const text = resolve(value, vars);
  if (!text) return null;
  const direct = parseColor(text);
  if (direct) return direct;
  // A shorthand or gradient: take its first recognisable colour.
  for (const m of text.matchAll(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b[a-z]+\b/gi)) { const c = parseColor(m[0]); if (c) return c; }
  return null;
}
function analyze(css) {
  const { list, vars } = rules(css);
  let text = null, background = null;
  for (const rule of list) {
    if (!rule.selectors.some(s => TARGET.test(s))) continue;
    const color = rule.decls.color && parseColor(resolve(rule.decls.color, vars));
    if (color && color[3] > 0.5) text = color;
    const bg = backgroundColor(rule.decls["background-color"] || rule.decls.background, vars);
    if (bg && bg[3] > 0.5) background = bg;
  }
  return { text, background };
}
// Returns the html{} declarations used by Minimal.
function minimalPalette(css, dark = false, enabled = true) {
  const light = "color-scheme:light;background:#faf9f6;color:#35343a", darkPalette = "color-scheme:dark;background:#202024;color:#e2e2e5";
  const fallback = dark ? darkPalette : light;
  if (!enabled) return { palette: fallback, reason: "" };
  const { text, background } = analyze(css);
  // The page paints its own backdrop; only make the outer frame match it.
  if (background) {
    const isDark = luminance(background) < 0.2;
    return { palette: `color-scheme:${isDark ? "dark" : "light"};background:rgb(${background.slice(0, 3).map(Math.round).join(",")});color:${isDark ? "#e2e2e5" : "#35343a"}`, reason: "page-background" };
  }
  if (text) {
    const lum = luminance(text);
    if (lum > 0.45) return { palette: darkPalette, reason: "light-text" };
    if (lum < 0.12) return { palette: light, reason: "dark-text" };
  }
  return { palette: fallback, reason: "" };
}
module.exports = { parseColor, luminance, analyze, minimalPalette };

return module.exports; })();
const {prepareSource}=(() => { const module = { exports: {} };
"use strict";
const blank=text=>text.replace(/[^\n]/g,"");
function stripComments(text){return text.replace(/\[\[code(?:\s+[^\]]*)?\]\][\s\S]*?\[\[\/code\]\]|\[!--[\s\S]*?--\]/gi,raw=>/^\[!--/.test(raw)?blank(raw):raw);}
// [[iftags]] blocks nest. An [[iftags]] without terms never matches at the
// top level (Wikidot's empty "any" list), but is transparent when nested.
// Themes rely on this: [[ift{$param}gs …]] only becomes a real tag once the
// include parameter is substituted, and wraps an empty [[iftags]] switch.
// Tag lines prefixed by blockquote markers are removed with their prefix.
function selectTags(text,tags=[]) {
  const available=new Set(tags),stack=[];let output="",end=0,active=true;
  const tokens=/\[\[code(?:\s+[^\]]*)?\]\][\s\S]*?\[\[\/code\]\]|^[ \t]*>[> \t]*\[\[(\/?)iftags(?:\s+([^\]]*))?\]\][ \t]*$|\[\[(\/?)iftags(?:\s+([^\]]*))?\]\]|^[ \t>]*\[\[\/?ift\{\$[^}\]]*\}gs\b[^\]]*\]\][ \t]*$/gim;let m;
  while((m=tokens.exec(text))){
    output+=active?text.slice(end,m.index):blank(text.slice(end,m.index));end=tokens.lastIndex;
    const close=m[1]??m[3],args=m[2]??m[4];
    if(close===undefined){output+=active&&!/^[ \t>]*\[\[\/?ift\{/.test(m[0])?m[0]:blank(m[0]);continue;}
    if(close){active=stack.length?stack.pop():active;}
    else{
      const terms=(args||"").trim().split(/[, ]+/).filter(Boolean);
      const required=terms.filter(t=>t[0]==="+"),excluded=terms.filter(t=>t[0]==="-"),any=terms.filter(t=>!/[+-]/.test(t[0]));
      const matches=terms.length?required.every(t=>available.has(t.slice(1)))&&excluded.every(t=>!available.has(t.slice(1)))&&(!any.length||any.some(t=>available.has(t))):stack.length>0;
      stack.push(active);active=active&&matches;
    }
    output+=blank(m[0]);
  }
  return output+(active?text.slice(end):blank(text.slice(end)));
}
// Wikidot expressions: [[#if c | then | else]], [[#ifexpr e | then | else]]
// and [[#expr e]]. Conditions are false when empty, "false", "null" or "0".
// Expressions use a small arithmetic/logic grammar; nothing is ever eval'd.
function evaluate(expr){
  const tokens=String(expr).match(/\d+(?:\.\d+)?|<=|>=|!=|<>|==|and|or|not|[-+*/%()<>=!]/gi)||[];
  if(tokens.join("").replace(/\s/g,"")!==String(expr).replace(/\s/g,""))throw Error("bad");
  let i=0;const peek=()=>tokens[i]?.toLowerCase(),take=()=>tokens[i++];
  const or=()=>{let v=and();while(peek()==="or"){take();const r=and();v=(v||r)?1:0;}return v;};
  const and=()=>{let v=cmp();while(peek()==="and"){take();const r=cmp();v=(v&&r)?1:0;}return v;};
  const cmp=()=>{let v=add();while(["<",">","<=",">=","=","==","!=","<>"].includes(peek())){const o=take(),r=add();v=({"<":v<r,">":v>r,"<=":v<=r,">=":v>=r,"=":v===r,"==":v===r,"!=":v!==r,"<>":v!==r})[o]?1:0;}return v;};
  const add=()=>{let v=mul();while(peek()==="+"||peek()==="-"){const o=take(),r=mul();v=o==="+"?v+r:v-r;}return v;};
  const mul=()=>{let v=unary();while(["*","/","%"].includes(peek())){const o=take(),r=unary();v=o==="*"?v*r:o==="/"?v/r:v%r;}return v;};
  const unary=()=>{const t=peek();if(t==="-"){take();return -unary();}if(t==="+"){take();return unary();}if(t==="not"||t==="!"){take();return unary()?0:1;}if(t==="("){take();const v=or();if(take()!==")")throw Error("bad");return v;}const n=take();if(n===undefined||!/^\d/.test(n))throw Error("bad");return Number(n);};
  const value=or();if(i!==tokens.length||!Number.isFinite(value))throw Error("bad");return value;
}
function expressions(text){
  const falsy=v=>/^(?:|false|null|0)$/i.test(v.trim());
  const re=/\[\[#(if|ifexpr|expr)\s([^\[\]]*)\]\]/gi;
  for(let round=0;round<20&&re.test(text);round++){
    re.lastIndex=0;
    text=text.replace(re,(raw,kind,body)=>{
      const parts=body.split("|"),cond=parts[0];
      if(kind.toLowerCase()==="if")return (falsy(cond)?parts[2]:parts[1])?.trim()??"";
      let value;try{value=evaluate(cond);}catch{return kind.toLowerCase()==="expr"?"Expression error":(parts[2]?.trim()??"");}
      if(kind.toLowerCase()==="expr")return String(Math.round(value*1e10)/1e10);
      return (value?parts[1]:parts[2])?.trim()??"";
    });
  }
  return text;
}
function prepareSource(text,tags=[]) {
  // Comments in code examples stay literal, while inactive documentation must
  // disappear before its includes or CSS modules are ever processed.
  return expressions(selectTags(stripComments(text),tags));
}
module.exports={stripComments,selectTags,prepareSource,expressions,evaluate};

return module.exports; })();
const {fontSize, unixName, attr} = (() => { const module = { exports: {} };
"use strict";
// Helpers shared by the Preview renderer and the Live editing decorator.
const SIZE_KEYWORDS = new Set(["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "smaller", "larger"]);
function fontSize(value) {
  const text = String(value || "").trim().toLowerCase();
  if (SIZE_KEYWORDS.has(text)) return text;
  if (/^\d+(?:\.\d+)?(?:px|em|rem|%|pt|ex|vw|vh)$/.test(text)) return text;
  if (/^\d+(?:\.\d+)?$/.test(text)) return text + "%";
  return "";
}
// Wikidot page names: lower case ASCII, every other run of characters becomes
// a single hyphen, and hyphens next to a category colon are dropped.
function unixName(value) {
  return String(value || "").toLowerCase()
    .replace(/[^a-z0-9:_#-]+/g, "-").replace(/-+/g, "-")
    .replace(/-*:-*/g, ":").replace(/^[-:]+|-+$/g, "");
}
// Finds the closer that balances an already consumed opener of `name`.
function findClose(text, from, name) {
  const re = new RegExp(`\\[\\[(\\/?)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s\\]])[^\\]]*\\]\\]`, "gi");
  re.lastIndex = from;
  let depth = 1, m;
  while ((m = re.exec(text))) {
    depth += m[1] ? -1 : 1;
    if (!depth) return { start: m.index, end: m.index + m[0].length };
  }
  return null;
}
function attr(text, name) {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"']+))`, "i").exec(String(text || ""));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}
module.exports = { fontSize, unixName, findClose, attr, SIZE_KEYWORDS };

return module.exports; })();
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

return module.exports; })(),{styleFor,declarations}=(() => { const module = { exports: {} };
"use strict";
const {attr}=(() => { const module = { exports: {} };
"use strict";
// Helpers shared by the Preview renderer and the Live editing decorator.
const SIZE_KEYWORDS = new Set(["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "smaller", "larger"]);
function fontSize(value) {
  const text = String(value || "").trim().toLowerCase();
  if (SIZE_KEYWORDS.has(text)) return text;
  if (/^\d+(?:\.\d+)?(?:px|em|rem|%|pt|ex|vw|vh)$/.test(text)) return text;
  if (/^\d+(?:\.\d+)?$/.test(text)) return text + "%";
  return "";
}
// Wikidot page names: lower case ASCII, every other run of characters becomes
// a single hyphen, and hyphens next to a category colon are dropped.
function unixName(value) {
  return String(value || "").toLowerCase()
    .replace(/[^a-z0-9:_#-]+/g, "-").replace(/-+/g, "-")
    .replace(/-*:-*/g, ":").replace(/^[-:]+|-+$/g, "");
}
// Finds the closer that balances an already consumed opener of `name`.
function findClose(text, from, name) {
  const re = new RegExp(`\\[\\[(\\/?)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s\\]])[^\\]]*\\]\\]`, "gi");
  re.lastIndex = from;
  let depth = 1, m;
  while ((m = re.exec(text))) {
    depth += m[1] ? -1 : 1;
    if (!depth) return { start: m.index, end: m.index + m[0].length };
  }
  return null;
}
function attr(text, name) {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"']+))`, "i").exec(String(text || ""));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}
module.exports = { fontSize, unixName, findClose, attr, SIZE_KEYWORDS };

return module.exports; })();
const LAYOUT=/^(?:display|grid-template-columns|grid-template-rows|grid-auto-flow|grid-column|grid-row|gap|column-gap|row-gap|flex-direction|flex-wrap|flex|order|justify-content|justify-items|align-items|align-self|width|min-width|max-width|height|min-height|max-height|margin(?:-(?:left|right|top|bottom|inline|block))?|padding(?:-(?:left|right|top|bottom|inline|block))?|text-align|float|clear|box-sizing)$/;
function declarations(css,positioning=false,painting=false){
 const result=[];
 for(const part of String(css||"").split(";")){
  const i=part.indexOf(":");if(i<0)continue;
  const name=part.slice(0,i).trim().toLowerCase(),value=part.slice(i+1).trim().replace(/\s*!important\s*$/i,"");
  if(!(LAYOUT.test(name)||(painting&&/^(?:color|background-color|border(?:-radius)?|font-size|line-height|opacity)$/.test(name))||(positioning&&/^(?:position|top|right|bottom|left)$/.test(name)))||!value||/url\s*\(|expression|[{}<>]|var\(/i.test(value))continue;
  if(name==="display"&&!/^(?:grid|inline-grid|flex|inline-flex|block|inline-block|flow-root)$/.test(value))continue;
  if(name==="position"&&!/^(?:relative|absolute|fixed|sticky)$/.test(value))continue;
  // Negative margins pull blocks over each other; without the page's own
  // painting that only produces overlapping text, so they need positioning.
  if(!positioning&&/^margin/.test(name)&&/(^|\s)-\d/.test(value)){const safe=value.replace(/(^|\s)-\d[\w.%]*/g,"$10");result.push(name+":"+safe);continue;}
  result.push(name+":"+value);
 }
 return result.join(";");
}
function localRules(source){
 const rules=[];
 for(const module of source.replace(/\[\[code\b[^\]]*\]\][\s\S]*?\[\[\/code\]\]/gi,"").matchAll(/\[\[module\s+CSS[^\]]*\]\]([\s\S]*?)\[\[\/module\]\]/gi)){
  if(/\bdisable\s*=\s*["']?true/i.test(module[0].slice(0,module[0].indexOf(']]'))))continue;
  const css=module[1].replace(/\/\*[\s\S]*?\*\//g,"");
  for(const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g))for(const selector of match[1].split(",")){
   const s=selector.trim();if(!/^(?:div)?(?:\.[\w-]+)+$/.test(s))continue;
   rules.push({classes:[...s.matchAll(/\.([\w-]+)/g)].map(m=>m[1]),css:match[2]});
  }
 }
 return rules;
}
function styleFor(args,rules,positioning=false,painting=false){
 const classes=new Set((attr(args,"class")||"").split(/\s+/));
 return declarations(rules.filter(r=>r.classes.every(c=>classes.has(c))).map(r=>r.css).concat(attr(args,"style")||"").join(";"),positioning,painting);
}
module.exports={declarations,localRules,styleFor};

return module.exports; })();
      const parsed=doc.createElement("template");parsed.innerHTML=render(this.block.source,{...this.context,editable:true}).html;
      // Keep layout, not document-authored painting, selectors, IDs or active embeds.
      for(const node of [...parsed.content.querySelectorAll("*")]){
        if(/^(?:STYLE|IFRAME|INPUT|SCRIPT|OBJECT|EMBED)$/.test(node.tagName)){node.remove();continue;}
        const args='class="'+(node.getAttribute("class")||"").replace(/"/g,"")+'" style="'+(node.getAttribute("style")||"").replace(/"/g,"")+'"';
        const style=node.tagName==="DIV"?styleFor(args,this.rules,!!this.context.livePositioning,false):declarations(node.getAttribute("style"),false,false);
        // Every div keeps a visible outline and label; outlines take no space,
        // so the layout itself is unchanged.
        if(node.tagName==="DIV"&&!node.closest("table")&&!/^wd-/.test(node.getAttribute("class")||"")){
          const cls=(node.getAttribute("class")||"").trim(),id=node.getAttribute("id")||"";
          node.setAttribute("data-wd-label","div"+(cls?" ."+cls.split(/\s+/).join("."):"")+(id?"#"+id:""));
        }
        node.removeAttribute("id");node.removeAttribute("class");node.removeAttribute("style");
        if(style)node.setAttribute("style",style);
        if(node.tagName==="IMG"){node.referrerPolicy="no-referrer";node.addEventListener("load",()=>view.requestMeasure());}
      }
      box.appendChild(parsed.content);
      if(this.context.livePositioning&&/position:(?:absolute|fixed)/.test(this.block.layout)){box.classList.add("is-positioned");}
      box.setAttribute("data-wd-layout-from",String(this.block.from));
      box.title="点击文字定位，拖选文字后直接编辑";
      box.addEventListener("click",event=>event.preventDefault()); // Links are source text here, not navigation.
      return box;
    }
    ignoreEvent(event){return !["mousedown","mousemove","mouseup"].includes(event.type);}
  }
  function lineIndex(model,pos){let lo=0,hi=model.lines.length-1;while(lo<hi){const mid=(lo+hi+1)>>1;if(model.lines[mid].from<=pos)lo=mid;else hi=mid-1;}return lo;}
  function decorate(state,model,opened=new Set(),tabs=new Map(),collapsed=new Map()){
    const ranges=[],selected=state.selection.ranges,active=activeLines(model,selected),atomic=[],covers=[],signature=[];
    const inside=(from,to)=>covers.some(c=>from>=c.from&&to<=c.to&&!(from===c.from&&to===c.to&&c.self));
    const hideRange=(from,to,widget,isAtomic,record=true)=>{
      if(to<=from&&!widget)return;
      // An outer hidden tab/fold supersedes nested replacements and controls.
      for(const list of [ranges,atomic,covers])for(let i=list.length-1;i>=0;i--)if(list[i].from>=from&&list[i].to<=to)list.splice(i,1);
      const range=widget?Decoration.replace({widget,inclusive:false}).range(from,to):Decoration.replace({inclusive:false}).range(from,to);
      ranges.push(range);if(isAtomic)atomic.push(range);if(record)covers.push({from,to,widget:!!widget});
    };
    // 1. Collapsed folds and inactive tabs hide whole spans of source.
    const gone=new Set(),tabState=[];
    for(const b of [...(model.collapsibles||[])].sort((a,b)=>a.from-b.from)){
      if(inside(b.from,b.to))continue;
      const {attr}=(() => { const module = { exports: {} };
"use strict";
// Helpers shared by the Preview renderer and the Live editing decorator.
const SIZE_KEYWORDS = new Set(["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "smaller", "larger"]);
function fontSize(value) {
  const text = String(value || "").trim().toLowerCase();
  if (SIZE_KEYWORDS.has(text)) return text;
  if (/^\d+(?:\.\d+)?(?:px|em|rem|%|pt|ex|vw|vh)$/.test(text)) return text;
  if (/^\d+(?:\.\d+)?$/.test(text)) return text + "%";
  return "";
}
// Wikidot page names: lower case ASCII, every other run of characters becomes
// a single hyphen, and hyphens next to a category colon are dropped.
function unixName(value) {
  return String(value || "").toLowerCase()
    .replace(/[^a-z0-9:_#-]+/g, "-").replace(/-+/g, "-")
    .replace(/-*:-*/g, ":").replace(/^[-:]+|-+$/g, "");
}
// Finds the closer that balances an already consumed opener of `name`.
function findClose(text, from, name) {
  const re = new RegExp(`\\[\\[(\\/?)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s\\]])[^\\]]*\\]\\]`, "gi");
  re.lastIndex = from;
  let depth = 1, m;
  while ((m = re.exec(text))) {
    depth += m[1] ? -1 : 1;
    if (!depth) return { start: m.index, end: m.index + m[0].length };
  }
  return null;
}
function attr(text, name) {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"']+))`, "i").exec(String(text || ""));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}
module.exports = { fontSize, unixName, findClose, attr, SIZE_KEYWORDS };

return module.exports; })(),open=model.chips[b.open],close=model.chips[b.close];
      const editing=touches(selected,open.revealFrom,open.revealTo)||touches(selected,close.revealFrom,close.revealTo);
      if(editing)continue;
      const expanded=collapsed.get(b.from)??((attr(b.args,"folded")||"").toLowerCase()==="no");
      signature.push("c"+b.from+expanded);
      if(!expanded){hideRange(b.from,b.to,new CollapseWidget(b,false),true);continue;}
      const location=(attr(b.args,"hideLocation")||"").toLowerCase();
      hideRange(open.from,open.to,location==="bottom"?null:new CollapseWidget(b,true),false);
      hideRange(close.from,close.to,location==="both"||location==="bottom"?new CollapseWidget(b,true,true):null,false);
    }
    for(const fold of model.folds){
      if(inside(fold.from,fold.to))continue;
      if(opened.has(fold.from)){ranges.push(Decoration.widget({widget:new FoldWidget(fold,true),side:1}).range(fold.firstTo));continue;}
      hideRange(fold.from,fold.to,new FoldWidget(fold),true);
    }
    for(const view of model.tabviews){
      if(inside(model.chips[view.chip].from,model.chips[view.chip].to))continue;
      const editing=revealed(model,model.chips[view.chip],selected,active);
      const total=view.tabs.filter(t=>t.close!==undefined).length;
      let current=Math.min(tabs.get(view.from)??0,Math.max(total-1,0));
      // A selection inside a tab makes it the visible one.
      view.tabs.forEach((tab,index)=>{if(touches(selected,tab.from,tab.to))current=index;});
      tabState.push({view,current,editing});signature.push("t"+current+(editing?"e":""));
      if(editing)continue;
      const spans=[];
      view.tabs.forEach((tab,index)=>{
        if(index===current||tab.close===undefined||inside(tab.hideFrom,tab.hideTo))return;
        const last=spans[spans.length-1];
        if(last&&tab.hideFrom<=last.to)last.to=Math.max(last.to,tab.hideTo);else spans.push({from:tab.hideFrom,to:tab.hideTo});
        for(let j=tab.first;j<=tab.last;j++)gone.add(j);
      });
      for(const span of spans)hideRange(span.from,span.to,null,false);
    }
    for(const table of model.tables||[]){
      if(inside(table.from,table.to))continue;
      const editing=touches(selected,table.from,table.to);signature.push("table"+table.from+editing);
      if(editing)continue;
      hideRange(table.from,table.to,new TableWidget(table),true);
      for(let i=table.first+1;i<=table.last;i++)gone.add(i);
      // Preserve the group's last margin on the surviving first row.
    }
    // A selected ancestor makes the entire subtree native. Never insert a
    // rendered child widget between rows of the same editable source frame.
    const editingDivs=(model.divs||[]).filter(b=>touches(selected,b.from,b.to));
    for(const block of [...(model.divs||[])].sort((a,b)=>a.from-b.from)){
      if(!block.layout||inside(block.from,block.to))continue;
      const editing=editingDivs.some(parent=>parent.from<=block.from&&parent.to>=block.to);signature.push("layout"+block.from+editing);
      if(editing)continue;
      hideRange(block.from,block.to,new LayoutWidget(block,model.layoutRules),false);
      for(let i=block.first+1;i<=block.last;i++)gone.add(i);
    }
    // Comments occupy no visual space until the selection touches the comment itself.
    for(const comment of model.comments||[]){
      if(inside(comment.from,comment.to))continue;
      const editing=touches(selected,comment.from,comment.to);signature.push("comment"+comment.from+editing);
      if(editing)ranges.push(Decoration.mark({class:"wd-live-comment"}).range(comment.from,comment.to));
      else {
        let from=comment.from,to=comment.to;
        const first=model.lines[lineIndex(model,from)],last=model.lines[lineIndex(model,to)];
        if(state.doc.toString().slice(first.from,from).trim()===""&&state.doc.toString().slice(to,last.to).trim()===""){
          if(last.to<model.length)to=last.to+1;else if(first.from>0)from=first.from-1;
        }
        hideRange(from,to,null,false);
      }
    }
    // 2. Tags, tokens and markers.
    const tabviewChips=new Map(tabState.map(t=>[t.view.chip,t]));
    model.chips.forEach((chip,index)=>{
      if(inside(chip.from,chip.to))return;
      const tabview=chip.tag==="tabview"?tabviewChips.get(chip.kind==="open"?index:chip.pair):null;
      const show=tabview?tabview.editing:revealed(model,chip,selected,active);
      signature.push(show?1:0);
      if(show){if(chip.revealFrom!==undefined&&chip.revealTo>chip.revealFrom)ranges.push(Decoration.mark({class:"wd-live-tag-source"}).range(chip.revealFrom,chip.revealTo));return;}
      switch(chip.kind){
        case "open":
          if(tabview)hideRange(chip.from,chip.to,new TabsWidget(tabview.view,tabview.current),true);
          else {
            const next=model.chips[index+1];
            let label=chip.label;
            for(let j=index-1;j>=0;j--){const prev=model.chips[j],current=model.chips[j+1];if(prev.kind!=="open"||prev.to!==current.from||revealed(model,prev,selected,active))break;label=prev.label+" › "+label;}
            const joinedNext=next?.kind==="open"&&chip.to===next.from&&!revealed(model,next,selected,active);
            hideRange(chip.from,chip.to,chip.box&&!joinedNext?new LabelWidget({...chip,label},"wikidot-live-box-label"):null,!!chip.box);
          }
          break;
        case "close":hideRange(chip.from,chip.to,null,false);break;
        case "image":hideRange(chip.from,chip.to,new ImageWidget(chip),true);break;
        case "toc":hideRange(chip.from,chip.to,new TocWidget(chip,model.headings.filter(h=>!h.hidden)),true);break;
        case "warn":hideRange(chip.from,chip.to,new LabelWidget(chip,"wikidot-live-chip wd-live-unmatched"),true);break;
        case "bullet":hideRange(chip.from,chip.to,new LabelWidget(chip,"wikidot-live-bullet"),false);break;
        case "sep":hideRange(chip.from,chip.to,new LabelWidget(chip,"wikidot-live-dd-sep"),false);break;
        default:hideRange(chip.from,chip.to,new LabelWidget(chip,"wikidot-live-chip"),true);
      }
    });
    // 3. Rows: every visual line gets one line decoration carrying its frame.
    const broken=new Set();
    for(const cover of covers){
      if(cover.to<=cover.from)continue;
      for(let i=lineIndex(model,cover.from);i<model.lines.length&&model.lines[i].to<cover.to;i++)if(model.lines[i].to>=cover.from)broken.add(i);
    }
    for(const row of rows(model,{broken,gone,opened})){
      const tagOnly=row.lines.every(l=>l.cls==="wd-live-tag-line")&&row.lines.every(l=>covers.some(c=>c.from<=l.from&&c.to>=l.to))&&!covers.some(c=>c.widget&&c.from>=row.at&&c.from<=row.lines.at(-1).to);
      const tableEnd=[...(model.tables||[]),...(model.divs||[])].some(t=>model.lines[t.first].from===row.at&&covers.some(c=>c.from===t.from&&c.to===t.to));
      if((model.divs||[]).some(b=>b.layout&&b.from===row.at&&covers.some(c=>c.widget&&c.from===b.from&&c.to===b.to))){row.depth=0;row.top=[];row.bottom=[];}
      const gapStart=row.spaceTop&&(!row.depth||row.top.includes(1)),gapEnd=(row.spaceBottom||tableEnd)&&(!row.depth||row.bottom.includes(1));
      const cls=[row.cls,frameClass(row),tagOnly?"wd-live-hidden-tag-row":"",gapStart?"wd-live-block-start":"",gapEnd?"wd-live-block-end":""].filter(Boolean).join(" "),style=[row.style,frameStyle(row),gapStart?"margin-top:.75em !important":"",gapEnd?"margin-bottom:.75em !important":""].filter(Boolean).join(";");
      if(cls||style)ranges.push(Decoration.line({attributes:{class:cls,style,"data-wd-line":String(row.at)}}).range(row.at));
    }
    for(const mark of model.marks)if(!inside(mark.from,mark.to))ranges.push(Decoration.mark({class:mark.cls,attributes:mark.style?{style:mark.style}:undefined}).range(mark.from,mark.to));
    for(const item of model.hidden)if(!inside(item.from,item.to))ranges.push(active.has(item.line)?Decoration.mark({class:"wd-live-syntax"}).range(item.from,item.to):Decoration.replace({inclusive:false}).range(item.from,item.to));
    return {model,decorations:Decoration.set(ranges,true),atomic:Decoration.set(atomic,true),active,opened,tabs,collapsed,signature:[...active].join(",")+"|"+signature.join("")};
  }
  const field=StateField.define({
    create(state){return decorate(state,parse(state.doc.toString()));},
    update(value,transaction){
      if(transaction.effects.some(e=>e.is(refreshContext)))return decorate(transaction.state,parse(transaction.state.doc.toString()),value.opened,value.tabs,value.collapsed);
      if(transaction.selection&&pointer?.active&&!transaction.docChanged&&!transaction.effects.length)return value;
      let opened=value.opened,tabs=value.tabs,collapsed=value.collapsed,changed=false;
      if(transaction.docChanged){
        opened=new Set([...opened].map(pos=>transaction.changes.mapPos(pos,1)));
        collapsed=new Map([...collapsed].map(([pos,open])=>[transaction.changes.mapPos(pos,1),open]));
        tabs=new Map([...tabs].map(([pos,index])=>[transaction.changes.mapPos(pos,1),index]));changed=true;
      }
      for(const effect of transaction.effects){
        if(effect.is(pointerEnd)){changed=true;}
        else if(effect.is(toggleCollapse)){collapsed=new Map(collapsed);collapsed.set(effect.value.from,effect.value.open);changed=true;}
        else if(effect.is(toggleModule)){if(opened===value.opened)opened=new Set(opened);changed=true;if(effect.value.open)opened.add(effect.value.from);else opened.delete(effect.value.from);}
        else if(effect.is(selectTab)){if(tabs===value.tabs)tabs=new Map(tabs);changed=true;tabs.set(effect.value.from,effect.value.index);}
      }
      // Includes return to their compact form as soon as editing leaves them.
      if(transaction.selection){opened=new Set([...opened].filter(pos=>{const f=value.model.folds.find(f=>f.from===pos);return !f?.kind.startsWith("Include")||touches(transaction.state.selection.ranges,f.from,f.to);}));if(opened.size!==value.opened.size)changed=true;}
      if(transaction.docChanged){const model=parse(transaction.state.doc.toString());opened=new Set([...opened].filter(pos=>model.folds.some(fold=>fold.from===pos)));return decorate(transaction.state,model,opened,tabs,collapsed);}
      if(changed)return decorate(transaction.state,value.model,opened,tabs,collapsed);
      if(transaction.selection){const next=decorate(transaction.state,value.model,opened,tabs,collapsed);return next.signature===value.signature?value:next;}
      return value;
    },provide:f=>[EditorView.decorations.from(f,value=>value.decorations),EditorView.atomicRanges.of(view=>view.state.field(f).atomic)]
  });
  let mode="source",pairing=false;
  let popup=null,selectionMenu=null;
  const textHandlers=EditorView.domEventHandlers?EditorView.domEventHandlers({
    keydown(event,view){
      if(event.isComposing)return false;
      if((event.metaKey||event.ctrlKey)&&event.shiftKey&&(event.code==="Backslash"||event.key==="\\"||event.key==="|")){
        const pos=matchingTagPosition(parse(view.state.doc.toString()),view.state.selection.main.head);
        if(pos===null)return false;popup?.close();view.dispatch({selection:{anchor:pos},scrollIntoView:true});return true;
      }
      if(selectionMenu?.handleKey(event))return true;
      if(popup?.handleKey(event))return true;
      if((event.key==="Enter"&&event.shiftKey)||!["Tab","Enter"].includes(event.key)||event.ctrlKey||event.metaKey||event.altKey)return false;
      const selection=view.state.selection;if(selection.ranges.length!==1||!selection.main.empty)return false;
      const {tableKey}=(() => { const module = { exports: {} };
"use strict";
// Source offsets shared by live table clicks and keyboard navigation.
function simpleCells(text,offset=0){
 const pipes=[...text.matchAll(/\|{2,}/g)],cells=[];
 for(let i=0;i<pipes.length-1;i++){
  const from=pipes[i].index+pipes[i][0].length,to=pipes[i+1].index,raw=text.slice(from,to);
  let lead=/^\s*(?:~\s*)?(?:[<>=]\s*)?/.exec(raw)[0].length;
  cells.push({from:offset+from+lead,to:offset+to,span:Math.max(1,Math.floor(pipes[i][0].length/2))});
 }
 return cells;
}
function tableKey(source,pos,key,backward=false,tables=[]){
 const table=tables.find(t=>pos>=t.from&&pos<=t.to&&t.simple);
 if(!table)return null;
 const cells=table.cells;let index=cells.findIndex((c,i)=>pos<=c.to&&(i===0||pos>cells[i-1].to));
 if(index<0&&cells.length&&pos>cells.at(-1).to)index=cells.length-1;
 if(index<0)return null;
 if(key==="Enter"&&pos!==table.to)return null;
 const target=key==="Enter"?cells.length:index+(backward?-1:1);
 if(target<0)return {selection:{anchor:Math.max(0,table.from-1)}};
 if(target<cells.length)return {selection:{anchor:cells[target].from}};
 if(backward)return null;
 const last=source.slice(table.from,table.to).split("\n").at(-1),columns=simpleCells(last).reduce((n,c)=>n+c.span,0);
 const insert="\n||"+"  ||".repeat(columns);
 return {changes:{from:table.to,insert},selection:{anchor:table.to+4}};
}
module.exports={simpleCells,tableKey};

return module.exports; })(),change=tableKey(view.state.doc.toString(),selection.main.head,event.key,event.shiftKey,parseLive(view.state.doc.toString()).tables);
      if(!change)return false;view.dispatch({...change,scrollIntoView:true,userEvent:"input"});return true;
    },
    mousedown(event,view){
      if(event.button!==0||mode!=="rich")return false;
      if(pointer)return false; // DOM-based hit testing also covers genuine blank rows.
      const node=event.target?.closest?.(".cm-line[data-wd-line]");if(!node)return false;
      const pos=Number(node.getAttribute("data-wd-line")),line=view.state.doc.lineAt(pos);
      if(line.text.trim())return false;
      event.preventDefault();view.dispatch({selection:{anchor:line.from}});view.focus();return true;
    },
    blur(){popup?.close();}
  }):[];
  function autoPair(update){
    if(pairing)return;
    if(!update.transactions?.some(transaction=>typeof transaction.isUserEvent==="function"&&transaction.isUserEvent("input.type")))return;
    const view=update.view,pos=update.state.selection.main.head,source=update.state.doc.toString(),tag=autoCloseFor(source,pos),inline=autoInlineFor(source,pos);
    if(!tag&&!inline)return;
    pairing=true;
    // Dispatching straight from an update listener is rejected by CodeMirror;
    // queue the insertion so it lands after the current update finishes.
    queueMicrotask(()=>{
      try{
        if(view.state.selection.main.head!==pos)return;
        if(inline){if(autoInlineFor(view.state.doc.toString(),pos)!==inline)return;view.dispatch({changes:{from:pos,insert:inline},selection:{anchor:pos}});return;}
        if(autoCloseFor(view.state.doc.toString(),pos)!==tag)return;
        // Reuse a following blank line as the body instead of adding one.
        const doc=view.state.doc,line=doc.lineAt(pos),next=line.number<doc.lines?doc.line(line.number+1):null;
        if(next&&!next.text.trim())view.dispatch({changes:{from:next.to,insert:"\n[[/"+tag+"]]"},selection:{anchor:next.to}});
        else view.dispatch({changes:{from:pos,insert:"\n\n[[/"+tag+"]]"},selection:{anchor:pos+1}});
      }finally{pairing=false;}
    });
  }
  // Source mode changes only bracketed syntax, never the prose font.
  const sourceMarks=state=>{
    const ranges=[];
    for(const m of state.doc.toString().matchAll(/\[\[(?!\[)[\s\S]*?\]\]/g))
      if(m[0].length>4)ranges.push(Decoration.mark({class:"wd-source-tag"}).range(m.index+2,m.index+m[0].length-2));
    return Decoration.set(ranges,true);
  };
  const sourceField=StateField.define({create:sourceMarks,update:(value,tr)=>tr.docChanged?sourceMarks(tr.state):value,provide:f=>EditorView.decorations.from(f)});
  const view=new EditorView({parent:host,state:EditorState.create({doc:text,extensions:[
    history(),dropCursor(),EditorView.lineWrapping,
    Prec?Prec.highest(textHandlers):textHandlers,
    EditorView.mouseSelectionStyle?EditorView.mouseSelectionStyle.of((view,event)=>pointer?.style(event)??null):[], 
    keymap.of([...defaultKeymap,...historyKeymap,indentWithTab]),
    EditorView.contentAttributes.of({class:"wikidot-content",spellcheck:"true","aria-label":"Wikidot source"}),
    EditorView.updateListener.of(update=>{if(update.docChanged){onChange(update.state.doc.toString());autoPair(update);}if((update.docChanged||update.selectionSet)&&!pointer?.active){if(update.state.selection.main.empty)popup?.sync();else popup?.close();selectionMenu?.schedule();}}),rich.of([sourceField])
  ]})});
  const {createPointerSelection}=(() => { const module = { exports: {} };
"use strict";
const {parseLive}=(() => { const module = { exports: {} };
"use strict";
// Live editing model. Decorations preserve native text and cursor positions;
// document CSS is only applied by the separate Preview renderer.
//
// Layout rule: Live editing never adds visual lines. Tags are replaced in
// place. A block opener swallows its own line break and a closer swallows the
// break before it, so `[[div]]\ntext\n[[/div]]` is drawn as one framed row
// with a "div" label in the corner, like a rendered Obsidian code block. When
// the cursor reaches either tag, both tags come back as source rows inside the
// same frame.
const {fontSize,unixName,findClose,attr}=(() => { const module = { exports: {} };
"use strict";
// Helpers shared by the Preview renderer and the Live editing decorator.
const SIZE_KEYWORDS = new Set(["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "smaller", "larger"]);
function fontSize(value) {
  const text = String(value || "").trim().toLowerCase();
  if (SIZE_KEYWORDS.has(text)) return text;
  if (/^\d+(?:\.\d+)?(?:px|em|rem|%|pt|ex|vw|vh)$/.test(text)) return text;
  if (/^\d+(?:\.\d+)?$/.test(text)) return text + "%";
  return "";
}
// Wikidot page names: lower case ASCII, every other run of characters becomes
// a single hyphen, and hyphens next to a category colon are dropped.
function unixName(value) {
  return String(value || "").toLowerCase()
    .replace(/[^a-z0-9:_#-]+/g, "-").replace(/-+/g, "-")
    .replace(/-*:-*/g, ":").replace(/^[-:]+|-+$/g, "");
}
// Finds the closer that balances an already consumed opener of `name`.
function findClose(text, from, name) {
  const re = new RegExp(`\\[\\[(\\/?)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s\\]])[^\\]]*\\]\\]`, "gi");
  re.lastIndex = from;
  let depth = 1, m;
  while ((m = re.exec(text))) {
    depth += m[1] ? -1 : 1;
    if (!depth) return { start: m.index, end: m.index + m[0].length };
  }
  return null;
}
function attr(text, name) {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"']+))`, "i").exec(String(text || ""));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}
module.exports = { fontSize, unixName, findClose, attr, SIZE_KEYWORDS };

return module.exports; })();
const ALIGN={"=":"center",">":"right","<":"left","==":"justify"};
const RAW=new Set(["code","html","embed","math"]);
// Blocks drawn as framed boxes; the others only hide their tags.
const BOX=new Set(["div","note","gallery","bibliography","code","html","embed","math","quote","ul","ol"]);
const NAMES="div|collapsible|tabview|tab|table|row|cell|hcell|thead|tbody|ul|ol|li|note|gallery|bibliography|footnote|span|size|a|quote|code|html|embed|math|==|=|>|<";
const OPEN_LINE=new RegExp(`^\\[\\[(${NAMES})(?=[\\s\\]])([^\\]]*)\\]\\]$`,"i");
const CLOSE_LINE=new RegExp(`^\\[\\[\\/(${NAMES})\\]\\]$`,"i");
const INLINE_CONTAINER=/\[\[(span|size|a|footnote|div|note|collapsible|li|cell|hcell)(?=[\s\]])([^\]]*)\]\]/y;
const TOKEN=/\[\[(f?[<>]toc|toc|footnoteblock|#|anchor|f?[<>=]?image|iframe|file|\*?user)(?=[\s\]])([^\]]*)\]\]/y;
// Only layout/typography declarations are admitted into the editor, never page CSS.
function layoutStyle(args){
 const allowed=/^(?:text-align|width|max-width|min-width|height|min-height|margin(?:-(?:left|right|top|bottom))?|padding(?:-(?:left|right|top|bottom))?|color|background-color|border(?:-radius)?|font-size|line-height|opacity)$/;
 return (attr(args,"style")||"").split(";").filter(part=>{const i=part.indexOf(":");return i>0&&allowed.test(part.slice(0,i).trim().toLowerCase())&&!/url\s*\(|expression|[{}<>]/i.test(part);}).join(";");
}
function colorValue(value){const text=String(value||"").trim();return /^[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(text)?"#"+text:text;}
function blockLabel(kind,args){
  const cls=attr(args,"class"),id=attr(args,"id");
  const sel=(cls?cls.split(/\s+/).filter(Boolean).map(c=>"."+c).join(""):"")+(id?"#"+id:"");
  switch(kind){
    case "collapsible":return "collapsible · "+(attr(args,"show")||"+ show block");
    case "code":{const type=attr(args,"type");return "code"+(type?" · "+type:"");}
    case "tab":return args.trim();
    default:return kind+(sel?" "+sel:"");
  }
}
function tokenLabel(name,args){
  const value=args.trim(),first=value.split(/\s+/)[0]||"";
  switch(name.toLowerCase().replace(/^f(?=[<>])/,"")){
    case "footnoteblock":return "脚注";
    case "#":case "anchor":return "⚓ "+first;
    case "iframe":return "iframe · "+(/^https?:\/\/([^/]+)/i.exec(first)?.[1]||first);
    case "file":return "📎 "+(value.split("|")[1]||first).trim();
    case "user":case "*user":return "@"+value;
    default:return "🖼 "+(first.split("/").pop()||"图片");
  }
}
function plain(text){return String(text).replace(/\[\[[^\]]*\]\]|\*\*|\/\/|__|--|\{\{|\}\}|\^\^|,,|@@/g,"").replace(/##[^|#]+\|([^#]*)##/g,"$1").trim();}
function parseLive(source,options={}) {
  const {localRules,styleFor}=(() => { const module = { exports: {} };
"use strict";
const {attr}=(() => { const module = { exports: {} };
"use strict";
// Helpers shared by the Preview renderer and the Live editing decorator.
const SIZE_KEYWORDS = new Set(["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "smaller", "larger"]);
function fontSize(value) {
  const text = String(value || "").trim().toLowerCase();
  if (SIZE_KEYWORDS.has(text)) return text;
  if (/^\d+(?:\.\d+)?(?:px|em|rem|%|pt|ex|vw|vh)$/.test(text)) return text;
  if (/^\d+(?:\.\d+)?$/.test(text)) return text + "%";
  return "";
}
// Wikidot page names: lower case ASCII, every other run of characters becomes
// a single hyphen, and hyphens next to a category colon are dropped.
function unixName(value) {
  return String(value || "").toLowerCase()
    .replace(/[^a-z0-9:_#-]+/g, "-").replace(/-+/g, "-")
    .replace(/-*:-*/g, ":").replace(/^[-:]+|-+$/g, "");
}
// Finds the closer that balances an already consumed opener of `name`.
function findClose(text, from, name) {
  const re = new RegExp(`\\[\\[(\\/?)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s\\]])[^\\]]*\\]\\]`, "gi");
  re.lastIndex = from;
  let depth = 1, m;
  while ((m = re.exec(text))) {
    depth += m[1] ? -1 : 1;
    if (!depth) return { start: m.index, end: m.index + m[0].length };
  }
  return null;
}
function attr(text, name) {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"']+))`, "i").exec(String(text || ""));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}
module.exports = { fontSize, unixName, findClose, attr, SIZE_KEYWORDS };

return module.exports; })();
const LAYOUT=/^(?:display|grid-template-columns|grid-template-rows|grid-auto-flow|grid-column|grid-row|gap|column-gap|row-gap|flex-direction|flex-wrap|flex|order|justify-content|justify-items|align-items|align-self|width|min-width|max-width|height|min-height|max-height|margin(?:-(?:left|right|top|bottom|inline|block))?|padding(?:-(?:left|right|top|bottom|inline|block))?|text-align|float|clear|box-sizing)$/;
function declarations(css,positioning=false,painting=false){
 const result=[];
 for(const part of String(css||"").split(";")){
  const i=part.indexOf(":");if(i<0)continue;
  const name=part.slice(0,i).trim().toLowerCase(),value=part.slice(i+1).trim().replace(/\s*!important\s*$/i,"");
  if(!(LAYOUT.test(name)||(painting&&/^(?:color|background-color|border(?:-radius)?|font-size|line-height|opacity)$/.test(name))||(positioning&&/^(?:position|top|right|bottom|left)$/.test(name)))||!value||/url\s*\(|expression|[{}<>]|var\(/i.test(value))continue;
  if(name==="display"&&!/^(?:grid|inline-grid|flex|inline-flex|block|inline-block|flow-root)$/.test(value))continue;
  if(name==="position"&&!/^(?:relative|absolute|fixed|sticky)$/.test(value))continue;
  // Negative margins pull blocks over each other; without the page's own
  // painting that only produces overlapping text, so they need positioning.
  if(!positioning&&/^margin/.test(name)&&/(^|\s)-\d/.test(value)){const safe=value.replace(/(^|\s)-\d[\w.%]*/g,"$10");result.push(name+":"+safe);continue;}
  result.push(name+":"+value);
 }
 return result.join(";");
}
function localRules(source){
 const rules=[];
 for(const module of source.replace(/\[\[code\b[^\]]*\]\][\s\S]*?\[\[\/code\]\]/gi,"").matchAll(/\[\[module\s+CSS[^\]]*\]\]([\s\S]*?)\[\[\/module\]\]/gi)){
  if(/\bdisable\s*=\s*["']?true/i.test(module[0].slice(0,module[0].indexOf(']]'))))continue;
  const css=module[1].replace(/\/\*[\s\S]*?\*\//g,"");
  for(const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g))for(const selector of match[1].split(",")){
   const s=selector.trim();if(!/^(?:div)?(?:\.[\w-]+)+$/.test(s))continue;
   rules.push({classes:[...s.matchAll(/\.([\w-]+)/g)].map(m=>m[1]),css:match[2]});
  }
 }
 return rules;
}
function styleFor(args,rules,positioning=false,painting=false){
 const classes=new Set((attr(args,"class")||"").split(/\s+/));
 return declarations(rules.filter(r=>r.classes.every(c=>classes.has(c))).map(r=>r.css).concat(attr(args,"style")||"").join(";"),positioning,painting);
}
module.exports={declarations,localRules,styleFor};

return module.exports; })(),layoutRules=localRules(source);
  const lines=[],marks=[],hidden=[],folds=[],chips=[],headings=[],tabviews=[],collapsibles=[],tables=[],divs=[],stack=[];
  // Mask comments before parsing so their brackets and CSS cannot affect nesting.
  const comments=[];
  const masked=source.replace(/\[\[(code|html|embed|math)\b[^\]]*\]\][\s\S]*?(?:\[\[\/\1\]\]|$)|@@[\s\S]*?@@|@<[\s\S]*?>@|\[!--[\s\S]*?(?:--\]|$)/gi,(text,...args)=>{
    const at=args[args.length-2];
    if(!text.startsWith("[!--"))return text;
    comments.push({from:at,to:at+text.length});return text.replace(/[^\n]/g," ");
  });
  const rawLines=masked.split("\n"),starts=[],tagLine=new Set();
  {let at=0;for(const text of rawLines){starts.push(at);at+=text.length+1;}}
  let raw=null,counters=[];
  function mark(from,to,cls,style=""){if(to>from&&(cls||style))marks.push({from,to,cls,style});}
  function hide(from,to,line){if(to>from)hidden.push({from,to,line});}
  const boxDepth=()=>stack.filter(s=>s.box).length;
  const alignStyle=()=>{for(let i=stack.length-1;i>=0;i--)if(stack[i].align)return "text-align:"+stack[i].align;return "";};
  const RULES=[
    {re:/@@([^\n]*?)@@/y,kind:"literal"},
    {re:/@<([^\n]*?)>@/y,kind:"literal"},
    {re:/\[!--[^\n]*?--\]/y,kind:"comment"},
    {re:/\[\[\[(\*?)([^\]\n|]+?)(?:\s*\|\s*([^\]\n]*?))?\s*\]\]\]/y,kind:"pagelink"},
    {re:/\[(\*?)((?:https?:\/\/|\/|#)[^\s\]]*)(?:\s+([^\]\n]+))?\]/y,kind:"url"},
    {re:/\[([\w.+-]+@[\w.-]+\.\w+)(?:\s+([^\]\n]+))?\]/y,kind:"mail"},
    {re:/\[\[\$([^\n]*?)\$\]\]/y,kind:"math"},
    {re:/\*\*([^\n]+?)\*\*/y,kind:"strong"},
    {re:/(?<![:/])\/\/([^\n]+?)\/\//y,kind:"em"},
    {re:/__([^\n]+?)__/y,kind:"underline"},
    {re:/--([^\n]+?)--/y,kind:"strike"},
    {re:/\{\{([^\n]+?)\}\}/y,kind:"code"},
    {re:/\^\^([^\n]+?)\^\^/y,kind:"sup"},
    {re:/,,([^\n]+?),,/y,kind:"sub"},
    {re:/##([^|\n#]+)\|([^\n#]*?)##/y,kind:"color"},
    {re:/(\*?)(https?:\/\/[^\s\]\[|<>"']+)/y,kind:"bare"}
  ];
  const WRAP={strong:"wd-live-strong",em:"wd-live-em",underline:"wd-live-underline",strike:"wd-live-strike",sup:"wd-live-sup",sub:"wd-live-sub"};
  function inline(text,at,line){
    let index=0;
    while(index<text.length){
      if(text.startsWith("[[",index)&&!text.startsWith("[[[",index)){
        TOKEN.lastIndex=index;let m=TOKEN.exec(text);
        if(m){
          const start=at+index,end=start+m[0].length,toc=/toc$/i.test(m[1]);
          chips.push({kind:toc?"toc":/image$/i.test(m[1])?"image":"token",source:m[0],from:start,to:end,revealFrom:start,revealTo:end,line,label:toc?"目录":tokenLabel(m[1],m[2]),float:/^f</i.test(m[1])?"left":/^f>/i.test(m[1])?"right":""});
          index+=m[0].length;continue;
        }
        INLINE_CONTAINER.lastIndex=index;m=INLINE_CONTAINER.exec(text);
        if(m){
          const name=m[1].toLowerCase(),close=findClose(text,index+m[0].length,name);
          if(close){
            const from=at+index+m[0].length,to=at+close.start;
            let cls="",style="";
            if(name==="size"){const size=fontSize(m[2]);if(size){cls="wd-live-size";style="font-size:"+size;}}
            else if(name==="a")cls="wd-live-link";
            else if(name==="footnote")cls="wd-live-footnote";
            hide(at+index,from,line);mark(from,to,cls,style);hide(to,at+close.end,line);
            inline(text.slice(index+m[0].length,close.start),from,line);
            index=close.end;continue;
          }
        }
      }
      let hit=null;
      for(const rule of RULES){rule.re.lastIndex=index;const m=rule.re.exec(text);if(m&&m.index===index){hit={rule,m};break;}}
      if(!hit){index++;continue;}
      const m=hit.m,start=at+m.index,end=start+m[0].length;
      switch(hit.rule.kind){
        case "literal":{const content=m[1],from=start+2;mark(from,from+content.length,"wd-live-literal");hide(start,from,line);hide(from+content.length,end,line);break;}
        case "comment":mark(start,end,"wd-live-comment");break;
        case "pagelink":{
          const pipe=m[0].indexOf("|"),label=m[3]?.trim();
          if(label){const from=start+pipe+1+m[0].slice(pipe+1).indexOf(label);mark(from,from+label.length,"wd-live-link");hide(start,from,line);hide(from+label.length,end,line);}
          else{
            // `[[[page]]]` and `[[[page|]]]` both show the page name itself.
            const target=m[2],from=start+3+m[1].length+m[0].slice(3+m[1].length).indexOf(target);
            mark(from,from+target.length,"wd-live-link");hide(start,from,line);hide(from+target.length,end,line);
          }
          break;
        }
        case "url":{
          const label=m[3]||m[2],from=label===m[3]?start+m[0].lastIndexOf(label):start+1+m[1].length;
          mark(from,from+label.length,"wd-live-link");hide(start,from,line);hide(from+label.length,end,line);break;
        }
        case "mail":{const label=m[2]||m[1],from=start+m[0].lastIndexOf(label);mark(from,from+label.length,"wd-live-link");hide(start,from,line);hide(from+label.length,end,line);break;}
        case "math":{const from=start+3;hide(start,from,line);mark(from,from+m[1].length,"wd-live-math");hide(from+m[1].length,end,line);break;}
        case "bare":{const from=start+m[1].length;hide(start,from,line);mark(from,end,"wd-live-link");break;}
        case "code":{const content=m[1],from=start+2;hide(start,from,line);mark(from,from+content.length,"wd-live-code");hide(from+content.length,end,line);break;}
        case "color":{
          const parts=m[2].split("|"),background=parts.length>1?colorValue(parts[0]):"",content=parts.length>1?parts.slice(1).join("|"):parts[0];
          const from=start+m[0].lastIndexOf(content);
          mark(from,from+content.length,"",`color:${colorValue(m[1])}${background?";background:"+background:""}`);
          hide(start,from,line);hide(from+content.length,end,line);
          inline(content,from,line);break;
        }
        default:{
          const content=m[1],from=start+2;
          hide(start,from,line);mark(from,from+content.length,WRAP[hit.rule.kind]||"");hide(from+content.length,end,line);
          inline(content,from,line);
        }
      }
      index+=m[0].length;
    }
  }
  const lineInfo=(i,extra={})=>({from:starts[i],to:starts[i]+rawLines[i].length,number:i,spaceTop:false,spaceBottom:false,cls:"",style:alignStyle(),depth:boxDepth(),top:[],bottom:[],...extra});
  // Folds keep their whole source; lines inside them are not decorated.
  function fold(line,i,last,kind){
    const from=starts[i],end=starts[last]+rawLines[last].length,first=rawLines[i].trim();
    const label=kind==="Comment"?"[!-- … --]":last>i&&!/\]\]$/.test(first)?first+" …":first;
    folds.push({from,to:end,label,kind,lines:last-i+1,line:i,last,firstTo:starts[i]+rawLines[i].length});
    line.cls="wd-live-fold-line";line.spaceTop=true;line.spaceBottom=last===i;
    for(let j=i+1;j<=last;j++)lines.push(lineInfo(j,{cls:"wd-live-fold-line",spaceBottom:j===last}));
  }
  for(let i=0;i<rawLines.length;i++){
    const text=rawLines[i],from=starts[i],to=from+text.length;
    const line=lineInfo(i);lines.push(line);
    const trimmed=text.trim(),lead=text.length-text.trimStart().length,tagFrom=from+lead,tagTo=from+text.trimEnd().length;let match;
    const closeTag=kind=>{
      // Same recovery as Preview: alignment closers are interchangeable, and
      // a closer of an outer block implicitly ends unclosed inner blocks.
      let open=stack[stack.length-1];
      if(!open)return false;
      if(open.kind!==kind&&!(ALIGN[open.kind]&&ALIGN[kind])){
        let at=stack.length-1;while(at>=0&&stack[at].kind!==kind)at--;
        if(at<0||stack.slice(at+1).some(s=>RAW.has(s.kind)))return false;
        while(stack.length-1>at){
          const inner=stack.pop();
          if(inner.box){line.bottom.push(inner.level);}
          chips[inner.chip].implicit=true;
        }
        open=stack[stack.length-1];
      }
      stack.pop();tagLine.add(i);
      line.style=open.align?"text-align:"+open.align:alignStyle();line.cls="wd-live-tag-line";
      if(!/^(?:span|size|a|tab|row|cell|hcell|thead|tbody|li)$/.test(kind))line.spaceBottom=true;
      if(open.box){line.depth=Math.max(open.level,...line.bottom);line.bottom.push(open.level);}
      const index=chips.push({kind:"close",tag:kind,from,to,revealFrom:tagFrom,revealTo:tagTo,line:i,label:"/"+kind,box:open.box,level:open.level,pair:open.chip})-1;
      chips[open.chip].pair=index;
      if(kind==="tab"&&open.tab){open.tab.to=i<rawLines.length-1?starts[i+1]:to;open.tab.close=index;}
      if(kind==="div")divs.push({from:chips[open.chip].revealFrom,to:tagTo,first:chips[open.chip].line,last:i,open:open.chip,close:index,args:open.args,layout:open.layout,source:source.slice(chips[open.chip].revealFrom,tagTo)});
      if(kind==="table"){
        const start=chips[open.chip].revealFrom,sourceText=source.slice(start,tagTo),cells=[];
        const re=/\[\[(h?cell)(?=[\s\]])[^\]]*\]\]/gi;let m;
        while((m=re.exec(sourceText)))cells.push({from:start+m.index+m[0].length});
        tables.push({from:start,to:tagTo,first:chips[open.chip].line,last:i,source:sourceText,cells,simple:false});
      }
      if(kind==="collapsible")collapsibles.push({from:chips[open.chip].from,to,open:open.chip,close:index,args:open.args});
      if(kind==="tabview"&&open.tabview)tabviews.push(open.tabview);
      return true;
    };
    if(raw){
      if((match=CLOSE_LINE.exec(trimmed))&&match[1].toLowerCase()===raw){raw=null;closeTag(match[1].toLowerCase());}
      else line.cls="wd-live-code-line";
      continue;
    }
    if(/^\[\[include\b/i.test(trimmed)){
      let last=i;
      while(last<rawLines.length-1&&!/\]\]\s*$/.test(rawLines[last])){
        if(/^\s*\[\[(?:include|module|div|code)\b/i.test(rawLines[last+1]))break;
        last++;
      }
      if(/\]\]\s*$/.test(rawLines[last])){fold(line,i,last,"Include · "+(/^\[\[include\s+([^\s|\]]+)/i.exec(trimmed)?.[1]||""));i=last;continue;}
    }
    if(/^\[\[module\s+\S+/i.test(trimmed)||/^\[!--/.test(trimmed)){
      const comment=trimmed.startsWith("[!--"),module=/^\[\[module\s+([^\s\]]+)/i.exec(trimmed)?.[1],endPattern=comment?/--\]/:/\[\[\/module\]\]/i;let last=i;
      while(last<rawLines.length-1&&!endPattern.test(rawLines[last])){
        if(!comment&&/^\s*\[\[module\b/i.test(rawLines[last+1]))break;
        last++;
      }
      const closed=endPattern.test(rawLines[last]);
      if(!closed&&!comment&&module?.toLowerCase()!=="css")last=i;
      if(closed||(!comment&&module?.toLowerCase()!=="css")){fold(line,i,last,comment?"Comment":module);i=last;continue;}
    }
    if(/^\s*\|\|/.test(text)){
      const {simpleCells}=(() => { const module = { exports: {} };
"use strict";
// Source offsets shared by live table clicks and keyboard navigation.
function simpleCells(text,offset=0){
 const pipes=[...text.matchAll(/\|{2,}/g)],cells=[];
 for(let i=0;i<pipes.length-1;i++){
  const from=pipes[i].index+pipes[i][0].length,to=pipes[i+1].index,raw=text.slice(from,to);
  let lead=/^\s*(?:~\s*)?(?:[<>=]\s*)?/.exec(raw)[0].length;
  cells.push({from:offset+from+lead,to:offset+to,span:Math.max(1,Math.floor(pipes[i][0].length/2))});
 }
 return cells;
}
function tableKey(source,pos,key,backward=false,tables=[]){
 const table=tables.find(t=>pos>=t.from&&pos<=t.to&&t.simple);
 if(!table)return null;
 const cells=table.cells;let index=cells.findIndex((c,i)=>pos<=c.to&&(i===0||pos>cells[i-1].to));
 if(index<0&&cells.length&&pos>cells.at(-1).to)index=cells.length-1;
 if(index<0)return null;
 if(key==="Enter"&&pos!==table.to)return null;
 const target=key==="Enter"?cells.length:index+(backward?-1:1);
 if(target<0)return {selection:{anchor:Math.max(0,table.from-1)}};
 if(target<cells.length)return {selection:{anchor:cells[target].from}};
 if(backward)return null;
 const last=source.slice(table.from,table.to).split("\n").at(-1),columns=simpleCells(last).reduce((n,c)=>n+c.span,0);
 const insert="\n||"+"  ||".repeat(columns);
 return {changes:{from:table.to,insert},selection:{anchor:table.to+4}};
}
module.exports={simpleCells,tableKey};

return module.exports; })(),first=i,cells=[];
      let last=i;
      while(true){
        cells.push(...simpleCells(rawLines[last],starts[last]));
        if(/ _\s*$/.test(rawLines[last]))break; // continuation remains native source until closed
        if(last+1>=rawLines.length||!/^\s*\|\|/.test(rawLines[last+1]))break;
        last++;
      }
      line.cls="wd-live-table-line";line.spaceTop=true;line.spaceBottom=last===i;
      for(let j=i+1;j<=last;j++)lines.push(lineInfo(j,{cls:"wd-live-table-line",spaceBottom:j===last}));
      if(!/ _\s*$/.test(rawLines[last]))tables.push({from,to:starts[last]+rawLines[last].length,first,last,source:source.slice(from,starts[last]+rawLines[last].length),cells,simple:true});
      i=last;continue;
    }
    if((match=OPEN_LINE.exec(trimmed))){
      const kind=match[1].toLowerCase(),args=match[2]||"",layout=kind==="div"&&options.layout!==false?styleFor(args,layoutRules,options.positioning):"",box=BOX.has(kind)&&(kind!=="div"||options.frames!==false);
      const entry={kind,args,layout,align:ALIGN[kind]||"",box,level:boxDepth()+(box?1:0),chip:chips.length};
      const parent=stack[stack.length-1];
      if(kind==="tabview")entry.tabview={from,chip:chips.length,tabs:[]};
      if(kind==="tab"&&parent?.tabview){entry.tab={name:args.trim()||"标签 "+(parent.tabview.tabs.length+1),from,open:chips.length};parent.tabview.tabs.push(entry.tab);}
      stack.push(entry);tagLine.add(i);
      if(!/^(?:span|size|a|tab|row|cell|hcell|thead|tbody|li)$/.test(kind))line.spaceTop=true;
      if(RAW.has(kind))raw=kind;
      line.style=alignStyle();line.depth=boxDepth();line.cls="wd-live-tag-line";if(box)line.top.push(entry.level);
      chips.push({kind:"open",tag:kind,from,to,revealFrom:tagFrom,revealTo:tagTo,line:i,label:blockLabel(kind,args),box,args,layout,level:entry.level,raw:RAW.has(kind)});
      counters=[];continue;
    }
    if((match=CLOSE_LINE.exec(trimmed))){
      const kind=match[1].toLowerCase();
      if(!closeTag(kind)){
        // Pairing hint: an unmatched closer is flagged in place instead of
        // silently changing the nesting of every following line.
        line.cls="wd-live-unmatched";line.style="";
        chips.push({kind:"warn",from:tagFrom,to:tagTo,revealFrom:tagFrom,revealTo:tagTo,line:i,label:"⚠ 多余的 /"+kind});
      }
      counters=[];continue;
    }
    if(!trimmed)line.cls="wd-live-empty-line";
    let content=text,contentAt=from;
    if((match=/^(\s*)([*#])\s+/.exec(text))){
      const level=match[1].length,ordered=match[2]==="#";
      counters=counters.slice(0,level+1);counters[level]=(counters[level]||0)+1;
      line.cls="wd-live-list";
      chips.push({kind:"bullet",from,to:from+match[0].length,line:i,lineMode:true,label:ordered?counters[level]+".":"•",indent:level});
      content=text.slice(match[0].length);contentAt+=match[0].length;
    }else{
      counters=[];
      if((match=/^(\+{1,6})(\*?)\s+/.exec(text))){
        // As with Markdown headings in this vault, the marker sits at the right
        // edge and only appears while the line is being edited.
        const level=match[1].length;
        line.cls=`wd-live-heading wd-live-h${level}`;
        mark(from,from+match[0].length,"wd-live-heading-mark");
        hide(from,from+match[0].length,i);content=text.slice(match[0].length);contentAt+=match[0].length;
        headings.push({level,text:plain(content),from:contentAt,hidden:!!match[2]});
      }
      else if((match=/^(>+) ?/.exec(text))){line.cls="wd-live-quote wd-live-quote-"+Math.min(match[1].length,4);hide(from,from+match[0].length,i);content=text.slice(match[0].length);contentAt+=match[0].length;}
      else if((match=/^:\s+(.+?)\s+:(?:\s+|$)/.exec(text))){
        line.cls="wd-live-dl";const term=match[1],termAt=from+text.indexOf(term,1);
        hide(from,termAt,i);mark(termAt,termAt+term.length,"wd-live-dt");
        chips.push({kind:"sep",from:termAt+term.length,to:from+match[0].length,line:i,lineMode:true,label:"："});
        inline(term,termAt,i);content=text.slice(match[0].length);contentAt=from+match[0].length;
      }
      else if(/^\s*\|\|/.test(text))line.cls="wd-live-table-line";
      else if(/^-{3,}\s*$/.test(text)){line.cls="wd-live-rule";line.spaceTop=true;line.spaceBottom=true;hide(from,to,i);continue;}
    }
    if(/^\[\[(?:f?[<>=]?image|f?[<>]?toc)\b/i.test(trimmed)){line.spaceTop=true;line.spaceBottom=true;}
    inline(content,contentAt,i);
  }
  // Incomplete outer divs still own their descendants while drafting.
  for(const open of stack)if(open.kind==="div"){
    const chip=chips[open.chip];
    divs.push({from:chip.revealFrom,to:source.length,first:chip.line,last:rawLines.length-1,open:open.chip,args:open.args,layout:open.layout,source:source.slice(chip.revealFrom)});
    if(open.box)lines.at(-1).bottom.push(open.level);
  }
  // Render one coherent subtree, rather than a layout widget inside source frames.
  for(const block of divs)if(!block.layout&&divs.some(child=>child.from>block.from&&child.to<=block.to&&child.layout))block.layout="display:block";
  // Line joins: every opener absorbs the break after it and every closer the
  // break before it, unless that break is already taken. An empty block is a
  // single framed row; sibling blocks stay on separate rows.
  const joined=new Set();
  for(const chip of chips)if(chip.kind==="open"&&chip.line<rawLines.length-1&&rawLines[chip.line+1].trim()!==""&&!joined.has(chip.line)){chip.to=starts[chip.line+1];chip.join=chip.line;joined.add(chip.line);}
  for(const chip of chips)if(chip.kind==="close"&&chip.line>0&&rawLines[chip.line-1].trim()!==""&&!joined.has(chip.line-1)){chip.from=starts[chip.line]-1;chip.join=chip.line-1;joined.add(chip.line-1);}
  // An inactive tab hides its lines plus one free line break next to them,
  // so switching tabs never leaves an empty row behind.
  for(const view of tabviews)for(const tab of view.tabs){
    if(tab.close===undefined)continue;
    const s=chips[tab.open].line,e=chips[tab.close].line,end=starts[e]+rawLines[e].length;
    // Only one tab of a view is visible, so hidden tabs may share a break;
    // the editor merges overlapping hide ranges.
    if(s>0&&!joined.has(s-1)){tab.hideFrom=starts[s]-1;tab.hideTo=end;}
    else if(e<rawLines.length-1&&!joined.has(e)){tab.hideFrom=starts[s];tab.hideTo=starts[e+1];}
    else{tab.hideFrom=starts[s];tab.hideTo=end;}
    tab.first=s;tab.last=e;tab.contentFrom=s<rawLines.length-1?starts[s+1]:end;
  }
  folds.forEach((f,index)=>{for(let j=f.line;j<=f.last;j++)lines[j].fold=index;});
  return {comments,lines,marks,hidden,folds,chips,headings,tabviews,collapsibles,tables,divs,layoutRules,length:source.length};
}
function activeLines(model,ranges){const active=new Set();for(const line of model.lines)if(ranges.some(r=>r.from<=line.to&&r.to>=line.from))active.add(line.number);return active;}
function touches(ranges,from,to){return ranges.some(r=>r.from<=to&&r.to>=from);}
// A paired block exposes both boundaries while editing anywhere within it.
// Line alignment/typography remains independent from source visibility.
function revealed(model,chip,ranges,active){
  if(chip.lineMode)return active.has(chip.line);
  const pair=chip.pair!==undefined?model.chips[chip.pair]:null;
  if(pair){
    const open=chip.kind==="open"?chip:pair,close=chip.kind==="open"?pair:chip;
    if(open.tag==="div")return touches(ranges,open.revealFrom,open.revealTo)||touches(ranges,close.revealFrom,close.revealTo);
    return touches(ranges,open.revealFrom,close.revealTo);
  }
  return touches(ranges,chip.revealFrom??chip.from,chip.revealTo??chip.to);
}
function matchingTagPosition(model,pos){
  const chip=model.chips.find(c=>c.pair!==undefined&&pos>=c.revealFrom&&pos<=c.revealTo);
  return chip?model.chips[chip.pair].revealFrom:null;
}
// Visual rows: source lines merged across hidden breaks. `broken` holds line
// numbers whose trailing break is hidden, `gone` lines hidden entirely and
// `opened` the start positions of expanded folds, drawn one level deeper.
function rows(model,{broken=new Set(),gone=new Set(),opened=new Set()}={}){
  const result=[];let current=null;
  for(const line of model.lines){
    if(!current)current={at:line.from,lines:[],depth:0,top:[],bottom:[],spaceTop:false,spaceBottom:false,cls:"",style:""};
    current.lines.push(line);
    if(!gone.has(line.number)){
      let depth=line.depth,cls=line.cls;const top=[...line.top],bottom=[...line.bottom];
      const fold=line.fold!==undefined?model.folds[line.fold]:null;
      if(fold&&opened.has(fold.from)){depth++;cls="wd-live-code-line";if(line.number===fold.line)top.push(depth);if(line.number===fold.last)bottom.push(depth);}
      current.spaceTop ||= line.spaceTop;current.spaceBottom ||= line.spaceBottom;
      current.depth=Math.max(current.depth,depth);current.top.push(...top);current.bottom.push(...bottom);
      if(!current.cls||current.cls==="wd-live-tag-line")current.cls=cls||current.cls;
      if(!current.style)current.style=line.style;
    }
    if(!broken.has(line.number)){result.push(current);current=null;}
  }
  if(current)result.push(current);
  return result;
}
const STEP=12;
// The outermost frame uses real borders (rounded through classes); inner
// levels are painted as background layers so nesting needs no extra DOM.
function frameStyle(row){
  if(!row.depth)return "";
  const paint="linear-gradient(var(--wd-box-border),var(--wd-box-border))",img=[],pos=[],size=[];
  const layer=(p,z)=>{img.push(paint);pos.push(p);size.push(z);};
  for(let k=2;k<=row.depth;k++){
    const x=(k-1)*STEP,top=row.top.includes(k),bottom=row.bottom.includes(k);
    const y=top?3:0,h=`calc(100% - ${(top?3:0)+(bottom?3:0)}px)`,w=`calc(100% - ${2*x}px)`;
    if(top)layer(`left ${x}px top 3px`,`${w} 1px`);
    if(bottom)layer(`left ${x}px bottom 3px`,`${w} 1px`);
    layer(`left ${x}px top ${y}px`,`1px ${h}`);layer(`right ${x}px top ${y}px`,`1px ${h}`);
  }
  const pad=row.depth*STEP+2,parts=[`padding-left:${pad}px`,`padding-right:${pad}px`];
  if(row.top.length)parts.push(`padding-top:${22}px`);
  if(img.length)parts.push(`background-image:${img.join(",")}`,`background-position:${pos.join(",")}`,`background-size:${size.join(",")}`,"background-repeat:no-repeat");
  return parts.join(";");
}
function frameClass(row){
  if(!row.depth)return "";
  return "wd-live-box"+(row.top.includes(1)?" wd-live-box-top":"")+(row.bottom.includes(1)?" wd-live-box-bottom":"")+(row.top.some(k=>k>1)?" wd-live-box-inner-top":"")+(row.bottom.some(k=>k>1)?" wd-live-box-inner-bottom":"");
}
module.exports={matchingTagPosition,layoutStyle,parseLive,activeLines,revealed,rows,frameStyle,frameClass,touches,STEP,unixName};

return module.exports; })();
// A rendered paragraph carries its original source span. Project its visible
// characters back through wiki delimiters, rather than guessing a paragraph start.
function projection(source){
 const model=parseLive(source),skip=new Uint8Array(source.length);
 const hide=(from,to)=>skip.fill(1,Math.max(0,from),Math.min(source.length,to));
 for(const h of model.hidden)hide(h.from,h.to);
 for(const c of model.chips)hide(c.revealFrom??c.from,c.revealTo??c.to);
 for(const f of model.folds)hide(f.from,f.to);
 for(const c of model.comments||[])hide(c.from,c.to);
 const chars=[],positions=[];
 for(let i=0;i<source.length;i++)if(!skip[i]){chars.push(source[i]);positions.push(i);}
 return {text:chars.join(""),positions};
}
function normalized(text,positions){
 const chars=[],map=[];
 for(let i=0;i<text.length;i++){
  const c=/\s/.test(text[i])?" ":text[i];
  if(c===" "&&(!chars.length||chars.at(-1)===" "))continue;
  chars.push(c);map.push(positions?positions[i]:i);
 }
 if(chars.at(-1)===" "){chars.pop();map.pop();}
 return {text:chars.join(""),positions:map};
}
function sourceOffset(source,rendered,offset){
 const visible=projection(source),a=normalized(visible.text,visible.positions),b=normalized(rendered);
 // The renderer may add a footnote label or other generated text. Only map
 // an actual matching text run; never use generated text as a source offset.
 const target=Math.max(0,Math.min(rendered.length,offset));
 let ai=0,last=null;
 for(let bi=0;bi<b.text.length;bi++){
  if(b.positions[bi]>=target)return a.positions[ai]??(last===null?0:Math.min(source.length,last+1));
  const found=a.text.indexOf(b.text[bi],ai);
  if(found<0)continue;
  last=a.positions[found];ai=found+1;
 }
 return last===null?0:Math.min(source.length,last+1);
}
function element(node){return node?.nodeType===1?node:node?.parentElement;}
function layoutPoint(view,node,offset){
 const parent=element(node),layout=parent?.closest?.("[data-wd-layout-from]");if(!layout)return null;
 const block=parent.closest("[data-wd-start]")||layout;
 const base=Number(layout.getAttribute("data-wd-layout-from")),from=base+Number(block.getAttribute("data-wd-start")||0),end=Number(block.getAttribute("data-wd-end"));
 const to=Number.isFinite(end)?base+end:view.state.doc.length;
 const range=block.ownerDocument.createRange();range.selectNodeContents(block);range.setEnd(node,offset);
 const prefix=range.toString(),source=view.state.doc.toString().slice(from,to);
 return Math.min(view.state.doc.length,from+sourceOffset(source,block.textContent,prefix.length));
}
function domPoint(view,event){
 const doc=view.contentDOM.ownerDocument;
 const caret=doc.caretPositionFromPoint?.(event.clientX,event.clientY),range=caret?null:doc.caretRangeFromPoint?.(event.clientX,event.clientY);
 const node=caret?.offsetNode||range?.startContainer,offset=caret?.offset??range?.startOffset;
 if(node&&view.contentDOM.contains(node)){
  const layout=layoutPoint(view,node,offset);if(layout!==null)return layout;
  const parent=element(node);
  if(!parent?.closest?.('[contenteditable="false"]'))return view.posAtDOM(node,offset);
 }
 // At a blank row or beyond a line's text, the DOM point can sit on its
 // element boundary. Prefer its real source row to a height-map estimate.
 const line=element(event.target)?.closest?.(".cm-line[data-wd-line]");
 if(line&&view.contentDOM.contains(line)){
  const pos=Number(line.getAttribute("data-wd-line"));
  if(!view.state.doc.lineAt(pos).text.trim())return pos;
 }
 return view.posAtCoords({x:event.clientX,y:event.clientY},false);
}
function clickRange(state,pos,type){
 if(type>=3){const line=state.doc.lineAt(pos);return {from:line.from,to:line.to};}
 if(type===2){
  const line=state.doc.lineAt(pos),at=Math.min(Math.max(0,pos-line.from),Math.max(0,line.text.length-1));
  const segmenter=new Intl.Segmenter(undefined,{granularity:"word"});
  for(const s of segmenter.segment(line.text))if(at>=s.index&&at<s.index+s.segment.length)return {from:line.from+s.index,to:line.from+s.index+s.segment.length};
 }
 return {from:pos,to:pos};
}
function createPointerSelection(view,Selection,{enabled,start,finish}){
 const doc=view.contentDOM.ownerDocument,win=doc.defaultView;let active=false,destroyed=false,queued=false,gesture=null,flags=null,nativeDrag=false;
 let frame=null,lastEvent=null;
 const scroller=view.dom?.closest?.(".wikidot-native-editor");
 function stopScroll(){if(frame!==null)win.cancelAnimationFrame(frame);frame=null;lastEvent=null;}
 function tick(){
  frame=null;if(!active||!lastEvent||nativeDrag||!scroller)return;
  const r=scroller.getBoundingClientRect(),y=lastEvent.clientY,edge=Math.min(64,r.height/4);
  const delta=y>r.bottom-edge?Math.min(24,(y-r.bottom+edge)/3):y<r.top+edge?-Math.min(24,(r.top+edge-y)/3):0;
  if(delta){
   const before=scroller.scrollTop;scroller.scrollTop+=delta;
   if(scroller.scrollTop!==before&&gesture){
    const point={clientX:lastEvent.clientX,clientY:Math.max(r.top+2,Math.min(r.bottom-2,y)),target:lastEvent.target};
    view.dispatch({selection:gesture.get(point,flags?.extend||false,flags?.multiple||false),userEvent:"select.pointer"});
   }
  }
  if(active)frame=win.requestAnimationFrame(tick);
 }
 function move(event){if(!active||nativeDrag||!scroller)return;lastEvent=event;if(frame===null)frame=win.requestAnimationFrame(tick);}
 function end(event){
  if(!active||queued)return;stopScroll();queued=true;
  // Commit the release point too: a final move can be coalesced by the OS.
  // Run after the full mouseup event, then expose source without losing the range.
  win.requestAnimationFrame(()=>{
   queued=false;if(destroyed||!active)return;
   if(event.type==="mouseup"&&!nativeDrag&&gesture)view.dispatch({selection:gesture.get(event,flags?.extend||false,flags?.multiple||false),userEvent:"select.pointer"});
   active=false;gesture=null;if(event.type==="mouseup")view.focus();finish();
  });
 }
 function drag(event){if(view.contentDOM.contains(event.target))nativeDrag=true;}
 doc.addEventListener("dragstart",drag);doc.addEventListener("mousemove",move);
 doc.addEventListener("mouseup",end);win?.addEventListener("blur",end);
 return {get active(){return active;},style(event){
  if(!enabled()||event.button!==0)return null;
  const target=element(event.target);
  if(target?.closest?.('[role="button"],[role="tab"],.wikidot-live-table,.wikidot-live-image'))return null;
  const pos=domPoint(view,event);if(pos===null)return null;
  let origin=pos,initial=view.state.selection;const type=event.detail||1;
  active=true;nativeDrag=false;flags=null;start();
  gesture={update(update){if(update.docChanged){origin=update.changes.mapPos(origin);initial=initial.map(update.changes);}},get(current,extend,multiple){
   flags={extend,multiple};
   const head=domPoint(view,current)??origin,first=clickRange(view.state,origin,type),last=clickRange(view.state,head,type);
   const range=Selection.range(head<origin?first.to:first.from,head<origin?last.from:last.to);
   if(extend)return initial.replaceRange(initial.main.extend(range.from,range.to));
   return multiple?initial.addRange(range):Selection.create([range]);
  }};return gesture;
 },destroy(){stopScroll();destroyed=true;active=false;doc.removeEventListener("dragstart",drag);doc.removeEventListener("mousemove",move);doc.removeEventListener("mouseup",end);win?.removeEventListener("blur",end);}};
}
module.exports={projection,sourceOffset,layoutPoint,domPoint,clickRange,createPointerSelection};

return module.exports; })();
  if(typeof createPointerSelection==="function")pointer=createPointerSelection(view,EditorSelection,{enabled:()=>mode==="rich",start:()=>{popup?.close();selectionMenu?.close();},finish:()=>{view.dispatch({effects:pointerEnd.of(null)});selectionMenu?.schedule();}});
  if(typeof createCompletionPopup==="function")popup=createCompletionPopup(view,host.ownerDocument);
  if(typeof createSelectionMenu==="function")selectionMenu=createSelectionMenu(view,host.ownerDocument);
  return {view,setMode(next){if(next===mode)return;mode=next;view.dispatch({effects:rich.reconfigure(mode==="rich"?[field]:[sourceField])});selectionMenu?.schedule();},refresh(){if(mode==="rich")view.dispatch({effects:refreshContext.of(null)});},getValue(){return view.state.doc.toString();},setValue(value){if(value!==view.state.doc.toString())view.dispatch({changes:{from:0,to:view.state.doc.length,insert:value}});},destroy(){pointer?.destroy();popup?.close();selectionMenu?.destroy();view.destroy();}};
}
module.exports={createEditor};

return module.exports; })();
const { IncludeManager } = (() => { const module = { exports: {} };
"use strict";
// Include cache manager: inspect, refresh, remove and add cached include
// sources and stylesheets. Entries live in cache/resources.json as
// "source:<page url>" and "css:<stylesheet url>".
const {Modal,Setting,Notice}=require("obsidian");
function describe(values,used=new Set()){
  return Object.entries(values||{}).map(([key,value])=>{
    const i=key.indexOf(":"),kind=key.slice(0,i),url=key.slice(i+1);
    let name=url;try{const u=new URL(url);name=kind==="source"?(u.hostname.replace(/\.wikidot\.com$/,"")+" · "+decodeURIComponent(u.pathname.slice(1))):u.hostname+u.pathname;}catch{}
    const text=typeof value==="string"?value:JSON.stringify(value);
    const nested=kind==="source"?[...text.matchAll(/^\[\[include\s+(\S+?)(?:\]\]|\s|$)/gim)].map(m=>m[1]):[];
    return {key,kind,url,name,size:text.length,used:used.has(url),nested};
  }).sort((a,b)=>(b.used-a.used)||a.kind.localeCompare(b.kind)||a.name.localeCompare(b.name));
}
const size=n=>n>1048576?(n/1048576).toFixed(1)+" MB":n>1024?(n/1024).toFixed(1)+" KB":n+" B";
class IncludeManager extends Modal{
  constructor(plugin,view){super(plugin.app);this.plugin=plugin;this.view=view;this.filter="";this.kind="source";}
  async onOpen(){this.setTitle("Include 缓存管理");this.modalEl.addClass("wikidot-include-manager");await this.draw();}
  async draw(){
    const root=this.contentEl;root.empty();
    const values=await this.plugin.cacheValues();
    const used=new Set(this.view?.lastDependencies||[]);
    const items=describe(values,used);
    const sources=items.filter(i=>i.kind==="source"),styles=items.filter(i=>i.kind==="css");
    root.createEl("p",{cls:"wikidot-manager-summary",text:`已缓存 ${sources.length} 个 include 源码、${styles.length} 个样式表，共 ${size(items.reduce((s,i)=>s+i.size,0))}。`+(this.view?.file?` 当前文稿「${this.view.file.basename}」使用 ${used.size} 个 include。`:"")});
    const add=new Setting(root).setName("添加或预缓存").setDesc("页面名、:站点:页面、HTTPS 地址或完整 [[include …]]，每行一个。");
    let input="";add.addTextArea(t=>{t.inputEl.rows=2;t.inputEl.style.width="100%";t.setPlaceholder(":scp-wiki-cn:component:license-box");t.onChange(v=>input=v);});
    const status=root.createDiv({cls:"wikidot-manager-status",attr:{role:"status","aria-live":"polite"}});
    add.addButton(b=>b.setButtonText("缓存").setCta().onClick(async()=>{b.setDisabled(true);try{await this.precache(input,status);}finally{b.setDisabled(false);}}));
    const tools=new Setting(root).setName("当前文稿");
    tools.addButton(b=>b.setButtonText("缓存文稿中的全部 include").setDisabled(!this.view).onClick(async()=>{
      b.setDisabled(true);
      const lines=[...this.view.getViewData().matchAll(/^\[\[include\s+(\S+?)(?=\]\]|\s|$)/gim)].map(m=>m[1]).join("\n");
      try{await this.precache(lines,status);}finally{b.setDisabled(false);}
    }));
    tools.addButton(b=>b.setButtonText("刷新当前文稿使用的").setDisabled(!used.size).onClick(async()=>{
      b.setDisabled(true);for(const url of used)await this.plugin.remote.forget("source:"+url);
      try{await this.precache([...used].join("\n"),status);}finally{b.setDisabled(false);}
    }));
    const bar=root.createDiv("wikidot-manager-bar");
    const search=bar.createEl("input",{type:"search",attr:{placeholder:"筛选名称","aria-label":"筛选缓存"}});search.value=this.filter;
    const kind=bar.createEl("select",{attr:{"aria-label":"缓存类型"}});
    for(const [v,t] of [["source",`include 源码（${sources.length}）`],["css",`样式表（${styles.length}）`],["all","全部"]])kind.createEl("option",{value:v,text:t});
    kind.value=this.kind;
    const list=root.createDiv("wikidot-manager-list");
    const paint=()=>{
      list.empty();
      const q=this.filter.toLowerCase();
      const shown=items.filter(i=>(this.kind==="all"||i.kind===this.kind)&&(!q||i.name.toLowerCase().includes(q)||i.url.toLowerCase().includes(q)));
      if(!shown.length)list.createDiv({cls:"wikidot-manager-empty",text:"没有匹配的缓存项。"});
      for(const item of shown.slice(0,300)){
        const row=list.createDiv("wikidot-manager-row"+(item.used?" is-used":""));
        const info=row.createDiv("wikidot-manager-info");
        info.createDiv({cls:"wikidot-manager-name",text:(item.used?"● ":"")+item.name});
        info.createDiv({cls:"wikidot-manager-meta",text:`${item.kind==="source"?"源码":"CSS"} · ${size(item.size)}${item.nested.length?" · 嵌套 "+item.nested.join("、"):""}`});
        const actions=row.createDiv("wikidot-manager-actions");
        const btn=(text,label,fn)=>{const b=actions.createEl("button",{text,attr:{"aria-label":label,title:label}});b.addEventListener("click",async()=>{b.disabled=true;try{await fn();}catch(e){new Notice(e.message);}finally{b.disabled=false;}});};
        btn("查看","查看缓存内容",async()=>new SourceModal(this.app,item.url,(await this.plugin.cacheValues())[item.key]).open());
        btn("刷新","重新读取",async()=>{await this.plugin.remote.forget(item.key);if(item.kind==="source")await this.plugin.remote.source(item.url);else await this.plugin.remote.styles(`@import url("${item.url}");`,item.url);new Notice("已刷新："+item.name);await this.draw();});
        btn("删除","从缓存中删除",async()=>{await this.plugin.remote.forget(item.key);await this.draw();});
      }
      if(shown.length>300)list.createDiv({cls:"wikidot-manager-empty",text:`仅显示前 300 项，共 ${shown.length} 项，请使用筛选。`});
    };
    search.addEventListener("input",()=>{this.filter=search.value;paint();});
    kind.addEventListener("change",()=>{this.kind=kind.value;paint();});
    paint();
    new Setting(root).addButton(b=>b.setButtonText("清空全部缓存").setWarning().onClick(async()=>{
      if(!b.buttonEl.dataset.confirm){b.buttonEl.dataset.confirm="1";b.setButtonText("再次点击确认清空");return;}
      await this.plugin.remote.clear(true);this.plugin.refreshViews();await this.draw();
    })).addButton(b=>b.setButtonText("关闭").onClick(()=>this.close()));
  }
  async precache(text,status){
    const {preloadIncludes}=(() => { const module = { exports: {} };
"use strict";
const {includeURL,expandIncludes}=(() => { const module = { exports: {} };
"use strict";
const {prepareSource}=(() => { const module = { exports: {} };
"use strict";
const blank=text=>text.replace(/[^\n]/g,"");
function stripComments(text){return text.replace(/\[\[code(?:\s+[^\]]*)?\]\][\s\S]*?\[\[\/code\]\]|\[!--[\s\S]*?--\]/gi,raw=>/^\[!--/.test(raw)?blank(raw):raw);}
// [[iftags]] blocks nest. An [[iftags]] without terms never matches at the
// top level (Wikidot's empty "any" list), but is transparent when nested.
// Themes rely on this: [[ift{$param}gs …]] only becomes a real tag once the
// include parameter is substituted, and wraps an empty [[iftags]] switch.
// Tag lines prefixed by blockquote markers are removed with their prefix.
function selectTags(text,tags=[]) {
  const available=new Set(tags),stack=[];let output="",end=0,active=true;
  const tokens=/\[\[code(?:\s+[^\]]*)?\]\][\s\S]*?\[\[\/code\]\]|^[ \t]*>[> \t]*\[\[(\/?)iftags(?:\s+([^\]]*))?\]\][ \t]*$|\[\[(\/?)iftags(?:\s+([^\]]*))?\]\]|^[ \t>]*\[\[\/?ift\{\$[^}\]]*\}gs\b[^\]]*\]\][ \t]*$/gim;let m;
  while((m=tokens.exec(text))){
    output+=active?text.slice(end,m.index):blank(text.slice(end,m.index));end=tokens.lastIndex;
    const close=m[1]??m[3],args=m[2]??m[4];
    if(close===undefined){output+=active&&!/^[ \t>]*\[\[\/?ift\{/.test(m[0])?m[0]:blank(m[0]);continue;}
    if(close){active=stack.length?stack.pop():active;}
    else{
      const terms=(args||"").trim().split(/[, ]+/).filter(Boolean);
      const required=terms.filter(t=>t[0]==="+"),excluded=terms.filter(t=>t[0]==="-"),any=terms.filter(t=>!/[+-]/.test(t[0]));
      const matches=terms.length?required.every(t=>available.has(t.slice(1)))&&excluded.every(t=>!available.has(t.slice(1)))&&(!any.length||any.some(t=>available.has(t))):stack.length>0;
      stack.push(active);active=active&&matches;
    }
    output+=blank(m[0]);
  }
  return output+(active?text.slice(end):blank(text.slice(end)));
}
// Wikidot expressions: [[#if c | then | else]], [[#ifexpr e | then | else]]
// and [[#expr e]]. Conditions are false when empty, "false", "null" or "0".
// Expressions use a small arithmetic/logic grammar; nothing is ever eval'd.
function evaluate(expr){
  const tokens=String(expr).match(/\d+(?:\.\d+)?|<=|>=|!=|<>|==|and|or|not|[-+*/%()<>=!]/gi)||[];
  if(tokens.join("").replace(/\s/g,"")!==String(expr).replace(/\s/g,""))throw Error("bad");
  let i=0;const peek=()=>tokens[i]?.toLowerCase(),take=()=>tokens[i++];
  const or=()=>{let v=and();while(peek()==="or"){take();const r=and();v=(v||r)?1:0;}return v;};
  const and=()=>{let v=cmp();while(peek()==="and"){take();const r=cmp();v=(v&&r)?1:0;}return v;};
  const cmp=()=>{let v=add();while(["<",">","<=",">=","=","==","!=","<>"].includes(peek())){const o=take(),r=add();v=({"<":v<r,">":v>r,"<=":v<=r,">=":v>=r,"=":v===r,"==":v===r,"!=":v!==r,"<>":v!==r})[o]?1:0;}return v;};
  const add=()=>{let v=mul();while(peek()==="+"||peek()==="-"){const o=take(),r=mul();v=o==="+"?v+r:v-r;}return v;};
  const mul=()=>{let v=unary();while(["*","/","%"].includes(peek())){const o=take(),r=unary();v=o==="*"?v*r:o==="/"?v/r:v%r;}return v;};
  const unary=()=>{const t=peek();if(t==="-"){take();return -unary();}if(t==="+"){take();return unary();}if(t==="not"||t==="!"){take();return unary()?0:1;}if(t==="("){take();const v=or();if(take()!==")")throw Error("bad");return v;}const n=take();if(n===undefined||!/^\d/.test(n))throw Error("bad");return Number(n);};
  const value=or();if(i!==tokens.length||!Number.isFinite(value))throw Error("bad");return value;
}
function expressions(text){
  const falsy=v=>/^(?:|false|null|0)$/i.test(v.trim());
  const re=/\[\[#(if|ifexpr|expr)\s([^\[\]]*)\]\]/gi;
  for(let round=0;round<20&&re.test(text);round++){
    re.lastIndex=0;
    text=text.replace(re,(raw,kind,body)=>{
      const parts=body.split("|"),cond=parts[0];
      if(kind.toLowerCase()==="if")return (falsy(cond)?parts[2]:parts[1])?.trim()??"";
      let value;try{value=evaluate(cond);}catch{return kind.toLowerCase()==="expr"?"Expression error":(parts[2]?.trim()??"");}
      if(kind.toLowerCase()==="expr")return String(Math.round(value*1e10)/1e10);
      return (value?parts[1]:parts[2])?.trim()??"";
    });
  }
  return text;
}
function prepareSource(text,tags=[]) {
  // Comments in code examples stay literal, while inactive documentation must
  // disappear before its includes or CSS modules are ever processed.
  return expressions(selectTags(stripComments(text),tags));
}
module.exports={stripComments,selectTags,prepareSource,expressions,evaluate};

return module.exports; })();
const {unixName}=(() => { const module = { exports: {} };
"use strict";
// Helpers shared by the Preview renderer and the Live editing decorator.
const SIZE_KEYWORDS = new Set(["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "smaller", "larger"]);
function fontSize(value) {
  const text = String(value || "").trim().toLowerCase();
  if (SIZE_KEYWORDS.has(text)) return text;
  if (/^\d+(?:\.\d+)?(?:px|em|rem|%|pt|ex|vw|vh)$/.test(text)) return text;
  if (/^\d+(?:\.\d+)?$/.test(text)) return text + "%";
  return "";
}
// Wikidot page names: lower case ASCII, every other run of characters becomes
// a single hyphen, and hyphens next to a category colon are dropped.
function unixName(value) {
  return String(value || "").toLowerCase()
    .replace(/[^a-z0-9:_#-]+/g, "-").replace(/-+/g, "-")
    .replace(/-*:-*/g, ":").replace(/^[-:]+|-+$/g, "");
}
// Finds the closer that balances an already consumed opener of `name`.
function findClose(text, from, name) {
  const re = new RegExp(`\\[\\[(\\/?)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s\\]])[^\\]]*\\]\\]`, "gi");
  re.lastIndex = from;
  let depth = 1, m;
  while ((m = re.exec(text))) {
    depth += m[1] ? -1 : 1;
    if (!depth) return { start: m.index, end: m.index + m[0].length };
  }
  return null;
}
function attr(text, name) {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"']+))`, "i").exec(String(text || ""));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}
module.exports = { fontSize, unixName, findClose, attr, SIZE_KEYWORDS };

return module.exports; })();
function includeURL(target, base) {
  let origin = new URL(base).origin, page = target.trim();
  if (page.startsWith(":")) {
    const match = /^:([a-z0-9.-]+):(.+)$/i.exec(page);
    if (!match) throw Error("跨站 include 格式应为 :站点:页面");
    const host = match[1].includes(".") ? match[1] : match[1] + ".wikidot.com";
    if (!/^[a-z0-9-]+\.wikidot\.com$/i.test(host)) throw Error("跨站 include 当前只支持 Wikidot 子域名");
    origin = "https://" + host; page = match[2];
  }
  // Wikidot normalises the name with toUnixName before looking it up, so
  // "Component:Image Block" and "component:image-block" are the same page.
  if (!/[\s/?#\\]/.test(page.trim())) page = unixName(page) || page;
  if (!page || /[\s/?#\\]/.test(page) || page === "." || page === "..") throw Error("无效的 include 页面名称");
  return origin + "/" + encodeURIComponent(page).replace(/%3A/gi, ":");
}
async function expandIncludes(source, getSource, options = {}) {
  const warnings = [], dependencies = new Set();
  const base = options.base || "https://scp-wiki-cn.wikidot.com/";
  let count = 0, size = 0;
  // Request every include of one level together; expansion itself stays
  // sequential, so output order and limits are unchanged.
  const requests = new Map();
  const load = url => { if (!requests.has(url)) requests.set(url, Promise.resolve().then(() => getSource(url))); return requests.get(url); };
  function prefetch(text, context) {
    if (options.prefetch === false) return;
    for (const m of text.matchAll(/^\[\[include\s+(\S+)/gim)) {
      try { load(includeURL(m[1].replace(/\]\]$/, ""), context)).catch(() => {}); } catch {}
    }
  }
  async function expand(text, context, stack) {
    text=prepareSource(text,options.tags||[]);
    prefetch(text, context);
    // Wikidot expands column-zero includes even inside code blocks. Indented
    // examples and inline includes remain literal, following the public syntax.
    // Same shape as Wikidot's rule: the tag starts a line and runs, possibly
    // over several lines, to the first "]]" that ends a line. A single "]"
    // inside a value (e.g. "hover-enlarge=--]") does not end the tag.
    const re = /^\[\[include\s+([\s\S]+?)\]\][\t ]*$/gm;
    let output = "", end = 0, match;
    while ((match = re.exec(text))) {
      output += text.slice(end, match.index); end = re.lastIndex;
      const parts = match[1].split("|"); const first=parts.shift().trim();
      const target=/^\S+/.exec(first)?.[0]||"";
      const params = Object.create(null);
      const initial=first.slice(target.length).trim();
      for(const m of initial.matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(.*?))(?=\s+[^\s=]+\s*=|$)/g))params[m[1]]=m[2]??m[3]??m[4].trim();
      // Wikidot ignores empty values and names outside [a-z0-9_-], leaving
      // their {$placeholders} literal.
      for (const part of parts) { const i = part.indexOf("="); if (i > 0) params[part.slice(0,i).trim()] = part.slice(i+1).trim(); }
      for (const key of Object.keys(params)) if (params[key] === "" || !/^[a-z0-9_-]+$/i.test(key)) delete params[key];
      try {
        const url = includeURL(target, context);
        if (stack.includes(url)) throw Error("循环引用：" + [...stack, url].join(" → "));
        if (stack.length >= (options.maxDepth || 10)) throw Error("嵌套 include 超过深度限制");
        if (++count > (options.maxCount || 40)) throw Error("include 数量超过限制");
        const raw = await load(url);
        if (typeof raw !== "string") throw Error("没有取得可用的页面源码");
        size += raw.length; if (size > (options.maxSize || 2000000)) throw Error("include 总内容超过限制");
        dependencies.add(url);
        const substituted = raw.replace(/\{\$([^}\r\n]+)\}/g, (all, name) => Object.hasOwn(params, name) ? params[name] : all);
        // Wikidot surrounds every included page with blank lines, so it never
        // merges into the paragraph before or after it.
        const inCode = (text.slice(0, match.index).match(/\[\[code\b/gi) || []).length > (text.slice(0, match.index).match(/\[\[\/code\]\]/gi) || []).length;
        const pad = inCode || options.padIncludes === false ? "" : "\n\n";
        output += pad + await expand(options.transformSource ? options.transformSource(substituted,url) : substituted, url, [...stack,url]) + pad;
      } catch (error) {
        warnings.push(`include ${target}：${error.message}`);
        // Keep errors visible and literal, not as new executable wikitext.
        output += "\n\n[[div class=\"error-block\"]]\n@@" + ("Include 不可用：" + target + " · " + error.message).replace(/@@/g, "@ @") + "@@\n[[/div]]\n\n";
      }
    }
    return output + text.slice(end);
  }
  return { source: await expand(source.replace(/\r\n?/g,"\n"), base, []), warnings, dependencies: [...dependencies] };
}
module.exports = { includeURL, expandIncludes };

return module.exports; })();
const {publicPageURL}=(() => { const module = { exports: {} };
"use strict";
const {imports}=(() => { const module = { exports: {} };
"use strict";
function quotedEnd(text,start) {
  const quote=text[start];let i=start+1;
  while(i<text.length){if(text[i]==="\\")i+=2;else if(text[i++]===quote)break;}
  return i;
}
function commentEnd(text,start){const end=text.indexOf("*/",start+2);return end<0?text.length:end+2;}
function urlAt(text,start) {
  const open=/^url\s*\(/i.exec(text.slice(start));if(!open)return null;
  let i=start+open[0].length;while(/\s/.test(text[i]||"")&&i<text.length)i++;
  const valueStart=i;let value;
  if(text[i]==='"'||text[i]==="'"){const end=quotedEnd(text,i);value=text.slice(i+1,end-1);i=end;}
  else {while(i<text.length&&text[i]!==")"){if(text[i]==="\\")i++;i++;}value=text.slice(valueStart,i).trim();}
  while(/\s/.test(text[i]||"")&&i<text.length)i++;
  return text[i]===")"?{start,end:i+1,value}:null;
}
function imports(css) {
  const found=[];let i=0;
  while(i<css.length){
    if(css.startsWith("/*",i)){i=commentEnd(css,i);continue;}
    if(css[i]==='"'||css[i]==="'"){i=quotedEnd(css,i);continue;}
    const m=/^@import\b\s*/i.exec(css.slice(i));
    if(!m){i++;continue;}
    const start=i;let pos=i+m[0].length,url,end;
    const token=urlAt(css,pos);
    if(token){url=token.value;pos=token.end;}
    else if(css[pos]==='"'||css[pos]==="'"){end=quotedEnd(css,pos);url=css.slice(pos+1,end-1);pos=end;}
    else {i+=m[0].length;continue;}
    const conditionStart=pos;let depth=0;
    while(pos<css.length){
      if(css.startsWith("/*",pos)){pos=commentEnd(css,pos);continue;}
      if(css[pos]==='"'||css[pos]==="'"){pos=quotedEnd(css,pos);continue;}
      if(css[pos]==="(")depth++;else if(css[pos]===")")depth--;
      if(css[pos]===";"&&!depth)break;pos++;
    }
    if(pos<css.length)found.push({start,end:pos+1,url,condition:css.slice(conditionStart,pos).trim()});
    i=pos+1;
  }
  return found;
}
function rebaseCSS(css,base) {
  function absolute(value){try{const url=new URL(value,base);return ["https:","http:"].includes(url.protocol)?url.href:"";}catch{return "";}}
  const patches=[];let i=0;
  while(i<css.length){
    if(css.startsWith("/*",i)){i=commentEnd(css,i);continue;}
    if(css[i]==='"'||css[i]==="'"){i=quotedEnd(css,i);continue;}
    const token=(i===0||!/[\w-]/.test(css[i-1]))?urlAt(css,i):null;
    if(token){if(!/^data:|^#/i.test(token.value))patches.push({start:i,end:token.end,text:`url(${JSON.stringify(absolute(token.value))})`});i=token.end;}else i++;
  }
  for(const item of imports(css)){
    const m=/^@import\b\s*/i.exec(css.slice(item.start));const start=item.start+m[0].length;
    if(css[start]==='"'||css[start]==="'")patches.push({start,end:quotedEnd(css,start),text:JSON.stringify(absolute(item.url))});
  }
  for(const patch of patches.sort((a,b)=>b.start-a.start))css=css.slice(0,patch.start)+patch.text+css.slice(patch.end);
  return css;
}
module.exports={imports,rebaseCSS};

return module.exports; })();
const MARKER = "<!--WIKIDOT_EDITOR_CONTENT-->";
async function inlineStyles(css,base,getCSS,options={}) {
  const warnings=[],seen=new Set();let bytes=0;
  async function expand(text,url,stack) {
    let out="",end=0;
    for(const item of imports(text)) {
      out+=options.rebase?options.rebase(text.slice(end,item.start),url):text.slice(end,item.start);end=item.end;
      try{
        const target=new URL(item.url,url);
        if(target.protocol==="http:")target.protocol="https:";
        if(target.protocol!=="https:"||target.username||target.password||target.port||!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(target.hostname)||/\.(local|lan|internal)$/i.test(target.hostname))throw Error("不支持的样式地址");
        if(stack.includes(target.href)||stack.length>=8)throw Error("样式循环引用或嵌套过深");
        if(!seen.has(target.href)&&seen.size>=40)throw Error("样式引用过多");seen.add(target.href);
        const remote=await getCSS(target.href);bytes+=remote.length;if(bytes>4000000)throw Error("样式内容过大");
        const content=await expand(remote,target.href,[...stack,target.href]);
        out+=item.condition?`@media ${item.condition}{\n${content}\n}`:content;
      }catch(error){warnings.push("样式读取失败："+item.url+" · "+error.message);}
    }
    return out+(options.rebase?options.rebase(text.slice(end),url):text.slice(end));
  }
  return {css:await expand(css,base,[]),warnings};
}
function publicPageURL(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.port || !/^[a-z0-9-]+\.wikidot\.com$/i.test(url.hostname)) throw Error("请使用公开 Wikidot 站点的 HTTPS 页面地址");
  url.hash = ""; url.search = "";
  return url.href;
}
function sourceFromResponse(json, parse) {
  if (json.status !== "ok" || typeof json.body !== "string") throw Error(json.message || "公开源码接口未返回有效结果");
  const doc = parse(json.body);
  const element = doc.querySelector(".page-source");
  if (!element) throw Error("该页面没有公开源码或已被删除");
  // Server inserts both a <br> and a literal newline. Keep exactly one newline.
  for (const br of element.querySelectorAll("br")) {
    const following = br.nextSibling;
    br.replaceWith(following?.nodeType === 3 && /^\r?\n/.test(following.nodeValue || "") ? "" : "\n");
  }
  let text = element.textContent;
  if (text.startsWith("\n\t")) text = text.slice(2);
  return text.replace(/\r\n?/g, "\n").replace(/\u00a0/g," ");
}
function templateFromHTML(html, pageURL, parse, local=false) {
  const doc = parse(html), url = publicPageURL(pageURL);
  const page = doc.getElementById("page-content"), main = doc.getElementById("main-content");
  if (!page || !main) throw Error("参考页面缺少 Wikidot 正文容器");
  const headCSS = local?[...doc.head.querySelectorAll("style")].map(el=>el.textContent).join("\n"):doc.getElementById("internal-style")?.textContent || "";
  const title = doc.getElementById("page-title")?.textContent.trim() || doc.title;
  // Only the site's base styles are inherited. Page-authored module CSS and
  // the reference article itself must not leak into the new draft.
  if(!local){
    main.replaceChildren();
    const heading = doc.createElement("div"); heading.id = "page-title"; heading.textContent = "WIKIDOT_EDITOR_TITLE";
    const content = doc.createElement("div"); content.id = "page-content";
    content.appendChild(doc.createComment("WIKIDOT_EDITOR_CONTENT"));main.append(heading,content);
  }else if(!page.innerHTML.includes(MARKER))throw Error("本地 HTML 的 #page-content 中缺少 "+MARKER);
  // Local shells preserve site chrome, including search and page controls.
  // The preview sandbox and CSP keep scripts and form submissions disabled.
  const remove=local?"script,object,embed,meta,base":"script,style,iframe,object,embed,form,input,button,textarea,select,link,meta,base,#login-status,#odialog-container,#extrac-div-1,#extrac-div-2,#extrac-div-3,.ads,.ad-container";
  for (const el of doc.body.querySelectorAll(remove)) el.remove();
  if(local)for(const frame of doc.body.querySelectorAll("iframe"))frame.setAttribute("sandbox","");
  for (const el of [doc.body, ...doc.body.querySelectorAll("*")]) {
    for (const attr of [...el.attributes]) {
      const key = attr.name.toLowerCase();
      if (key.startsWith("on") || ["srcdoc","nonce","integrity","srcset","action","formaction"].includes(key)) el.removeAttribute(attr.name);
      else if (["href","src","poster"].includes(key)) {
        if(local&&key==="href"&&attr.value.startsWith("#"))continue;
        if(local&&key==="src"&&el.tagName==="IMG"&&/^data:image\/(?:png|jpeg|gif|webp|svg\+xml);base64,/i.test(attr.value))continue;
        try { const dest = new URL(attr.value, url); if (!["https:","http:"].includes(dest.protocol)) el.removeAttribute(attr.name); else el.setAttribute(attr.name, dest.href.replace(/^http:/,"https:")); }
        catch { el.removeAttribute(attr.name); }
      }
    }
    if (el.tagName === "A") { el.setAttribute("target","_blank"); el.setAttribute("rel","noopener noreferrer"); }
  }
  return { body: doc.body.innerHTML, headCSS, referenceURL:url, referenceTitle:title, bodyClass:doc.body.className, bodyId:doc.body.id || "html-body", marker:MARKER };
}
function serializeTemplate(shell) {
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return `<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8"><meta name="wikidot-editor-origin" content="${escape(shell.referenceURL)}"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WIKIDOT_EDITOR_TITLE</title><style id="internal-style">${shell.headCSS.replace(/<\/style/gi,"<\\/style")}</style></head><body id="${escape(shell.bodyId)}" class="${escape(shell.bodyClass)}">${shell.body}</body></html>`;
}
function localTemplateFromHTML(html,fallback,parse){
  const doc=parse(html),origin=doc.querySelector('meta[name="wikidot-editor-origin"]')?.getAttribute("content")||fallback;
  return templateFromHTML(html,origin,parse,true);
}
const UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36";
function createRemoteClient(request, parse, options = {}) {
  const cache = new Map(), pending = new Map(), timeout = options.timeout || 18000;
  // Wikidot occasionally answers 5xx or stalls under load; retry those once
  // or twice with a short pause instead of failing the whole include.
  async function fetch(options, attempt = 0) {
    try { return await fetchOnce(options); }
    catch (error) {
      const transient = /超时|HTTP 5\d\d|HTTP 429|network|ECONN|ETIMEDOUT/i.test(error.message || "");
      if (!transient || attempt >= (options.retries ?? 2)) throw error;
      await new Promise(resolve => setTimeout(resolve, 600 * (attempt + 1)));
      return fetch(options, attempt + 1);
    }
  }
  async function fetchOnce(options) {
    let timer;
    try {
      const {retries,...plain}=options;
      // Wikidot answers 503 to the ajax connector unless the client looks like
      // a browser, so always send a browser-style User-Agent.
      plain.headers={"User-Agent":UA,...(plain.headers||{})};
      const result = await Promise.race([request({...plain,throw:false}), new Promise((_,reject) => { timer=setTimeout(() => reject(Error("读取超时，可稍后刷新重试")), timeout); })]);
      if (result.status < 200 || result.status >= 300) throw Error("HTTP " + result.status);
      if (result.text.length > 3000000) throw Error("远程页面过大");
      return result;
    } finally { clearTimeout(timer); }
  }
  async function memo(key, factory) {
    const item = cache.get(key);
    if (item) return item.value;
    if (pending.has(key)) return pending.get(key);
    const task = (async()=>{
      const saved=await options.storage?.read(key);if(saved!==undefined&&saved!==null){cache.set(key,{value:saved});return saved;}
      const value=await factory();await options.storage?.write(key,value);cache.set(key,{value});return value;
    })().finally(() => pending.delete(key));
    pending.set(key,task); return task;
  }
  const styles=(css,base)=>inlineStyles(css,base,url=>memo("css:"+url,async()=>(await fetch({url,method:"GET"})).text),{rebase:options.rebaseCSS});
  return {
    async clear(persistent=false) { cache.clear();if(persistent)await options.storage?.clear(); },
    async forget(key) { cache.delete(key);await options.storage?.remove?.(key); },
    has(key) { return cache.has(key); },
    styles,
    async source(input) {
      const url = publicPageURL(input);
      return memo("source:"+url, async () => {
        const page = await fetch({url,method:"GET"});
        const id = /WIKIREQUEST\.info\.pageId\s*=\s*(\d+)/.exec(page.text)?.[1] || /\bpageId\s*[:=]\s*(\d+)/.exec(page.text)?.[1];
        if (!id) throw Error(/id="page-content"[\s\S]{0,400}(?:does not exist|不存在|尚未创建)/i.test(page.text) ? "页面不存在" : "页面不存在或无法取得页面编号");
        const token = "wikidoteditor" + Math.random().toString(36).slice(2);
        const response = await fetch({url:new URL("/ajax-module-connector.php",url).href,method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded","Cookie":"wikidot_token7="+token,"Referer":url},body:new URLSearchParams({moduleName:"viewsource/ViewSourceModule",page_id:id,wikidot_token7:token}).toString()});
        let json; try {json=JSON.parse(response.text);} catch {throw Error("源码接口返回了非 JSON 内容");}
        return sourceFromResponse(json,parse);
      });
    },
    async template(input) { const url=publicPageURL(input); return memo("template:"+url, async () => {
      const shell=templateFromHTML((await fetch({url,method:"GET"})).text,url,parse);
      const resolved=await styles(shell.headCSS,url);shell.headCSS=resolved.css;shell.resourceWarnings=resolved.warnings;return shell;
    }); }
  };
}
module.exports = { MARKER, publicPageURL, sourceFromResponse, templateFromHTML, localTemplateFromHTML, serializeTemplate, createRemoteClient, inlineStyles };

return module.exports; })();
const {render,rebaseCSS}=(() => { const module = { exports: {} };
"use strict";
const {rebaseCSS}=(() => { const module = { exports: {} };
"use strict";
function quotedEnd(text,start) {
  const quote=text[start];let i=start+1;
  while(i<text.length){if(text[i]==="\\")i+=2;else if(text[i++]===quote)break;}
  return i;
}
function commentEnd(text,start){const end=text.indexOf("*/",start+2);return end<0?text.length:end+2;}
function urlAt(text,start) {
  const open=/^url\s*\(/i.exec(text.slice(start));if(!open)return null;
  let i=start+open[0].length;while(/\s/.test(text[i]||"")&&i<text.length)i++;
  const valueStart=i;let value;
  if(text[i]==='"'||text[i]==="'"){const end=quotedEnd(text,i);value=text.slice(i+1,end-1);i=end;}
  else {while(i<text.length&&text[i]!==")"){if(text[i]==="\\")i++;i++;}value=text.slice(valueStart,i).trim();}
  while(/\s/.test(text[i]||"")&&i<text.length)i++;
  return text[i]===")"?{start,end:i+1,value}:null;
}
function imports(css) {
  const found=[];let i=0;
  while(i<css.length){
    if(css.startsWith("/*",i)){i=commentEnd(css,i);continue;}
    if(css[i]==='"'||css[i]==="'"){i=quotedEnd(css,i);continue;}
    const m=/^@import\b\s*/i.exec(css.slice(i));
    if(!m){i++;continue;}
    const start=i;let pos=i+m[0].length,url,end;
    const token=urlAt(css,pos);
    if(token){url=token.value;pos=token.end;}
    else if(css[pos]==='"'||css[pos]==="'"){end=quotedEnd(css,pos);url=css.slice(pos+1,end-1);pos=end;}
    else {i+=m[0].length;continue;}
    const conditionStart=pos;let depth=0;
    while(pos<css.length){
      if(css.startsWith("/*",pos)){pos=commentEnd(css,pos);continue;}
      if(css[pos]==='"'||css[pos]==="'"){pos=quotedEnd(css,pos);continue;}
      if(css[pos]==="(")depth++;else if(css[pos]===")")depth--;
      if(css[pos]===";"&&!depth)break;pos++;
    }
    if(pos<css.length)found.push({start,end:pos+1,url,condition:css.slice(conditionStart,pos).trim()});
    i=pos+1;
  }
  return found;
}
function rebaseCSS(css,base) {
  function absolute(value){try{const url=new URL(value,base);return ["https:","http:"].includes(url.protocol)?url.href:"";}catch{return "";}}
  const patches=[];let i=0;
  while(i<css.length){
    if(css.startsWith("/*",i)){i=commentEnd(css,i);continue;}
    if(css[i]==='"'||css[i]==="'"){i=quotedEnd(css,i);continue;}
    const token=(i===0||!/[\w-]/.test(css[i-1]))?urlAt(css,i):null;
    if(token){if(!/^data:|^#/i.test(token.value))patches.push({start:i,end:token.end,text:`url(${JSON.stringify(absolute(token.value))})`});i=token.end;}else i++;
  }
  for(const item of imports(css)){
    const m=/^@import\b\s*/i.exec(css.slice(item.start));const start=item.start+m[0].length;
    if(css[start]==='"'||css[start]==="'")patches.push({start,end:quotedEnd(css,start),text:JSON.stringify(absolute(item.url))});
  }
  for(const patch of patches.sort((a,b)=>b.start-a.start))css=css.slice(0,patch.start)+patch.text+css.slice(patch.end);
  return css;
}
module.exports={imports,rebaseCSS};

return module.exports; })();
const {minimalPalette}=(() => { const module = { exports: {} };
"use strict";
// Minimal preview has no site shell, so pages written for a dark theme (light
// text on a dark #container) become unreadable on the plain background.
// The preview iframe has no scripts, so the decision is made statically from
// the page CSS: find the text colour and background the page assigns to its
// main containers and pick a matching backdrop.
const NAMED = { black: "#000", white: "#fff", gray: "#808080", grey: "#808080", silver: "#c0c0c0", red: "#f00", maroon: "#800000", navy: "#000080", darkgray: "#a9a9a9", darkgrey: "#a9a9a9", lightgray: "#d3d3d3", lightgrey: "#d3d3d3", dimgray: "#696969", whitesmoke: "#f5f5f5", gainsboro: "#dcdcdc", snow: "#fffafa", ivory: "#fffff0", beige: "#f5f5dc", wheat: "#f5deb3", linen: "#faf0e6" };
const TARGET = /^(?::root|html|body|#html-body|#skrollr-body|#container|#container-wrap|#content-wrap|#main-content|#page-content|#page-content\s+p|p|\.content-panel|\.page-content)$/i;
function parseColor(value) {
  let text = String(value || "").trim().toLowerCase().replace(/\s*!important$/, "");
  if (NAMED[text]) text = NAMED[text];
  let m;
  if ((m = /^#([0-9a-f]{3,4})$/.exec(text))) return [...m[1].slice(0, 3)].map(c => parseInt(c + c, 16)).concat(m[1].length === 4 ? parseInt(m[1][3] + m[1][3], 16) / 255 : 1);
  if ((m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/.exec(text))) return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)).concat(m[2] ? parseInt(m[2], 16) / 255 : 1);
  if ((m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(text))) {
    const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [+m[1], +m[2], +m[3], a];
  }
  if ((m = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(text))) {
    const h = +m[1] / 360, s = +m[2] / 100, l = +m[3] / 100;
    const f = n => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); };
    const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [f(0), f(8), f(4), a];
  }
  return null;
}
function luminance([r, g, b]) {
  const c = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}
// Collects simple top-level rules (inside @media too) and custom properties.
function rules(css) {
  const out = [], vars = Object.create(null);
  const text = String(css || "").replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of text.matchAll(/([^{}@;]+)\{([^{}]*)\}/g)) {
    const selectors = m[1].split(",").map(s => s.trim()).filter(Boolean);
    const decls = Object.create(null);
    for (const part of m[2].split(";")) {
      const i = part.indexOf(":"); if (i < 0) continue;
      const name = part.slice(0, i).trim().toLowerCase(), value = part.slice(i + 1).trim();
      if (name.startsWith("--")) vars[name] = value; else decls[name] = value;
    }
    out.push({ selectors, decls });
  }
  return { list: out, vars };
}
function resolve(value, vars, depth = 0) {
  if (!value || depth > 8) return value;
  return String(value).replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/g, (_, name, fallback) => resolve(vars[name] ?? fallback ?? "", vars, depth + 1));
}
function backgroundColor(value, vars) {
  const text = resolve(value, vars);
  if (!text) return null;
  const direct = parseColor(text);
  if (direct) return direct;
  // A shorthand or gradient: take its first recognisable colour.
  for (const m of text.matchAll(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b[a-z]+\b/gi)) { const c = parseColor(m[0]); if (c) return c; }
  return null;
}
function analyze(css) {
  const { list, vars } = rules(css);
  let text = null, background = null;
  for (const rule of list) {
    if (!rule.selectors.some(s => TARGET.test(s))) continue;
    const color = rule.decls.color && parseColor(resolve(rule.decls.color, vars));
    if (color && color[3] > 0.5) text = color;
    const bg = backgroundColor(rule.decls["background-color"] || rule.decls.background, vars);
    if (bg && bg[3] > 0.5) background = bg;
  }
  return { text, background };
}
// Returns the html{} declarations used by Minimal.
function minimalPalette(css, dark = false, enabled = true) {
  const light = "color-scheme:light;background:#faf9f6;color:#35343a", darkPalette = "color-scheme:dark;background:#202024;color:#e2e2e5";
  const fallback = dark ? darkPalette : light;
  if (!enabled) return { palette: fallback, reason: "" };
  const { text, background } = analyze(css);
  // The page paints its own backdrop; only make the outer frame match it.
  if (background) {
    const isDark = luminance(background) < 0.2;
    return { palette: `color-scheme:${isDark ? "dark" : "light"};background:rgb(${background.slice(0, 3).map(Math.round).join(",")});color:${isDark ? "#e2e2e5" : "#35343a"}`, reason: "page-background" };
  }
  if (text) {
    const lum = luminance(text);
    if (lum > 0.45) return { palette: darkPalette, reason: "light-text" };
    if (lum < 0.12) return { palette: light, reason: "dark-text" };
  }
  return { palette: fallback, reason: "" };
}
module.exports = { parseColor, luminance, analyze, minimalPalette };

return module.exports; })();
const {prepareSource}=(() => { const module = { exports: {} };
"use strict";
const blank=text=>text.replace(/[^\n]/g,"");
function stripComments(text){return text.replace(/\[\[code(?:\s+[^\]]*)?\]\][\s\S]*?\[\[\/code\]\]|\[!--[\s\S]*?--\]/gi,raw=>/^\[!--/.test(raw)?blank(raw):raw);}
// [[iftags]] blocks nest. An [[iftags]] without terms never matches at the
// top level (Wikidot's empty "any" list), but is transparent when nested.
// Themes rely on this: [[ift{$param}gs …]] only becomes a real tag once the
// include parameter is substituted, and wraps an empty [[iftags]] switch.
// Tag lines prefixed by blockquote markers are removed with their prefix.
function selectTags(text,tags=[]) {
  const available=new Set(tags),stack=[];let output="",end=0,active=true;
  const tokens=/\[\[code(?:\s+[^\]]*)?\]\][\s\S]*?\[\[\/code\]\]|^[ \t]*>[> \t]*\[\[(\/?)iftags(?:\s+([^\]]*))?\]\][ \t]*$|\[\[(\/?)iftags(?:\s+([^\]]*))?\]\]|^[ \t>]*\[\[\/?ift\{\$[^}\]]*\}gs\b[^\]]*\]\][ \t]*$/gim;let m;
  while((m=tokens.exec(text))){
    output+=active?text.slice(end,m.index):blank(text.slice(end,m.index));end=tokens.lastIndex;
    const close=m[1]??m[3],args=m[2]??m[4];
    if(close===undefined){output+=active&&!/^[ \t>]*\[\[\/?ift\{/.test(m[0])?m[0]:blank(m[0]);continue;}
    if(close){active=stack.length?stack.pop():active;}
    else{
      const terms=(args||"").trim().split(/[, ]+/).filter(Boolean);
      const required=terms.filter(t=>t[0]==="+"),excluded=terms.filter(t=>t[0]==="-"),any=terms.filter(t=>!/[+-]/.test(t[0]));
      const matches=terms.length?required.every(t=>available.has(t.slice(1)))&&excluded.every(t=>!available.has(t.slice(1)))&&(!any.length||any.some(t=>available.has(t))):stack.length>0;
      stack.push(active);active=active&&matches;
    }
    output+=blank(m[0]);
  }
  return output+(active?text.slice(end):blank(text.slice(end)));
}
// Wikidot expressions: [[#if c | then | else]], [[#ifexpr e | then | else]]
// and [[#expr e]]. Conditions are false when empty, "false", "null" or "0".
// Expressions use a small arithmetic/logic grammar; nothing is ever eval'd.
function evaluate(expr){
  const tokens=String(expr).match(/\d+(?:\.\d+)?|<=|>=|!=|<>|==|and|or|not|[-+*/%()<>=!]/gi)||[];
  if(tokens.join("").replace(/\s/g,"")!==String(expr).replace(/\s/g,""))throw Error("bad");
  let i=0;const peek=()=>tokens[i]?.toLowerCase(),take=()=>tokens[i++];
  const or=()=>{let v=and();while(peek()==="or"){take();const r=and();v=(v||r)?1:0;}return v;};
  const and=()=>{let v=cmp();while(peek()==="and"){take();const r=cmp();v=(v&&r)?1:0;}return v;};
  const cmp=()=>{let v=add();while(["<",">","<=",">=","=","==","!=","<>"].includes(peek())){const o=take(),r=add();v=({"<":v<r,">":v>r,"<=":v<=r,">=":v>=r,"=":v===r,"==":v===r,"!=":v!==r,"<>":v!==r})[o]?1:0;}return v;};
  const add=()=>{let v=mul();while(peek()==="+"||peek()==="-"){const o=take(),r=mul();v=o==="+"?v+r:v-r;}return v;};
  const mul=()=>{let v=unary();while(["*","/","%"].includes(peek())){const o=take(),r=unary();v=o==="*"?v*r:o==="/"?v/r:v%r;}return v;};
  const unary=()=>{const t=peek();if(t==="-"){take();return -unary();}if(t==="+"){take();return unary();}if(t==="not"||t==="!"){take();return unary()?0:1;}if(t==="("){take();const v=or();if(take()!==")")throw Error("bad");return v;}const n=take();if(n===undefined||!/^\d/.test(n))throw Error("bad");return Number(n);};
  const value=or();if(i!==tokens.length||!Number.isFinite(value))throw Error("bad");return value;
}
function expressions(text){
  const falsy=v=>/^(?:|false|null|0)$/i.test(v.trim());
  const re=/\[\[#(if|ifexpr|expr)\s([^\[\]]*)\]\]/gi;
  for(let round=0;round<20&&re.test(text);round++){
    re.lastIndex=0;
    text=text.replace(re,(raw,kind,body)=>{
      const parts=body.split("|"),cond=parts[0];
      if(kind.toLowerCase()==="if")return (falsy(cond)?parts[2]:parts[1])?.trim()??"";
      let value;try{value=evaluate(cond);}catch{return kind.toLowerCase()==="expr"?"Expression error":(parts[2]?.trim()??"");}
      if(kind.toLowerCase()==="expr")return String(Math.round(value*1e10)/1e10);
      return (value?parts[1]:parts[2])?.trim()??"";
    });
  }
  return text;
}
function prepareSource(text,tags=[]) {
  // Comments in code examples stay literal, while inactive documentation must
  // disappear before its includes or CSS modules are ever processed.
  return expressions(selectTags(stripComments(text),tags));
}
module.exports={stripComments,selectTags,prepareSource,expressions,evaluate};

return module.exports; })();
const {fontSize, unixName, attr} = (() => { const module = { exports: {} };
"use strict";
// Helpers shared by the Preview renderer and the Live editing decorator.
const SIZE_KEYWORDS = new Set(["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "smaller", "larger"]);
function fontSize(value) {
  const text = String(value || "").trim().toLowerCase();
  if (SIZE_KEYWORDS.has(text)) return text;
  if (/^\d+(?:\.\d+)?(?:px|em|rem|%|pt|ex|vw|vh)$/.test(text)) return text;
  if (/^\d+(?:\.\d+)?$/.test(text)) return text + "%";
  return "";
}
// Wikidot page names: lower case ASCII, every other run of characters becomes
// a single hyphen, and hyphens next to a category colon are dropped.
function unixName(value) {
  return String(value || "").toLowerCase()
    .replace(/[^a-z0-9:_#-]+/g, "-").replace(/-+/g, "-")
    .replace(/-*:-*/g, ":").replace(/^[-:]+|-+$/g, "");
}
// Finds the closer that balances an already consumed opener of `name`.
function findClose(text, from, name) {
  const re = new RegExp(`\\[\\[(\\/?)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s\\]])[^\\]]*\\]\\]`, "gi");
  re.lastIndex = from;
  let depth = 1, m;
  while ((m = re.exec(text))) {
    depth += m[1] ? -1 : 1;
    if (!depth) return { start: m.index, end: m.index + m[0].length };
  }
  return null;
}
function attr(text, name) {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"']+))`, "i").exec(String(text || ""));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}
module.exports = { fontSize, unixName, findClose, attr, SIZE_KEYWORDS };

return module.exports; })();
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

return module.exports; })();
function entries(text,base){
 return [...new Set(String(text||"").split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map(s=>{
  if(/^https:\/\//i.test(s))return publicPageURL(s);
  const match=/^\[\[include\s+([\s\S]+?)\]\]\s*$/i.exec(s);
  return includeURL((match?match[1]:s).split(/[|\s]/)[0],base);
 }))];
}
async function preloadIncludes(text,remote,base,onProgress=()=>{}){
 const urls=entries(text,base),results=[];
 for(let i=0;i<urls.length;i++){
  const url=urls[i];onProgress({index:i+1,total:urls.length,url});
  try{
   const source=await remote.source(url);
   const expanded=await expandIncludes(source,u=>remote.source(u),{base:url,transformSource:(raw,u)=>raw.replace(/(\[\[module\s+CSS\b[^\]]*\]\])([\s\S]*?)(\[\[\/module\]\])/gi,(_,a,css,c)=>a+rebaseCSS(css,u)+c)});
   const css=render(expanded.source,{base:url}).css.join("\n");
   const styles=await remote.styles(rebaseCSS(css,url),url);
   results.push({url,warnings:[...expanded.warnings,...styles.warnings],dependencies:expanded.dependencies});
  }catch(error){results.push({url,error:error.message});}
 }
 return results;
}
module.exports={entries,preloadIncludes};

return module.exports; })();
    const results=await preloadIncludes(text,this.plugin.remote,this.view?.profile?.().referenceURL&&this.view.profile().profile!=="minimal"?this.view.profile().referenceURL:this.plugin.settings.base,p=>{status.textContent=`正在缓存 ${p.index}/${p.total}：${p.url}`;});
    const failed=results.filter(r=>r.error);
    new Notice(results.length?`已缓存 ${results.length-failed.length}/${results.length}`:"没有可缓存的 include");
    this.plugin.refreshViews();await this.draw();
    const box=this.contentEl.querySelector(".wikidot-manager-status");
    if(box)for(const r of results)if(r.error||r.warnings?.length)box.createDiv({text:r.url+"："+(r.error||r.warnings.join("；"))});
  }
  onClose(){this.contentEl.empty();}
}
class SourceModal extends Modal{
  constructor(app,url,text){super(app);this.url=url;this.text=String(text??"");}
  onOpen(){
    this.setTitle(this.url);this.modalEl.addClass("wikidot-include-source");
    const pre=this.contentEl.createEl("pre",{cls:"wikidot-manager-source"});pre.textContent=this.text.length>200000?this.text.slice(0,200000)+"\n…（已截断）":this.text;
    new Setting(this.contentEl).addButton(b=>b.setButtonText("复制").onClick(async()=>{await navigator.clipboard.writeText(this.text);new Notice("已复制");})).addButton(b=>b.setButtonText("关闭").onClick(()=>this.close()));
  }
  onClose(){this.contentEl.empty();}
}
module.exports={IncludeManager,describe};

return module.exports; })();
const { toMarkdown } = (() => { const module = { exports: {} };
"use strict";
// Wikidot (FTML) -> ordinary GitHub flavoured Markdown.
//
// The conversion is deliberately forgiving: FTML produced by include-expansion
// regularly contains unbalanced or half-written tags, and the preview should
// still show readable text instead of raw wiki syntax.

const common = (() => { const module = { exports: {} };
"use strict";
// Helpers shared by the Preview renderer and the Live editing decorator.
const SIZE_KEYWORDS = new Set(["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "smaller", "larger"]);
function fontSize(value) {
  const text = String(value || "").trim().toLowerCase();
  if (SIZE_KEYWORDS.has(text)) return text;
  if (/^\d+(?:\.\d+)?(?:px|em|rem|%|pt|ex|vw|vh)$/.test(text)) return text;
  if (/^\d+(?:\.\d+)?$/.test(text)) return text + "%";
  return "";
}
// Wikidot page names: lower case ASCII, every other run of characters becomes
// a single hyphen, and hyphens next to a category colon are dropped.
function unixName(value) {
  return String(value || "").toLowerCase()
    .replace(/[^a-z0-9:_#-]+/g, "-").replace(/-+/g, "-")
    .replace(/-*:-*/g, ":").replace(/^[-:]+|-+$/g, "");
}
// Finds the closer that balances an already consumed opener of `name`.
function findClose(text, from, name) {
  const re = new RegExp(`\\[\\[(\\/?)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s\\]])[^\\]]*\\]\\]`, "gi");
  re.lastIndex = from;
  let depth = 1, m;
  while ((m = re.exec(text))) {
    depth += m[1] ? -1 : 1;
    if (!depth) return { start: m.index, end: m.index + m[0].length };
  }
  return null;
}
function attr(text, name) {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"']+))`, "i").exec(String(text || ""));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}
module.exports = { fontSize, unixName, findClose, attr, SIZE_KEYWORDS };

return module.exports; })();

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
return module.exports; })();
const TYPE = "flipiris-wikidot-view";
class WikidotView extends TextFileView {
  constructor(leaf,plugin){super(leaf);this.plugin=plugin;this.data="";this.mode="source";this.generation=0;}
  getViewType(){return TYPE;}
  getDisplayText(){return this.file?.basename||"Wikidot";}
  getIcon(){return "file-code";}
  async onOpen(){
    this.closed=false;this.contentEl.empty();this.contentEl.addClass("flipiris-wikidot");
    this.modeActions=[];
    for(const [mode,icon,label]of [["source","code-xml","Source editing"],["rich","pencil-line","Live editing"],["preview","book-open","Preview"]]){
      const action=this.addAction(icon,label,()=>this.setMode(mode));action.dataset.wikidotMode=mode;this.modeActions.push(action);
    }
    this.addAction("settings-2","Preview environment",()=>new DraftModal(this.plugin,null,this).open());
    this.addAction("refresh-cw","Refresh preview",()=>this.updatePreview());
    this.addAction("package","Manage include cache",()=>new IncludeManager(this.plugin,this).open());
    const toolbar=this.contentEl.createDiv("wikidot-toolbar");
    this.environment=toolbar.createEl("select",{attr:{"aria-label":"预览页面环境"}});
    this.environment.createEl("option",{value:"minimal",text:"Minimal"});this.environment.createEl("option",{value:"scp-cn",text:"SCP CN Wiki"});this.environment.createEl("option",{value:"local",text:"Local HTML"});
    this.registerDomEvent(this.environment,"change",async()=>{if(!this.file)return;await this.plugin.setProfile(this.file.path,{...this.profile(),profile:this.environment.value});this.updatePreview();});
    this.status=toolbar.createSpan({cls:"wikidot-status"});
    this.warning=this.contentEl.createEl("details",{cls:"wikidot-warnings"});this.warning.createEl("summary",{text:"预览兼容性说明"});this.warningBody=this.warning.createDiv();
    this.panes=this.contentEl.createDiv("wikidot-panes");
    this.nativeRoot=this.panes.createDiv("wikidot-native-editor markdown-source-view mod-cm6");
    const sizer=this.nativeRoot.createDiv("wikidot-note-sizer");
    this.title=sizer.createDiv({cls:"inline-title",text:this.file?.basename||"Wikidot"});
    this.cm=createEditor({host:sizer,text:this.data,getContext:()=>({liveLayout:this.plugin.settings.liveLayout!==false,liveFrames:this.plugin.settings.liveFrames!==false,livePositioning:!!this.plugin.settings.livePositioning,base:this.profile().referenceURL||this.plugin.settings.base,page:this.file?.basename}),onChange:text=>{
      this.data=text;if(!this.loading)this.requestSave();
      if(this.mode==="preview"){window.clearTimeout(this.timer);this.timer=window.setTimeout(()=>this.updatePreview(),350);}
    }});
    this.frame=this.panes.createEl("iframe",{cls:"wikidot-preview",attr:{title:"Wikidot preview",sandbox:"allow-popups allow-popups-to-escape-sandbox",referrerpolicy:"no-referrer"}});
    this.setMode(this.mode);
  }
  getViewData(){return this.cm?.getValue()??this.data;}
  setViewData(data,clear){
    const changed=data!==this.getViewData();this.data=data;this.loading=true;
    try{this.cm?.setValue(data);}finally{this.loading=false;}
    if(this.title)this.title.textContent=this.file?.basename||"Wikidot";
    if(changed||clear)this.updatePreview();
  }
  clear(){this.data="";this.loading=true;try{this.cm?.setValue("");}finally{this.loading=false;}}
  profile(){return {profile:this.plugin.settings.defaultProfile,referenceURL:this.plugin.settings.referenceURL,...this.plugin.settings.profiles[this.file?.path]};}
  setMode(mode){
    this.mode=mode;this.contentEl.dataset.layout=mode;this.cm?.setMode(mode);
    for(const action of this.modeActions||[])action.classList.toggle("is-active",action.dataset.wikidotMode===mode);
    this.updatePreview();if(mode!=="preview")this.cm?.view.focus();
  }
  async updatePreview(){
    const generation=++this.generation;if(!this.frame)return;
    this.environment.value=this.profile().profile;
    if(this.mode!=="preview"){this.warning.hidden=true;return;}
    const text=this.getViewData(),profile={...this.profile()},warnings=[];
    this.status.textContent=`${text.length} 字符 · 正在生成预览…`;
    try{
      const referenceURL=profile.referenceURL||this.plugin.settings.referenceURL;
      let template;try{template=await this.plugin.loadTemplate(profile);}catch(error){warnings.push("本地 HTML 读取失败，临时使用 Minimal："+error.message);}
      const base=profile.profile!=="minimal"?referenceURL:this.plugin.settings.base;
      // Paint the local shell immediately; slow includes must not blank the page.
      if(this.closed||generation!==this.generation||this.mode!=="preview")return;
      this.frame.srcdoc=render(text,{base,contentBase:base,template,title:profile.title||this.file?.basename,page:this.file?.basename,dark:this.contentEl.ownerDocument.body.classList.contains("theme-dark")}).document;
      const source=this.plugin.settings.includesEnabled?await expandIncludes(text,url=>this.plugin.remote.source(url),{
        base,tags:(profile.tags||"").split(/\s+/).filter(Boolean),transformSource:(raw,url)=>raw.replace(/(\[\[module\s+CSS\b[^\]]*\]\])([\s\S]*?)(\[\[\/module\]\])/gi,(_,open,css,close)=>open+rebaseCSS(css,url)+close)
      }):{source:text,warnings:[],dependencies:[]};
      warnings.push(...source.warnings);this.lastDependencies=source.dependencies;
      if(this.closed||generation!==this.generation||this.mode!=="preview")return;
      warnings.push(...(template?.resourceWarnings || []));
      const cssSources=render(source.source,{base,contentBase:base}).css;
      const resolvedCSS=await this.plugin.remote.styles(cssSources.join("\n"),base);warnings.push(...resolvedCSS.warnings);
      if(this.closed||generation!==this.generation||this.mode!=="preview")return;
      const result=render(source.source,{base,contentBase:base,template,overrideCSS:resolvedCSS.css,minimalContrast:this.plugin.settings.minimalContrast!==false,title:profile.title||this.file?.basename,page:this.file?.basename,dark:this.contentEl.ownerDocument.body.classList.contains("theme-dark")});
      warnings.push(...result.warnings);this.frame.srcdoc=result.document;this.warning.hidden=!warnings.length;this.warningBody.empty();
      for(const warning of warnings)this.warningBody.createDiv({text:warning});
      this.status.textContent=`${text.length} 字符 · ${source.dependencies.length} 个引用 · ${template?"Local HTML":"Minimal"}${warnings.length?" · "+warnings.length+" 项提示":""}`;
    }catch(error){if(!this.closed&&generation===this.generation)this.status.textContent="预览失败，源码仍可编辑："+error.message;console.error(error);}
  }
  async onClose(){this.closed=true;this.generation++;window.clearTimeout(this.timer);await this.save();this.cm?.destroy();}
}

class DraftModal extends Modal {
  constructor(plugin,folder,view,extension) {super(plugin.app);this.plugin=plugin;this.folder=folder;this.view=view;this.extension=extension;}
  onOpen() {
    const root=this.contentEl, existing=this.view?.profile();
    this.setTitle(this.view ? "Preview Environment" : "New Wikidot Draft");
    let name="Untitled Wikidot", title=existing?.title || this.view?.file?.basename || "", profile=existing?.profile || this.plugin.settings.defaultProfile, referenceURL=existing?.referenceURL || this.plugin.settings.referenceURL;
    let extension=this.extension||this.plugin.settings.defaultExtension,templatePath=existing?.templatePath||this.plugin.settings.templatePath,tags=existing?.tags||"";
    if (!this.view) new Setting(root).setName("文件名").addText(input=>input.setValue(name).onChange(value=>name=value));
    if (!this.view) new Setting(root).setName("文件格式").addDropdown(drop=>drop.addOption("ftml",".ftml").addOption("wikidot",".wikidot").addOption("wd",".wd").setValue(extension).onChange(value=>extension=value));
    new Setting(root).setName("页面标题").setDesc("仅用于预览，留空则使用文件名。").addText(input=>input.setValue(title).onChange(value=>title=value));
    new Setting(root).setName("HTML 页面环境").addDropdown(drop=>drop.addOption("minimal","Minimal").addOption("scp-cn","SCP CN Wiki").addOption("local","Local HTML").setValue(profile).onChange(value=>profile=value));
    new Setting(root).setName("本地 HTML 母体").setDesc("仓库内 HTML 文件路径。仅 Local HTML 使用此路径；SCP CN Wiki 始终使用设置中的默认母体。").addText(input=>input.setValue(templatePath||"").onChange(value=>templatePath=value.trim()));
    new Setting(root).setName("参考页面地址").setDesc("仅用于相对链接，以及主动保存网站母体；预览不会重新读取此网页。").addText(input=>input.setValue(referenceURL).onChange(value=>referenceURL=value));
    new Setting(root).setName("模拟页面标签").setDesc("空格分隔，用于 [[iftags]]；普通文稿留空，避免带入主题说明页内容。").addText(input=>input.setValue(tags).onChange(value=>tags=value));
    root.createEl("p",{text:"正文始终保存在本地。公开 include 和导入样式首次读取后保存在磁盘缓存；字体与图片仍可能联网。"});
    const errorEl=root.createDiv({cls:"wikidot-form-error"});
    new Setting(root).addButton(button=>button.setButtonText(this.view?"应用":"创建文稿").setCta().onClick(async()=>{
      button.setDisabled(true); errorEl.textContent="";
      try {
        if (profile !== "minimal") referenceURL=publicPageURL(referenceURL);
        const config={...existing,profile,referenceURL,templatePath,title:title.trim(),tags};
        if (this.view) {await this.plugin.setProfile(this.view.file.path,config);this.view.updatePreview();}
        else {
          if (!name.trim() || /[\\/:*?"<>|]/.test(name) || /^\./.test(name) || /[. ]$/.test(name)) throw Error("请输入有效的文件名，不含路径或 Windows 保留字符");
          await this.plugin.createFile(this.folder,{name:name.trim().replace(/\.(wikidot|ftml|wd)$/i,""),extension,config,source:""});
        }
        this.close();
      } catch(error) {errorEl.textContent=error.message;button.setDisabled(false);}
    }));
  }
}
class WikidotSettings extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
  display() {
    this.containerEl.empty();
    this.containerEl.createEl("p", { text: "支持公开 Wikidot include、参数替换、嵌套引用与 CSS 模块。选择 HTML 页面环境来模拟源码作为页面正文提交后的显示；这是本地预览，不会实际提交。其他动态模块仍有兼容性限制。" });
    new Setting(this.containerEl).setName("站点地址").setDesc("用于解析三方括号页面链接；不会自动上传或发布内容。").addText(text => text.setValue(this.plugin.settings.base).onChange(async value => {
      if (!safeUrl(value) || !/^https?:\/\//i.test(value)) return;
      this.plugin.settings.base = value; await this.plugin.persist();this.plugin.refreshViews();
    }));
    new Setting(this.containerEl).setName("Minimal 自动配色").setDesc("Minimal 环境按页面 CSS 的文字色与背景色选择相称的底色，避免为深色主题准备的页面在浅色底上不可读。").addToggle(toggle=>toggle.setValue(this.plugin.settings.minimalContrast!==false).onChange(async value=>{this.plugin.settings.minimalContrast=value;await this.plugin.persist();this.plugin.refreshViews();}));
    new Setting(this.containerEl).setName("Include 缓存管理").setDesc("查看、刷新、删除已缓存的 include 源码和样式表，或缓存当前文稿用到的全部 include。").addButton(button=>button.setButtonText("打开管理").onClick(()=>new IncludeManager(this.plugin,this.app.workspace.getActiveViewOfType(WikidotView)).open()));
    new Setting(this.containerEl).setName("实时阅览：块布局").setDesc("显示本地内联样式与 CSS 模块中的网格、宽高、对齐和留白。点击布局块进入原生编辑；关闭后使用源码框。切换后立即生效。").addToggle(toggle=>toggle.setValue(this.plugin.settings.liveLayout!==false).onChange(async value=>{this.plugin.settings.liveLayout=value;await this.plugin.persist();this.plugin.refreshViews();}));
    new Setting(this.containerEl).setName("实时阅览：显示 div 边框").setDesc("默认开启：以细线框与独立类名栏区分嵌套层级；关闭后所有 div 均隐藏边框与类名。切换后立即生效。").addToggle(toggle=>toggle.setValue(this.plugin.settings.liveFrames!==false).onChange(async value=>{this.plugin.settings.liveFrames=value;await this.plugin.persist();this.plugin.refreshViews();}));
    new Setting(this.containerEl).setName("实时阅览：定位效果").setDesc("可选显示 position 与上下左右偏移；限定在布局块自身范围内，不覆盖编辑器工具栏。切换后立即生效。").addToggle(toggle=>toggle.setValue(!!this.plugin.settings.livePositioning).onChange(async value=>{this.plugin.settings.livePositioning=value;await this.plugin.persist();this.plugin.refreshViews();}));
    new Setting(this.containerEl).setName("解析远程 include").setDesc("默认开启；源码请求只包含公开页面名称。关闭时保留源码并提示未解析。").addToggle(toggle=>toggle.setValue(this.plugin.settings.includesEnabled).onChange(async value=>{this.plugin.settings.includesEnabled=value;await this.plugin.persist();this.plugin.refreshViews();}));
    new Setting(this.containerEl).setName("新建文稿的默认 HTML 环境").addDropdown(drop=>drop.addOption("minimal","Minimal").addOption("scp-cn","SCP CN Wiki").setValue(this.plugin.settings.defaultProfile).onChange(async value=>{this.plugin.settings.defaultProfile=value;await this.plugin.persist();}));
    new Setting(this.containerEl).setName("默认文件格式").addDropdown(drop=>drop.addOption("ftml",".ftml").addOption("wikidot",".wikidot").addOption("wd",".wd").setValue(this.plugin.settings.defaultExtension).onChange(async value=>{this.plugin.settings.defaultExtension=value;await this.plugin.persist();}));
    new Setting(this.containerEl).setName("默认本地 HTML 母体").setDesc("相对于仓库根目录的路径；留空使用插件内置 SCP 中文站外壳；Local HTML 可单独指定文件。").addText(input=>input.setValue(this.plugin.settings.templatePath||"").onChange(async value=>{this.plugin.settings.templatePath=value.trim();await this.plugin.persist();}));
    new Setting(this.containerEl).setName("默认参考页面").setDesc("用于新建文稿；既有文稿的环境可通过工具栏单独更改。").addText(input=>{
      input.setValue(this.plugin.settings.referenceURL);
      input.inputEl.addEventListener("change",async()=>{try{this.plugin.settings.referenceURL=publicPageURL(input.getValue().trim());await this.plugin.persist();}catch(error){new Notice(error.message);}});
    });
    new Setting(this.containerEl).setName("保存网站为本地 HTML 母体").setDesc("仅点击时读取默认参考页，保存外壳和内联基础 CSS，不带文章正文；重名会创建新文件。完成后设为默认母体。").addButton(button=>button.setButtonText("保存本地 HTML").onClick(async()=>{button.setDisabled(true);try{const path=await this.plugin.captureTemplate();new Notice("已保存："+path);this.display();}catch(error){new Notice(error.message);button.setDisabled(false);}}));
    new Setting(this.containerEl).setName("常用 include").setDesc("每行一个页面名、跨站名称（:站点:页面）、HTTPS 页面地址或完整 [[include …]]。预缓存保存原始源码，使用时仍按文稿参数展开。").addTextArea(input=>{input.setValue(this.plugin.settings.precacheIncludes||"");input.inputEl.rows=6;input.inputEl.style.width="100%";input.inputEl.placeholder=":scp-wiki-cn:theme:another-night\ncomponent:example";input.onChange(async value=>{this.plugin.settings.precacheIncludes=value;await this.plugin.persist();});});
    const progress=this.containerEl.createDiv({attr:{role:"status","aria-live":"polite"}});
    new Setting(this.containerEl).setName("预缓存常用 include").setDesc("提前读取列表、嵌套 include 与 CSS 导入；已有缓存直接复用。之后预览无需等待这些源码请求。字体和图片仍按需加载。").addButton(button=>button.setButtonText("缓存列表").onClick(async()=>{
      button.setDisabled(true);progress.empty();
      try{
        const {preloadIncludes}=(() => { const module = { exports: {} };
"use strict";
const {includeURL,expandIncludes}=(() => { const module = { exports: {} };
"use strict";
const {prepareSource}=(() => { const module = { exports: {} };
"use strict";
const blank=text=>text.replace(/[^\n]/g,"");
function stripComments(text){return text.replace(/\[\[code(?:\s+[^\]]*)?\]\][\s\S]*?\[\[\/code\]\]|\[!--[\s\S]*?--\]/gi,raw=>/^\[!--/.test(raw)?blank(raw):raw);}
// [[iftags]] blocks nest. An [[iftags]] without terms never matches at the
// top level (Wikidot's empty "any" list), but is transparent when nested.
// Themes rely on this: [[ift{$param}gs …]] only becomes a real tag once the
// include parameter is substituted, and wraps an empty [[iftags]] switch.
// Tag lines prefixed by blockquote markers are removed with their prefix.
function selectTags(text,tags=[]) {
  const available=new Set(tags),stack=[];let output="",end=0,active=true;
  const tokens=/\[\[code(?:\s+[^\]]*)?\]\][\s\S]*?\[\[\/code\]\]|^[ \t]*>[> \t]*\[\[(\/?)iftags(?:\s+([^\]]*))?\]\][ \t]*$|\[\[(\/?)iftags(?:\s+([^\]]*))?\]\]|^[ \t>]*\[\[\/?ift\{\$[^}\]]*\}gs\b[^\]]*\]\][ \t]*$/gim;let m;
  while((m=tokens.exec(text))){
    output+=active?text.slice(end,m.index):blank(text.slice(end,m.index));end=tokens.lastIndex;
    const close=m[1]??m[3],args=m[2]??m[4];
    if(close===undefined){output+=active&&!/^[ \t>]*\[\[\/?ift\{/.test(m[0])?m[0]:blank(m[0]);continue;}
    if(close){active=stack.length?stack.pop():active;}
    else{
      const terms=(args||"").trim().split(/[, ]+/).filter(Boolean);
      const required=terms.filter(t=>t[0]==="+"),excluded=terms.filter(t=>t[0]==="-"),any=terms.filter(t=>!/[+-]/.test(t[0]));
      const matches=terms.length?required.every(t=>available.has(t.slice(1)))&&excluded.every(t=>!available.has(t.slice(1)))&&(!any.length||any.some(t=>available.has(t))):stack.length>0;
      stack.push(active);active=active&&matches;
    }
    output+=blank(m[0]);
  }
  return output+(active?text.slice(end):blank(text.slice(end)));
}
// Wikidot expressions: [[#if c | then | else]], [[#ifexpr e | then | else]]
// and [[#expr e]]. Conditions are false when empty, "false", "null" or "0".
// Expressions use a small arithmetic/logic grammar; nothing is ever eval'd.
function evaluate(expr){
  const tokens=String(expr).match(/\d+(?:\.\d+)?|<=|>=|!=|<>|==|and|or|not|[-+*/%()<>=!]/gi)||[];
  if(tokens.join("").replace(/\s/g,"")!==String(expr).replace(/\s/g,""))throw Error("bad");
  let i=0;const peek=()=>tokens[i]?.toLowerCase(),take=()=>tokens[i++];
  const or=()=>{let v=and();while(peek()==="or"){take();const r=and();v=(v||r)?1:0;}return v;};
  const and=()=>{let v=cmp();while(peek()==="and"){take();const r=cmp();v=(v&&r)?1:0;}return v;};
  const cmp=()=>{let v=add();while(["<",">","<=",">=","=","==","!=","<>"].includes(peek())){const o=take(),r=add();v=({"<":v<r,">":v>r,"<=":v<=r,">=":v>=r,"=":v===r,"==":v===r,"!=":v!==r,"<>":v!==r})[o]?1:0;}return v;};
  const add=()=>{let v=mul();while(peek()==="+"||peek()==="-"){const o=take(),r=mul();v=o==="+"?v+r:v-r;}return v;};
  const mul=()=>{let v=unary();while(["*","/","%"].includes(peek())){const o=take(),r=unary();v=o==="*"?v*r:o==="/"?v/r:v%r;}return v;};
  const unary=()=>{const t=peek();if(t==="-"){take();return -unary();}if(t==="+"){take();return unary();}if(t==="not"||t==="!"){take();return unary()?0:1;}if(t==="("){take();const v=or();if(take()!==")")throw Error("bad");return v;}const n=take();if(n===undefined||!/^\d/.test(n))throw Error("bad");return Number(n);};
  const value=or();if(i!==tokens.length||!Number.isFinite(value))throw Error("bad");return value;
}
function expressions(text){
  const falsy=v=>/^(?:|false|null|0)$/i.test(v.trim());
  const re=/\[\[#(if|ifexpr|expr)\s([^\[\]]*)\]\]/gi;
  for(let round=0;round<20&&re.test(text);round++){
    re.lastIndex=0;
    text=text.replace(re,(raw,kind,body)=>{
      const parts=body.split("|"),cond=parts[0];
      if(kind.toLowerCase()==="if")return (falsy(cond)?parts[2]:parts[1])?.trim()??"";
      let value;try{value=evaluate(cond);}catch{return kind.toLowerCase()==="expr"?"Expression error":(parts[2]?.trim()??"");}
      if(kind.toLowerCase()==="expr")return String(Math.round(value*1e10)/1e10);
      return (value?parts[1]:parts[2])?.trim()??"";
    });
  }
  return text;
}
function prepareSource(text,tags=[]) {
  // Comments in code examples stay literal, while inactive documentation must
  // disappear before its includes or CSS modules are ever processed.
  return expressions(selectTags(stripComments(text),tags));
}
module.exports={stripComments,selectTags,prepareSource,expressions,evaluate};

return module.exports; })();
const {unixName}=(() => { const module = { exports: {} };
"use strict";
// Helpers shared by the Preview renderer and the Live editing decorator.
const SIZE_KEYWORDS = new Set(["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "smaller", "larger"]);
function fontSize(value) {
  const text = String(value || "").trim().toLowerCase();
  if (SIZE_KEYWORDS.has(text)) return text;
  if (/^\d+(?:\.\d+)?(?:px|em|rem|%|pt|ex|vw|vh)$/.test(text)) return text;
  if (/^\d+(?:\.\d+)?$/.test(text)) return text + "%";
  return "";
}
// Wikidot page names: lower case ASCII, every other run of characters becomes
// a single hyphen, and hyphens next to a category colon are dropped.
function unixName(value) {
  return String(value || "").toLowerCase()
    .replace(/[^a-z0-9:_#-]+/g, "-").replace(/-+/g, "-")
    .replace(/-*:-*/g, ":").replace(/^[-:]+|-+$/g, "");
}
// Finds the closer that balances an already consumed opener of `name`.
function findClose(text, from, name) {
  const re = new RegExp(`\\[\\[(\\/?)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s\\]])[^\\]]*\\]\\]`, "gi");
  re.lastIndex = from;
  let depth = 1, m;
  while ((m = re.exec(text))) {
    depth += m[1] ? -1 : 1;
    if (!depth) return { start: m.index, end: m.index + m[0].length };
  }
  return null;
}
function attr(text, name) {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"']+))`, "i").exec(String(text || ""));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}
module.exports = { fontSize, unixName, findClose, attr, SIZE_KEYWORDS };

return module.exports; })();
function includeURL(target, base) {
  let origin = new URL(base).origin, page = target.trim();
  if (page.startsWith(":")) {
    const match = /^:([a-z0-9.-]+):(.+)$/i.exec(page);
    if (!match) throw Error("跨站 include 格式应为 :站点:页面");
    const host = match[1].includes(".") ? match[1] : match[1] + ".wikidot.com";
    if (!/^[a-z0-9-]+\.wikidot\.com$/i.test(host)) throw Error("跨站 include 当前只支持 Wikidot 子域名");
    origin = "https://" + host; page = match[2];
  }
  // Wikidot normalises the name with toUnixName before looking it up, so
  // "Component:Image Block" and "component:image-block" are the same page.
  if (!/[\s/?#\\]/.test(page.trim())) page = unixName(page) || page;
  if (!page || /[\s/?#\\]/.test(page) || page === "." || page === "..") throw Error("无效的 include 页面名称");
  return origin + "/" + encodeURIComponent(page).replace(/%3A/gi, ":");
}
async function expandIncludes(source, getSource, options = {}) {
  const warnings = [], dependencies = new Set();
  const base = options.base || "https://scp-wiki-cn.wikidot.com/";
  let count = 0, size = 0;
  // Request every include of one level together; expansion itself stays
  // sequential, so output order and limits are unchanged.
  const requests = new Map();
  const load = url => { if (!requests.has(url)) requests.set(url, Promise.resolve().then(() => getSource(url))); return requests.get(url); };
  function prefetch(text, context) {
    if (options.prefetch === false) return;
    for (const m of text.matchAll(/^\[\[include\s+(\S+)/gim)) {
      try { load(includeURL(m[1].replace(/\]\]$/, ""), context)).catch(() => {}); } catch {}
    }
  }
  async function expand(text, context, stack) {
    text=prepareSource(text,options.tags||[]);
    prefetch(text, context);
    // Wikidot expands column-zero includes even inside code blocks. Indented
    // examples and inline includes remain literal, following the public syntax.
    // Same shape as Wikidot's rule: the tag starts a line and runs, possibly
    // over several lines, to the first "]]" that ends a line. A single "]"
    // inside a value (e.g. "hover-enlarge=--]") does not end the tag.
    const re = /^\[\[include\s+([\s\S]+?)\]\][\t ]*$/gm;
    let output = "", end = 0, match;
    while ((match = re.exec(text))) {
      output += text.slice(end, match.index); end = re.lastIndex;
      const parts = match[1].split("|"); const first=parts.shift().trim();
      const target=/^\S+/.exec(first)?.[0]||"";
      const params = Object.create(null);
      const initial=first.slice(target.length).trim();
      for(const m of initial.matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(.*?))(?=\s+[^\s=]+\s*=|$)/g))params[m[1]]=m[2]??m[3]??m[4].trim();
      // Wikidot ignores empty values and names outside [a-z0-9_-], leaving
      // their {$placeholders} literal.
      for (const part of parts) { const i = part.indexOf("="); if (i > 0) params[part.slice(0,i).trim()] = part.slice(i+1).trim(); }
      for (const key of Object.keys(params)) if (params[key] === "" || !/^[a-z0-9_-]+$/i.test(key)) delete params[key];
      try {
        const url = includeURL(target, context);
        if (stack.includes(url)) throw Error("循环引用：" + [...stack, url].join(" → "));
        if (stack.length >= (options.maxDepth || 10)) throw Error("嵌套 include 超过深度限制");
        if (++count > (options.maxCount || 40)) throw Error("include 数量超过限制");
        const raw = await load(url);
        if (typeof raw !== "string") throw Error("没有取得可用的页面源码");
        size += raw.length; if (size > (options.maxSize || 2000000)) throw Error("include 总内容超过限制");
        dependencies.add(url);
        const substituted = raw.replace(/\{\$([^}\r\n]+)\}/g, (all, name) => Object.hasOwn(params, name) ? params[name] : all);
        // Wikidot surrounds every included page with blank lines, so it never
        // merges into the paragraph before or after it.
        const inCode = (text.slice(0, match.index).match(/\[\[code\b/gi) || []).length > (text.slice(0, match.index).match(/\[\[\/code\]\]/gi) || []).length;
        const pad = inCode || options.padIncludes === false ? "" : "\n\n";
        output += pad + await expand(options.transformSource ? options.transformSource(substituted,url) : substituted, url, [...stack,url]) + pad;
      } catch (error) {
        warnings.push(`include ${target}：${error.message}`);
        // Keep errors visible and literal, not as new executable wikitext.
        output += "\n\n[[div class=\"error-block\"]]\n@@" + ("Include 不可用：" + target + " · " + error.message).replace(/@@/g, "@ @") + "@@\n[[/div]]\n\n";
      }
    }
    return output + text.slice(end);
  }
  return { source: await expand(source.replace(/\r\n?/g,"\n"), base, []), warnings, dependencies: [...dependencies] };
}
module.exports = { includeURL, expandIncludes };

return module.exports; })();
const {publicPageURL}=(() => { const module = { exports: {} };
"use strict";
const {imports}=(() => { const module = { exports: {} };
"use strict";
function quotedEnd(text,start) {
  const quote=text[start];let i=start+1;
  while(i<text.length){if(text[i]==="\\")i+=2;else if(text[i++]===quote)break;}
  return i;
}
function commentEnd(text,start){const end=text.indexOf("*/",start+2);return end<0?text.length:end+2;}
function urlAt(text,start) {
  const open=/^url\s*\(/i.exec(text.slice(start));if(!open)return null;
  let i=start+open[0].length;while(/\s/.test(text[i]||"")&&i<text.length)i++;
  const valueStart=i;let value;
  if(text[i]==='"'||text[i]==="'"){const end=quotedEnd(text,i);value=text.slice(i+1,end-1);i=end;}
  else {while(i<text.length&&text[i]!==")"){if(text[i]==="\\")i++;i++;}value=text.slice(valueStart,i).trim();}
  while(/\s/.test(text[i]||"")&&i<text.length)i++;
  return text[i]===")"?{start,end:i+1,value}:null;
}
function imports(css) {
  const found=[];let i=0;
  while(i<css.length){
    if(css.startsWith("/*",i)){i=commentEnd(css,i);continue;}
    if(css[i]==='"'||css[i]==="'"){i=quotedEnd(css,i);continue;}
    const m=/^@import\b\s*/i.exec(css.slice(i));
    if(!m){i++;continue;}
    const start=i;let pos=i+m[0].length,url,end;
    const token=urlAt(css,pos);
    if(token){url=token.value;pos=token.end;}
    else if(css[pos]==='"'||css[pos]==="'"){end=quotedEnd(css,pos);url=css.slice(pos+1,end-1);pos=end;}
    else {i+=m[0].length;continue;}
    const conditionStart=pos;let depth=0;
    while(pos<css.length){
      if(css.startsWith("/*",pos)){pos=commentEnd(css,pos);continue;}
      if(css[pos]==='"'||css[pos]==="'"){pos=quotedEnd(css,pos);continue;}
      if(css[pos]==="(")depth++;else if(css[pos]===")")depth--;
      if(css[pos]===";"&&!depth)break;pos++;
    }
    if(pos<css.length)found.push({start,end:pos+1,url,condition:css.slice(conditionStart,pos).trim()});
    i=pos+1;
  }
  return found;
}
function rebaseCSS(css,base) {
  function absolute(value){try{const url=new URL(value,base);return ["https:","http:"].includes(url.protocol)?url.href:"";}catch{return "";}}
  const patches=[];let i=0;
  while(i<css.length){
    if(css.startsWith("/*",i)){i=commentEnd(css,i);continue;}
    if(css[i]==='"'||css[i]==="'"){i=quotedEnd(css,i);continue;}
    const token=(i===0||!/[\w-]/.test(css[i-1]))?urlAt(css,i):null;
    if(token){if(!/^data:|^#/i.test(token.value))patches.push({start:i,end:token.end,text:`url(${JSON.stringify(absolute(token.value))})`});i=token.end;}else i++;
  }
  for(const item of imports(css)){
    const m=/^@import\b\s*/i.exec(css.slice(item.start));const start=item.start+m[0].length;
    if(css[start]==='"'||css[start]==="'")patches.push({start,end:quotedEnd(css,start),text:JSON.stringify(absolute(item.url))});
  }
  for(const patch of patches.sort((a,b)=>b.start-a.start))css=css.slice(0,patch.start)+patch.text+css.slice(patch.end);
  return css;
}
module.exports={imports,rebaseCSS};

return module.exports; })();
const MARKER = "<!--WIKIDOT_EDITOR_CONTENT-->";
async function inlineStyles(css,base,getCSS,options={}) {
  const warnings=[],seen=new Set();let bytes=0;
  async function expand(text,url,stack) {
    let out="",end=0;
    for(const item of imports(text)) {
      out+=options.rebase?options.rebase(text.slice(end,item.start),url):text.slice(end,item.start);end=item.end;
      try{
        const target=new URL(item.url,url);
        if(target.protocol==="http:")target.protocol="https:";
        if(target.protocol!=="https:"||target.username||target.password||target.port||!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(target.hostname)||/\.(local|lan|internal)$/i.test(target.hostname))throw Error("不支持的样式地址");
        if(stack.includes(target.href)||stack.length>=8)throw Error("样式循环引用或嵌套过深");
        if(!seen.has(target.href)&&seen.size>=40)throw Error("样式引用过多");seen.add(target.href);
        const remote=await getCSS(target.href);bytes+=remote.length;if(bytes>4000000)throw Error("样式内容过大");
        const content=await expand(remote,target.href,[...stack,target.href]);
        out+=item.condition?`@media ${item.condition}{\n${content}\n}`:content;
      }catch(error){warnings.push("样式读取失败："+item.url+" · "+error.message);}
    }
    return out+(options.rebase?options.rebase(text.slice(end),url):text.slice(end));
  }
  return {css:await expand(css,base,[]),warnings};
}
function publicPageURL(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.port || !/^[a-z0-9-]+\.wikidot\.com$/i.test(url.hostname)) throw Error("请使用公开 Wikidot 站点的 HTTPS 页面地址");
  url.hash = ""; url.search = "";
  return url.href;
}
function sourceFromResponse(json, parse) {
  if (json.status !== "ok" || typeof json.body !== "string") throw Error(json.message || "公开源码接口未返回有效结果");
  const doc = parse(json.body);
  const element = doc.querySelector(".page-source");
  if (!element) throw Error("该页面没有公开源码或已被删除");
  // Server inserts both a <br> and a literal newline. Keep exactly one newline.
  for (const br of element.querySelectorAll("br")) {
    const following = br.nextSibling;
    br.replaceWith(following?.nodeType === 3 && /^\r?\n/.test(following.nodeValue || "") ? "" : "\n");
  }
  let text = element.textContent;
  if (text.startsWith("\n\t")) text = text.slice(2);
  return text.replace(/\r\n?/g, "\n").replace(/\u00a0/g," ");
}
function templateFromHTML(html, pageURL, parse, local=false) {
  const doc = parse(html), url = publicPageURL(pageURL);
  const page = doc.getElementById("page-content"), main = doc.getElementById("main-content");
  if (!page || !main) throw Error("参考页面缺少 Wikidot 正文容器");
  const headCSS = local?[...doc.head.querySelectorAll("style")].map(el=>el.textContent).join("\n"):doc.getElementById("internal-style")?.textContent || "";
  const title = doc.getElementById("page-title")?.textContent.trim() || doc.title;
  // Only the site's base styles are inherited. Page-authored module CSS and
  // the reference article itself must not leak into the new draft.
  if(!local){
    main.replaceChildren();
    const heading = doc.createElement("div"); heading.id = "page-title"; heading.textContent = "WIKIDOT_EDITOR_TITLE";
    const content = doc.createElement("div"); content.id = "page-content";
    content.appendChild(doc.createComment("WIKIDOT_EDITOR_CONTENT"));main.append(heading,content);
  }else if(!page.innerHTML.includes(MARKER))throw Error("本地 HTML 的 #page-content 中缺少 "+MARKER);
  // Local shells preserve site chrome, including search and page controls.
  // The preview sandbox and CSP keep scripts and form submissions disabled.
  const remove=local?"script,object,embed,meta,base":"script,style,iframe,object,embed,form,input,button,textarea,select,link,meta,base,#login-status,#odialog-container,#extrac-div-1,#extrac-div-2,#extrac-div-3,.ads,.ad-container";
  for (const el of doc.body.querySelectorAll(remove)) el.remove();
  if(local)for(const frame of doc.body.querySelectorAll("iframe"))frame.setAttribute("sandbox","");
  for (const el of [doc.body, ...doc.body.querySelectorAll("*")]) {
    for (const attr of [...el.attributes]) {
      const key = attr.name.toLowerCase();
      if (key.startsWith("on") || ["srcdoc","nonce","integrity","srcset","action","formaction"].includes(key)) el.removeAttribute(attr.name);
      else if (["href","src","poster"].includes(key)) {
        if(local&&key==="href"&&attr.value.startsWith("#"))continue;
        if(local&&key==="src"&&el.tagName==="IMG"&&/^data:image\/(?:png|jpeg|gif|webp|svg\+xml);base64,/i.test(attr.value))continue;
        try { const dest = new URL(attr.value, url); if (!["https:","http:"].includes(dest.protocol)) el.removeAttribute(attr.name); else el.setAttribute(attr.name, dest.href.replace(/^http:/,"https:")); }
        catch { el.removeAttribute(attr.name); }
      }
    }
    if (el.tagName === "A") { el.setAttribute("target","_blank"); el.setAttribute("rel","noopener noreferrer"); }
  }
  return { body: doc.body.innerHTML, headCSS, referenceURL:url, referenceTitle:title, bodyClass:doc.body.className, bodyId:doc.body.id || "html-body", marker:MARKER };
}
function serializeTemplate(shell) {
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return `<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8"><meta name="wikidot-editor-origin" content="${escape(shell.referenceURL)}"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WIKIDOT_EDITOR_TITLE</title><style id="internal-style">${shell.headCSS.replace(/<\/style/gi,"<\\/style")}</style></head><body id="${escape(shell.bodyId)}" class="${escape(shell.bodyClass)}">${shell.body}</body></html>`;
}
function localTemplateFromHTML(html,fallback,parse){
  const doc=parse(html),origin=doc.querySelector('meta[name="wikidot-editor-origin"]')?.getAttribute("content")||fallback;
  return templateFromHTML(html,origin,parse,true);
}
const UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36";
function createRemoteClient(request, parse, options = {}) {
  const cache = new Map(), pending = new Map(), timeout = options.timeout || 18000;
  // Wikidot occasionally answers 5xx or stalls under load; retry those once
  // or twice with a short pause instead of failing the whole include.
  async function fetch(options, attempt = 0) {
    try { return await fetchOnce(options); }
    catch (error) {
      const transient = /超时|HTTP 5\d\d|HTTP 429|network|ECONN|ETIMEDOUT/i.test(error.message || "");
      if (!transient || attempt >= (options.retries ?? 2)) throw error;
      await new Promise(resolve => setTimeout(resolve, 600 * (attempt + 1)));
      return fetch(options, attempt + 1);
    }
  }
  async function fetchOnce(options) {
    let timer;
    try {
      const {retries,...plain}=options;
      // Wikidot answers 503 to the ajax connector unless the client looks like
      // a browser, so always send a browser-style User-Agent.
      plain.headers={"User-Agent":UA,...(plain.headers||{})};
      const result = await Promise.race([request({...plain,throw:false}), new Promise((_,reject) => { timer=setTimeout(() => reject(Error("读取超时，可稍后刷新重试")), timeout); })]);
      if (result.status < 200 || result.status >= 300) throw Error("HTTP " + result.status);
      if (result.text.length > 3000000) throw Error("远程页面过大");
      return result;
    } finally { clearTimeout(timer); }
  }
  async function memo(key, factory) {
    const item = cache.get(key);
    if (item) return item.value;
    if (pending.has(key)) return pending.get(key);
    const task = (async()=>{
      const saved=await options.storage?.read(key);if(saved!==undefined&&saved!==null){cache.set(key,{value:saved});return saved;}
      const value=await factory();await options.storage?.write(key,value);cache.set(key,{value});return value;
    })().finally(() => pending.delete(key));
    pending.set(key,task); return task;
  }
  const styles=(css,base)=>inlineStyles(css,base,url=>memo("css:"+url,async()=>(await fetch({url,method:"GET"})).text),{rebase:options.rebaseCSS});
  return {
    async clear(persistent=false) { cache.clear();if(persistent)await options.storage?.clear(); },
    async forget(key) { cache.delete(key);await options.storage?.remove?.(key); },
    has(key) { return cache.has(key); },
    styles,
    async source(input) {
      const url = publicPageURL(input);
      return memo("source:"+url, async () => {
        const page = await fetch({url,method:"GET"});
        const id = /WIKIREQUEST\.info\.pageId\s*=\s*(\d+)/.exec(page.text)?.[1] || /\bpageId\s*[:=]\s*(\d+)/.exec(page.text)?.[1];
        if (!id) throw Error(/id="page-content"[\s\S]{0,400}(?:does not exist|不存在|尚未创建)/i.test(page.text) ? "页面不存在" : "页面不存在或无法取得页面编号");
        const token = "wikidoteditor" + Math.random().toString(36).slice(2);
        const response = await fetch({url:new URL("/ajax-module-connector.php",url).href,method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded","Cookie":"wikidot_token7="+token,"Referer":url},body:new URLSearchParams({moduleName:"viewsource/ViewSourceModule",page_id:id,wikidot_token7:token}).toString()});
        let json; try {json=JSON.parse(response.text);} catch {throw Error("源码接口返回了非 JSON 内容");}
        return sourceFromResponse(json,parse);
      });
    },
    async template(input) { const url=publicPageURL(input); return memo("template:"+url, async () => {
      const shell=templateFromHTML((await fetch({url,method:"GET"})).text,url,parse);
      const resolved=await styles(shell.headCSS,url);shell.headCSS=resolved.css;shell.resourceWarnings=resolved.warnings;return shell;
    }); }
  };
}
module.exports = { MARKER, publicPageURL, sourceFromResponse, templateFromHTML, localTemplateFromHTML, serializeTemplate, createRemoteClient, inlineStyles };

return module.exports; })();
const {render,rebaseCSS}=(() => { const module = { exports: {} };
"use strict";
const {rebaseCSS}=(() => { const module = { exports: {} };
"use strict";
function quotedEnd(text,start) {
  const quote=text[start];let i=start+1;
  while(i<text.length){if(text[i]==="\\")i+=2;else if(text[i++]===quote)break;}
  return i;
}
function commentEnd(text,start){const end=text.indexOf("*/",start+2);return end<0?text.length:end+2;}
function urlAt(text,start) {
  const open=/^url\s*\(/i.exec(text.slice(start));if(!open)return null;
  let i=start+open[0].length;while(/\s/.test(text[i]||"")&&i<text.length)i++;
  const valueStart=i;let value;
  if(text[i]==='"'||text[i]==="'"){const end=quotedEnd(text,i);value=text.slice(i+1,end-1);i=end;}
  else {while(i<text.length&&text[i]!==")"){if(text[i]==="\\")i++;i++;}value=text.slice(valueStart,i).trim();}
  while(/\s/.test(text[i]||"")&&i<text.length)i++;
  return text[i]===")"?{start,end:i+1,value}:null;
}
function imports(css) {
  const found=[];let i=0;
  while(i<css.length){
    if(css.startsWith("/*",i)){i=commentEnd(css,i);continue;}
    if(css[i]==='"'||css[i]==="'"){i=quotedEnd(css,i);continue;}
    const m=/^@import\b\s*/i.exec(css.slice(i));
    if(!m){i++;continue;}
    const start=i;let pos=i+m[0].length,url,end;
    const token=urlAt(css,pos);
    if(token){url=token.value;pos=token.end;}
    else if(css[pos]==='"'||css[pos]==="'"){end=quotedEnd(css,pos);url=css.slice(pos+1,end-1);pos=end;}
    else {i+=m[0].length;continue;}
    const conditionStart=pos;let depth=0;
    while(pos<css.length){
      if(css.startsWith("/*",pos)){pos=commentEnd(css,pos);continue;}
      if(css[pos]==='"'||css[pos]==="'"){pos=quotedEnd(css,pos);continue;}
      if(css[pos]==="(")depth++;else if(css[pos]===")")depth--;
      if(css[pos]===";"&&!depth)break;pos++;
    }
    if(pos<css.length)found.push({start,end:pos+1,url,condition:css.slice(conditionStart,pos).trim()});
    i=pos+1;
  }
  return found;
}
function rebaseCSS(css,base) {
  function absolute(value){try{const url=new URL(value,base);return ["https:","http:"].includes(url.protocol)?url.href:"";}catch{return "";}}
  const patches=[];let i=0;
  while(i<css.length){
    if(css.startsWith("/*",i)){i=commentEnd(css,i);continue;}
    if(css[i]==='"'||css[i]==="'"){i=quotedEnd(css,i);continue;}
    const token=(i===0||!/[\w-]/.test(css[i-1]))?urlAt(css,i):null;
    if(token){if(!/^data:|^#/i.test(token.value))patches.push({start:i,end:token.end,text:`url(${JSON.stringify(absolute(token.value))})`});i=token.end;}else i++;
  }
  for(const item of imports(css)){
    const m=/^@import\b\s*/i.exec(css.slice(item.start));const start=item.start+m[0].length;
    if(css[start]==='"'||css[start]==="'")patches.push({start,end:quotedEnd(css,start),text:JSON.stringify(absolute(item.url))});
  }
  for(const patch of patches.sort((a,b)=>b.start-a.start))css=css.slice(0,patch.start)+patch.text+css.slice(patch.end);
  return css;
}
module.exports={imports,rebaseCSS};

return module.exports; })();
const {minimalPalette}=(() => { const module = { exports: {} };
"use strict";
// Minimal preview has no site shell, so pages written for a dark theme (light
// text on a dark #container) become unreadable on the plain background.
// The preview iframe has no scripts, so the decision is made statically from
// the page CSS: find the text colour and background the page assigns to its
// main containers and pick a matching backdrop.
const NAMED = { black: "#000", white: "#fff", gray: "#808080", grey: "#808080", silver: "#c0c0c0", red: "#f00", maroon: "#800000", navy: "#000080", darkgray: "#a9a9a9", darkgrey: "#a9a9a9", lightgray: "#d3d3d3", lightgrey: "#d3d3d3", dimgray: "#696969", whitesmoke: "#f5f5f5", gainsboro: "#dcdcdc", snow: "#fffafa", ivory: "#fffff0", beige: "#f5f5dc", wheat: "#f5deb3", linen: "#faf0e6" };
const TARGET = /^(?::root|html|body|#html-body|#skrollr-body|#container|#container-wrap|#content-wrap|#main-content|#page-content|#page-content\s+p|p|\.content-panel|\.page-content)$/i;
function parseColor(value) {
  let text = String(value || "").trim().toLowerCase().replace(/\s*!important$/, "");
  if (NAMED[text]) text = NAMED[text];
  let m;
  if ((m = /^#([0-9a-f]{3,4})$/.exec(text))) return [...m[1].slice(0, 3)].map(c => parseInt(c + c, 16)).concat(m[1].length === 4 ? parseInt(m[1][3] + m[1][3], 16) / 255 : 1);
  if ((m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/.exec(text))) return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)).concat(m[2] ? parseInt(m[2], 16) / 255 : 1);
  if ((m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(text))) {
    const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [+m[1], +m[2], +m[3], a];
  }
  if ((m = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(text))) {
    const h = +m[1] / 360, s = +m[2] / 100, l = +m[3] / 100;
    const f = n => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); };
    const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [f(0), f(8), f(4), a];
  }
  return null;
}
function luminance([r, g, b]) {
  const c = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}
// Collects simple top-level rules (inside @media too) and custom properties.
function rules(css) {
  const out = [], vars = Object.create(null);
  const text = String(css || "").replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of text.matchAll(/([^{}@;]+)\{([^{}]*)\}/g)) {
    const selectors = m[1].split(",").map(s => s.trim()).filter(Boolean);
    const decls = Object.create(null);
    for (const part of m[2].split(";")) {
      const i = part.indexOf(":"); if (i < 0) continue;
      const name = part.slice(0, i).trim().toLowerCase(), value = part.slice(i + 1).trim();
      if (name.startsWith("--")) vars[name] = value; else decls[name] = value;
    }
    out.push({ selectors, decls });
  }
  return { list: out, vars };
}
function resolve(value, vars, depth = 0) {
  if (!value || depth > 8) return value;
  return String(value).replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/g, (_, name, fallback) => resolve(vars[name] ?? fallback ?? "", vars, depth + 1));
}
function backgroundColor(value, vars) {
  const text = resolve(value, vars);
  if (!text) return null;
  const direct = parseColor(text);
  if (direct) return direct;
  // A shorthand or gradient: take its first recognisable colour.
  for (const m of text.matchAll(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b[a-z]+\b/gi)) { const c = parseColor(m[0]); if (c) return c; }
  return null;
}
function analyze(css) {
  const { list, vars } = rules(css);
  let text = null, background = null;
  for (const rule of list) {
    if (!rule.selectors.some(s => TARGET.test(s))) continue;
    const color = rule.decls.color && parseColor(resolve(rule.decls.color, vars));
    if (color && color[3] > 0.5) text = color;
    const bg = backgroundColor(rule.decls["background-color"] || rule.decls.background, vars);
    if (bg && bg[3] > 0.5) background = bg;
  }
  return { text, background };
}
// Returns the html{} declarations used by Minimal.
function minimalPalette(css, dark = false, enabled = true) {
  const light = "color-scheme:light;background:#faf9f6;color:#35343a", darkPalette = "color-scheme:dark;background:#202024;color:#e2e2e5";
  const fallback = dark ? darkPalette : light;
  if (!enabled) return { palette: fallback, reason: "" };
  const { text, background } = analyze(css);
  // The page paints its own backdrop; only make the outer frame match it.
  if (background) {
    const isDark = luminance(background) < 0.2;
    return { palette: `color-scheme:${isDark ? "dark" : "light"};background:rgb(${background.slice(0, 3).map(Math.round).join(",")});color:${isDark ? "#e2e2e5" : "#35343a"}`, reason: "page-background" };
  }
  if (text) {
    const lum = luminance(text);
    if (lum > 0.45) return { palette: darkPalette, reason: "light-text" };
    if (lum < 0.12) return { palette: light, reason: "dark-text" };
  }
  return { palette: fallback, reason: "" };
}
module.exports = { parseColor, luminance, analyze, minimalPalette };

return module.exports; })();
const {prepareSource}=(() => { const module = { exports: {} };
"use strict";
const blank=text=>text.replace(/[^\n]/g,"");
function stripComments(text){return text.replace(/\[\[code(?:\s+[^\]]*)?\]\][\s\S]*?\[\[\/code\]\]|\[!--[\s\S]*?--\]/gi,raw=>/^\[!--/.test(raw)?blank(raw):raw);}
// [[iftags]] blocks nest. An [[iftags]] without terms never matches at the
// top level (Wikidot's empty "any" list), but is transparent when nested.
// Themes rely on this: [[ift{$param}gs …]] only becomes a real tag once the
// include parameter is substituted, and wraps an empty [[iftags]] switch.
// Tag lines prefixed by blockquote markers are removed with their prefix.
function selectTags(text,tags=[]) {
  const available=new Set(tags),stack=[];let output="",end=0,active=true;
  const tokens=/\[\[code(?:\s+[^\]]*)?\]\][\s\S]*?\[\[\/code\]\]|^[ \t]*>[> \t]*\[\[(\/?)iftags(?:\s+([^\]]*))?\]\][ \t]*$|\[\[(\/?)iftags(?:\s+([^\]]*))?\]\]|^[ \t>]*\[\[\/?ift\{\$[^}\]]*\}gs\b[^\]]*\]\][ \t]*$/gim;let m;
  while((m=tokens.exec(text))){
    output+=active?text.slice(end,m.index):blank(text.slice(end,m.index));end=tokens.lastIndex;
    const close=m[1]??m[3],args=m[2]??m[4];
    if(close===undefined){output+=active&&!/^[ \t>]*\[\[\/?ift\{/.test(m[0])?m[0]:blank(m[0]);continue;}
    if(close){active=stack.length?stack.pop():active;}
    else{
      const terms=(args||"").trim().split(/[, ]+/).filter(Boolean);
      const required=terms.filter(t=>t[0]==="+"),excluded=terms.filter(t=>t[0]==="-"),any=terms.filter(t=>!/[+-]/.test(t[0]));
      const matches=terms.length?required.every(t=>available.has(t.slice(1)))&&excluded.every(t=>!available.has(t.slice(1)))&&(!any.length||any.some(t=>available.has(t))):stack.length>0;
      stack.push(active);active=active&&matches;
    }
    output+=blank(m[0]);
  }
  return output+(active?text.slice(end):blank(text.slice(end)));
}
// Wikidot expressions: [[#if c | then | else]], [[#ifexpr e | then | else]]
// and [[#expr e]]. Conditions are false when empty, "false", "null" or "0".
// Expressions use a small arithmetic/logic grammar; nothing is ever eval'd.
function evaluate(expr){
  const tokens=String(expr).match(/\d+(?:\.\d+)?|<=|>=|!=|<>|==|and|or|not|[-+*/%()<>=!]/gi)||[];
  if(tokens.join("").replace(/\s/g,"")!==String(expr).replace(/\s/g,""))throw Error("bad");
  let i=0;const peek=()=>tokens[i]?.toLowerCase(),take=()=>tokens[i++];
  const or=()=>{let v=and();while(peek()==="or"){take();const r=and();v=(v||r)?1:0;}return v;};
  const and=()=>{let v=cmp();while(peek()==="and"){take();const r=cmp();v=(v&&r)?1:0;}return v;};
  const cmp=()=>{let v=add();while(["<",">","<=",">=","=","==","!=","<>"].includes(peek())){const o=take(),r=add();v=({"<":v<r,">":v>r,"<=":v<=r,">=":v>=r,"=":v===r,"==":v===r,"!=":v!==r,"<>":v!==r})[o]?1:0;}return v;};
  const add=()=>{let v=mul();while(peek()==="+"||peek()==="-"){const o=take(),r=mul();v=o==="+"?v+r:v-r;}return v;};
  const mul=()=>{let v=unary();while(["*","/","%"].includes(peek())){const o=take(),r=unary();v=o==="*"?v*r:o==="/"?v/r:v%r;}return v;};
  const unary=()=>{const t=peek();if(t==="-"){take();return -unary();}if(t==="+"){take();return unary();}if(t==="not"||t==="!"){take();return unary()?0:1;}if(t==="("){take();const v=or();if(take()!==")")throw Error("bad");return v;}const n=take();if(n===undefined||!/^\d/.test(n))throw Error("bad");return Number(n);};
  const value=or();if(i!==tokens.length||!Number.isFinite(value))throw Error("bad");return value;
}
function expressions(text){
  const falsy=v=>/^(?:|false|null|0)$/i.test(v.trim());
  const re=/\[\[#(if|ifexpr|expr)\s([^\[\]]*)\]\]/gi;
  for(let round=0;round<20&&re.test(text);round++){
    re.lastIndex=0;
    text=text.replace(re,(raw,kind,body)=>{
      const parts=body.split("|"),cond=parts[0];
      if(kind.toLowerCase()==="if")return (falsy(cond)?parts[2]:parts[1])?.trim()??"";
      let value;try{value=evaluate(cond);}catch{return kind.toLowerCase()==="expr"?"Expression error":(parts[2]?.trim()??"");}
      if(kind.toLowerCase()==="expr")return String(Math.round(value*1e10)/1e10);
      return (value?parts[1]:parts[2])?.trim()??"";
    });
  }
  return text;
}
function prepareSource(text,tags=[]) {
  // Comments in code examples stay literal, while inactive documentation must
  // disappear before its includes or CSS modules are ever processed.
  return expressions(selectTags(stripComments(text),tags));
}
module.exports={stripComments,selectTags,prepareSource,expressions,evaluate};

return module.exports; })();
const {fontSize, unixName, attr} = (() => { const module = { exports: {} };
"use strict";
// Helpers shared by the Preview renderer and the Live editing decorator.
const SIZE_KEYWORDS = new Set(["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "smaller", "larger"]);
function fontSize(value) {
  const text = String(value || "").trim().toLowerCase();
  if (SIZE_KEYWORDS.has(text)) return text;
  if (/^\d+(?:\.\d+)?(?:px|em|rem|%|pt|ex|vw|vh)$/.test(text)) return text;
  if (/^\d+(?:\.\d+)?$/.test(text)) return text + "%";
  return "";
}
// Wikidot page names: lower case ASCII, every other run of characters becomes
// a single hyphen, and hyphens next to a category colon are dropped.
function unixName(value) {
  return String(value || "").toLowerCase()
    .replace(/[^a-z0-9:_#-]+/g, "-").replace(/-+/g, "-")
    .replace(/-*:-*/g, ":").replace(/^[-:]+|-+$/g, "");
}
// Finds the closer that balances an already consumed opener of `name`.
function findClose(text, from, name) {
  const re = new RegExp(`\\[\\[(\\/?)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s\\]])[^\\]]*\\]\\]`, "gi");
  re.lastIndex = from;
  let depth = 1, m;
  while ((m = re.exec(text))) {
    depth += m[1] ? -1 : 1;
    if (!depth) return { start: m.index, end: m.index + m[0].length };
  }
  return null;
}
function attr(text, name) {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"']+))`, "i").exec(String(text || ""));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}
module.exports = { fontSize, unixName, findClose, attr, SIZE_KEYWORDS };

return module.exports; })();
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

return module.exports; })();
function entries(text,base){
 return [...new Set(String(text||"").split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map(s=>{
  if(/^https:\/\//i.test(s))return publicPageURL(s);
  const match=/^\[\[include\s+([\s\S]+?)\]\]\s*$/i.exec(s);
  return includeURL((match?match[1]:s).split(/[|\s]/)[0],base);
 }))];
}
async function preloadIncludes(text,remote,base,onProgress=()=>{}){
 const urls=entries(text,base),results=[];
 for(let i=0;i<urls.length;i++){
  const url=urls[i];onProgress({index:i+1,total:urls.length,url});
  try{
   const source=await remote.source(url);
   const expanded=await expandIncludes(source,u=>remote.source(u),{base:url,transformSource:(raw,u)=>raw.replace(/(\[\[module\s+CSS\b[^\]]*\]\])([\s\S]*?)(\[\[\/module\]\])/gi,(_,a,css,c)=>a+rebaseCSS(css,u)+c)});
   const css=render(expanded.source,{base:url}).css.join("\n");
   const styles=await remote.styles(rebaseCSS(css,url),url);
   results.push({url,warnings:[...expanded.warnings,...styles.warnings],dependencies:expanded.dependencies});
  }catch(error){results.push({url,error:error.message});}
 }
 return results;
}
module.exports={entries,preloadIncludes};

return module.exports; })();
        const results=await preloadIncludes(this.plugin.settings.precacheIncludes,this.plugin.remote,this.plugin.settings.base,p=>{progress.textContent=`正在缓存 ${p.index}/${p.total}：${p.url}`;});
        progress.empty();
        progress.createDiv({text:results.length?`已缓存 ${results.filter(r=>!r.error).length}/${results.length} 个常用 include` : "请先填写常用 include 列表。"});
        for(const result of results)if(result.error||result.warnings.length)progress.createDiv({text:result.url+"："+(result.error||result.warnings.join("；"))});
        this.plugin.refreshViews();
      }catch(error){progress.textContent=error.message;}finally{button.setDisabled(false);}
    }));
    new Setting(this.containerEl).setName("刷新远程引用缓存").setDesc("include 源码与导入样式保存在磁盘，重启后继续使用；仅此按钮清空并重新读取，不会重载网站母体。").addButton(button=>button.setButtonText("清空并刷新").onClick(async()=>{await this.plugin.remote.clear(true);this.plugin.refreshViews();}));
  }
}
module.exports = class WikidotPlugin extends Plugin {
  async onload() {
    this.settings = Object.assign({ base: "https://scp-wiki-cn.wikidot.com/",defaultProfile:"scp-cn",defaultExtension:"ftml",templatePath:"数据库/模板/Wikidot/SCP CN.html",referenceURL:"https://scp-wiki-cn.wikidot.com/main",includesEnabled:true,precacheIncludes:"",liveLayout:true,liveFrames:true,minimalContrast:true,livePositioning:false,profiles:{} }, await this.loadData());
    if(this.settings.referenceURL === "https://scp-wiki-cn.wikidot.com/akaneiro") {this.settings.referenceURL="https://scp-wiki-cn.wikidot.com/main";await this.saveData(this.settings);}
    this.parseHTML=html=>new DOMParser().parseFromString(html,"text/html");
    const adapter=this.app.vault.adapter,cachePath=normalizePath(this.manifest.dir+"/cache/resources.json");
    let values;const readCache=async()=>{if(!values){try{values=JSON.parse(await adapter.read(cachePath));}catch{values={};}}return values;};
    const flush=()=>{this.cacheWrites=(this.cacheWrites||Promise.resolve()).catch(()=>{}).then(async()=>{const dir=cachePath.slice(0,cachePath.lastIndexOf("/"));if(!await adapter.exists(dir))await adapter.mkdir(dir);await adapter.write(cachePath,JSON.stringify(values));});return this.cacheWrites;};
    this.remote=createRemoteClient(requestUrl,this.parseHTML,{rebaseCSS,storage:{read:async key=>(await readCache())[key],write:async(key,value)=>{(await readCache())[key]=value;await flush();},clear:async()=>{await readCache();values={};await flush();},remove:async key=>{const all=await readCache();if(key in all){delete all[key];await flush();}}}});
    this.cacheValues=readCache;
    this.registerView(TYPE, leaf => new WikidotView(leaf, this));
    this.registerExtensions(["wikidot", "ftml", "wd"], TYPE);
    this.addSettingTab(new WikidotSettings(this.app, this));
    this.addCommand({ id: "new-wikidot", name: "New Wikidot draft", callback: () => new DraftModal(this).open() });
    this.addCommand({ id: "new-ftml", name: "New FTML draft", callback: () => new DraftModal(this,undefined,undefined,"ftml").open() });
    const activeView=()=>this.app.workspace.getActiveViewOfType(WikidotView);
    this.addCommand({ id: "manage-includes", name: "Manage include cache", callback: () => new IncludeManager(this,activeView()).open() });
    this.addCommand({ id: "export-html", name: "Export as minimal HTML", checkCallback: checking => { const view=activeView(); if(checking)return !!view?.file; this.exportFile(view,"html"); } });
    this.addCommand({ id: "export-markdown", name: "Export as Markdown", checkCallback: checking => { const view=activeView(); if(checking)return !!view?.file; this.exportFile(view,"md"); } });
    this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => {
      if (!/\.(ftml|wikidot|wd)$/i.test(file.path||"")||file.children) return;
      menu.addItem(item => item.setTitle("Export as minimal HTML").setIcon("file-output").onClick(async () => { const leaf=this.app.workspace.getLeaf(false); await leaf.openFile(file); this.exportFile(leaf.view,"html"); }));
      menu.addItem(item => item.setTitle("Export as Markdown").setIcon("file-output").onClick(async () => { const leaf=this.app.workspace.getLeaf(false); await leaf.openFile(file); this.exportFile(leaf.view,"md"); }));
    }));
    this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => {
      if (file.children) menu.addItem(item => item.setTitle("New Wikidot draft").setIcon("file-code").onClick(() => new DraftModal(this,file.path).open()));
      if (file.children) menu.addItem(item => item.setTitle("New FTML draft").setIcon("file-code").onClick(() => new DraftModal(this,file.path,undefined,"ftml").open()));
    }));
    this.registerEvent(this.app.vault.on("rename",async(file,oldPath)=>{if(this.settings.profiles[oldPath]){this.settings.profiles[file.path]=this.settings.profiles[oldPath];delete this.settings.profiles[oldPath];await this.persist();}}));
    this.registerEvent(this.app.vault.on("delete",async(file)=>{if(this.settings.profiles[file.path]){delete this.settings.profiles[file.path];await this.persist();}}));
  }
  persist() { this.saves=(this.saves || Promise.resolve()).catch(()=>{}).then(()=>this.saveData(this.settings));return this.saves; }
  onunload() {this.remote?.clear();}
  // Export never overwrites: an existing name gets a numeric suffix.
  async exportFile(view,format){
    if(!(view instanceof WikidotView)||!view.file){new Notice("请先打开 Wikidot 文稿");return;}
    try{
      const profile=view.profile(),base=profile.profile!=="minimal"?(profile.referenceURL||this.settings.referenceURL):this.settings.base;
      const text=view.getViewData(),page=view.file.basename,title=profile.title||page;
      const expanded=this.settings.includesEnabled?await expandIncludes(text,url=>this.remote.source(url),{base,tags:(profile.tags||"").split(/\s+/).filter(Boolean)}):{source:text,warnings:[]};
      let output;
      if(format==="md"){
        output='---\n类型: []\ntags: []\n---\n'+toMarkdown(expanded.source,{base,page}).replace(/\n+$/,"");
      }else{
        const result=render(expanded.source,{base,page,title});
        const esc=v=>String(v).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
        // Plain semantic HTML: no site shell, page CSS, scripts or editor markup.
        const body=result.html.replace(/\s(?:data-wd-[\w-]+)="[^"]*"/g,"");
        output=`<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>${esc(title)}</title>\n<style>*,::before,::after{box-sizing:border-box}body{max-width:46em;margin:clamp(1em,4vw,2em) auto;padding:0 clamp(.75em,4vw,1.5em);overflow-wrap:anywhere;font-family:serif;line-height:1.8;color:#222;background:#fff}img,video,iframe{max-width:100%}img{height:auto}table{border-collapse:collapse;display:block;max-width:100%;overflow-x:auto}td,th{border:1px solid #9996;padding:.3em .6em}blockquote{border-left:3px solid #9996;margin-left:0;padding-left:1em}pre{white-space:pre-wrap}</style>\n</head>\n<body>\n<h1>${esc(title)}</h1>\n${body}\n</body>\n</html>\n`;
      }
      const folder=view.file.parent?.path&&view.file.parent.path!=="/"?view.file.parent.path+"/":"";
      let index=0,file;
      while(!file){const path=normalizePath(`${folder}${page}${index?" "+index:""}.${format}`);if(this.app.vault.getAbstractFileByPath(path)){index++;continue;}try{file=await this.app.vault.create(path,output);}catch(error){if(this.app.vault.getAbstractFileByPath(path))index++;else throw error;}}
      new Notice(`已导出：${file.path}`+(expanded.warnings.length?`（${expanded.warnings.length} 个 include 未展开）`:""));
    }catch(error){new Notice("导出失败："+error.message);console.error(error);}
  }
  async setProfile(path,profile) {this.settings.profiles[path]=profile;await this.persist();}
  refreshViews() {for(const leaf of this.app.workspace.getLeavesOfType(TYPE)) {leaf.view.cm?.refresh();leaf.view.updatePreview();}}
  async loadTemplate(profile){
    if(profile.profile==="minimal")return null;
    const configured=profile.profile==="scp-cn"?this.settings.templatePath:(profile.templatePath||this.settings.templatePath);
    const path=normalizePath(!configured||configured==="数据库/模板/Wikidot/SCP CN.html"?this.manifest.dir+"/templates/scp-cn.html":configured);
    if(!/\.html?$/i.test(path)||path.startsWith("/")||path.split("/").includes(".."))throw Error("请选择仓库内的 HTML 文件");
    return localTemplateFromHTML(await this.app.vault.adapter.read(path),profile.referenceURL||this.settings.referenceURL,this.parseHTML);
  }
  async captureTemplate(){
    const shell=await this.remote.template(this.settings.referenceURL);
    if(shell.resourceWarnings?.length)throw Error("基础 CSS 未完整取得，请稍后重试："+shell.resourceWarnings.join("；"));
    const folder="数据库/模板/Wikidot";let current="";
    for(const part of folder.split("/")){current=normalizePath(current+"/"+part);if(!await this.app.vault.adapter.exists(current))await this.app.vault.createFolder(current);}
    let index=0,file;
    while(!file){const path=`${folder}/Site Template${index?" "+index:""}.html`;if(this.app.vault.getAbstractFileByPath(path)){index++;continue;}try{file=await this.app.vault.create(path,serializeTemplate(shell));}catch(error){if(this.app.vault.getAbstractFileByPath(path))index++;else throw error;}}
    this.settings.templatePath=file.path;await this.persist();return file.path;
  }
  async createFile(folder, draft) {
      const parent = folder === undefined ? this.app.fileManager.getNewFileParent(this.app.workspace.getActiveFile()?.path || "").path : folder;
      let index = 0, file;
      while (!file) {
        const extension=draft.extension||this.settings.defaultExtension||"ftml";
        if(!["ftml","wikidot","wd"].includes(extension))throw Error("不支持的文件格式");
        const name = `${draft.name}${index ? " " + index : ""}.${extension}`;
        const path = normalizePath(parent + "/" + name);
        if (this.app.vault.getAbstractFileByPath(path)) { index++; continue; }
        try { file = await this.app.vault.create(path, ""); } catch (error) { if (this.app.vault.getAbstractFileByPath(path)) index++; else throw error; }
      }
      await this.setProfile(file.path,draft.config);
      await this.app.workspace.getLeaf(false).openFile(file);
  }
};
