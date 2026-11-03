const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseLive,activeLines,rows}=require('./live');
test('ordinary prose remains native text without replacements, including long Chinese paragraphs',()=>{
  const source='中文正文🙂，光标应留在点击的文字之间。'.repeat(500)+'\n\n（完。）';
  const model=parseLive(source);
  assert.equal(model.folds.length,0);assert.equal(model.chips.length,0);assert.equal(model.hidden.length,0);assert.equal(model.marks.length,0);
  assert.equal(model.lines.at(-1).to,source.length);
  for(const pos of [0,7,source.length-2]){
    const selected=[{from:pos,to:pos}];assert.ok(activeLines(model,selected).size);assert.equal(selected[0].from,pos);
  }
});
test('page CSS and pseudo element content never become live decorations',()=>{
  const source='[[module CSS]]\n#page-content::after{content:"（完。）"}p{position:fixed;font-size:100px}\n[[/module]]\n\nFirst\n\nLast';
  const model=parseLive(source);
  assert.equal(model.folds.length,1);assert.equal(model.folds[0].kind,'CSS');assert.equal(model.folds[0].label,'[[module CSS]]');
  assert.equal(source.slice(model.folds[0].from,model.folds[0].to),source.slice(0,source.indexOf('\n\n')));
  assert.equal(model.marks.length,0);assert.ok(model.lines.every(line=>!line.style));
});
test('div boundaries preserve editable content and admit layout but reject fixed positioning',()=>{
  const source='[[div class="verse outer" id="work" style="position:fixed;height:150px;color:red"]]\n**inside**\n[[div]]\ninner\n[[/div]]\nmore\n[[/div]]\nnormal';
  const model=parseLive(source);
  assert.equal(model.folds.length,0);assert.equal(model.chips.length,4);
  assert.equal(model.chips[0].label,'div .verse.outer#work');
  assert.equal(source.slice(model.chips[0].revealFrom,model.chips[0].revealTo),source.split('\n')[0]);
  assert.equal(source.slice(model.chips[0].from,model.chips[0].to),source.split('\n')[0]+'\n');
  assert.ok(model.lines.find(line=>source.slice(line.from,line.to)==='inner').depth===2);
  assert.ok(model.lines.find(line=>source.slice(line.from,line.to)==='more').depth===1);
  assert.ok(!model.lines.at(-1).depth);assert.ok(model.divs.some(div=>div.layout.includes("height:150px")));assert.ok(model.lines.every(line=>!line.style.includes("position:fixed")));
  assert.equal(source.slice(model.marks[0].from,model.marks[0].to),'inside');
});
test('inline formatting decorates actual text and only syntax is hidden',()=>{
  const source='🙂 **粗体** //斜体// __下划线__ --删除-- {{code}} @@**literal**@@';
  const model=parseLive(source);
  assert.deepEqual(model.marks.map(m=>source.slice(m.from,m.to)),['粗体','斜体','下划线','删除','code','**literal**']);
  for(const hidden of model.hidden)assert.match(source.slice(hidden.from,hidden.to),/^(?:\*\*|\/\/|__|--|\{\{|\}\}|@@)$/);
  assert.equal(model.folds.length,0);
});
test('links and spans retain original labels with nested Wikidot formatting',()=>{
  const source='[[[page|页面]]] [https://example.com 网页] [[span class="red" style="color:red"]]**文字**[[/span]]';
  const model=parseLive(source);
  assert.equal(model.marks.filter(m=>m.cls==='wd-live-link').map(m=>source.slice(m.from,m.to)).join(','),'页面,网页');
  assert.ok(model.marks.some(m=>m.cls==='wd-live-strong'&&source.slice(m.from,m.to)==='文字'));
  assert.ok(model.marks.every(m=>!m.style));
});
test('code examples and comments do not change div nesting or parse markup',()=>{
  const source='[[code]]\n[[div]]\n**literal**\n[[module CSS]]\na{}\n[[/module]]\n[[/code]]\n[!--\n[[div]]\n--]\nnormal';
  const model=parseLive(source);assert.deepEqual(model.chips.map(c=>c.label),['code','/code']);assert.equal(model.marks.length,0);
  assert.ok(model.lines.slice(1,6).every(line=>line.cls==='wd-live-code-line'));
  assert.equal(model.folds.length,0);assert.equal(model.comments.length,1);assert.ok(!model.lines.at(-1).depth);
});
test('multiple selections reveal markup on each selected line and no others',()=>{
  const model=parseLive('**one**\n**two**\n**three**');
  assert.deepEqual([...activeLines(model,[{from:3,to:3},{from:20,to:20}])],[0,2]);
  assert.deepEqual([...activeLines(model,[{from:5,to:10}])],[0,1]);
});
test('unfinished blocks stay editable without folding away the rest of the draft',()=>{
  const source='[[module CSS]]\nunfinished\n\nnormal';
  const model=parseLive(source);assert.equal(model.folds.length,0);assert.equal(model.lines.at(-1).to,source.length);
});
test('all MODULE types have compact folds including standalone and body modules',()=>{
  const source='[[module rate]]\n\n[[module ListPages category="*"]]\n%%title%%\n[[/module]]\n\n[[module CSS]]\np{}\n[[/module]]';
  const model=parseLive(source);
  assert.deepEqual(model.folds.map(f=>[f.kind,f.lines]),[['rate',1],['ListPages',3],['CSS',3]]);
  assert.equal(source.slice(model.folds[1].from,model.folds[1].to),'[[module ListPages category="*"]]\n%%title%%\n[[/module]]');
});
test('single and multiline includes use the same folding model without parsing their arguments',()=>{
  const source='[[include :scp-wiki-cn:theme:parallel]]\n[[include theme:normal\n|night=-\n|text=**literal parameter**\n]]\n\nbody';
  const model=parseLive(source);
  assert.deepEqual(model.folds.map(f=>[f.kind,f.label,f.lines]),[['Include · :scp-wiki-cn:theme:parallel','[[include :scp-wiki-cn:theme:parallel]]',1],['Include · theme:normal','[[include theme:normal …',4]]);
  assert.equal(model.marks.length,0);assert.equal(model.lines.at(-1).to,source.length);
  const incomplete=parseLive('[[include theme:normal\n|night=-\n\nbody');assert.equal(incomplete.folds.length,0);
});
function editorHarness(text){
  const fs=require('node:fs'),vm=require('node:vm');let definition,effectType;
  const make=(type,spec)=>({range:(from,to=from)=>({from,to,type,spec})});
  const Decoration={set:ranges=>ranges,replace:spec=>make('replace',spec),widget:spec=>make('widget',spec),line:spec=>make('line',spec),mark:spec=>make('mark',spec)};
  const state={doc:{toString:()=>text},selection:{ranges:[{from:0,to:0}]}};
  class View{constructor(){this.state=state;this.dispatched=[];}dispatch(value){this.dispatched.push(value);}focus(){}}
  View.decorations={from:()=>({})};View.atomicRanges={of:()=>({})};View.contentAttributes={of:()=>({})};View.updateListener={of:()=>({})};View.domEventHandlers=()=>({});
  const effects={define:()=>{const type={of:value=>({value,is:other=>other===type})};effectType=type;return type;}};
  const pointer={active:false};
  const api={EditorState:{create:()=>state},StateField:{define:def=>{definition??=def;return def;}},StateEffect:effects,Compartment:class{of(){return [];}reconfigure(){return {};}}};
  const context={module:{exports:{}},require:name=>name==='./pointer'?{createPointerSelection:(_view,_selection,options)=>{pointer.finish=options.finish;return pointer;}}:name==='./common'?require('./common'):name==='./live'?require('./live'):name==='@codemirror/state'?api:name==='@codemirror/view'?{EditorView:View,Decoration,WidgetType:class{},keymap:{of:()=>({})},drawSelection:()=>({}),dropCursor:()=>({})}:{history:()=>({}),defaultKeymap:[],historyKeymap:[]},Set};
  vm.runInNewContext(fs.readFileSync(require.resolve('./editor'),'utf8'),context);
  const host={ownerDocument:{createElement:()=>({events:{},setAttribute(){},addEventListener(name,fn){this.events[name]=fn;}})}};
  const editor=context.module.exports.createEditor({host,text,onChange:()=>{}});
  return {definition,state,editor,effectType,pointer};
}
test('cursor motion reuses decorations within a line and never opens a folded module',()=>{
  const h=editorHarness('[[module CSS]]\np{}\n[[/module]]\n\nLong ordinary paragraph');
  const value=h.definition.create(h.state);assert.equal(value.atomic.length,1);assert.equal(value.opened.size,0);
  const nextState={...h.state,selection:{ranges:[{from:6,to:6}]}};
  assert.equal(h.definition.update(value,{docChanged:false,selection:{},effects:[],state:nextState}),value);
  const bodyState={...h.state,selection:{ranges:[{from:40,to:40}]}};
  const moved=h.definition.update(value,{docChanged:false,selection:{},effects:[],state:bodyState});
  assert.equal(moved.atomic.length,1);assert.equal(moved.opened.size,0);assert.equal(h.editor.view.dispatched.length,0);
});
test('module controls explicitly expand and collapse independently of selections',()=>{
  const h=editorHarness('[[module CSS]]\np{}\n[[/module]]\n\nBody');let value=h.definition.create(h.state);
  const openEffect=h.effectType.of({from:0,open:true});
  value=h.definition.update(value,{docChanged:false,selection:undefined,effects:[openEffect],state:h.state});
  assert.equal(value.atomic.length,0);assert.ok(value.opened.has(0));
  const header=value.decorations.find(r=>r.type==='widget').spec.widget.toDOM(h.editor.view);
  assert.equal(header.textContent,'▾ 收起 · 3 行');
  header.events.mousedown({button:0,preventDefault(){},stopPropagation(){}});
  const toggle=h.editor.view.dispatched.at(-1);assert.equal(toggle.effects.value.open,false);
  value=h.definition.update(value,{docChanged:false,selection:toggle.selection,effects:[toggle.effects],state:h.state});assert.equal(value.atomic.length,1);
});
test('block tags join neighbouring lines so the frame adds no rows',()=>{
  const source='before\n[[div class="side-menu"]]\n[[toc]]\n[[/div]]\n[[div style="height:150px;"]]\n[[/div]]\nafter';
  const model=parseLive(source),[open,close,,empty,emptyClose]=model.chips.filter(c=>c.kind!=='toc').concat([]);
  assert.equal(source.slice(open.from,open.to),'[[div class="side-menu"]]\n');
  assert.equal(source.slice(close.from,close.to),'\n[[/div]]');
  const broken=new Set(model.chips.filter(c=>c.join!==undefined).map(c=>c.join));
  const visual=rows(model,{broken});
  assert.equal(visual.length,4,'before / framed toc row / framed empty div / after');
  assert.deepEqual(visual[1].top,[1]);assert.deepEqual(visual[1].bottom,[1]);
  assert.equal(model.chips.find(c=>c.kind==='toc').label,'目录');
});
test('headings feed the live table of contents and keep their marker for the right edge',()=>{
  const model=parseLive('+ 一\n++ **二**\n+* 隐藏\n[[f>toc]]');
  assert.deepEqual(model.headings.map(h=>[h.level,h.text,h.hidden]),[[1,'一',false],[2,'二',false],[1,'隐藏',true]]);
  assert.ok(model.marks.some(m=>m.cls==='wd-live-heading-mark'));
  assert.equal(model.chips.at(-1).float,'right');
});
test('tabview tabs are collected with hide ranges that leave no empty row',()=>{
  const source='[[tabview]]\n[[tab 甲]]\nA\n[[/tab]]\n[[tab 乙]]\nB\n[[/tab]]\n[[/tabview]]';
  const model=parseLive(source),tabs=model.tabviews[0].tabs;
  assert.deepEqual(tabs.map(t=>t.name),['甲','乙']);
  assert.equal(source.slice(tabs[1].hideFrom,tabs[1].hideTo),'\n[[tab 乙]]\nB\n[[/tab]]');
});
test('size keywords and nested spans decorate in live editing',()=>{
  const source='[[size xx-large]]大[[/size]] [[span class="a"]]外[[span class="b"]]内[[/span]][[/span]]';
  const model=parseLive(source);
  assert.ok(model.marks.some(m=>m.style==='font-size:xx-large'&&source.slice(m.from,m.to)==='大'));
  assert.ok(model.hidden.every(h=>/^\[\[\/?(?:size|span)[^\]]*\]\]$/.test(source.slice(h.from,h.to))));
});

