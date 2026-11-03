const {test}=require('node:test'),assert=require('node:assert/strict'),{parseLive,rows}=require('./live'),{declarations,localRules,styleFor}=require('./layout');
test('layout grid retains complete native frame geometry for editing',()=>{
 const s='[[div style="display:grid;grid-template-columns:3fr 2fr"]]\n\n[[div class="chorus"]]\nA\n[[/div]]\n\n[[div class="chorus"]]\nB\n[[/div]]\n\n[[/div]]\n[[module CSS]]\ndiv.chorus{padding:10px}\n[[/module]]',m=parseLive(s);
 assert.ok(m.divs.every(b=>b.layout));assert.equal(m.lines[3].depth,2);assert.ok(m.divs.find(b=>b.first===0).layout.includes('3fr 2fr'));
 assert.equal(m.chips.filter(c=>c.kind==='open'&&c.box).length,3);
});
test('empty source rows are preserved on either side of tag replacements',()=>{
 const s='before\n[[div]]\n\ntext\n\n[[/div]]\n\nafter',m=parseLive(s);
 for(const i of [2,4,6]){
  const line=m.lines[i];assert.equal(line.cls,'wd-live-empty-line');
  assert.ok(!m.chips.some(c=>c.from<line.from&&c.to>line.from),'no tag replacement covers a blank cursor position');
 }
 const r=rows(m,{broken:new Set(m.chips.filter(c=>c.join!==undefined).map(c=>c.join))});
 assert.ok(r.some(r=>r.at===m.lines[2].from));assert.ok(r.some(r=>r.at===m.lines[4].from));
});
test('local class layout, widths, empty spacers and optional scoped positioning',()=>{
 const rules=localRules('[[module CSS]]\ndiv.side.right{width:40%;margin-left:auto;float:right;color:red}\n[[/module]]');
 assert.equal(styleFor('class="side right"',rules),'width:40%;margin-left:auto;float:right');
 assert.equal(declarations('position:fixed;bottom:1em;width:50%'),'width:50%');
 assert.ok(declarations('position:fixed;bottom:1em',true).includes('position:fixed'));
 assert.equal(parseLive('[[div style="height:150px"]]\n[[/div]]').divs[0].layout,'height:150px');
 assert.equal(parseLive('[[div style="width:50%"]]\ntext\n[[/div]]',{layout:false}).chips[0].box,true);
 assert.equal(declarations('width:expression(alert(1));background:url(x);display:none'),'');
});
