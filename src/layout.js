"use strict";
const {attr}=require("./common");
const LAYOUT=/^(?:display|grid-template-columns|grid-template-rows|grid-auto-flow|grid-column|grid-row|gap|column-gap|row-gap|flex-direction|flex-wrap|flex|order|justify-content|justify-items|align-items|align-self|width|min-width|max-width|height|min-height|max-height|margin(?:-(?:left|right|top|bottom|inline|block))?|padding(?:-(?:left|right|top|bottom|inline|block))?|text-align|float|clear|box-sizing)$/;
function declarations(css,positioning=false,painting=false){
 const result=[];
 for(const part of String(css||"").split(";")){
  const i=part.indexOf(":");if(i<0)continue;
  const name=part.slice(0,i).trim().toLowerCase(),value=part.slice(i+1).trim().replace(/\s*!important\s*$/i,"");
  if(!(LAYOUT.test(name)||(painting&&/^(?:color|background-color|border(?:-radius)?|font-size|line-height|opacity)$/.test(name))||(positioning&&/^(?:position|top|right|bottom|left)$/.test(name)))||!value||/url\s*\(|expression|[{}<>]|var\(/i.test(value))continue;
  if(name==="display"&&!/^(?:grid|inline-grid|flex|inline-flex|block|inline-block|flow-root)$/.test(value))continue;
  if(name==="position"&&!/^(?:relative|absolute|fixed|sticky)$/.test(value))continue;
  // Negative margins pull blocks over each other; without the page's own
  // painting that only produces overlapping text, so they need positioning.
  if(!positioning&&/^margin/.test(name)&&/(^|\s)-\d/.test(value)){const safe=value.replace(/(^|\s)-\d[\w.%]*/g,"$10");result.push(name+":"+safe);continue;}
  result.push(name+":"+value);
 }
 return result.join(";");
}
function localRules(source){
 const rules=[];
 for(const module of source.replace(/\[\[code\b[^\]]*\]\][\s\S]*?\[\[\/code\]\]/gi,"").matchAll(/\[\[module\s+CSS[^\]]*\]\]([\s\S]*?)\[\[\/module\]\]/gi)){
  if(/\bdisable\s*=\s*["']?true/i.test(module[0].slice(0,module[0].indexOf(']]'))))continue;
  const css=module[1].replace(/\/\*[\s\S]*?\*\//g,"");
  for(const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g))for(const selector of match[1].split(",")){
   const s=selector.trim();if(!/^(?:div)?(?:\.[\w-]+)+$/.test(s))continue;
   rules.push({classes:[...s.matchAll(/\.([\w-]+)/g)].map(m=>m[1]),css:match[2]});
  }
 }
 return rules;
}
function styleFor(args,rules,positioning=false,painting=false){
 const classes=new Set((attr(args,"class")||"").split(/\s+/));
 return declarations(rules.filter(r=>r.classes.every(c=>classes.has(c))).map(r=>r.css).concat(attr(args,"style")||"").join(";"),positioning,painting);
}
module.exports={declarations,localRules,styleFor};