test('alignment boundaries are visible during body editing and rules hide their source',()=>{
 const {revealed}=require('./live'),source='[[=]]\ncenter\n[[/=]]\n---\nend',m=parseLive(source);
 assert.equal(revealed(m,m.chips[0],[{from:8,to:8}],new Set([1])),true);
 assert.equal(m.lines[2].style,'text-align:center');
 assert.ok(m.hidden.some(h=>source.slice(h.from,h.to)==='---'));
});
test('collapsibles are functional blocks, not div boxes, and image source is retained',()=>{
 const m=parseLive('[[collapsible show="更多"]]\nbody\n[[/collapsible]]\n[[=image https://example.com/a.png]]');
 assert.equal(m.collapsibles.length,1);assert.equal(m.chips[0].box,false);
 assert.equal(m.chips.at(-1).kind,'image');assert.ok(m.chips.at(-1).source.includes('a.png'));
});
test('include closes when selection leaves but modules remain manually controlled',()=>{
 const h=editorHarness('[[include a]]\nbody');let v=h.definition.create(h.state);
 v=h.definition.update(v,{docChanged:false,effects:[h.effectType.of({from:0,open:true})],state:h.state});
 assert.ok(v.opened.has(0));
 v=h.definition.update(v,{docChanged:false,selection:{},effects:[],state:{...h.state,selection:{ranges:[{from:16,to:16}]}}});
 assert.equal(v.opened.size,0);
});

