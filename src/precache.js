"use strict";
const {includeURL,expandIncludes}=require("./includes");
const {publicPageURL}=require("./remote");
const {render,rebaseCSS}=require("./renderer");
function entries(text,base){
 return [...new Set(String(text||"").split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map(s=>{
  if(/^https:\/\//i.test(s))return publicPageURL(s);
  const match=/^\[\[include\s+([\s\S]+?)\]\]\s*$/i.exec(s);
  return includeURL((match?match[1]:s).split(/[|\s]/)[0],base);
 }))];
}
async function preloadIncludes(text,remote,base,onProgress=()=>{}){
 const urls=entries(text,base),results=[];
 for(let i=0;i<urls.length;i++){
  const url=urls[i];onProgress({index:i+1,total:urls.length,url});
  try{
   const source=await remote.source(url);
   const expanded=await expandIncludes(source,u=>remote.source(u),{base:url,transformSource:(raw,u)=>raw.replace(/(\[\[module\s+CSS\b[^\]]*\]\])([\s\S]*?)(\[\[\/module\]\])/gi,(_,a,css,c)=>a+rebaseCSS(css,u)+c)});
   const css=render(expanded.source,{base:url}).css.join("\n");
   const styles=await remote.styles(rebaseCSS(css,url),url);
   results.push({url,warnings:[...expanded.warnings,...styles.warnings],dependencies:expanded.dependencies});
  }catch(error){results.push({url,error:error.message});}
 }
 return results;
}
module.exports={entries,preloadIncludes};
