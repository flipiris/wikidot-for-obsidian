const { test }=require('node:test');
const assert=require('node:assert/strict');
const { includeURL,expandIncludes }=require('./includes');
const { render,rebaseCSS }=require('./renderer');
const { publicPageURL,createRemoteClient,inlineStyles }=require('./remote');
test('same-site and cross-site includes preserve category names',()=>{
  assert.equal(includeURL('theme:sample','https://scp-wiki-cn.wikidot.com/akaneiro'),'https://scp-wiki-cn.wikidot.com/theme:sample');
  assert.equal(includeURL(':scp-wiki:component:test','https://scp-wiki-cn.wikidot.com/'),'https://scp-wiki.wikidot.com/component:test');
  assert.throws(()=>includeURL(':example.com:x','https://scp-wiki-cn.wikidot.com/'));
  assert.throws(()=>includeURL('../private','https://scp-wiki-cn.wikidot.com/'));
});
test('parameters, multiline arguments and nested includes expand before rendering',async()=>{
  const pages={'https://scp-wiki-cn.wikidot.com/a':'[[div class="{$class}"]]\n{$text}\n[[include b | color={$color}]]\n[[/div]]','https://scp-wiki-cn.wikidot.com/b':'[[module CSS]]\n.test {color:{$color}}\n[[/module]]'};
  const r=await expandIncludes('[[include a\n|class=test\n|text=**Hello**\n|color=red\n]]',async url=>{assert.ok(pages[url]);return pages[url]});
  assert.equal(r.warnings.length,0);assert.equal(r.dependencies.length,2);
  const html=render(r.source);assert.match(html.html,/<strong>Hello<\/strong>/);assert.match(html.css[0],/color:red/);
});
test('cross-site nested includes resolve within the included site',async()=>{
  const calls=[];
  const r=await expandIncludes('[[include :scp-wiki:a]]',async url=>{calls.push(url);return url.endsWith('/a')?'[[include b]]':'nested'});
  assert.equal(r.source.trim(),'nested');assert.deepEqual(calls,['https://scp-wiki.wikidot.com/a','https://scp-wiki.wikidot.com/b']);
});
test('cycles and failed requests are visible and terminate',async()=>{
  const cyclic=await expandIncludes('[[include a]]',async()=> '[[include a]]');
  assert.match(cyclic.warnings[0],/循环引用/);assert.match(cyclic.source,/Include 不可用/);
  const fail=await expandIncludes('before\n[[include missing]]\nafter',async()=>{throw Error('HTTP 404')});
  assert.match(fail.warnings[0],/404/);assert.match(fail.source,/before/);assert.match(fail.source,/after/);
});
test('resource limits stop expanding huge or deeply nested sources',async()=>{
  const result=await expandIncludes('[[include a]]',async()=> 'long text',{maxSize:2});
  assert.match(result.warnings[0],/总内容/);
  const deep=await expandIncludes('[[include a]]',async url=>'[[include '+(url.endsWith('/a')?'b':'a')+']]',{maxDepth:1});
  assert.match(deep.warnings[0],/深度/);
});
test('Wikidot column-zero include expands in code; indented examples stay literal',async()=>{
  let count=0;
  const r=await expandIncludes('[[code]]\n[[include a]]\n [[include b]]\n[[/code]]',async()=>{count++;return 'expanded'});
  assert.equal(count,1);assert.match(r.source,/expanded\n \[\[include b\]\]/);
});
test('CSS import and relative asset URLs resolve against their source page',()=>{
  const css=rebaseCSS('@import "/theme:sample/code/1";p{background:url(../asset.png)}','https://scp-wiki-cn.wikidot.com/theme:sample');
  assert.match(css,/https:\/\/scp-wiki-cn.wikidot.com\/theme:sample\/code\/1/);assert.match(css,/https:\/\/scp-wiki-cn.wikidot.com\/asset.png/);
});
test('template replaces content and title without replacing dollar expressions',()=>{
  const r=render('**draft**',{title:'$& <title>',template:{body:'<div id="page-title">WIKIDOT_EDITOR_TITLE</div><div id="page-content"><!--WIKIDOT_EDITOR_CONTENT--></div>',marker:'<!--WIKIDOT_EDITOR_CONTENT-->',headCSS:'body{color:red}',referenceURL:'https://scp-wiki-cn.wikidot.com/akaneiro'}});
  assert.match(r.document,/\$&amp; &lt;title&gt;/);assert.match(r.document,/<strong>draft<\/strong>/);assert.ok(!r.document.includes('WIKIDOT_EDITOR_CONTENT'));assert.match(r.document,/body\{color:red\}/);
});
test('remote URLs reject local networks and non-HTTPS endpoints',()=>{
  for(const url of ['file:///etc/passwd','http://scp-wiki-cn.wikidot.com/a','https://localhost/a','https://127.0.0.1/a','https://user:pass@scp-wiki.wikidot.com/a']) assert.throws(()=>publicPageURL(url));
  assert.equal(publicPageURL('https://scp-wiki-cn.wikidot.com/akaneiro#x'),'https://scp-wiki-cn.wikidot.com/akaneiro');
});
test('network errors are not cached and timeout is bounded',async()=>{
  let count=0;
  const client=createRemoteClient(async()=>{count++;return {status:404,text:'missing'}},()=>{});
  await assert.rejects(client.source('https://scp-wiki-cn.wikidot.com/a'),/HTTP 404/);
  await assert.rejects(client.source('https://scp-wiki-cn.wikidot.com/a'),/HTTP 404/);assert.equal(count,2);
  const timeout=createRemoteClient(()=>new Promise(()=>{}),()=>{},{timeout:5});
  await assert.rejects(timeout.source('https://scp-wiki-cn.wikidot.com/a'),/超时/);
});
test('site stylesheet imports are fetched, flattened and rebased',async()=>{
  const calls=[];
  const result=await inlineStyles('@import url("/base.css");.own{color:red}','https://example.com/page',async url=>{
    calls.push(url);return url.endsWith('base.css')?'@import "nested.css" screen;body{background:url(bg.png)}':'.nested{color:blue}';
  },{rebase:rebaseCSS});
  assert.deepEqual(calls,['https://example.com/base.css','https://example.com/nested.css']);assert.equal(result.warnings.length,0);
  assert.ok(!result.css.includes('@import'));assert.match(result.css,/@media screen/);assert.match(result.css,/https:\/\/example.com\/bg.png/);
});
test('failed stylesheet imports are visible and do not discard local CSS',async()=>{
  const result=await inlineStyles('@import "https://example.com/missing.css";p{color:red}','https://example.com',async()=>{throw Error('offline')});
  assert.equal(result.warnings.length,1);assert.match(result.css,/p\{color:red\}/);
});
test('space arguments select only the requested theme and inactive docs never fetch',async()=>{
  const calls=[];
  const source='[[include theme:normal night=- other="two words" | color=red]]';
  const r=await expandIncludes(source,async url=>{calls.push(url);return '[[iftags +版式]]\n[[include documentation]]\n[[module CSS]]\nbad{}\n[[/module]]\n[[/iftags]]\n[!-- {$night}-]\n[[module CSS]]\n.good{color:{$color};content:"{$other}"}\n[[/module]]\n[!-{$night} --]\n[!--\n[[include disabled]]\n--]';});
  assert.deepEqual(calls,['https://scp-wiki-cn.wikidot.com/theme:normal']);assert.equal(r.warnings.length,0);
  assert.equal(render(r.source).css.length,1);assert.match(render(r.source).css[0],/color:red;content:"two words"/);assert.ok(!r.source.includes('bad{}'));
});
test('iftags evaluates nesting against the final page tags',async()=>{
  const s='[[iftags +article -draft]]\nyes\n[[iftags +版式]]\nno\n[[/iftags]]\n[[/iftags]]';
  const a=await expandIncludes(s,async()=>'',{tags:['article']});assert.match(a.source,/yes/);assert.ok(!a.source.includes('no'));
  const b=await expandIncludes(s,async()=>'',{tags:['draft','article']});assert.ok(!b.source.includes('yes'));
});
test('commented CSS imports and strings never load optional variants',async()=>{
  const calls=[];
  const css='/* {$other}/\n@import "https://example.com/inactive.css";\n/{$other} */\np::after{content:\'@import "not-real.css";\'}\n/* */\n@import "active.css";\n/* */';
  const r=await inlineStyles(css,'https://example.com/',async url=>{calls.push(url);return '/* nested comment */body{color:red}';},{rebase:rebaseCSS});
  assert.deepEqual(calls,['https://example.com/active.css']);assert.match(r.css,/body\{color:red\}/);assert.equal(r.warnings.length,0);
});
test('quoted SVG data URLs with parentheses and embedded quotes remain intact',()=>{
  const css=`p{background:url("data:image/svg+xml,<svg viewBox='0 0 10 10'><path d='M(0)'/></svg>")}q{background:url('../img.png')}`;
  const result=rebaseCSS(css,'https://example.com/dir/theme.css');assert.ok(result.includes(css.slice(0,css.indexOf('q{'))));assert.match(result,/https:\/\/example.com\/img.png/);
});
test('persistent caches serve a new client offline until explicitly cleared',async()=>{
  const values=new Map(),storage={read:async key=>values.get(key),write:async(key,value)=>values.set(key,value),clear:async()=>values.clear()};let requests=0;
  const first=createRemoteClient(async()=>{requests++;return {status:200,text:'body{color:red}'};},()=>{},{storage});
  await first.styles('@import "https://example.com/a.css";','https://example.com/');await first.clear();
  const second=createRemoteClient(async()=>{throw Error('offline');},()=>{},{storage});
  const result=await second.styles('@import "https://example.com/a.css";','https://example.com/');assert.equal(result.warnings.length,0);assert.equal(requests,1);
  await second.clear(true);assert.equal(values.size,0);
});

test('Wikidot include rules: unix names, single ] in values, empty values ignored, blank-line padding',async()=>{
  const calls=[];
  const src='before\n[[include :scp-wiki:Component:Image-Features |hover-enlarge=--]\n|width=75px\n|empty=\n]]\nafter';
  const r=await expandIncludes(src,async url=>{calls.push(url);return 'W={$width} H={$hover-enlarge} E={$empty}';});
  assert.deepEqual(calls,['https://scp-wiki.wikidot.com/component:image-features']);
  assert.match(r.source,/before\n\n\nW=75px H=--\] E=\{\$empty\}\n\n\nafter/);
});
