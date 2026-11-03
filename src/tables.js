"use strict";
// Source offsets shared by live table clicks and keyboard navigation.
function simpleCells(text,offset=0){
 const pipes=[...text.matchAll(/\|{2,}/g)],cells=[];
 for(let i=0;i<pipes.length-1;i++){
  const from=pipes[i].index+pipes[i][0].length,to=pipes[i+1].index,raw=text.slice(from,to);
  let lead=/^\s*(?:~\s*)?(?:[<>=]\s*)?/.exec(raw)[0].length;
  cells.push({from:offset+from+lead,to:offset+to,span:Math.max(1,Math.floor(pipes[i][0].length/2))});
 }
 return cells;
}
function tableKey(source,pos,key,backward=false,tables=[]){
 const table=tables.find(t=>pos>=t.from&&pos<=t.to&&t.simple);
 if(!table)return null;
 const cells=table.cells;let index=cells.findIndex((c,i)=>pos<=c.to&&(i===0||pos>cells[i-1].to));
 if(index<0&&cells.length&&pos>cells.at(-1).to)index=cells.length-1;
 if(index<0)return null;
 if(key==="Enter"&&pos!==table.to)return null;
 const target=key==="Enter"?cells.length:index+(backward?-1:1);
 if(target<0)return {selection:{anchor:Math.max(0,table.from-1)}};
 if(target<cells.length)return {selection:{anchor:cells[target].from}};
 if(backward)return null;
 const last=source.slice(table.from,table.to).split("\n").at(-1),columns=simpleCells(last).reduce((n,c)=>n+c.span,0);
 const insert="\n||"+"  ||".repeat(columns);
 return {changes:{from:table.to,insert},selection:{anchor:table.to+4}};
}
module.exports={simpleCells,tableKey};
