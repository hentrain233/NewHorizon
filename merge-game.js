// Pure game rules: independent of Canvas, layout, editor settings and storage.
const BoardContent=typeof module!=='undefined'?require('./js/game/content/catalog.js'):GameContent;
class MergeTestBoard {
 constructor(random=Math.random,content=BoardContent){this.random=random;this.content=content;this.slots=Array(63).fill(null);this.max=Object.fromEntries(content.chains.map(c=>[c.key,c.maxTier]));this.generatorTypes=new Set(content.items.filter(i=>i.producerId).map(i=>i.type));this.onChange=()=>{};this.isProducerAvailable=()=>true;}
 definition(item){return item&&this.content.items.find(d=>d.type===item.type&&d.tier===item.level);}
 resolveMerge(a,b){const d=this.definition(a);return d&&d.id===this.definition(b)?.id?this.content.items.find(i=>i.id===d.mergeResultId):null;}
 setTier(index,level){const item=this.slots[index];if(!item||!this.definition({...item,level}))return false;item.level=level;this.onChange('ITEM_CHANGED',item);return true;}
 // New item families inherit effects from their configured maximum, not their names.
 getEffectTier(item){
  if(!item||this.generatorTypes.has(item.type))return 'none';
  const max=this.max[item.type];if(!Number.isInteger(max)||max<2||!Number.isInteger(item.level))return 'none';
  return item.level===max?'max':item.level===max-1?'near-max':'none';
 }
 empty(){return this.slots.flatMap((item,i)=>item?[]:[i]);}
 add(type='drinkgen',level=1){const free=this.empty();if(!free.length||!this.definition({type,level}))return -1;const i=free[Math.floor(this.random()*free.length)];this.slots[i]={type,level};this.onChange('ITEM_ADDED',this.slots[i]);return i;}
 reset(){this.slots.fill(null);return this.add();}
 generate(i){
  const generator=this.slots[i],producer=this.content.producers.find(p=>p.id===this.definition(generator)?.producerId);if(!producer||!this.isProducerAvailable(producer))return {kind:'none',source:i};
  const free=this.empty();if(!free.length)return {kind:'full',source:i};
  if(this.spendGenerationEnergy&&!this.spendGenerationEnergy(producer))return {kind:'no-energy',source:i};
  const groups=[...new Set(producer.outputs.map(o=>this.content.items.find(d=>d.id===o.itemId).chainId))];
  const choose=(list,roll)=>{let n=roll*list.reduce((s,o)=>s+o.weight,0);return list.find(o=>(n-=o.weight)<0)||list[list.length-1];};
  const group=choose(groups.map(id=>({id,weight:producer.outputs.filter(o=>this.content.items.find(d=>d.id===o.itemId).chainId===id).reduce((s,o)=>s+o.weight,0)})),this.random());
  const output=choose(producer.outputs.filter(o=>this.content.items.find(d=>d.id===o.itemId).chainId===group.id),this.random());
  const definition=this.content.items.find(d=>d.id===output.itemId),type=definition.type,level=definition.tier;
  const distance=j=>(j%7-i%7)**2+(Math.floor(j/7)-Math.floor(i/7))**2;
  const nearest=Math.min(...free.map(distance)),choices=free.filter(j=>distance(j)===nearest);
  const index=choices[Math.floor(this.random()*choices.length)],item={type,level};
  this.slots[index]=item;this.onChange('ITEM_GENERATED',item);return {kind:'spawn',index,source:i,type,item};
 }
 move(from,to){
  if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=63||to>=63||from===to||!this.slots[from])return {kind:'none',source:from};
  const a=this.slots[from],b=this.slots[to];
  const result=this.resolveMerge(a,b);
  if(!result&&b&&this.definition(a)?.id===this.definition(b)?.id)return {kind:'none',source:from};
  if(result){
   this.slots[to]={type:result.type,level:result.tier};this.slots[from]=null;this.onChange('ITEM_MERGED',this.slots[to]);return {kind:'merge',index:to,item:this.slots[to]};
  }
  this.slots[to]=a;this.slots[from]=b;this.onChange('ITEM_MOVED',a);return {kind:b?'swap':'move',index:to};
 }
}
if(typeof module!=='undefined')module.exports=MergeTestBoard;
