const {test}=require('node:test'),assert=require('node:assert/strict');
const {parseLive,rows,frameStyle}=require('./live'),{simpleCells,tableKey}=require('./tables'),{render}=require('./renderer');
const source='before\n||~ 名称 ||~ 值 ||\n|| A || = B ||\nafter';
test('simple table group records editable cell offsets and renders shared preview markup',()=>{
 const m=parseLive(source),t=m.tables[0];assert.equal(m.tables.length,1);assert.equal(t.cells.length,4);
 assert.equal(source.slice(t.cells[0].from,t.cells[0].to).trim(),'名称');
 assert.equal(source.slice(t.cells[3].from,t.cells[3].to).trim(),'B');
 assert.match(render(t.source).html,/<th>名称<\/th>/);assert.match(render(t.source).html,/<td style="text-align:center">B<\/td>/);
});
test('advanced table records source targets, ignores examples inside raw code/modules',()=>{
 const m=parseLive('[[table]]\n[[row]]\n[[hcell]]Name[[/hcell]]\n[[cell]]Value[[/cell]]\n[[/row]]\n[[/table]]');
 assert.equal(m.tables.length,1);assert.equal(m.tables[0].cells.length,2);assert.equal(m.tables[0].simple,false);
 assert.equal(parseLive('[[code]]\n|| x || y ||\n[[/code]]').tables.length,0);
 assert.equal(parseLive('[[module CSS]]\n|| x || y ||\n[[/module]]').tables.length,0);
});
test('Tab, Shift Tab and row continuation keep existing table contents',()=>{
 const t=parseLive(source).tables[0],move=(pos,key,back=false)=>tableKey(source,pos,key,back,[t]);
 assert.equal(move(t.cells[0].from,'Tab').selection.anchor,t.cells[1].from);
 assert.equal(move(t.cells[2].from,'Tab',true).selection.anchor,t.cells[1].from);
 const change=move(t.cells[3].from,'Tab');assert.equal(change.changes.insert,'\n||  ||  ||');
 assert.equal(move(t.to,'Enter').changes.insert,change.changes.insert);
 assert.equal(move(t.cells[0].from,'Enter'),null);assert.equal(tableKey(source,0,'Tab',false,[t]),null);
});
test('colspan width is preserved when creating a new row',()=>{
 const s='|| A |||| B ||',t=parseLive(s).tables[0];assert.equal(simpleCells(s)[1].span,2);
 assert.equal(tableKey(s,t.to,'Tab',false,[t]).changes.insert,'\n||  ||  ||  ||');
});
test('block spacing survives joined source rows and nested frame padding retains its compact inset',()=>{
 const m=parseLive('[[div]]\ntext\n[[/div]]'),broken=new Set(m.chips.map(c=>c.join)),r=rows(m,{broken})[0];
 assert.equal(r.spaceTop,true);assert.equal(r.spaceBottom,true);assert.match(frameStyle(r),/padding-left:14px/);
 assert.equal(parseLive('plain\ntext').lines.some(l=>l.spaceTop||l.spaceBottom),false);
});
