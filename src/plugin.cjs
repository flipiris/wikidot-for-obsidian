"use strict";
const { Plugin, TextFileView, Notice, PluginSettingTab, Setting, Modal, requestUrl, normalizePath } = require("obsidian");
const { render, safeUrl, rebaseCSS } = require("./renderer");
const { expandIncludes } = require("./includes");
const { createRemoteClient, publicPageURL, localTemplateFromHTML, serializeTemplate } = require("./remote");
const { createEditor } = require("./editor");
const { IncludeManager } = require("./manager");
const { toMarkdown } = require("./markdown");
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
        const {preloadIncludes}=require("./precache");
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
    this.settings = Object.assign({ base: "https://scp-wiki-cn.wikidot.com/",defaultProfile:"scp-cn",defaultExtension:"ftml",templatePath:"",referenceURL:"https://scp-wiki-cn.wikidot.com/main",includesEnabled:true,precacheIncludes:"",liveLayout:true,liveFrames:true,minimalContrast:true,livePositioning:false,profiles:{} }, await this.loadData());
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
    const path=normalizePath(configured||this.manifest.dir+"/templates/scp-cn.html");
    if(!/\.html?$/i.test(path)||path.startsWith("/")||path.split("/").includes(".."))throw Error("请选择仓库内的 HTML 文件");
    return localTemplateFromHTML(await this.app.vault.adapter.read(path),profile.referenceURL||this.settings.referenceURL,this.parseHTML);
  }
  async captureTemplate(){
    const shell=await this.remote.template(this.settings.referenceURL);
    if(shell.resourceWarnings?.length)throw Error("基础 CSS 未完整取得，请稍后重试："+shell.resourceWarnings.join("；"));
    const folder="Wikidot Templates";let current="";
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
