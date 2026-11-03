const {test}=require('node:test'),assert=require('node:assert/strict'),{wrapSelection,ACTIONS}=require('./selection');
function result(s,from,to,id){const c=wrapSelection(s,from,to,id);return {c,text:s.slice(0,c.changes.from)+c.changes.insert+s.slice(c.changes.to)};}
test('inline styles preserve selected text and surrounding prose',()=>{
 for(const a of ACTIONS.filter(a=>!a.block)){
  const {c,text}=result('前文正文后文',2,4,a.id);assert.equal(text,'前文'+a.open+'正文'+a.close+'后文');assert.equal(text.slice(c.selection.anchor,c.selection.head),'正文');
 }
});
test('block styles use standalone paired tags without consuming adjacent prose',()=>{
 for(const a of ACTIONS.filter(a=>a.block)){
  const {c,text}=result('前文正文后文',2,4,a.id);assert.equal(text,'前文\n[['+a.block+']]\n正文\n[[/'+a.block+']]\n后文');assert.equal(text.slice(c.selection.anchor,c.selection.head),'正文');
 }
});
test('block wrapping preserves blank lines and existing boundary newlines',()=>{
 const {text}=result('前\n甲\n\n乙\n后',2,7,'center');assert.equal(text,'前\n[[=]]\n甲\n\n乙\n[[/=]]\n后');
 const s='甲\n\n乙',r=result(s,0,s.length,'bold');assert.equal(r.text,'**甲**\n\n**乙**');
});
test('invalid and empty selections do not edit',()=>{
 assert.equal(wrapSelection('abc',1,1,'bold'),null);assert.equal(wrapSelection('abc',0,3,'unknown'),null);assert.equal(wrapSelection('abc',0,9,'center'),null);
});

test('selection toolbar opens, applies a block using current selection, dismisses and cleans up',()=>{
 const {createSelectionMenu}=require('./selection');let text='before text after',shown=[];const listeners=new Map();
 const doc={defaultView:{innerWidth:900,innerHeight:700,addEventListener(){},removeEventListener(){}},body:{appendChild(el){shown.push(el);}},addEventListener(n,fn){listeners.set(n,fn);},removeEventListener(n){listeners.delete(n);},createElement(){return {style:{},children:[],events:{},setAttribute(){},appendChild(el){this.children.push(el);},addEventListener(n,fn){this.events[n]=fn;},remove(){this.removed=true;},contains(){return false;},focus(){}};}};
 const selection=(from,to)=>({main:{from,to,empty:from===to},ranges:[{from,to}]});
 const view={state:{doc:{toString:()=>text},selection:selection(7,11)},coordsAtPos:()=>({left:100,top:100,bottom:120}),focus(){this.focused=true;},dispatch(c){text=text.slice(0,c.changes.from)+c.changes.insert+text.slice(c.changes.to);this.state={doc:{toString:()=>text},selection:selection(c.selection.anchor,c.selection.head)};}};
 const menu=createSelectionMenu(view,doc);menu.sync();assert.equal(menu.open,true);assert.equal(shown[0].children.length,10);
 menu.apply('center');assert.equal(text,'before \n[[=]]\ntext\n[[/=]]\n after');assert.equal(view.focused,true);
 assert.equal(menu.handleKey({key:'Escape'}),true);assert.equal(menu.open,false);menu.sync();assert.equal(menu.open,false);
 menu.destroy();assert.equal(listeners.size,0);
});

test('block formatting after inline formatting keeps delimiters inside the block',()=>{
 const {text}=result('前 **正文** 后',4,6,'center');assert.equal(text,'前 \n[[=]]\n**正文**\n[[/=]]\n 后');
});
