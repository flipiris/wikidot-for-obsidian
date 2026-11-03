const {test}=require('node:test');
const assert=require('node:assert/strict');
const {render}=require('./renderer');
const {parseLive}=require('./live');
const {minimalPalette}=require('./contrast');
const {describe}=(()=>{const M=require('module'),o=M._load;M._load=function(r,...a){if(r==='obsidian')return {Modal:class{},Setting:class{},Notice:class{}};return o.call(this,r,...a)};try{return require('./manager');}finally{M._load=o;}})();
test('"= text" centers one line',()=>{
  const r=render('= **居中** 文本\n下一行');
  assert.match(r.html,/<div style="text-align:center"><strong>居中<\/strong> 文本<\/div>/);
  assert.match(r.html,/<p>下一行<\/p>/);
  assert.ok(!render('==不是居中').html.includes('text-align:center'));
});
test('mismatched alignment closer and outer closer recover without derailing later blocks',()=>{
  const r=render('[[>]]\nright\n[[/=]]\n[[div class="a"]]\n[[<]]\nx\n[[/div]]\n[[div class="b"]]\ny\n[[/div]]');
  assert.match(r.html,/text-align:right[^>]*>[\s\S]*right/);
  assert.match(r.html,/<div class="b">[\s\S]*y[\s\S]*<\/div>/);
  assert.ok(!r.html.includes('[[/'));
});
test('spans crossing lines and unclosed spans never leak source',()=>{
  const r=render('[[span class="thin"]]第一行\n[[span class="x"]]内层[[/span]]\n后续');
  assert.ok(!r.html.includes('[[span'));assert.equal(r.warnings.filter(w=>w.includes('行内')).length,0);
  assert.ok(!render('a[[/span]]b').html.includes('[[/span]]'));
});
test('extra syntax: clear float, aligned images, embedaudio, bibcite, @< entities >@',()=>{
  assert.match(render('~~~~').html,/clear:both/);
  assert.match(render('~~~~>').html,/clear:right/);
  assert.match(render('[[>image https://example.com/a.png]]').html,/image-container alignright/);
  assert.match(render('[[embedaudio]]<audio src="https://e.com/a.mp3"></audio>[[/embedaudio]]').html,/wd-embed/);
  assert.match(render('text ((bibcite ref1))').html,/href="#bibitem-ref1"/);
  assert.match(render('@<&nbsp;&#9608;>@').html,/&nbsp;&#9608;/);
});
test('live editing pairs interchangeable alignment closers and outer closers',()=>{
  const m=parseLive('[[div]]\n[[>]]\nx\n[[/=]]\n[[/div]]\n[[div]]\n[[<]]\ny\n[[/div]]');
  assert.equal(m.chips.filter(c=>c.kind==='warn').length,0);
});
test('Minimal palette follows page colours',()=>{
  assert.match(minimalPalette('#page-content{color:#eeeeee}').palette,/color-scheme:dark/);
  assert.match(minimalPalette('body{background-color:#101010}').palette,/rgb\(16,16,16\)/);
  assert.match(minimalPalette(':root{--bg:#fff}#container{background:var(--bg)}',true).palette,/color-scheme:light/);
  assert.match(minimalPalette('#page-content{color:#eee}',false,false).palette,/color-scheme:light/);
});
test('include manager lists cache entries with usage and nested includes',()=>{
  const items=describe({'source:https://scp-wiki-cn.wikidot.com/component:a':'[[include component:b]]\nx','css:https://e.com/s.css':'p{}'},new Set(['https://scp-wiki-cn.wikidot.com/component:a']));
  assert.equal(items[0].used,true);assert.deepEqual(items[0].nested,['component:b']);assert.equal(items[1].kind,'css');
});
test('sample manuscripts render without leaking block syntax',()=>{
  const samples=[
    '+ 标题\n\n[[div class="box"]]\n**粗体** 与 //斜体//\n\n||~表头||值||\n||a||b||\n[[/div]]\n\n* 列表\n* 列表二',
    '+ 第一个标题\n\n正文段落，包含 [[span class="s"]]行内块[[/span]] 与 [链接 标题]。\n\n[[=]]\n居中一行\n[[/=]]\n\n[[code]]\n[[div]] 原样\n[[/code]]',
    '+ 长文\n\n[[module CSS]]\n.box { color: #333; }\n[[/module]]\n\n[[div class="box"]]\n[[tabview]]\n[[tab 标签一]]\n内容一\n[[/tab]]\n[[tab 标签二]]\n内容二\n[[/tab]]\n[[/tabview]]\n[[/div]]',
  ];
  for(const source of samples){
    const html=render(source).html.replace(/<pre[\s\S]*?<\/pre>/g,'');
    assert.ok(!/\[\[\/?(?:div|span|size|=|<|>|cell|row|table)\b/.test(html),source.slice(0,12));
    const live=parseLive(source);
    assert.ok(live.chips.filter(c=>c.kind==='warn').length<=2,source.slice(0,12));
  }
});
test('body-less modules do not swallow content up to a later [[/module]]',()=>{
  const r=render('[[module Rate]]\n中间正文\n[[module ListPages category="x"]]\n%%title%%\n[[/module]]');
  assert.match(r.html,/中间正文/);assert.ok(!r.html.includes('%%title%%'));
});
test('Wikidot #if / #ifexpr / #expr expressions',()=>{
  const {expressions}=require('./syntax');
  assert.equal(expressions('[[#if true | a | b ]]'),'a');
  assert.equal(expressions('[[#if false | a | b ]]'),'b');
  assert.equal(expressions('[[#if  | a | b ]]'),'b');
  assert.equal(expressions('[[#ifexpr 3 > 2 and 1 | yes | no ]]'),'yes');
  assert.equal(expressions('[[#expr (2+3)*4 ]]'),'20');
  assert.equal(expressions('x [[#expr process.exit() ]]'),'x Expression error');
  assert.equal(expressions('[[div_ class="a [[#if true | b | c ]]"]]'),'[[div_ class="a b"]]');
});
test('theme parameter switches: [[ift{$x}gs]] around an empty [[iftags]]',()=>{
  const {selectTags}=require('./syntax');
  const src='>[[ift{$dark}gs -x]]\n>[[iftags]]\nDARK\n>[[/iftags]]\n>[[/ift{$dark}gs]]\nafter';
  assert.ok(!selectTags(src).includes('DARK'));
  assert.ok(selectTags(src.replace(/\{\$dark\}/g,'a')).includes('DARK'));
  assert.ok(selectTags(src).includes('after'));assert.ok(!selectTags(src).includes('[['));
});
