const {test}=require('node:test'),assert=require('node:assert/strict');
const {entries,preloadIncludes}=require('./precache');
test('cache list accepts page, cross-site, full include and URL without duplicates',()=>{
 assert.deepEqual(entries('component:a\n[[include component:a |x=y]]\n:other:theme:a\nhttps://other.wikidot.com/theme:a','https://test.wikidot.com/'),['https://test.wikidot.com/component:a','https://other.wikidot.com/theme:a']);
 assert.throws(()=>entries('https://example.com/a','https://test.wikidot.com/'));
});
test('preload collects nested sources and relative CSS, preserving raw parameters for actual use',async()=>{
 const calls=[],styles=[],raw='[[module CSS]]\n@import "local--theme.css";\n[[/module]]\n{$value}\n[[include child]]';
 const remote={async source(url){calls.push(url);return url.endsWith('/child')?'child text':raw},async styles(css,base){styles.push({css,base});return {warnings:[]}}};
 const progress=[],results=await preloadIncludes('theme:a',remote,'https://test.wikidot.com/',p=>progress.push(p));
 assert.deepEqual(calls,['https://test.wikidot.com/theme:a','https://test.wikidot.com/child']);assert.ok(styles[0].css.includes('https://test.wikidot.com/local--theme.css'));assert.equal(results[0].warnings.length,0);assert.equal(progress[0].total,1);assert.ok(raw.includes('{$value}'));
});
test('individual failures do not stop later preloads and nested warnings are surfaced',async()=>{
 const remote={async source(url){if(url.endsWith('bad'))throw Error('offline');return url.endsWith('outer')?'[[include bad]]':'ok'},async styles(){return {warnings:[]}}};
 const r=await preloadIncludes('bad\nouter\ngood',remote,'https://test.wikidot.com/');assert.equal(r[0].error,'offline');assert.ok(r[1].warnings[0].includes('offline'));assert.equal(r[2].error,undefined);
});
test('live div body never applies authored paint, whether framed or layout-only',()=>{
 const {parseLive}=require('./live'),source='[[div style="color:white;background-color:black;opacity:.1"]]\ntext\n[[/div]]',m=parseLive(source);
 assert.ok(m.lines.every(l=>!/(?:color|opacity)/.test(l.style)));assert.ok(!m.divs[0].layout);
});
