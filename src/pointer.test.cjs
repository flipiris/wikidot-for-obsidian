const {test}=require('node:test'),assert=require('node:assert/strict');
const {projection,sourceOffset,domPoint,clickRange,createPointerSelection}=require('./pointer');
test('rendered text offsets pass through nested styles, links and paired block syntax',()=>{
 const source='[[div style="width:60%"]]\n[[=]]\n**甲乙**、//甲乙//和[[[target|页面]]]🙂\n[[/=]]\n[[/div]]',text='甲乙、甲乙和页面🙂';
 const p=projection(source);assert.equal(p.text.replace(/\s/g,''),text);
 for(const [offset,at] of [[0,source.indexOf('甲乙')],[3,source.lastIndexOf('甲乙')],[6,source.indexOf('页面')],[8,source.indexOf('🙂')]])assert.equal(sourceOffset(source,text,offset),at);
 assert.equal(sourceOffset(source,text,text.length),source.indexOf('🙂')+2);
});
test('multiline paragraphs, repeated words and whitespace preserve distinct source positions',()=>{
 const source='甲 **重复**\n乙 __重复__ 尾',text='甲 重复\n乙 重复 尾';
 for(const offset of [0,2,3,5,7,8,10]){
  const actual=sourceOffset(source,text,offset);assert.equal(source[actual],text[offset],`rendered ${offset} mapped to ${actual}`);
 }
});
function harness(){
 const text='before\n中文测试文本\nafter',listeners=new Map(),winListeners=new Map();
 const parent={nodeType:1,closest:()=>null},node={nodeType:3,parentElement:parent};
 const doc={defaultView:{requestAnimationFrame(fn){queueMicrotask(fn)},addEventListener(n,fn){winListeners.set(n,fn)},removeEventListener(n){winListeners.delete(n)}},caretRangeFromPoint(x){return {startContainer:node,startOffset:x}},addEventListener(n,fn){listeners.set(n,fn)},removeEventListener(n){listeners.delete(n)}};
 const range=(anchor,head)=>({anchor,head,from:Math.min(anchor,head),to:Math.max(anchor,head),extend(from,to){return range(anchor,head<anchor?from:to)}});
 const Selection={range,create(ranges){return {ranges,main:ranges[0],replaceRange(r){return Selection.create([r])},addRange(r){return Selection.create([...ranges,r])},map(){return this}}}};
 const view={contentDOM:{ownerDocument:doc,contains:()=>true},state:{doc:{length:text.length,toString:()=>text,lineAt(pos){let from=text.lastIndexOf('\n',pos-1)+1,to=text.indexOf('\n',pos);if(to<0)to=text.length;return {from,to,text:text.slice(from,to)}}},selection:Selection.create([range(0,0)])},focus(){this.focused=true},dispatch(tr){this.state.selection=tr.selection},posAtDOM:(_node,offset)=>offset,posAtCoords:()=>0};
 return {view,Selection,listeners,winListeners,node};
}
test('DOM glyph hit testing wins over a wrong height-map coordinate',()=>{
 const h=harness();assert.equal(domPoint(h.view,{clientX:9,clientY:1000,target:h.node}),9);
});
test('mouse gestures retain forward, reverse, shift and multiple selections until release',async()=>{
 const h=harness();let starts=0,finishes=0;const pointer=createPointerSelection(h.view,h.Selection,{enabled:()=>true,start(){starts++},finish(){finishes++}});
 const event=x=>({button:0,detail:1,clientX:x,clientY:5,target:h.node});
 const style=pointer.style(event(8));assert.equal(pointer.active,true);assert.equal(starts,1);
 assert.equal(style.get(event(12),false,false).main.anchor,8);assert.equal(style.get(event(12),false,false).main.head,12);
 assert.equal(style.get(event(7),false,false).main.anchor,8);assert.equal(style.get(event(7),false,false).main.head,7);
 assert.equal(style.get(event(12),true,false).main.anchor,0);
 assert.equal(style.get(event(12),false,true).ranges.length,2);
 style.get(event(10),false,false);
 h.listeners.get('mouseup')({...event(12),type:'mouseup'});await Promise.resolve();assert.equal(h.view.state.selection.main.head,12);assert.equal(pointer.active,false);assert.equal(finishes,1);assert.equal(h.view.focused,true);
 pointer.destroy();assert.equal(h.listeners.size,0);assert.equal(h.winListeners.size,0);
});
test('double clicks select words, triple clicks select the actual source line',()=>{
 const h=harness();assert.deepEqual(clickRange(h.view.state,9,3),{from:7,to:13});
 const r=clickRange(h.view.state,9,2);assert.ok(r.from>=7&&r.to<=13&&r.to>r.from);
});

 test('leaving the app during a gesture releases its geometry lock without stealing focus',async()=>{
  const h=harness();let finished=0;const pointer=createPointerSelection(h.view,h.Selection,{enabled:()=>true,start(){},finish(){finished++}});
  pointer.style({button:0,clientX:8,clientY:1,target:h.node});
  h.winListeners.get('blur')({type:'blur'});await Promise.resolve();
  assert.equal(pointer.active,false);assert.equal(finished,1);assert.ok(!h.view.focused);pointer.destroy();
 });

test('edge dragging scrolls the real editor pane until release and cancels its frame',async()=>{
 const h=harness(),frames=new Map();let id=0;
 const win=h.view.contentDOM.ownerDocument.defaultView;
 win.requestAnimationFrame=fn=>{frames.set(++id,fn);return id};win.cancelAnimationFrame=id=>frames.delete(id);
 const pane={scrollTop:100,getBoundingClientRect:()=>({top:0,bottom:200,height:200})};
 h.view.dom={closest:()=>pane};
 const pointer=createPointerSelection(h.view,h.Selection,{enabled:()=>true,start(){},finish(){}});
 const e={button:0,detail:1,clientX:8,clientY:100,target:h.node};pointer.style(e);
 h.listeners.get('mousemove')({...e,clientY:195});
 const run=()=>{const [id,fn]=frames.entries().next().value;frames.delete(id);fn()};run();
 assert.ok(pane.scrollTop>100);assert.equal(h.view.state.selection.main.anchor,8);
 h.listeners.get('mousemove')({...e,clientY:5});const before=pane.scrollTop;run();assert.ok(pane.scrollTop<before);
 h.listeners.get('mouseup')({...e,type:'mouseup'});run();assert.equal(pointer.active,false);assert.equal(frames.size,0);
 pointer.destroy();assert.equal(h.listeners.size,0);
});
