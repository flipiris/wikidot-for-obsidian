"use strict";
const {prepareSource}=require("./syntax");
const {unixName}=require("./common");
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
