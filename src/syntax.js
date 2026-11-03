"use strict";
const blank=text=>text.replace(/[^\n]/g,"");
function stripComments(text){return text.replace(/\[\[code(?:\s+[^\]]*)?\]\][\s\S]*?\[\[\/code\]\]|\[!--[\s\S]*?--\]/gi,raw=>/^\[!--/.test(raw)?blank(raw):raw);}
// [[iftags]] blocks nest. An [[iftags]] without terms never matches at the
// top level (Wikidot's empty "any" list), but is transparent when nested.
// Themes rely on this: [[ift{$param}gs …]] only becomes a real tag once the
// include parameter is substituted, and wraps an empty [[iftags]] switch.
// Tag lines prefixed by blockquote markers are removed with their prefix.
function selectTags(text,tags=[]) {
  const available=new Set(tags),stack=[];let output="",end=0,active=true;
  const tokens=/\[\[code(?:\s+[^\]]*)?\]\][\s\S]*?\[\[\/code\]\]|^[ \t]*>[> \t]*\[\[(\/?)iftags(?:\s+([^\]]*))?\]\][ \t]*$|\[\[(\/?)iftags(?:\s+([^\]]*))?\]\]|^[ \t>]*\[\[\/?ift\{\$[^}\]]*\}gs\b[^\]]*\]\][ \t]*$/gim;let m;
  while((m=tokens.exec(text))){
    output+=active?text.slice(end,m.index):blank(text.slice(end,m.index));end=tokens.lastIndex;
    const close=m[1]??m[3],args=m[2]??m[4];
    if(close===undefined){output+=active&&!/^[ \t>]*\[\[\/?ift\{/.test(m[0])?m[0]:blank(m[0]);continue;}
    if(close){active=stack.length?stack.pop():active;}
    else{
      const terms=(args||"").trim().split(/[, ]+/).filter(Boolean);
      const required=terms.filter(t=>t[0]==="+"),excluded=terms.filter(t=>t[0]==="-"),any=terms.filter(t=>!/[+-]/.test(t[0]));
      const matches=terms.length?required.every(t=>available.has(t.slice(1)))&&excluded.every(t=>!available.has(t.slice(1)))&&(!any.length||any.some(t=>available.has(t))):stack.length>0;
      stack.push(active);active=active&&matches;
    }
    output+=blank(m[0]);
  }
  return output+(active?text.slice(end):blank(text.slice(end)));
}
// Wikidot expressions: [[#if c | then | else]], [[#ifexpr e | then | else]]
// and [[#expr e]]. Conditions are false when empty, "false", "null" or "0".
// Expressions use a small arithmetic/logic grammar; nothing is ever eval'd.
function evaluate(expr){
  const tokens=String(expr).match(/\d+(?:\.\d+)?|<=|>=|!=|<>|==|and|or|not|[-+*/%()<>=!]/gi)||[];
  if(tokens.join("").replace(/\s/g,"")!==String(expr).replace(/\s/g,""))throw Error("bad");
  let i=0;const peek=()=>tokens[i]?.toLowerCase(),take=()=>tokens[i++];
  const or=()=>{let v=and();while(peek()==="or"){take();const r=and();v=(v||r)?1:0;}return v;};
  const and=()=>{let v=cmp();while(peek()==="and"){take();const r=cmp();v=(v&&r)?1:0;}return v;};
  const cmp=()=>{let v=add();while(["<",">","<=",">=","=","==","!=","<>"].includes(peek())){const o=take(),r=add();v=({"<":v<r,">":v>r,"<=":v<=r,">=":v>=r,"=":v===r,"==":v===r,"!=":v!==r,"<>":v!==r})[o]?1:0;}return v;};
  const add=()=>{let v=mul();while(peek()==="+"||peek()==="-"){const o=take(),r=mul();v=o==="+"?v+r:v-r;}return v;};
  const mul=()=>{let v=unary();while(["*","/","%"].includes(peek())){const o=take(),r=unary();v=o==="*"?v*r:o==="/"?v/r:v%r;}return v;};
  const unary=()=>{const t=peek();if(t==="-"){take();return -unary();}if(t==="+"){take();return unary();}if(t==="not"||t==="!"){take();return unary()?0:1;}if(t==="("){take();const v=or();if(take()!==")")throw Error("bad");return v;}const n=take();if(n===undefined||!/^\d/.test(n))throw Error("bad");return Number(n);};
  const value=or();if(i!==tokens.length||!Number.isFinite(value))throw Error("bad");return value;
}
function expressions(text){
  const falsy=v=>/^(?:|false|null|0)$/i.test(v.trim());
  const re=/\[\[#(if|ifexpr|expr)\s([^\[\]]*)\]\]/gi;
  for(let round=0;round<20&&re.test(text);round++){
    re.lastIndex=0;
    text=text.replace(re,(raw,kind,body)=>{
      const parts=body.split("|"),cond=parts[0];
      if(kind.toLowerCase()==="if")return (falsy(cond)?parts[2]:parts[1])?.trim()??"";
      let value;try{value=evaluate(cond);}catch{return kind.toLowerCase()==="expr"?"Expression error":(parts[2]?.trim()??"");}
      if(kind.toLowerCase()==="expr")return String(Math.round(value*1e10)/1e10);
      return (value?parts[1]:parts[2])?.trim()??"";
    });
  }
  return text;
}
function prepareSource(text,tags=[]) {
  // Comments in code examples stay literal, while inactive documentation must
  // disappear before its includes or CSS modules are ever processed.
  return expressions(selectTags(stripComments(text),tags));
}
module.exports={stripComments,selectTags,prepareSource,expressions,evaluate};
