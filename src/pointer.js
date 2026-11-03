"use strict";
const {parseLive}=require("./live");
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
