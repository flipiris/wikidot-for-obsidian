"use strict";
const {EditorSelection,EditorState,Compartment,StateField,StateEffect,Prec}=require("@codemirror/state");
const {EditorView,Decoration,WidgetType,keymap,dropCursor}=require("@codemirror/view");
const {history,defaultKeymap,historyKeymap,indentWithTab}=require("@codemirror/commands");
const {parseLive,activeLines,revealed,matchingTagPosition,rows,frameStyle,frameClass,touches}=require("./live");
const {completionSource,autoCloseFor,autoInlineFor,analyze}=require("./complete");
const {createCompletionPopup}=require("./popup");
const {createSelectionMenu}=require("./selection");
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
      const {attr}=require("./common"),b=this.block;
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
      const box=el("span","wikidot-live-image"),{render}=require("./renderer");
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
      const box=el("div","wikidot-live-table"),{render}=require("./renderer");
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
      const box=el("div","wikidot-live-layout"+(this.context.liveFrames!==false?" is-framed":"")),{render}=require("./renderer"),{styleFor,declarations}=require("./layout");
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
      const {attr}=require("./common"),open=model.chips[b.open],close=model.chips[b.close];
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
      const {tableKey}=require("./tables"),change=tableKey(view.state.doc.toString(),selection.main.head,event.key,event.shiftKey,parseLive(view.state.doc.toString()).tables);
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
  const {createPointerSelection}=require("./pointer");
  if(typeof createPointerSelection==="function")pointer=createPointerSelection(view,EditorSelection,{enabled:()=>mode==="rich",start:()=>{popup?.close();selectionMenu?.close();},finish:()=>{view.dispatch({effects:pointerEnd.of(null)});selectionMenu?.schedule();}});
  if(typeof createCompletionPopup==="function")popup=createCompletionPopup(view,host.ownerDocument);
  if(typeof createSelectionMenu==="function")selectionMenu=createSelectionMenu(view,host.ownerDocument);
  return {view,setMode(next){if(next===mode)return;mode=next;view.dispatch({effects:rich.reconfigure(mode==="rich"?[field]:[sourceField])});selectionMenu?.schedule();},refresh(){if(mode==="rich")view.dispatch({effects:refreshContext.of(null)});},getValue(){return view.state.doc.toString();},setValue(value){if(value!==view.state.doc.toString())view.dispatch({changes:{from:0,to:view.state.doc.length,insert:value}});},destroy(){pointer?.destroy();popup?.close();selectionMenu?.destroy();view.destroy();}};
}
module.exports={createEditor};
