const { test } = require('node:test');
const assert = require('node:assert/strict');
const { SLASH, collectClasses, openTags, analyze, completions, autoCloseFor, completionSource } = require('./complete');

const draft = '[[div class="verse outer"]]\n[[div class="verse inner"]]\nx\n[[/div]]\n[[/div]]\n\n[[span class="tag"]]y[[/span]]\n\n[[module CSS]]\n.verse { color:red }\n.inner::after { content:"x" }\n@import url("https://fonts.example/a.css");\n[[/module]]';
test('class scan reads class attributes and CSS module selectors', () => {
  const found = collectClasses(draft).map(item => item.name);
  assert.ok(found.includes('verse'));
  assert.ok(found.includes('outer'));
  assert.ok(found.includes('inner'));
  assert.ok(found.includes('tag'));
  assert.ok(!found.includes('css'), 'file extensions are not class names');
  assert.ok(!found.includes('after'), 'pseudo elements are not offered');
  const verse = collectClasses(draft).find(item => item.name === 'verse');
  assert.ok(verse.count >= 3);
});
test('open tags are tracked for the closing suggestion', () => {
  assert.deepEqual(openTags('[[div]]\n[[span]]\n[[/span]]\n', 25), ['div']);
  assert.deepEqual(openTags('[[div]]\n[[div]]\n', 16), ['div', 'div']);
});
test('slash on a fresh line lists paired snippets with carets inside', () => {
  const result = completions('/', 1);
  assert.equal(result.from, 0);
  const labels = result.options.map(option => option.label);
  assert.ok(labels.includes('[[div]]'));
  assert.ok(labels.includes('[[tabview]]'));
  assert.ok(labels.includes('[[module CSS]]'));
  for (const option of SLASH) {
    assert.ok(option.cursor >= 0 && option.cursor <= option.text.length, option.label + ' cursor in range');
    const opened = /\[\[([a-zA-Z]+)/.exec(option.text);
    if (opened && option.text.includes('[[/')) assert.ok(option.text.includes('[[/' + opened[1] + ']]'), option.label + ' is paired');
    const aligned = /\[\[([=<>]{1,2})\]\]\n/.exec(option.text);
    if (aligned) assert.ok(option.text.includes('[[/' + aligned[1] + ']]'), option.label + ' is closed');
  }
  assert.equal(completions('https://example.com/', 20), null, 'URL slashes do not open the menu');
});
test('tag, attribute and class contexts complete separately', () => {
  const tag = completions(draft, draft.indexOf('[[di') + 4);
  assert.ok(tag.options.some(option => option.label === 'div'));
  const text = '[[div cla';
  const attr = completions(text, text.length);
  assert.ok(attr.options.some(option => option.label === 'class'));
  const open = draft.slice(0, draft.indexOf('x\n[[/div]]')) + '[[div class="';
  const classes = completions(open, open.length);
  assert.ok(classes.options.some(option => option.label === 'verse'));
  const second = draft + '[[div class="verse ou';
  const filtered = completions(second, second.length);
  assert.deepEqual(filtered.options.map(option => option.label), ['outer']);
  const used = draft + '[[div class="verse ';
  assert.ok(!completions(used, used.length).options.some(option => option.label === 'verse'));
});
test('closing tags suggest the most recent open block first', () => {
  const text = '[[div class="a"]]\n[[collapsible]]\n[[/';
  const result = completions(text, text.length);
  assert.equal(result.options[0].label, '[[/collapsible]]');
  assert.equal(result.options[0].text, 'collapsible]]');
  assert.ok(result.options.some(option => option.label === '[[/div]]'));
});
test('auto pairing closes an unpaired block once and only at line end', () => {
  assert.equal(autoCloseFor('[[div]]', 7), 'div');
  const collapsible = '  [[collapsible show="x"]]';
  assert.equal(autoCloseFor(collapsible, collapsible.length), 'collapsible');
  assert.equal(autoCloseFor('[[span]]', 8), null, 'inline span is not auto closed');
  assert.equal(autoCloseFor('[[div]]\n[[/div]]', 7), null, 'already paired');
  assert.equal(autoCloseFor('[[code]]\n[[div]]', 16), null, 'examples inside code stay literal');
  assert.equal(autoCloseFor('[[div]]text', 7), null, 'cursor must sit at the end of the line');
  assert.equal(autoCloseFor('[[div]]\ntext', 7), 'div');
  const nested = '[[div class="outer"]]\n[[div]]\n\ncontent\n[[/div]]\n[[/div]]';
  assert.equal(autoCloseFor(nested, nested.indexOf('[[div]]') + 7), 'div', 'nested blocks still pair');
});
test('completion source exposes apply handlers for the editor', () => {
  const source = completionSource({ state: { doc: { toString: () => '/' } }, pos: 1 });
  assert.equal(source.from, 0);
  assert.ok(source.options.length > 10);
  for (const option of source.options) assert.equal(typeof option.apply, 'function');
});

 test('formatting is first, alignment precedes insertions and inline typing pairs safely',()=>{
 const {SLASH,autoInlineFor}=require('./complete');
 assert.equal(SLASH[0].label,'加粗');
 assert.ok(SLASH.findIndex(s=>s.label.includes('居中'))<SLASH.findIndex(s=>s.label==='[[include]]'));
 for(const [text,expected] of [['**','**'],['//','//'],['__','__'],['{{','}}'],['https://',null],['**word**',null],['---',null]])assert.equal(autoInlineFor(text,text.length),expected);
 });

test('alignment tags close automatically and are suggested as their own pair',()=>{
 for(const tag of ['=','==','<','>']){
  const s='[['+tag+']]';assert.equal(autoCloseFor(s,s.length),tag);
  const closed=s+'\n[[/'+tag+']]';assert.equal(autoCloseFor(closed,s.length),null);
  const partial=s+'\ntext\n[[/';assert.equal(completions(partial,partial.length).options[0].label,'[[/'+tag+']]');
  assert.equal(completions('[['+tag,tag.length+2).options[0].text,tag);
 }
});
