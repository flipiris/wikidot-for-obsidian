"use strict";
function quotedEnd(text,start) {
  const quote=text[start];let i=start+1;
  while(i<text.length){if(text[i]==="\\")i+=2;else if(text[i++]===quote)break;}
  return i;
}
function commentEnd(text,start){const end=text.indexOf("*/",start+2);return end<0?text.length:end+2;}
function urlAt(text,start) {
  const open=/^url\s*\(/i.exec(text.slice(start));if(!open)return null;
  let i=start+open[0].length;while(/\s/.test(text[i]||"")&&i<text.length)i++;
  const valueStart=i;let value;
  if(text[i]==='"'||text[i]==="'"){const end=quotedEnd(text,i);value=text.slice(i+1,end-1);i=end;}
  else {while(i<text.length&&text[i]!==")"){if(text[i]==="\\")i++;i++;}value=text.slice(valueStart,i).trim();}
  while(/\s/.test(text[i]||"")&&i<text.length)i++;
  return text[i]===")"?{start,end:i+1,value}:null;
}
function imports(css) {
  const found=[];let i=0;
  while(i<css.length){
    if(css.startsWith("/*",i)){i=commentEnd(css,i);continue;}
    if(css[i]==='"'||css[i]==="'"){i=quotedEnd(css,i);continue;}
    const m=/^@import\b\s*/i.exec(css.slice(i));
    if(!m){i++;continue;}
    const start=i;let pos=i+m[0].length,url,end;
    const token=urlAt(css,pos);
    if(token){url=token.value;pos=token.end;}
    else if(css[pos]==='"'||css[pos]==="'"){end=quotedEnd(css,pos);url=css.slice(pos+1,end-1);pos=end;}
    else {i+=m[0].length;continue;}
    const conditionStart=pos;let depth=0;
    while(pos<css.length){
      if(css.startsWith("/*",pos)){pos=commentEnd(css,pos);continue;}
      if(css[pos]==='"'||css[pos]==="'"){pos=quotedEnd(css,pos);continue;}
      if(css[pos]==="(")depth++;else if(css[pos]===")")depth--;
      if(css[pos]===";"&&!depth)break;pos++;
    }
    if(pos<css.length)found.push({start,end:pos+1,url,condition:css.slice(conditionStart,pos).trim()});
    i=pos+1;
  }
  return found;
}
function rebaseCSS(css,base) {
  function absolute(value){try{const url=new URL(value,base);return ["https:","http:"].includes(url.protocol)?url.href:"";}catch{return "";}}
  const patches=[];let i=0;
  while(i<css.length){
    if(css.startsWith("/*",i)){i=commentEnd(css,i);continue;}
    if(css[i]==='"'||css[i]==="'"){i=quotedEnd(css,i);continue;}
    const token=(i===0||!/[\w-]/.test(css[i-1]))?urlAt(css,i):null;
    if(token){if(!/^data:|^#/i.test(token.value))patches.push({start:i,end:token.end,text:`url(${JSON.stringify(absolute(token.value))})`});i=token.end;}else i++;
  }
  for(const item of imports(css)){
    const m=/^@import\b\s*/i.exec(css.slice(item.start));const start=item.start+m[0].length;
    if(css[start]==='"'||css[start]==="'")patches.push({start,end:quotedEnd(css,start),text:JSON.stringify(absolute(item.url))});
  }
  for(const patch of patches.sort((a,b)=>b.start-a.start))css=css.slice(0,patch.start)+patch.text+css.slice(patch.end);
  return css;
}
module.exports={imports,rebaseCSS};
