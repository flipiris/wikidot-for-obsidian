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
    const {preloadIncludes}=require("./precache");
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
