const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function pluginHarness(){
 const reads=[],ctx={module:{exports:{}},require:name=>name==='obsidian'?{Plugin:class{},TextFileView:class{},Modal:class{},PluginSettingTab:class{},normalizePath:s=>s}:name==='./remote'?{localTemplateFromHTML:(html,base)=>({html,base})}:{}};
 vm.runInNewContext(fs.readFileSync(require.resolve('./plugin.cjs'),'utf8'),ctx);
 const p=new ctx.module.exports();p.manifest={dir:'.obsidian/plugins/flipiris-wikidot'};p.settings={templatePath:'数据库/模板/Wikidot/SCP CN.html',referenceURL:'https://scp-wiki-cn.wikidot.com/main'};
 p.app={vault:{adapter:{read:async path=>{reads.push(path);return 'local shell';}}}};return {p,reads};
}
test('SCP preset uses bundled shell rather than stale per-draft Sandbox path',async()=>{
 const {p,reads}=pluginHarness();await p.loadTemplate({profile:'scp-cn',templatePath:'数据库/模板/Wikidot/SCP CN Sandbox.html'});
 assert.equal(reads[0],'.obsidian/plugins/flipiris-wikidot/templates/scp-cn.html');
});
test('explicit Local HTML and custom global templates remain selectable',async()=>{
 const {p,reads}=pluginHarness();await p.loadTemplate({profile:'local',templatePath:'custom.html'});p.settings.templatePath='global.html';await p.loadTemplate({profile:'scp-cn'});
 assert.deepEqual(reads,['custom.html','global.html']);assert.equal(await p.loadTemplate({profile:'minimal'}),null);
});
test('bundled shell has no article body or active scripts',()=>{
 const html=fs.readFileSync(__dirname+'/../templates/scp-cn.html','utf8');
 assert.match(html,/<div id="page-content">\s*<!--WIKIDOT_EDITOR_CONTENT-->\s*<\/div>/);
 assert.ok(!/<script\b/i.test(html));assert.ok(html.includes('scp-wiki-cn.wikidot.com/main'));
 assert.ok(!/@import\s/i.test(html));
});

test('bundled template retains the supplied saved-page chrome but no article-specific subtitle',()=>{
 const html=fs.readFileSync(__dirname+'/../templates/scp-cn.html','utf8');
 for(const id of ['header','top-bar','side-bar','main-content','footer','license-area'])assert.ok(html.includes('id="'+id+'"'));
 assert.ok(!html.includes('梦神检索记录-SY7163'));
 assert.ok(!/src="(?:file:|\.\/)/.test(html));
 assert.equal((html.match(/<!--WIKIDOT_EDITOR_CONTENT-->/g)||[]).length,1);
});

test('reference template retains site controls and fills the title from the filename',()=>{
 const html=fs.readFileSync(__dirname+'/../templates/scp-cn.html','utf8');
 for(const id of ['search-top-box-form','search-top-box-input','page-info','page-options-bottom','action-area','footer'])assert.ok(html.includes('id="'+id+'"'),id);
 for(const id of ['login-status'])assert.match(html,new RegExp('<div[^>]*id="'+id+'"[^>]*>\\s*</div>'));
 assert.match(html,/<div id="page-title">WIKIDOT_EDITOR_FILENAME<\/div>/);
 assert.match(html,/<title>\s*<\/title>/);
});

test('article data is empty while metadata labels and count containers remain',()=>{
 const html=fs.readFileSync(__dirname+'/../templates/scp-cn.html','utf8');
 assert.match(html,/<div class="page-tags"><span><\/span><\/div>/);
 assert.match(html,/页面版本: <span class="page-version"><\/span>, 最后编辑于: <span class="odate"><\/span>/);
 assert.match(html,/评分 \(<span class="page-rating"><\/span>\)/);
 assert.match(html,/讨论 \(<span class="page-comment-count"><\/span>\)/);
 for(const stale of ['2023冬季征文','2026夏季征文','+162','+268','讨论 (34)','讨论 (41)','停止关注网站','time_1690908403','turbulent','empty-page'])assert.ok(!html.includes(stale),stale);
});
test('default template contains site CSS but no author typography or record styles',()=>{
 const html=fs.readFileSync(__dirname+'/../templates/scp-cn.html','utf8');
 for(const authorCSS of ['Noto Serif SC','IMG_noise.png','div#page-content > div.record > p','.record {','text-indent: 2em'])assert.ok(!html.includes(authorCSS),authorCSS);
 assert.ok(html.includes('#side-bar'));assert.ok(html.includes('#header'));
});
