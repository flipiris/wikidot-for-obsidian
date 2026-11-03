const { test } = require('node:test');
const assert = require('node:assert/strict');
const { render } = require('./renderer');
const { parseLive } = require('./live');

test('paired and nested div blocks close exactly once', () => {
  const r = render('[[div class="a"]]\n[[div class="b"]]\ndeep\n[[/div]]\nmid\n[[/div]]\ntop');
  assert.equal(r.html, '<div class="a"><div class="b"><p>deep</p></div><p>mid</p></div><p>top</p>');
  assert.equal(r.warnings.length, 0);
});
test('stray closers and unclosed blocks are reported instead of shifting nesting', () => {
  const stray = render('first\n[[/div]]\nsecond');
  assert.match(stray.warnings.join(), /多余的结束标记 \[\[\/div\]\]/);
  assert.equal(stray.html, '<p>first</p><p>second</p>');
  assert.match(render('[[div]]\nbody').warnings.join(), /未闭合的块/);
});
test('same-line div and span keep their attributes and content', () => {
  const r = render('[[div class="x"]]inner **bold**[[/div]]');
  assert.equal(r.html, '<div class="x">inner <strong>bold</strong></div>');
});
test('tabview renders the native shell with switchable tabs', () => {
  const r = render('[[tabview]]\n[[tab First]]\none\n[[/tab]]\n[[tab Second]]\ntwo\n[[/tab]]\n[[/tabview]]');
  assert.match(r.html, /class="yui-navset wd-tabview"/);
  assert.equal((r.html.match(/type="radio"/g) || []).length, 2);
  assert.match(r.html, /<label for="wd-tv-1-1">Second<\/label>/);
  assert.equal((r.html.match(/wd-tab-panel/g) || []).length, 2);
  assert.match(r.html, /<p>one<\/p>/);
  assert.match(r.html, /<p>two<\/p>/);
  assert.equal(r.warnings.length, 0);
});
test('table container syntax maps rows, headers and cell spans', () => {
  const r = render('[[table]]\n[[thead]]\n[[row]]\n[[hcell]]H[[/hcell]]\n[[/row]]\n[[/thead]]\n[[row]]\n[[cell colspan="2"]]D[[/cell]]\n[[/row]]\n[[/table]]');
  assert.equal(r.html, '<table><thead><tr><th>H</th></tr></thead><tr><td colspan="2">D</td></tr></table>');
});
test('size, colour, scripts and inline math stay inside safe styles', () => {
  const r = render('[[size 150%]]大[[/size]] [[size smaller]]小[[/size]] ##red|红## ##blue|white|底## ^^上^^ ,,下,, [[$ x^2 $]]');
  assert.match(r.html, /<span style="font-size:150%">大<\/span>/);
  assert.match(r.html, /<span style="font-size:0\.8em">小<\/span>/);
  assert.match(r.html, /<span style="color:red">红<\/span>/);
  assert.match(r.html, /<span style="color:blue;background:white">底<\/span>/);
  assert.match(r.html, /<sup>上<\/sup>/);
  assert.match(r.html, /<sub>下<\/sub>/);
  assert.match(r.html, /class="wd-math-inline" title="LaTeX">x\^2/);
  assert.equal(r.warnings.length, 0);
});
test('images, floats, iframes, files, anchors and footnotes render', () => {
  const r = render('[[image https://example.com/a.png size="small" alt="A"]]\n[[f<image https://example.com/b.png]]\n[[iframe https://example.com width="100%" height="200"]]\n[[file doc.pdf|下载]]\n[[anchor sec]]\n[[footnote]]注[[/footnote]]');
  assert.match(r.html, /<img src="https:\/\/example.com\/a.png" alt="A" class="image" style="max-width:180px"/);
  assert.match(r.html, /<img src="https:\/\/example.com\/b.png"[^>]*style="float:left/);
  assert.match(r.html, /<iframe src="https:\/\/example.com\/" sandbox="" loading="lazy"/);
  assert.match(r.html, /<a class="wd-file" href="https:\/\/scp-wiki-cn\.wikidot\.com\/local--files\/doc\.pdf"/);
  assert.match(r.html, /<a id="sec"><\/a>/);
  assert.match(r.html, /wd-footnote-ref-1/);
  assert.match(r.html, /<li id="wd-footnote-1">注/);
});
test('footnoteblock is used when the draft places one', () => {
  const r = render('[[footnote]]一[[/footnote]]\n\n[[footnoteblock]]');
  assert.equal((r.html.match(/wd-footnote-ref-1/g) || []).length, 2);
  assert.match(r.html, /<ol><li id="wd-footnote-1">一/);
});
test('raw html blocks drop scripts, handlers, meta and inline styles', () => {
  const r = render('[[html]]<b>x</b><script>alert(1)</script><img src=x onerror=alert(1)><meta http-equiv="refresh" content="0"><style>p{}</style><a href="javascript:alert(1)">y</a>[[/html]]');
  assert.match(r.html, /<b>x<\/b>/);
  assert.ok(!r.html.includes('<script'));
  assert.ok(!/onerror/.test(r.html));
  assert.ok(!/<meta/.test(r.html));
  assert.ok(!/<style>/.test(r.html));
  assert.ok(!/javascript:/.test(r.html));
});
test('embed blocks render sanitized markup and hide sidebar synchronizers', () => {
  assert.match(render('[[embed]]<div class="e">x</div>[[/embed]]').html, /<div class="wd-embed"><div class="e">x<\/div><\/div>/);
  const hidden = render('[[embed]]<iframe style="display: none"></iframe>[[/embed]]\n\ntext');
  assert.ok(!hidden.html.includes('iframe'));
});
test('gallery and bibliography keep their container shape', () => {
  const r = render('[[gallery]]\n[[image https://example.com/1.png]]\n[[/gallery]]\n\n[[bibliography title="参考"]]\n[[div]]条目[[/div]]\n[[/bibliography]]');
  assert.match(r.html, /<div class="wd-gallery"><img src="https:\/\/example.com\/1\.png"/);
  assert.match(r.html, /<div class="wd-bibliography"><div class="wd-bib-title">参考<\/div><div>条目<\/div><\/div>/);
});
test('unsupported modules and unexpanded includes degrade to labelled chips', () => {
  const r = render('[[module ListPages]]\n[[/module]]\n\n[[include theme:x]]');
  assert.match(r.html, /Module · ListPages/);
  assert.match(r.html, /Include · theme:x/);
  assert.equal(r.warnings.length, 2);
});
test('justified alignment block is supported', () => {
  assert.match(render('[[==]]\ntext\n[[/==]]').html, /text-align:justify/);
});
test('live editing decorates size, colour and scripts without dropping text', () => {
  const source = '文本 [[size 150%]]放大[[/size]] 与 ##red|红字## 和 ^^上^^ ,,下,,';
  const model = parseLive(source);
  assert.deepEqual(model.marks.map(m => [source.slice(m.from, m.to), m.cls, m.style]), [
    ['放大', 'wd-live-size', 'font-size:150%'],
    ['红字', '', 'color:red'],
    ['上', 'wd-live-sup', ''],
    ['下', 'wd-live-sub', '']
  ]);
  for (const hidden of model.hidden) assert.match(source.slice(hidden.from, hidden.to), /^(?:\[\[size 150%\]\]|\[\[\/size\]\]|##red\||##|\^\^|,,)$/);
});
test('live editing flags an unmatched div closer and keeps nesting stable', () => {
  const source = '[[div class="a"]]\ninside\n[[/div]]\n[[/div]]\nafter';
  const model = parseLive(source);
  assert.deepEqual(model.chips.map(b => b.label), ['div .a', '/div', '⚠ 多余的 /div']);
  assert.ok(!model.lines.find(line => source.slice(line.from, line.to) === 'after').depth);
  assert.match(model.lines[3].cls, /wd-live-unmatched/);
});
test('live editing keeps alignment contexts on their own lines', () => {
  const source = '[[==]]\n居中\n[[/==]]';
  const model = parseLive(source);
  assert.equal(model.lines[1].style, 'text-align:justify');
  assert.equal(model.lines[2].style, 'text-align:justify');
});

test('attachment names resolve under the reference page', () => {
  const r = render('[[image foo.png size="small"]]\n\n[[file doc.pdf|下载]]', { page: 'my-page' });
  assert.match(r.html, /src="https:\/\/scp-wiki-cn\.wikidot\.com\/local--files\/my-page\/foo\.png"/);
  assert.match(r.html, /href="https:\/\/scp-wiki-cn\.wikidot\.com\/local--files\/my-page\/doc\.pdf"/);
});
test('render stays fast for long drafts', () => {
  const body = '这是一段普通正文，包含 **粗体** 与 [[[scp-001|页面链接]]]。\n\n'.repeat(2000);
  const started = process.hrtime.bigint();
  const r = render(body);
  const ms = Number(process.hrtime.bigint() - started) / 1e6;
  assert.ok(r.html.length > 1000);
  assert.ok(ms < 3000, 'render took ' + Math.round(ms) + 'ms');
});

test('inline footnotes inside a sentence are numbered once', () => {
  const r = render('句中出现脚注[[footnote]]注释[[/footnote]]。');
  assert.match(r.html, /wd-footnote-ref-1/);
  assert.match(r.html, /<li id="wd-footnote-1">注释/);
  assert.equal(r.warnings.length, 0);
});

test('multi-line span and size stay inline without paragraph wrappers', () => {
  assert.equal(render('[[span class="x"]]\none\ntwo\n[[/span]]').html, '<span class="x">one<br>\ntwo</span>');
  assert.equal(render('[[size 120%]]\na\nb\n[[/size]]').html, '<span style="font-size:120%">a<br>\nb</span>');
});

test('col declarations inside table blocks are self-closing', () => {
  const r = render('[[table]]\n[[col style="width:20%"]]\n[[row]]\n[[cell]]a[[/cell]]\n[[/row]]\n[[/table]]\n\nafter');
  assert.equal(r.html, '<table><col style="width:20%"><tr><td>a</td></tr></table><p>after</p>');
  assert.equal(r.warnings.length, 0);
});
