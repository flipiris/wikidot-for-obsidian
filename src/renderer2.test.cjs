const { test } = require('node:test');
const assert = require('node:assert/strict');
const { render } = require('./renderer');

// 1. Size keywords go through common.fontSize.
test('size keywords xx-small through xx-large render as font-size', () => {
  const r = render('[[size xx-small]]a[[/size]] [[size x-small]]b[[/size]] [[size xx-large]]c[[/size]] [[size larger]]d[[/size]]');
  assert.match(r.html, /font-size:xx-small/);
  assert.match(r.html, /font-size:x-small/);
  assert.match(r.html, /font-size:xx-large/);
  assert.match(r.html, /font-size:1\.2em/);
  assert.equal(r.warnings.length, 0);
  const block = render('[[size x-large]]\nblock\n[[/size]]');
  assert.match(block.html, /<span style="font-size:x-large">block<\/span>/);
});

// 2. Typography applies to normal text but not to code literals.
test('typography quotes, guillemets, ellipsis and em dash', () => {
  const r = render("``引号'' `单引' ,,低引'' <<左>> >>右<< 等等... 破折 -- 号 ,,下标,, --删除--");
  assert.match(r.html, /“引号”/);
  assert.match(r.html, /‘单引’/);
  assert.match(r.html, /„低引”/);
  assert.match(r.html, /«左»/);
  assert.match(r.html, /»右«/);
  assert.match(r.html, /等等…/);
  assert.match(r.html, /破折 — 号/);
  assert.match(render(",,下标,, 和 ,,低''").html, /<sub>下标<\/sub> 和 „低”/);
  assert.match(r.html, /<sub>下标<\/sub>/);
  assert.match(r.html, /<s>删除<\/s>/);
  const literal = render("@@``literal''@@ {{``code''}}").html;
  assert.match(literal, /``literal&#39;&#39;/);
  assert.match(literal, /<code>``code&#39;&#39;<\/code>/);
});

// 3. Double- and single-bracket links.
test('page links normalize names, keep anchors and custom labels', () => {
  const r = render('[[[scp-001]]] [[[some page|文本]]] [[[some page|]]] [[[wiki syntax#toc1|Sec]]] [[[category: sample page]]]');
  assert.match(r.html, /<a href="https:\/\/scp-wiki-cn\.wikidot\.com\/scp-001"[^>]*>scp-001<\/a>/);
  assert.match(r.html, /<a href="https:\/\/scp-wiki-cn\.wikidot\.com\/some-page"[^>]*>文本<\/a>/);
  assert.match(r.html, /<a href="https:\/\/scp-wiki-cn\.wikidot\.com\/some-page"[^>]*>some-page<\/a>/);
  assert.match(r.html, /<a href="https:\/\/scp-wiki-cn\.wikidot\.com\/wiki-syntax#toc1"[^>]*>Sec<\/a>/);
  assert.match(r.html, /<a href="https:\/\/scp-wiki-cn\.wikidot\.com\/category:sample-page"[^>]*>sample page<\/a>/);
  assert.match(r.html, /target="_blank" rel="noopener noreferrer"/);
});

test('external, new-window, site-root and single-bracket links', () => {
  const r = render('[[[http://x | W]]] [[[*http://y | N]]] [[[/category:page/opt | text]]]');
  assert.match(r.html, /<a href="http:\/\/x\/"[^>]*>W<\/a>/);
  assert.match(r.html, /<a href="http:\/\/y\/"[^>]*>N<\/a>/);
  assert.match(r.html, /<a href="https:\/\/scp-wiki-cn\.wikidot\.com\/category:page\/opt"[^>]*>text<\/a>/);
  const s = render('[http://x text] [*http://x text] [# text] [#anchor jump] [/path text]');
  assert.match(s.html, /<a href="http:\/\/x\/"[^>]*>text<\/a>/);
  assert.match(s.html, /<a class="wd-empty-link" href="#">text<\/a>/);
  assert.match(s.html, /<a href="#anchor"[^>]*>jump<\/a>/);
  assert.match(s.html, /<a href="https:\/\/scp-wiki-cn\.wikidot\.com\/path"[^>]*>text<\/a>/);
  assert.ok(!s.html.includes('javascript:'));
});

test('bare http and starred bare URLs auto-link', () => {
  const r = render('see http://example.com/a and *http://example.com/b');
  assert.match(r.html, /<a href="http:\/\/example\.com\/a"[^>]*>http:\/\/example\.com\/a<\/a>/);
  assert.match(r.html, /<a href="http:\/\/example\.com\/b"[^>]*>http:\/\/example\.com\/b<\/a>/);
  assert.ok(!r.html.includes('>*http'));
});

// 4. Anchors.
test('double-hash anchors become ids inline and as blocks, old anchor syntax stays', () => {
  const r = render('[[# name]]\n\ntext [[# inline]] more\n\n[[anchor old]]');
  assert.match(r.html, /<a id="name"><\/a>/);
  assert.match(r.html, /<a id="inline"><\/a>/);
  assert.match(r.html, /<a id="old"><\/a>/);
});

// 5. TOC variants.
test('toc variants float right and left', () => {
  assert.match(render('[[toc]]\n\n+ A').html, /<div id="toc">/);
  assert.match(render('[[f>toc]]\n\n+ A').html, /<div id="toc" style="float:right">/);
  assert.match(render('[[f<toc]]\n\n+ A').html, /<div id="toc" style="float:left">/);
  assert.match(render('[[f>toc]]\n\n+ A').html, /href="#toc0"/);
});

// 6. Nested and mixed lists.
test('nested and mixed lists build real nested markup without warnings', () => {
  assert.equal(
    render('* one\n * sub1\n * sub2\n* two\n\n# first\n # deep').html,
    '<ul><li>one<ul><li>sub1</li><li>sub2</li></ul></li><li>two</li></ul><ol><li>first<ol><li>deep</li></ol></li></ol>'
  );
  assert.equal(
    render('* bullet\n # ordered\n # ordered2\n * bullet2').html,
    '<ul><li>bullet<ol><li>ordered</li><li>ordered2</li></ol><ul><li>bullet2</li></ul></li></ul>'
  );
  assert.equal(render('* first _\nsecond\n* two').html, '<ul><li>first<br>second</li><li>two</li></ul>');
  assert.equal(render('para _\nnext').html, '<p>para<br>\nnext</p>');
  assert.equal(render('* one\n * two').warnings.length, 0);
});

// 7. Definition lists.
test('definition lists group terms and continue with a trailing " _"', () => {
  assert.equal(
    render(': term : definition _\ncontinued\n: other : more').html,
    '<dl><dt>term</dt><dd>definition<br>continued</dd><dt>other</dt><dd>more</dd></dl>'
  );
});

// 8. Blockquotes.
test('blockquotes nest, split paragraphs and join backslash continuations', () => {
  assert.equal(
    render('> one\n>> two\n> three\n\n> p1\n> \n> p2').html,
    '<blockquote>one<blockquote>two</blockquote>three</blockquote><blockquote><p>p1</p><p>p2</p></blockquote>'
  );
  assert.equal(render('> joined \\\nnext\n> done').html, '<blockquote>joined next<br>done</blockquote>');
  assert.match(render('> **bold**').html, /<blockquote><strong>bold<\/strong><\/blockquote>/);
  assert.match(render('>>inner').html, /<blockquote><blockquote>inner<\/blockquote><\/blockquote>/);
});

// 9. Advanced list blocks.
test('advanced ul/ol/li blocks keep attributes, nest and accept indentation', () => {
  const r = render('[[ul]]\n [[li class="item1" data-toggle="data1"]]Item1[[/li]]\n [[li]]\nItem 2\n [[ol]]\n [[li style="color:red"]]Item 2.1[[/li]]\n [[/ol]]\n [[/li]]\n[[/ul]]');
  assert.match(r.html, /<ul><li class="item1" data-toggle="data1">Item1<\/li>/);
  assert.match(r.html, /<li>Item 2<ol><li style="color:red">Item 2.1<\/li><\/ol><\/li>/);
  assert.equal(r.warnings.length, 0);
  assert.match(render('  [[ul]]\n    [[li]]a[[/li]]\n  [[/ul]]').html, /<ul><li>a<\/li><\/ul>/);
});

// 10. Collapsible blocks.
test('collapsible uses details with show/hide spans, folding and bottom link', () => {
  const r = render('[[collapsible]]\nbody\n[[/collapsible]]');
  assert.match(r.html, /<details class="collapsible-block"><summary><span class="collapsible-block-show">\+ show block<\/span><span class="collapsible-block-hide">- hide block<\/span><\/summary>/);
  const open = render('[[collapsible show="+ 显示" hide="- 隐藏" folded="no" hideLocation="both"]]\nbody\n[[/collapsible]]');
  assert.match(open.html, /<details class="collapsible-block" open>/);
  assert.match(open.html, /<div class="collapsible-block-hide-bottom"><span>- 隐藏<\/span><\/div>/);
  assert.match(render('x').document, /details\[open\] \.collapsible-block-hide\{display:inline\}/);
});

// 11. Simple tables.
test('simple tables handle headers, colspan, alignment and inline formatting', () => {
  const r = render('||~ h1 ||~ h2 ||\n|| a || b ||\n|||| span || c ||\n||< left ||> right ||\n||= **center** ||');
  assert.match(r.html, /<tr><th>h1<\/th><th>h2<\/th><\/tr>/);
  assert.match(r.html, /<td colspan="2">span<\/td><td>c<\/td>/);
  assert.match(r.html, /<td style="text-align:left">left<\/td><td style="text-align:right">right<\/td>/);
  assert.match(r.html, /<td style="text-align:center"><strong>center<\/strong><\/td>/);
  assert.match(render('|||||| x ||').html, /<td colspan="3">x<\/td>/);
});

// 12. Notes and users.
test('note blocks and user links render printuser with optional avatar', () => {
  const r = render('[[note]]\n内容\n[[/note]]\n\n[[user MScarlet]] [[*user MScarlet]]');
  assert.match(r.html, /<div class="wiki-note"><p>内容<\/p><\/div>/);
  assert.match(r.html, /<span class="printuser"><a href="https:\/\/www\.wikidot\.com\/user:info\/mscarlet"[^>]*>MScarlet<\/a><\/span>/);
  assert.match(r.html, /<span class="avatar"><\/span><span class="printuser">/);
});

// 13. Images.
test('images resolve sources, sizes, links and unsupported forms', () => {
  const r = render('[[image foo.png width="200" height="100" alt="A"]]\n\n[[image /other-page/file.png]]\n\n[[image flickr:123]]\n\n[[image foo.png link="page"]]', { page: 'my-page' });
  assert.match(r.html, /src="https:\/\/scp-wiki-cn\.wikidot\.com\/local--files\/my-page\/foo\.png"[^>]*style="width:200px;height:100px"/);
  assert.match(r.html, /src="https:\/\/scp-wiki-cn\.wikidot\.com\/local--files\/other-page\/file\.png"/);
  assert.match(r.html, /<span class="wd-image-missing"[^>]*>图片：flickr:123<\/span>/);
  assert.match(r.html, /<a href="https:\/\/scp-wiki-cn\.wikidot\.com\/page"[^>]*><img src="https:\/\/scp-wiki-cn\.wikidot\.com\/local--files\/my-page\/foo\.png"/);
  const anchored = render('[[image foo.png link="#sec"]]', { page: 'my-page' });
  assert.match(anchored.html, /<a href="#sec"[^>]*><img/);
  const centred = render('[[=image https://example.com/a.png]]');
  assert.match(centred.html, /<img src="https:\/\/example\.com\/a\.png"[^>]*style="display:block;margin:1em auto"/);
});

// 14. Blank-line handling.
test('intentional blank lines and empty divs never add stray paragraphs', () => {
  assert.equal(render('a\n\n@@@@\n\n@@ @@\n\nb').html, '<p>a</p><p>&nbsp;</p><p>&nbsp;</p><p>b</p>');
  assert.equal(render('[[div]]\n\n\n[[/div]]\n\n\nafter').html, '<div></div><p>after</p>');
});

// 15. Nested same-name inline tags.
test('nested span, size and a tags balance, and bare span works', () => {
  assert.equal(render('[[span class="ruby"]]base[[span class="rt"]]ruby[[/span]][[/span]]').html, '<p><span class="ruby">base<span class="rt">ruby</span></span></p>');
  assert.equal(render('[[size 120%]]a[[size 80%]]b[[/size]][[/size]]').html, '<p><span style="font-size:120%">a<span style="font-size:80%">b</span></span></p>');
  assert.match(render('[[a href="https://e.com"]]x[[a href="https://f.com"]]y[[/a]][[/a]]').html, /<a href="https:\/\/e\.com\/"[^>]*>x<a href="https:\/\/f\.com\/"[^>]*>y<\/a><\/a>/);
  assert.equal(render('[[span]]plain[[/span]]').html, '<p><span>plain</span></p>');
  assert.match(render('[[div class="collapsiblealt"]]\n[[div]]x[[/div]]\n[[/div]]').html, /<div class="collapsiblealt"><div>x<\/div><\/div>/);
});

// 16. Existing raw-markup sanitisation must stay intact.
test('html and embed stay sanitized and the CSP still blocks scripts', () => {
  const r = render('[[html]]<b>x</b><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">y</a>[[/html]]\n\n[[embed]]<script>alert(2)</script>[[/embed]]');
  assert.match(r.html, /<b>x<\/b>/);
  assert.ok(!r.html.includes('<script'));
  assert.ok(!r.html.includes('onerror'));
  assert.ok(!r.html.includes('href="javascript:'));
  assert.match(r.document, /script-src &#39;none&#39;/);
  assert.ok(!r.document.includes('allow-scripts'));
});

// Editable mode still marks every new block node exactly once.
test('editable mode marks list, definition, quote, table and anchor blocks', () => {
  const r = render('* a\n * b\n\n: t : d\n\n> q\n\n|| x ||\n\n[[# sec]]', { editable: true });
  assert.equal((r.html.match(/data-wd-block="true"/g) || []).length, 5);
});
