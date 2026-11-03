"use strict";
// Live editing model. Decorations preserve native text and cursor positions;
// document CSS is only applied by the separate Preview renderer.
//
// Layout rule: Live editing never adds visual lines. Tags are replaced in
// place. A block opener swallows its own line break and a closer swallows the
// break before it, so `[[div]]\ntext\n[[/div]]` is drawn as one framed row
// with a "div" label in the corner, like a rendered Obsidian code block. When
// the cursor reaches either tag, both tags come back as source rows inside the
// same frame.
const {fontSize,unixName,findClose,attr}=require("./common");
const ALIGN={"=":"center",">":"right","<":"left","==":"justify"};
const RAW=new Set(["code","html","embed","math"]);
// Blocks drawn as framed boxes; the others only hide their tags.
const BOX=new Set(["div","note","gallery","bibliography","code","html","embed","math","quote","ul","ol"]);
const NAMES="div|collapsible|tabview|tab|table|row|cell|hcell|thead|tbody|ul|ol|li|note|gallery|bibliography|footnote|span|size|a|quote|code|html|embed|math|==|=|>|<";
const OPEN_LINE=new RegExp(`^\\[\\[(${NAMES})(?=[\\s\\]])([^\\]]*)\\]\\]$`,"i");
const CLOSE_LINE=new RegExp(`^\\[\\[\\/(${NAMES})\\]\\]$`,"i");
const INLINE_CONTAINER=/\[\[(span|size|a|footnote|div|note|collapsible|li|cell|hcell)(?=[\s\]])([^\]]*)\]\]/y;
const TOKEN=/\[\[(f?[<>]toc|toc|footnoteblock|#|anchor|f?[<>=]?image|iframe|file|\*?user)(?=[\s\]])([^\]]*)\]\]/y;
// Only layout/typography declarations are admitted into the editor, never page CSS.
function layoutStyle(args){
 const allowed=/^(?:text-align|width|max-width|min-width|height|min-height|margin(?:-(?:left|right|top|bottom))?|padding(?:-(?:left|right|top|bottom))?|color|background-color|border(?:-radius)?|font-size|line-height|opacity)$/;
 return (attr(args,"style")||"").split(";").filter(part=>{const i=part.indexOf(":");return i>0&&allowed.test(part.slice(0,i).trim().toLowerCase())&&!/url\s*\(|expression|[{}<>]/i.test(part);}).join(";");
}
function colorValue(value){const text=String(value||"").trim();return /^[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(text)?"#"+text:text;}
function blockLabel(kind,args){
  const cls=attr(args,"class"),id=attr(args,"id");
  const sel=(cls?cls.split(/\s+/).filter(Boolean).map(c=>"."+c).join(""):"")+(id?"#"+id:"");
  switch(kind){
    case "collapsible":return "collapsible · "+(attr(args,"show")||"+ show block");
    case "code":{const type=attr(args,"type");return "code"+(type?" · "+type:"");}
    case "tab":return args.trim();
    default:return kind+(sel?" "+sel:"");
  }
}
function tokenLabel(name,args){
  const value=args.trim(),first=value.split(/\s+/)[0]||"";
  switch(name.toLowerCase().replace(/^f(?=[<>])/,"")){
    case "footnoteblock":return "脚注";
    case "#":case "anchor":return "⚓ "+first;
    case "iframe":return "iframe · "+(/^https?:\/\/([^/]+)/i.exec(first)?.[1]||first);
    case "file":return "📎 "+(value.split("|")[1]||first).trim();
    case "user":case "*user":return "@"+value;
    default:return "🖼 "+(first.split("/").pop()||"图片");
  }
}
function plain(text){return String(text).replace(/\[\[[^\]]*\]\]|\*\*|\/\/|__|--|\{\{|\}\}|\^\^|,,|@@/g,"").replace(/##[^|#]+\|([^#]*)##/g,"$1").trim();}
function parseLive(source,options={}) {
  const {localRules,styleFor}=require("./layout"),layoutRules=localRules(source);
  const lines=[],marks=[],hidden=[],folds=[],chips=[],headings=[],tabviews=[],collapsibles=[],tables=[],divs=[],stack=[];
  // Mask comments before parsing so their brackets and CSS cannot affect nesting.
  const comments=[];
  const masked=source.replace(/\[\[(code|html|embed|math)\b[^\]]*\]\][\s\S]*?(?:\[\[\/\1\]\]|$)|@@[\s\S]*?@@|@<[\s\S]*?>@|\[!--[\s\S]*?(?:--\]|$)/gi,(text,...args)=>{
    const at=args[args.length-2];
    if(!text.startsWith("[!--"))return text;
    comments.push({from:at,to:at+text.length});return text.replace(/[^\n]/g," ");
  });
  const rawLines=masked.split("\n"),starts=[],tagLine=new Set();
  {let at=0;for(const text of rawLines){starts.push(at);at+=text.length+1;}}
  let raw=null,counters=[];
  function mark(from,to,cls,style=""){if(to>from&&(cls||style))marks.push({from,to,cls,style});}
  function hide(from,to,line){if(to>from)hidden.push({from,to,line});}
  const boxDepth=()=>stack.filter(s=>s.box).length;
  const alignStyle=()=>{for(let i=stack.length-1;i>=0;i--)if(stack[i].align)return "text-align:"+stack[i].align;return "";};
  const RULES=[
    {re:/@@([^\n]*?)@@/y,kind:"literal"},
    {re:/@<([^\n]*?)>@/y,kind:"literal"},
    {re:/\[!--[^\n]*?--\]/y,kind:"comment"},
    {re:/\[\[\[(\*?)([^\]\n|]+?)(?:\s*\|\s*([^\]\n]*?))?\s*\]\]\]/y,kind:"pagelink"},
    {re:/\[(\*?)((?:https?:\/\/|\/|#)[^\s\]]*)(?:\s+([^\]\n]+))?\]/y,kind:"url"},
    {re:/\[([\w.+-]+@[\w.-]+\.\w+)(?:\s+([^\]\n]+))?\]/y,kind:"mail"},
    {re:/\[\[\$([^\n]*?)\$\]\]/y,kind:"math"},
    {re:/\*\*([^\n]+?)\*\*/y,kind:"strong"},
    {re:/(?<![:/])\/\/([^\n]+?)\/\//y,kind:"em"},
    {re:/__([^\n]+?)__/y,kind:"underline"},
    {re:/--([^\n]+?)--/y,kind:"strike"},
    {re:/\{\{([^\n]+?)\}\}/y,kind:"code"},
    {re:/\^\^([^\n]+?)\^\^/y,kind:"sup"},
    {re:/,,([^\n]+?),,/y,kind:"sub"},
    {re:/##([^|\n#]+)\|([^\n#]*?)##/y,kind:"color"},
    {re:/(\*?)(https?:\/\/[^\s\]\[|<>"']+)/y,kind:"bare"}
  ];
  const WRAP={strong:"wd-live-strong",em:"wd-live-em",underline:"wd-live-underline",strike:"wd-live-strike",sup:"wd-live-sup",sub:"wd-live-sub"};
  function inline(text,at,line){
    let index=0;
    while(index<text.length){
      if(text.startsWith("[[",index)&&!text.startsWith("[[[",index)){
        TOKEN.lastIndex=index;let m=TOKEN.exec(text);
        if(m){
          const start=at+index,end=start+m[0].length,toc=/toc$/i.test(m[1]);
          chips.push({kind:toc?"toc":/image$/i.test(m[1])?"image":"token",source:m[0],from:start,to:end,revealFrom:start,revealTo:end,line,label:toc?"目录":tokenLabel(m[1],m[2]),float:/^f</i.test(m[1])?"left":/^f>/i.test(m[1])?"right":""});
          index+=m[0].length;continue;
        }
        INLINE_CONTAINER.lastIndex=index;m=INLINE_CONTAINER.exec(text);
        if(m){
          const name=m[1].toLowerCase(),close=findClose(text,index+m[0].length,name);
          if(close){
            const from=at+index+m[0].length,to=at+close.start;
            let cls="",style="";
            if(name==="size"){const size=fontSize(m[2]);if(size){cls="wd-live-size";style="font-size:"+size;}}
            else if(name==="a")cls="wd-live-link";
            else if(name==="footnote")cls="wd-live-footnote";
            hide(at+index,from,line);mark(from,to,cls,style);hide(to,at+close.end,line);
            inline(text.slice(index+m[0].length,close.start),from,line);
            index=close.end;continue;
          }
        }
      }
      let hit=null;
      for(const rule of RULES){rule.re.lastIndex=index;const m=rule.re.exec(text);if(m&&m.index===index){hit={rule,m};break;}}
      if(!hit){index++;continue;}
      const m=hit.m,start=at+m.index,end=start+m[0].length;
      switch(hit.rule.kind){
        case "literal":{const content=m[1],from=start+2;mark(from,from+content.length,"wd-live-literal");hide(start,from,line);hide(from+content.length,end,line);break;}
        case "comment":mark(start,end,"wd-live-comment");break;
        case "pagelink":{
          const pipe=m[0].indexOf("|"),label=m[3]?.trim();
          if(label){const from=start+pipe+1+m[0].slice(pipe+1).indexOf(label);mark(from,from+label.length,"wd-live-link");hide(start,from,line);hide(from+label.length,end,line);}
          else{
            // `[[[page]]]` and `[[[page|]]]` both show the page name itself.
            const target=m[2],from=start+3+m[1].length+m[0].slice(3+m[1].length).indexOf(target);
            mark(from,from+target.length,"wd-live-link");hide(start,from,line);hide(from+target.length,end,line);
          }
          break;
        }
        case "url":{
          const label=m[3]||m[2],from=label===m[3]?start+m[0].lastIndexOf(label):start+1+m[1].length;
          mark(from,from+label.length,"wd-live-link");hide(start,from,line);hide(from+label.length,end,line);break;
        }
        case "mail":{const label=m[2]||m[1],from=start+m[0].lastIndexOf(label);mark(from,from+label.length,"wd-live-link");hide(start,from,line);hide(from+label.length,end,line);break;}
        case "math":{const from=start+3;hide(start,from,line);mark(from,from+m[1].length,"wd-live-math");hide(from+m[1].length,end,line);break;}
        case "bare":{const from=start+m[1].length;hide(start,from,line);mark(from,end,"wd-live-link");break;}
        case "code":{const content=m[1],from=start+2;hide(start,from,line);mark(from,from+content.length,"wd-live-code");hide(from+content.length,end,line);break;}
        case "color":{
          const parts=m[2].split("|"),background=parts.length>1?colorValue(parts[0]):"",content=parts.length>1?parts.slice(1).join("|"):parts[0];
          const from=start+m[0].lastIndexOf(content);
          mark(from,from+content.length,"",`color:${colorValue(m[1])}${background?";background:"+background:""}`);
          hide(start,from,line);hide(from+content.length,end,line);
          inline(content,from,line);break;
        }
        default:{
          const content=m[1],from=start+2;
          hide(start,from,line);mark(from,from+content.length,WRAP[hit.rule.kind]||"");hide(from+content.length,end,line);
          inline(content,from,line);
        }
      }
      index+=m[0].length;
    }
  }
  const lineInfo=(i,extra={})=>({from:starts[i],to:starts[i]+rawLines[i].length,number:i,spaceTop:false,spaceBottom:false,cls:"",style:alignStyle(),depth:boxDepth(),top:[],bottom:[],...extra});
  // Folds keep their whole source; lines inside them are not decorated.
  function fold(line,i,last,kind){
    const from=starts[i],end=starts[last]+rawLines[last].length,first=rawLines[i].trim();
    const label=kind==="Comment"?"[!-- … --]":last>i&&!/\]\]$/.test(first)?first+" …":first;
    folds.push({from,to:end,label,kind,lines:last-i+1,line:i,last,firstTo:starts[i]+rawLines[i].length});
    line.cls="wd-live-fold-line";line.spaceTop=true;line.spaceBottom=last===i;
    for(let j=i+1;j<=last;j++)lines.push(lineInfo(j,{cls:"wd-live-fold-line",spaceBottom:j===last}));
  }
  for(let i=0;i<rawLines.length;i++){
    const text=rawLines[i],from=starts[i],to=from+text.length;
    const line=lineInfo(i);lines.push(line);
    const trimmed=text.trim(),lead=text.length-text.trimStart().length,tagFrom=from+lead,tagTo=from+text.trimEnd().length;let match;
    const closeTag=kind=>{
      // Same recovery as Preview: alignment closers are interchangeable, and
      // a closer of an outer block implicitly ends unclosed inner blocks.
      let open=stack[stack.length-1];
      if(!open)return false;
      if(open.kind!==kind&&!(ALIGN[open.kind]&&ALIGN[kind])){
        let at=stack.length-1;while(at>=0&&stack[at].kind!==kind)at--;
        if(at<0||stack.slice(at+1).some(s=>RAW.has(s.kind)))return false;
        while(stack.length-1>at){
          const inner=stack.pop();
          if(inner.box){line.bottom.push(inner.level);}
          chips[inner.chip].implicit=true;
        }
        open=stack[stack.length-1];
      }
      stack.pop();tagLine.add(i);
      line.style=open.align?"text-align:"+open.align:alignStyle();line.cls="wd-live-tag-line";
      if(!/^(?:span|size|a|tab|row|cell|hcell|thead|tbody|li)$/.test(kind))line.spaceBottom=true;
      if(open.box){line.depth=Math.max(open.level,...line.bottom);line.bottom.push(open.level);}
      const index=chips.push({kind:"close",tag:kind,from,to,revealFrom:tagFrom,revealTo:tagTo,line:i,label:"/"+kind,box:open.box,level:open.level,pair:open.chip})-1;
      chips[open.chip].pair=index;
      if(kind==="tab"&&open.tab){open.tab.to=i<rawLines.length-1?starts[i+1]:to;open.tab.close=index;}
      if(kind==="div")divs.push({from:chips[open.chip].revealFrom,to:tagTo,first:chips[open.chip].line,last:i,open:open.chip,close:index,args:open.args,layout:open.layout,source:source.slice(chips[open.chip].revealFrom,tagTo)});
      if(kind==="table"){
        const start=chips[open.chip].revealFrom,sourceText=source.slice(start,tagTo),cells=[];
        const re=/\[\[(h?cell)(?=[\s\]])[^\]]*\]\]/gi;let m;
        while((m=re.exec(sourceText)))cells.push({from:start+m.index+m[0].length});
        tables.push({from:start,to:tagTo,first:chips[open.chip].line,last:i,source:sourceText,cells,simple:false});
      }
      if(kind==="collapsible")collapsibles.push({from:chips[open.chip].from,to,open:open.chip,close:index,args:open.args});
      if(kind==="tabview"&&open.tabview)tabviews.push(open.tabview);
      return true;
    };
    if(raw){
      if((match=CLOSE_LINE.exec(trimmed))&&match[1].toLowerCase()===raw){raw=null;closeTag(match[1].toLowerCase());}
      else line.cls="wd-live-code-line";
      continue;
    }
    if(/^\[\[include\b/i.test(trimmed)){
      let last=i;
      while(last<rawLines.length-1&&!/\]\]\s*$/.test(rawLines[last])){
        if(/^\s*\[\[(?:include|module|div|code)\b/i.test(rawLines[last+1]))break;
        last++;
      }
      if(/\]\]\s*$/.test(rawLines[last])){fold(line,i,last,"Include · "+(/^\[\[include\s+([^\s|\]]+)/i.exec(trimmed)?.[1]||""));i=last;continue;}
    }
    if(/^\[\[module\s+\S+/i.test(trimmed)||/^\[!--/.test(trimmed)){
      const comment=trimmed.startsWith("[!--"),module=/^\[\[module\s+([^\s\]]+)/i.exec(trimmed)?.[1],endPattern=comment?/--\]/:/\[\[\/module\]\]/i;let last=i;
      while(last<rawLines.length-1&&!endPattern.test(rawLines[last])){
        if(!comment&&/^\s*\[\[module\b/i.test(rawLines[last+1]))break;
        last++;
      }
      const closed=endPattern.test(rawLines[last]);
      if(!closed&&!comment&&module?.toLowerCase()!=="css")last=i;
      if(closed||(!comment&&module?.toLowerCase()!=="css")){fold(line,i,last,comment?"Comment":module);i=last;continue;}
    }
    if(/^\s*\|\|/.test(text)){
      const {simpleCells}=require("./tables"),first=i,cells=[];
      let last=i;
      while(true){
        cells.push(...simpleCells(rawLines[last],starts[last]));
        if(/ _\s*$/.test(rawLines[last]))break; // continuation remains native source until closed
        if(last+1>=rawLines.length||!/^\s*\|\|/.test(rawLines[last+1]))break;
        last++;
      }
      line.cls="wd-live-table-line";line.spaceTop=true;line.spaceBottom=last===i;
      for(let j=i+1;j<=last;j++)lines.push(lineInfo(j,{cls:"wd-live-table-line",spaceBottom:j===last}));
      if(!/ _\s*$/.test(rawLines[last]))tables.push({from,to:starts[last]+rawLines[last].length,first,last,source:source.slice(from,starts[last]+rawLines[last].length),cells,simple:true});
      i=last;continue;
    }
    if((match=OPEN_LINE.exec(trimmed))){
      const kind=match[1].toLowerCase(),args=match[2]||"",layout=kind==="div"&&options.layout!==false?styleFor(args,layoutRules,options.positioning):"",box=BOX.has(kind)&&(kind!=="div"||options.frames!==false);
      const entry={kind,args,layout,align:ALIGN[kind]||"",box,level:boxDepth()+(box?1:0),chip:chips.length};
      const parent=stack[stack.length-1];
      if(kind==="tabview")entry.tabview={from,chip:chips.length,tabs:[]};
      if(kind==="tab"&&parent?.tabview){entry.tab={name:args.trim()||"标签 "+(parent.tabview.tabs.length+1),from,open:chips.length};parent.tabview.tabs.push(entry.tab);}
      stack.push(entry);tagLine.add(i);
      if(!/^(?:span|size|a|tab|row|cell|hcell|thead|tbody|li)$/.test(kind))line.spaceTop=true;
      if(RAW.has(kind))raw=kind;
      line.style=alignStyle();line.depth=boxDepth();line.cls="wd-live-tag-line";if(box)line.top.push(entry.level);
      chips.push({kind:"open",tag:kind,from,to,revealFrom:tagFrom,revealTo:tagTo,line:i,label:blockLabel(kind,args),box,args,layout,level:entry.level,raw:RAW.has(kind)});
      counters=[];continue;
    }
    if((match=CLOSE_LINE.exec(trimmed))){
      const kind=match[1].toLowerCase();
      if(!closeTag(kind)){
        // Pairing hint: an unmatched closer is flagged in place instead of
        // silently changing the nesting of every following line.
        line.cls="wd-live-unmatched";line.style="";
        chips.push({kind:"warn",from:tagFrom,to:tagTo,revealFrom:tagFrom,revealTo:tagTo,line:i,label:"⚠ 多余的 /"+kind});
      }
      counters=[];continue;
    }
    if(!trimmed)line.cls="wd-live-empty-line";
    let content=text,contentAt=from;
    if((match=/^(\s*)([*#])\s+/.exec(text))){
      const level=match[1].length,ordered=match[2]==="#";
      counters=counters.slice(0,level+1);counters[level]=(counters[level]||0)+1;
      line.cls="wd-live-list";
      chips.push({kind:"bullet",from,to:from+match[0].length,line:i,lineMode:true,label:ordered?counters[level]+".":"•",indent:level});
      content=text.slice(match[0].length);contentAt+=match[0].length;
    }else{
      counters=[];
      if((match=/^(\+{1,6})(\*?)\s+/.exec(text))){
        // As with Markdown headings in this vault, the marker sits at the right
        // edge and only appears while the line is being edited.
        const level=match[1].length;
        line.cls=`wd-live-heading wd-live-h${level}`;
        mark(from,from+match[0].length,"wd-live-heading-mark");
        hide(from,from+match[0].length,i);content=text.slice(match[0].length);contentAt+=match[0].length;
        headings.push({level,text:plain(content),from:contentAt,hidden:!!match[2]});
      }
      else if((match=/^(>+) ?/.exec(text))){line.cls="wd-live-quote wd-live-quote-"+Math.min(match[1].length,4);hide(from,from+match[0].length,i);content=text.slice(match[0].length);contentAt+=match[0].length;}
      else if((match=/^:\s+(.+?)\s+:(?:\s+|$)/.exec(text))){
        line.cls="wd-live-dl";const term=match[1],termAt=from+text.indexOf(term,1);
        hide(from,termAt,i);mark(termAt,termAt+term.length,"wd-live-dt");
        chips.push({kind:"sep",from:termAt+term.length,to:from+match[0].length,line:i,lineMode:true,label:"："});
        inline(term,termAt,i);content=text.slice(match[0].length);contentAt=from+match[0].length;
      }
      else if(/^\s*\|\|/.test(text))line.cls="wd-live-table-line";
      else if(/^-{3,}\s*$/.test(text)){line.cls="wd-live-rule";line.spaceTop=true;line.spaceBottom=true;hide(from,to,i);continue;}
    }
    if(/^\[\[(?:f?[<>=]?image|f?[<>]?toc)\b/i.test(trimmed)){line.spaceTop=true;line.spaceBottom=true;}
    inline(content,contentAt,i);
  }
  // Incomplete outer divs still own their descendants while drafting.
  for(const open of stack)if(open.kind==="div"){
    const chip=chips[open.chip];
    divs.push({from:chip.revealFrom,to:source.length,first:chip.line,last:rawLines.length-1,open:open.chip,args:open.args,layout:open.layout,source:source.slice(chip.revealFrom)});
    if(open.box)lines.at(-1).bottom.push(open.level);
  }
  // Render one coherent subtree, rather than a layout widget inside source frames.
  for(const block of divs)if(!block.layout&&divs.some(child=>child.from>block.from&&child.to<=block.to&&child.layout))block.layout="display:block";
  // Line joins: every opener absorbs the break after it and every closer the
  // break before it, unless that break is already taken. An empty block is a
  // single framed row; sibling blocks stay on separate rows.
  const joined=new Set();
  for(const chip of chips)if(chip.kind==="open"&&chip.line<rawLines.length-1&&rawLines[chip.line+1].trim()!==""&&!joined.has(chip.line)){chip.to=starts[chip.line+1];chip.join=chip.line;joined.add(chip.line);}
  for(const chip of chips)if(chip.kind==="close"&&chip.line>0&&rawLines[chip.line-1].trim()!==""&&!joined.has(chip.line-1)){chip.from=starts[chip.line]-1;chip.join=chip.line-1;joined.add(chip.line-1);}
  // An inactive tab hides its lines plus one free line break next to them,
  // so switching tabs never leaves an empty row behind.
  for(const view of tabviews)for(const tab of view.tabs){
    if(tab.close===undefined)continue;
    const s=chips[tab.open].line,e=chips[tab.close].line,end=starts[e]+rawLines[e].length;
    // Only one tab of a view is visible, so hidden tabs may share a break;
    // the editor merges overlapping hide ranges.
    if(s>0&&!joined.has(s-1)){tab.hideFrom=starts[s]-1;tab.hideTo=end;}
    else if(e<rawLines.length-1&&!joined.has(e)){tab.hideFrom=starts[s];tab.hideTo=starts[e+1];}
    else{tab.hideFrom=starts[s];tab.hideTo=end;}
    tab.first=s;tab.last=e;tab.contentFrom=s<rawLines.length-1?starts[s+1]:end;
  }
  folds.forEach((f,index)=>{for(let j=f.line;j<=f.last;j++)lines[j].fold=index;});
  return {comments,lines,marks,hidden,folds,chips,headings,tabviews,collapsibles,tables,divs,layoutRules,length:source.length};
}
function activeLines(model,ranges){const active=new Set();for(const line of model.lines)if(ranges.some(r=>r.from<=line.to&&r.to>=line.from))active.add(line.number);return active;}
function touches(ranges,from,to){return ranges.some(r=>r.from<=to&&r.to>=from);}
// A paired block exposes both boundaries while editing anywhere within it.
// Line alignment/typography remains independent from source visibility.
function revealed(model,chip,ranges,active){
  if(chip.lineMode)return active.has(chip.line);
  const pair=chip.pair!==undefined?model.chips[chip.pair]:null;
  if(pair){
    const open=chip.kind==="open"?chip:pair,close=chip.kind==="open"?pair:chip;
    if(open.tag==="div")return touches(ranges,open.revealFrom,open.revealTo)||touches(ranges,close.revealFrom,close.revealTo);
    return touches(ranges,open.revealFrom,close.revealTo);
  }
  return touches(ranges,chip.revealFrom??chip.from,chip.revealTo??chip.to);
}
function matchingTagPosition(model,pos){
  const chip=model.chips.find(c=>c.pair!==undefined&&pos>=c.revealFrom&&pos<=c.revealTo);
  return chip?model.chips[chip.pair].revealFrom:null;
}
// Visual rows: source lines merged across hidden breaks. `broken` holds line
// numbers whose trailing break is hidden, `gone` lines hidden entirely and
// `opened` the start positions of expanded folds, drawn one level deeper.
function rows(model,{broken=new Set(),gone=new Set(),opened=new Set()}={}){
  const result=[];let current=null;
  for(const line of model.lines){
    if(!current)current={at:line.from,lines:[],depth:0,top:[],bottom:[],spaceTop:false,spaceBottom:false,cls:"",style:""};
    current.lines.push(line);
    if(!gone.has(line.number)){
      let depth=line.depth,cls=line.cls;const top=[...line.top],bottom=[...line.bottom];
      const fold=line.fold!==undefined?model.folds[line.fold]:null;
      if(fold&&opened.has(fold.from)){depth++;cls="wd-live-code-line";if(line.number===fold.line)top.push(depth);if(line.number===fold.last)bottom.push(depth);}
      current.spaceTop ||= line.spaceTop;current.spaceBottom ||= line.spaceBottom;
      current.depth=Math.max(current.depth,depth);current.top.push(...top);current.bottom.push(...bottom);
      if(!current.cls||current.cls==="wd-live-tag-line")current.cls=cls||current.cls;
      if(!current.style)current.style=line.style;
    }
    if(!broken.has(line.number)){result.push(current);current=null;}
  }
  if(current)result.push(current);
  return result;
}
const STEP=12;
// The outermost frame uses real borders (rounded through classes); inner
// levels are painted as background layers so nesting needs no extra DOM.
function frameStyle(row){
  if(!row.depth)return "";
  const paint="linear-gradient(var(--wd-box-border),var(--wd-box-border))",img=[],pos=[],size=[];
  const layer=(p,z)=>{img.push(paint);pos.push(p);size.push(z);};
  for(let k=2;k<=row.depth;k++){
    const x=(k-1)*STEP,top=row.top.includes(k),bottom=row.bottom.includes(k);
    const y=top?3:0,h=`calc(100% - ${(top?3:0)+(bottom?3:0)}px)`,w=`calc(100% - ${2*x}px)`;
    if(top)layer(`left ${x}px top 3px`,`${w} 1px`);
    if(bottom)layer(`left ${x}px bottom 3px`,`${w} 1px`);
    layer(`left ${x}px top ${y}px`,`1px ${h}`);layer(`right ${x}px top ${y}px`,`1px ${h}`);
  }
  const pad=row.depth*STEP+2,parts=[`padding-left:${pad}px`,`padding-right:${pad}px`];
  if(row.top.length)parts.push(`padding-top:${22}px`);
  if(img.length)parts.push(`background-image:${img.join(",")}`,`background-position:${pos.join(",")}`,`background-size:${size.join(",")}`,"background-repeat:no-repeat");
  return parts.join(";");
}
function frameClass(row){
  if(!row.depth)return "";
  return "wd-live-box"+(row.top.includes(1)?" wd-live-box-top":"")+(row.bottom.includes(1)?" wd-live-box-bottom":"")+(row.top.some(k=>k>1)?" wd-live-box-inner-top":"")+(row.bottom.some(k=>k>1)?" wd-live-box-inner-bottom":"");
}
module.exports={matchingTagPosition,layoutStyle,parseLive,activeLines,revealed,rows,frameStyle,frameClass,touches,STEP,unixName};
