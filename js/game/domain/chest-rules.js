'use strict';
// Chest drops are separate from energy-consuming producers.
const ChestRules={
 valid(content){
  const rules=content.chest;
  return !!rules&&typeof rules.unlimited==='boolean'&&Number.isSafeInteger(rules.defaultCharges)&&rules.defaultCharges>0&&
   Array.isArray(rules.series)&&rules.series.length>0&&new Set(rules.series).size===rules.series.length&&
   Array.isArray(rules.tierWeights)&&rules.tierWeights.length===3&&rules.tierWeights.every(w=>Number.isFinite(w)&&w>=0)&&rules.tierWeights.reduce((a,b)=>a+b,0)>0&&
   rules.series.every(type=>rules.tierWeights.every((_,i)=>content.items.some(d=>d.type===type&&d.tier===i+1&&d.tags.includes('tool'))));
 },
 open(board,i){
   if(!this.valid(board.content))return {kind:'none',source:i};
   const chest=board.slots[i],rules=board.content.chest,free=board.empty();if(!free.length)return {kind:'full',source:i};
   const type=rules.series[Math.floor(board.random()*rules.series.length)],roll=board.random()*rules.tierWeights.reduce((a,b)=>a+b,0);
   let total=0;const level=rules.tierWeights.findIndex(w=>(total+=w)>roll)+1;
   if(!board.definition({type,level})?.tags.includes('tool'))return {kind:'none',source:i};
   const index=free[0],item={type,level};board.slots[index]=item;chest.chestUses=(chest.chestUses||0)+1;
   if(!rules.unlimited&&chest.chestUses>=rules.defaultCharges)board.slots[i]=null;
   board.onChange('ITEM_GENERATED',item);return {kind:'spawn',source:i,index,type,item};
}};
if(typeof module!=='undefined')module.exports=ChestRules;
