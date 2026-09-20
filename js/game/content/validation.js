'use strict';
function validateGameContent(c){
 const errors=[],maps={};const fail=m=>errors.push(m);
 for(const name of ['items','chains','producers','customers','unlocks','levels','areas','zones','tasks']){maps[name]=new Map();for(const d of c[name]){if(!d.id||maps[name].has(d.id))fail(`${name}: duplicate/empty ID ${d.id}`);maps[name].set(d.id,d);}}
 const ref=(name,id,owner)=>{if(id!=null&&!maps[name].has(id))fail(`${owner}: missing ${name} ${id}`);};
 const amount=(v,owner)=>{if(!Number.isFinite(v)||v<0)fail(`${owner}: invalid amount ${v}`);};
 const rewards=(list,owner)=>{for(const r of list||[]){if(r.type==='item')ref('items',r.itemId,owner);else if(r.type==='unlock')ref('unlocks',r.unlockId,owner);else if(!['currency','xp'].includes(r.type))fail(`${owner}: invalid reward type`);if(r.type!=='unlock'&&(!Number.isSafeInteger(r.amount)||r.amount<1))fail(`${owner}: reward amount must be a positive integer`);if(r.type==='currency'&&!['coins','energy','gems'].includes(r.currency))fail(`${owner}: invalid currency`);}};
 const tiers=new Set();for(const i of c.items){ref('chains',i.chainId,i.id);ref('items',i.mergeResultId,i.id);ref('producers',i.producerId,i.id);const key=i.chainId+':'+i.tier;if(tiers.has(key))fail(`${i.id}: duplicate chain tier`);tiers.add(key);if(!Number.isInteger(i.tier)||i.tier<1)fail(`${i.id}: invalid tier`);if(i.mergeResultId){const target=maps.items.get(i.mergeResultId);if(target&&(target.chainId!==i.chainId||target.tier!==i.tier+1))fail(`${i.id}: invalid merge target`);}amount(i.sellValue,i.id);}
 for(const ch of c.chains)for(const id of ch.itemIds){ref('items',id,ch.id);if(maps.items.get(id)?.chainId!==ch.id)fail(`${ch.id}: foreign item ${id}`);}
 for(const ch of c.chains){
  const items=c.items.filter(i=>i.chainId===ch.id).sort((a,b)=>a.tier-b.tier);
  if(!Number.isSafeInteger(ch.maxTier)||ch.maxTier<1||items.length!==ch.maxTier||items.at(-1)?.tier!==ch.maxTier)fail(`${ch.id}: maxTier must match item definitions`);
  if(items.some((item,index)=>item.tier!==index+1))fail(`${ch.id}: tiers must be contiguous starting at 1`);
  if(ch.itemIds.length!==items.length||items.some((item,index)=>ch.itemIds[index]!==item.id))fail(`${ch.id}: itemIds must list all tiers in order`);
 }
 for(const p of c.producers){ref('unlocks',p.unlockId,p.id);amount(p.energyCost,p.id);amount(p.cooldown,p.id);if(!p.outputs.length)fail(`${p.id}: no outputs`);for(const o of p.outputs){ref('items',o.itemId,p.id);if(!(o.weight>0))fail(`${p.id}: invalid weight`);}}
 for(const d of c.customers)ref('unlocks',d.unlockId,d.id);
 const levelNumbers=new Set();for(const d of c.levels){if(!Number.isInteger(d.level)||d.level<1||levelNumbers.has(d.level))fail(`${d.id}: duplicate/invalid level`);levelNumbers.add(d.level);if(d.xpToNext!==null&&!(d.xpToNext>0))fail(`${d.id}: invalid XP threshold`);for(const id of d.unlockIds)ref('unlocks',id,d.id);rewards(d.rewards,d.id);}
 for(const d of c.unlocks){for(const id of d.taskIds||[])ref('tasks',id,d.id);if(d.level!=null&&!c.levels.some(l=>l.level===d.level))fail(`${d.id}: missing level`);}
 for(const id of c.orders.chainIds)ref('chains',id,c.orders.id);
 const o=c.orders,whole=(v,min=0)=>Number.isSafeInteger(v)&&v>=min;
 if(!Array.isArray(o.stages)||!o.stages.length)fail(`${o.id}: order stages must be non-empty`);
 else{
  let previous=-1;
  o.stages.forEach((stage,index)=>{
   if(!Array.isArray(stage)||stage.length!==4){fail(`${o.id}: stage ${index} must be [threshold,minTier,maxTier,count]`);return;}
   const [threshold,min,max,count]=stage;
   if(!whole(threshold)||threshold<=previous||(index===0&&threshold!==0))fail(`${o.id}: stage thresholds must start at 0 and strictly increase`);
   previous=threshold;
   if(!whole(min,1)||!whole(max,1)||min>max)fail(`${o.id}: stage ${index} invalid tier range`);
   if(!whole(count,1))fail(`${o.id}: stage ${index} count must be >= 1`);
   for(const id of o.chainIds)if(!c.items.some(i=>i.chainId===id&&i.tier>=min&&i.tier<=max))fail(`${o.id}: stage ${index} has no eligible items in ${id}`);
  });
 }
 if(!o.chainIds.length)fail(`${o.id}: eligible chains required`);
 if(!whole(o.capacity,1))fail(`${o.id}: capacity must be positive`);
 if(!whole(o.coinsPerTier))fail(`${o.id}: coinsPerTier must be a non-negative integer`);
 if(!whole(o.jitter)||!whole(o.xp))fail(`${o.id}: jitter and XP must be non-negative integers`);
 if(!Number.isFinite(o.multiMin)||!Number.isFinite(o.multiMax)||o.multiMin<=0||o.multiMax<o.multiMin)fail(`${o.id}: invalid reward multiplier range`);
 for(const a of c.areas){if(!a.zoneIds.length)fail(`${a.id}: empty area`);if(a.phaseRule&&a.phaseRule!=='all-basic-before-premium')fail(`${a.id}: unsupported phase rule`);for(const id of a.requiredBasicZoneIds||a.zoneIds)if(!a.zoneIds.includes(id))fail(`${a.id}: foreign required zone`);for(const id of a.zoneIds){ref('zones',id,a.id);if(maps.zones.get(id)?.areaId!==a.id)fail(`${a.id}: foreign zone`);}rewards(a.rewards,a.id);}
 for(const z of c.zones){ref('areas',z.areaId,z.id);if(!z.basicTaskIds.length)fail(`${z.id}: basic tasks required`);if(!z.premiumTaskIds.length)fail(`${z.id}: premium tasks required`);for(const phase of ['basic','premium'])for(const id of z[phase+'TaskIds']){ref('tasks',id,z.id);if(maps.tasks.get(id)?.zoneId!==z.id||maps.tasks.get(id)?.phase!==phase)fail(`${z.id}: foreign task or phase`);}}
 for(const t of c.tasks){ref('zones',t.zoneId,t.id);amount(t.coinCost,t.id);if(!['basic','premium'].includes(t.phase))fail(`${t.id}: invalid phase`);if(!maps.zones.get(t.zoneId)?.[t.phase+'TaskIds']?.includes(t.id))fail(`${t.id}: task not listed in zone`);for(const id of t.prerequisiteIds)ref('tasks',id,t.id);for(const id of t.unlockIds||[])ref('unlocks',id,t.id);rewards(t.rewards,t.id);}
 for(const t of c.tasks){if(t.available!==undefined&&typeof t.available!=='boolean')fail(`${t.id}: availability must be boolean`);if(t.mapAnchor&&(!Array.isArray(t.mapAnchor)||t.mapAnchor.length!==2||!t.mapAnchor.every(Number.isFinite)))fail(`${t.id}: invalid map anchor`);}
 const visiting=new Set(),done=new Set();function visit(id){if(visiting.has(id)){fail(`${id}: circular task prerequisites`);return;}if(done.has(id))return;visiting.add(id);for(const next of maps.tasks.get(id)?.prerequisiteIds||[])visit(next);visiting.delete(id);done.add(id);}c.tasks.forEach(t=>visit(t.id));
 if(errors.length)throw new Error('Invalid game content:\n'+errors.join('\n'));return true;
}
if(typeof module!=='undefined')module.exports=validateGameContent;
