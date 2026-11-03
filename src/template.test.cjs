const {test}=require('node:test'),assert=require('node:assert/strict');
const {localTemplateFromHTML}=require('./remote');
const {render}=require('./renderer');
test('local shells retain search, account containers, body styles and page controls',()=>{
 const removed=new Set(),elements=['script','style','form','input','button','#login-status','#odialog-container'].map(selector=>({selector,remove(){removed.add(selector)}}));
 const body={className:'',id:'html-body',attributes:[],querySelectorAll(selector){return selector==='*'?[]:elements.filter(el=>selector.split(',').includes(el.selector))},get innerHTML(){return elements.filter(el=>!removed.has(el.selector)).map(el=>el.selector).join('|')}};
 const doc={body,head:{querySelectorAll:()=>[{textContent:'body{color:red}'}]},title:'',getElementById:id=>id==='page-content'?{innerHTML:'<!--WIKIDOT_EDITOR_CONTENT-->'}:id==='main-content'?{}:null,querySelector:()=>null};
 const shell=localTemplateFromHTML('fixture','https://scp-wiki-cn.wikidot.com/turbulent',()=>doc);
 assert.ok(removed.has('script'));for(const keep of ['style','form','input','button','#login-status','#odialog-container'])assert.ok(!removed.has(keep),keep);
 const preview=render('',{template:{...shell,body:'<form><input><button>搜索</button></form><div id="page-title"></div><div id="page-content"><!--WIKIDOT_EDITOR_CONTENT--></div>'}}).document;
 assert.ok(preview.includes('<button>搜索</button>'));assert.match(preview,/script-src &#39;none&#39;/);assert.match(preview,/form-action &#39;none&#39;/);
});

test('filename title follows the current draft rather than a stale custom preview title',()=>{
 const shell={body:'<div id="page-title">WIKIDOT_EDITOR_FILENAME</div><div id="page-content"><!--WIKIDOT_EDITOR_CONTENT--></div>',marker:'<!--WIKIDOT_EDITOR_CONTENT-->',headCSS:'',referenceURL:'https://scp-wiki-cn.wikidot.com/turbulent'};
 for(const name of ['坠龙鳞','新文件名','A & <B> $&']){
  const r=render('',{template:shell,page:name,title:'旧的自定义标题'});
  const expected=name.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  assert.ok(r.document.includes('<div id="page-title">'+expected+'</div>'));assert.ok(!r.document.includes('WIKIDOT_EDITOR_FILENAME'));
 }
});