test('hidden tabs supersede nested folds without overlapping replacements',()=>{
 const h=editorHarness('outside\n[[tabview]]\n[[tab one]]\nA\n[[/tab]]\n[[tab two]]\n[[include a]]\n[[collapsible]]\nB\n[[/collapsible]]\n[[/tab]]\n[[/tabview]]');
 const v=h.definition.create(h.state),r=v.decorations.filter(r=>r.type==='replace').sort((a,b)=>a.from-b.from);
 for(let i=1;i<r.length;i++)assert.ok(r[i].from>=r[i-1].to,'replacement spans cannot overlap');
});

test('blank cursor targets carry source positions and nested frame rows have no external gaps',()=>{
 const text='before\n[[div]]\n\n[[div]]\ninside\n[[/div]]\n\n[[/div]]\nafter',h=editorHarness(text),value=h.definition.create(h.state);
 const blank=value.decorations.find(r=>r.type==='line'&&r.from===value.model.lines[2].from);
 assert.ok(blank.spec.attributes.class.includes('wd-live-empty-line'));assert.equal(blank.spec.attributes['data-wd-line'],String(blank.from));
 for(const r of value.decorations.filter(r=>r.type==='line'))if(r.spec.attributes.class.includes('wd-live-box')&&!r.spec.attributes.class.includes('wd-live-box-top')&&!r.spec.attributes.class.includes('wd-live-box-bottom'))assert.ok(!r.spec.attributes.style.includes('margin-top:.75em'));
});

