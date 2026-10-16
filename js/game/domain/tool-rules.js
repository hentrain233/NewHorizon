'use strict';
// Tool eligibility and effects live together; UI reads the same range without duplicating rules.
const ToolRules={
 range(type,level,maximum=null){
  if(type==='card')return {min:level,max:level};
  if(!['hammer','mirror'].includes(type)||level<4||level>6)return null;
  const cap=level===4?6:level===5?8:maximum;
  return {min:type==='hammer'?2:1,max:type==='hammer'?cap:cap===null?null:cap-1};
 },
 canUse(board,tool,item){
  if(!board.isOrdinary(item))return false;
  const range=this.range(tool.type,tool.level,board.max[item.type]);
  return !!range&&item.level>=range.min&&item.level<=range.max&&(tool.type==='card'?!!board.definition(item).mergeResultId:tool.type!=='mirror'||item.level<board.max[item.type]);
 },
 use(board,source,target){
  const tool=board.slots[source],item=board.slots[target];
  if(!this.canUse(board,tool,item))return {kind:'none',source};
  if(tool.type==='card'){
   board.slots[source]=null;board.slots[target]={type:item.type,level:item.level+1};
   board.onChange('ITEM_MERGED',board.slots[target]);return {kind:'merge',index:target,item:board.slots[target]};
  }
  // Keep the bonus roll on a blocked attempt: freeing space cannot reroll a better reward.
  if(tool.toolRoll===undefined){tool.toolRoll=board.random();board.onChange('ITEM_CHANGED',tool);}
  const count=(tool.type==='hammer'?2:1)+(tool.toolRoll<.33?1:0),free=board.empty();
  if(free.length<(tool.type==='hammer'?count-2:count))return {kind:'full',source};
  const indices=[];
  if(tool.type==='hammer'){
   board.slots[source]=null;
   indices.push(target,source,...free.slice(0,count-2));
   for(const i of indices)board.slots[i]={type:item.type,level:item.level-1};
  }else{
   const uses=(tool.toolUses||0)+1,keep=board.random()<.2**uses;
   if(keep){tool.toolUses=uses;delete tool.toolRoll;}else board.slots[source]=null;
   indices.push(...free.slice(0,count));for(const i of indices)board.slots[i]={type:item.type,level:item.level};
  }
  for(const i of indices)board.onChange('ITEM_ADDED',board.slots[i]);
  return {kind:'tool',index:indices[0],indices,source:target,toolType:tool.type,count};
 }
};
if(typeof module!=='undefined')module.exports=ToolRules;
