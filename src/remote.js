"use strict";
const {imports}=require("./css");
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