test('paired block endpoints appear throughout body editing and disappear together outside',()=>{
 const {revealed,matchingTagPosition}=require('./live');
 for(const tag of ['=','==','<','>','div','collapsible','tabview']){
  const source='before\n[['+tag+']]\nbody\n[[/'+tag+']]\nafter',m=parseLive(source),open=m.chips.find(c=>c.kind==='open'),close=m.chips[open.pair];
  for(const c of [open,close])for(const selected of [open,close])assert.equal(revealed(m,c,[{from:selected.revealFrom+2,to:selected.revealFrom+2}],new Set()),true,tag);
  assert.equal(revealed(m,open,[{from:source.indexOf('body')+1,to:source.indexOf('body')+1}],new Set()),tag!=='div');
  assert.equal(revealed(m,open,[{from:0,to:0}],new Set()),false);
  assert.equal(matchingTagPosition(m,open.revealFrom+2),close.revealFrom);assert.equal(matchingTagPosition(m,close.revealFrom+2),open.revealFrom);
 }
});

test('alignment remains unchanged while typing in body or its empty source rows',()=>{
 const {revealed}=require('./live');
 for(const [tag,align] of [['=','center'],['==','justify'],['<','left'],['>','right']]){
  const s='before\n[['+tag+']]\nfirst\n\nlast\n[[/'+tag+']]\nafter',m=parseLive(s),open=m.chips[0],close=m.chips[open.pair];
  for(const i of [2,3,4]){
   const pos=m.lines[i].from;assert.equal(revealed(m,open,[{from:pos,to:pos}],new Set([i])),true);assert.equal(revealed(m,close,[{from:pos,to:pos}],new Set([i])),true);
   assert.equal(m.lines[i].style,'text-align:'+align);
  }
 }
});

