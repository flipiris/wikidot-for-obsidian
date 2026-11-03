const { test } = require('node:test');
const assert = require('node:assert/strict');
const { render, safeUrl } = require('./renderer');
test('headings, inline style, literal text and raw HTML', () => {
  const r = render('+ 标题\n\n**粗体** //斜体// @@**原文**@@ <script>alert(1)</script>');
  assert.match(r.html, /<h1 id="toc0"><span>标题<\/span><\/h1>/);
  assert.match(r.html, /<strong>粗体<\/strong>/);
  assert.match(r.html, /<em>斜体<\/em>/);
  assert.match(r.html, /\*\*原文\*\*/);
  assert.ok(!r.html.includes('<script>'));
});
test('CSS modules preserve order, disable and show', () => {
  const r = render('[[module CSS]]\np{color:red}\n[[/module]]\n[[module CSS disable="true" show="true"]]\np{color:blue}\n[[/module]]\n[[module CSS]]\np{font-size:20px}\n[[/module]]');
  assert.equal(r.css.length, 2); assert.match(r.css[0], /red/); assert.match(r.css[1], /20px/);
  assert.match(r.html, /color:blue/); assert.ok(!r.css.join('').includes('blue'));
});
test('CSS cannot terminate its style element', () => {
  const r = render('[[module CSS]]\n</style><script>alert(1)</script>\n[[/module]]');
  assert.ok(!r.document.includes('</style><script>'));
  assert.match(r.document, /script-src &#39;none&#39;/);
});
test('code blocks protect literal CSS and markup examples', () => {
  const r = render('[[code]]\n[[module CSS]]\na{}\n[[/module]]\n**x**\n\n\nend\n[[/code]]');
  assert.equal(r.css.length, 0); assert.match(r.html, /\n\n\nend/); assert.ok(!r.html.includes('<strong>'));
});
test('nested div, span attrs, collapsible and alignment', () => {
  const r = render('[[div class="outer"]]\n[[div id="inner"]]\n[[span class="red"]]**x**[[/span]]\n[[/div]]\n[[/div]]\n[[collapsible show="展开"]]\nx\n[[/collapsible]]\n[[=]]\n居中\n[[/=]]');
  assert.match(r.html, /<div class="outer"><div id="inner">/);
  assert.match(r.html, /<span class="red"><strong>x<\/strong><\/span>/);
  assert.match(r.html, /<details class="collapsible-block"><summary><span class="collapsible-block-show">展开/);
  assert.match(r.html, /text-align:center/); assert.equal(r.warnings.length, 0);
});
test('attributes cannot inject event handlers', () => {
  const r = render('[[div class="x" onclick="alert(1)" style="color:red"]]\nx\n[[/div]]');
  assert.ok(!r.html.includes('onclick')); assert.match(r.html, /style="color:red"/);
});
test('page links and rejected URL protocols', () => {
  const r = render('[[[scp-001 | 页面]]] [[[javascript:alert(1)]]] [https://example.com 例子]');
  assert.match(r.html, /href="https:\/\/scp-wiki-cn.wikidot.com\/scp-001"/);
  assert.ok(!r.html.includes('href="javascript:')); assert.equal(safeUrl('data:text/html,x'), '');
});
test('lists, table, quotes and unsupported modules', () => {
  const r = render('* one\n* two\n\n||~head||value||\n\n> quote\n\n[[include theme:test]]');
  assert.match(r.html, /<ul><li>one/); assert.match(r.html, /<th>head<\/th>/); assert.match(r.html, /<blockquote>quote/);
  assert.equal(r.warnings.length, 1);
});
test('unclosed blocks warn instead of silently claiming compatibility', () => { assert.ok(render('[[div]]\nx').warnings.length); });
test('CRLF source accepted; no active markup or inline handlers from text', () => {
  const r = render('+ 标题\r\n\r\n<img src=x onerror=alert(1)>');
  assert.match(r.html, /<h1 id=/); assert.ok(!r.html.includes('<img'));
});
// The layout helpers live in the separate flipiris-layout-enhancer plugin.
// When it is not checked out next to this repository those cases are skipped.
let layout = null;
try { layout = require('../flipiris-layout-enhancer/core'); } catch {}
test('packaged plugin entry loads with only the Obsidian runtime', () => {
  const vm = require('node:vm'), fs = require('node:fs'), path = require('node:path');
  const api = { Plugin: class {}, TextFileView: class {}, PluginSettingTab: class {}, Modal: class {} };
  const context = { module: {exports:{}}, require: name => { if(name.startsWith('@codemirror/'))return {}; assert.equal(name, 'obsidian'); return api; }, URL };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8'), context);
  assert.equal(typeof context.module.exports, 'function');
});
test('layout class is opt-in and exact', { skip: !layout }, () => {
  assert.ok(layout.hasClass(['other', 'preserve-layout'], 'preserve-layout'));
  assert.ok(layout.hasClass('other preserve-layout', 'preserve-layout'));
  assert.ok(!layout.hasClass('not-preserve-layout', 'preserve-layout'));
  assert.ok(!layout.hasClass(undefined, 'preserve-layout'));
});
test('layout body retains every original character, including trailing blanks', { skip: !layout }, () => {
  const body = '  第一行\r\n\r\n\r\n\t第二行\r\n\r\n';
  const fm = '---\r\ncssclasses: [preserve-layout]\r\n---\r\n';
  assert.equal(layout.bodyOf(fm + body, () => ({exists:true,contentStart:fm.length})), body);
  assert.equal(layout.bodyOf(body, () => ({exists:false})), body);
});
test('rich edit ranges point to exact original source after CSS/code extraction',()=>{
  const source='[[module CSS]]\n.x {color:red}\n[[/module]]\n\n[[div class="x"]]\n**inside**\n[[/div]]\n\n[[code]]\nliteral\n[[/code]]\n\n+ Last';
  const r=render(source,{editable:true});
  const ranges=[...r.html.matchAll(/data-wd-start="(\d+)" data-wd-end="(\d+)"/g)].map(m=>source.slice(+m[1],+m[2]));
  assert.ok(ranges.includes('**inside**'));assert.ok(ranges.includes('[[div class="x"]]\n**inside**\n[[/div]]'));
  assert.ok(ranges.includes('[[module CSS]]\n.x {color:red}\n[[/module]]'));assert.ok(ranges.includes('[[code]]\nliteral\n[[/code]]'));assert.ok(ranges.includes('+ Last'));
});
test('new drafts are always empty regardless of reference page or supplied example',async()=>{
  const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
  const api={Plugin:class{},TextFileView:class{},PluginSettingTab:class{},Modal:class{},normalizePath:s=>s.replace(/^\//,'')};
  const context={module:{exports:{}},require:name=>name==='obsidian'?api:{},URL};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../main.js'),'utf8'),context);
  const plugin=new context.module.exports();let content,opened;
  plugin.settings={profiles:{}};plugin.saveData=async()=>{};
  plugin.app={vault:{getAbstractFileByPath:()=>null,create:async(name,text)=>{content=text;return {path:name};}},workspace:{getLeaf:()=>({openFile:async file=>opened=file.path})}};
  await plugin.createFile('',{name:'Blank Draft',config:{profile:'scp-cn'},source:'This reference article must never be copied'});
  assert.equal(content,'');assert.equal(opened,'Blank Draft.ftml');
  await plugin.createFile('',{name:'Other Draft',extension:'wd',config:{profile:'minimal'},source:'example'});
  assert.equal(content,'');assert.equal(opened,'Other Draft.wd');
});
test('comments suppress CSS before extraction and code examples stay literal',()=>{
  const r=render('[!--\n[[module CSS]]\np{color:red}\n[[/module]]\n[[code]]\nhidden example\n[[/code]]\n--]\n[[code]]\n[!-- literal --]\n[[/code]]');
  assert.equal(r.css.length,0);assert.ok(!r.html.includes('hidden example'));assert.match(r.html,/\[!-- literal --\]/);
});
test('TOC links use actual heading anchors and omit starred headings',()=>{
  const r=render('[[toc]]\n+ One\n++ Two\n+* Hidden');
  assert.equal(r.warnings.length,0);assert.match(r.html,/href="#toc1"/);assert.match(r.html,/id="toc1"/);assert.ok(!r.html.includes('href="#toc2"'));
});
