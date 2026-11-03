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