test('pointer gestures keep native block geometry stable until the exact selection is committed',()=>{
 const text='outside\n[[=]]\ncenter\n[[/=]]\n[[div]]\nbody\n[[/div]]',h=editorHarness(text),initial=h.definition.create(h.state),pos=text.indexOf('center')+2;
 const state={...h.state,selection:{ranges:[{from:pos,to:pos}]}};
 h.pointer.active=true;
 const held=h.definition.update(initial,{selection:{},docChanged:false,effects:[],state});assert.equal(held,initial);
 h.pointer.active=false;h.pointer.finish();
 const effect=h.editor.view.dispatched.at(-1).effects;
 const released=h.definition.update(held,{docChanged:false,effects:[effect],state});
 assert.ok(released.decorations.some(r=>r.type==='mark'&&r.spec.class==='wd-live-tag-source'&&r.from===text.indexOf('[[=]]')));
 assert.ok(released.decorations.some(r=>r.type==='mark'&&r.spec.class==='wd-live-tag-source'&&r.from===text.indexOf('[[/=]]')));
});
test('layout text is not an atomic cursor obstacle and receives mouse selection events',()=>{
 const h=editorHarness('outside\n[[div style="width:60%"]]\nbody\n[[/div]]'),v=h.definition.create(h.state),block=v.model.divs[0];
 assert.ok(!v.atomic.some(r=>r.from===block.from&&r.to===block.to));
 const widget=v.decorations.find(r=>r.type==='replace'&&r.from===block.from&&r.to===block.to).spec.widget;
 assert.equal(widget.ignoreEvent({type:'mousedown'}),false);assert.equal(widget.ignoreEvent({type:'mouseup'}),false);
});

test('hidden empty div closer retains a bottom frame edge',()=>{
 const h=editorHarness('before\n[[div class="myBasicBlock"]]\n\n[[/div]]\n[[>]]\nafter\n[[/>]]'),v=h.definition.create(h.state);
 const closing=v.decorations.find(r=>r.type==='line'&&r.spec.attributes.class.includes('wd-live-box-bottom'));
 assert.ok(closing);assert.ok(closing.spec.attributes.class.includes('wd-live-hidden-tag-row'));
 const css=require('node:fs').readFileSync(require.resolve('../styles.css'),'utf8');
 assert.match(css,/\.wd-live-hidden-tag-row\.wd-live-box-bottom[^}]*border-bottom:1px solid var\(--wd-box-border\) !important/);
});

 test('nested live divs keep one layout subtree, frames off means no source boxes',()=>{
  const source='outside\n[[div class="blockquote"]]\n[[div class="web-archive forum"]]\n[[div class="forum-post"]]\n[[div class="post-title"]]\n标题\n[[/div]]\n[[div style="margin-left:3rem;margin-top:-1.5rem"]]\n时间\n[[/div]]\n正文\n[[div class="blockquote"]]\n引用\n[[/div]]\n[[div class="meta-title"]]\n**文件：a.zip**[!-- https://example.com --]\n[[/div]]';
  for(const layout of [false,true])for(const frames of [false,true])for(const positioning of [false,true]){
   const m=parseLive(source,{layout,frames,positioning});
   assert.equal(m.comments.length,1);assert.equal(m.chips.filter(c=>c.kind==='warn').length,0);
   if(!frames)assert.ok(m.chips.filter(c=>c.tag==='div').every(c=>!c.box));
   if(layout){const outer=m.divs.find(b=>b.first===1);assert.ok(outer.layout);assert.equal(outer.to,source.length);}
  }
 });
 test('inline and multiline comments hide independently of the surrounding paragraph',()=>{
  const text='outside\n**文件：a.zip**[!-- [[div]]\nsecret\n--]正文';
  const h=editorHarness(text),v=h.definition.create(h.state),comment=v.model.comments[0];
  assert.ok(v.decorations.some(r=>r.type==='replace'&&r.from===comment.from&&r.to===comment.to));
  const state={...h.state,selection:{ranges:[{from:comment.from+5,to:comment.from+5}]}};
  const selected=h.definition.update(v,{selection:{},docChanged:false,effects:[],state});
  assert.ok(selected.decorations.some(r=>r.type==='mark'&&r.spec.class==='wd-live-comment'));
  assert.equal(v.model.chips.length,0);
 });

test('editing an ancestor never leaves a rendered child interrupting its source frame',()=>{
 const text='outside\n[[div class="outer"]]\n[[div class="inner"]]\n标题\n[[/div]]\n[[div style="margin-left:3rem;margin-top:-1.5rem"]]\n时间\n[[/div]]\n正文\n[[/div]]';
 const h=editorHarness(text),initial=h.definition.create(h.state);
 for(const pos of [text.indexOf('标题'),text.indexOf('正文'),text.lastIndexOf('[[/div]]')+2]){
  const state={...h.state,selection:{ranges:[{from:pos,to:pos}]}};
  const v=h.definition.update(initial,{selection:{},docChanged:false,effects:[],state});
  assert.ok(!v.decorations.some(r=>r.type==='replace'&&r.spec.widget?.block),'no layout island inside native ancestor');
  assert.ok(v.model.lines.filter(l=>['标题','时间','正文'].includes(text.slice(l.from,l.to))).every(l=>l.depth>0));
 }
});
