'use strict';
// Small domain facade. No DOM, Canvas, timers, asset loading or storage APIs.
class GameRuntime {
 constructor(content,board,orders,now=Date.now){
  this.now=now;
  this.energyRules={...content.energy};
  this.content=content;this.board=board;this.orders=orders;this.listeners=new Map();this.scheduleSave=()=>{};
  this.transactionDepth=0;this.pendingEvents=[];this.dirty=false;
  this.state={progression:{level:1,xp:0},currencies:{coins:100,energy:this.energyRules.initial,gems:0},energy:{updatedAt:now()},inventory:{capacity:0,items:[]},unlocks:content.unlocks.filter(u=>u.initial).map(u=>u.id),discoveries:[],renovation:{completedTaskIds:[],rewardedAreaIds:[]},rewardQueue:[],recovery:[]};
  orders.isEligible=id=>!id||this.isUnlocked(id);
  board.isProducerAvailable=p=>!p.unlockId||this.isUnlocked(p.unlockId);
  board.spendGenerationEnergy=p=>this.spendEnergy(p.energyCost);
  board.onChange=(type,item)=>{this.discover(item);this.changed(type,{item});};
  orders.onChange=(type,order)=>{if(type==='ORDERS_RESET')this.state.currencies.coins=100;if(type==='ORDER_COMPLETED'){this.state.currencies.coins+=order.reward;if(order.xpReward)this.addXP(order.xpReward);}this.changed(type,{orderId:order?.id});};
  // Nested rewards/unlocks publish only after the complete operation is committed.
  for(const name of ['addXP','unlock','storeItem','retrieveItem','enqueueRewards','claimReward','purchaseTask']){const method=this[name].bind(this);this[name]=(...args)=>{this.transactionDepth++;try{return method(...args);}finally{if(--this.transactionDepth===0){const events=this.pendingEvents.splice(0);for(const [type,payload]of events)this.emit(type,payload);if(this.dirty){this.dirty=false;this.scheduleSave();}}}};}
 }
 // Persist the recovery anchor, not a ticking countdown. Offline recovery uses the same clock.
 configureEnergy(rules){
  const {initial,max,recoveryMs}=rules;
  if(!Number.isSafeInteger(initial)||initial<0||!Number.isSafeInteger(max)||max<1||!Number.isSafeInteger(recoveryMs)||recoveryMs<1000)return false;
  const next={initial:Math.min(initial,max),max,recoveryMs},old=this.energyRules;
  if(Object.keys(next).every(k=>next[k]===old[k]))return true;
  this.recoverEnergy();
  const fraction=Math.max(0,Math.min(1,(this.now()-this.state.energy.updatedAt)/old.recoveryMs));
  this.energyRules=next;this.state.currencies.energy=Math.min(max,this.state.currencies.energy);
  this.state.energy.updatedAt=Math.round(this.now()-fraction*recoveryMs);
  this.changed('ENERGY_RULES_CHANGED');return true;
 }
 resetEnergy(){this.state.currencies.energy=this.energyRules.initial;this.state.energy.updatedAt=this.now();this.changed('ENERGY_CHANGED');}
 recoverEnergy(){
  const now=this.now(),clock=this.state.energy,c=this.state.currencies,{max,recoveryMs}=this.energyRules;
  if(now<clock.updatedAt){clock.updatedAt=now;this.changed('ENERGY_CLOCK_CHANGED');return;}
  if(c.energy>=max){clock.updatedAt=now;if(c.energy>max){c.energy=max;this.changed('ENERGY_CHANGED');}return;}
  const points=Math.floor((now-clock.updatedAt)/recoveryMs);
  if(points>0){c.energy=Math.min(max,c.energy+points);clock.updatedAt=c.energy===max?now:clock.updatedAt+points*recoveryMs;this.changed('ENERGY_CHANGED');}
 }
 spendEnergy(amount){
  if(!Number.isSafeInteger(amount)||amount<0)return false;
  this.recoverEnergy();if(this.state.currencies.energy<amount)return false;
  this.state.currencies.energy-=amount;if(amount)this.changed('ENERGY_CHANGED');return true;
 }
 energySeconds(){return this.state.currencies.energy>=this.energyRules.max?0:Math.max(0,Math.ceil((this.energyRules.recoveryMs-(this.now()-this.state.energy.updatedAt))/1000));}
 on(type,listener){const list=this.listeners.get(type)||new Set();list.add(listener);this.listeners.set(type,list);return ()=>list.delete(listener);}
 emit(type,payload){if(this.transactionDepth){this.pendingEvents.push([type,payload]);return;}for(const fn of this.listeners.get(type)||[])try{fn(payload);}catch(error){console.error('Game event listener failed',type,error);}}
 changed(type,payload={}){this.emit(type,payload);if(this.transactionDepth)this.dirty=true;else this.scheduleSave();}
 discover(item){const id=this.board.definition(item)?.id;if(id&&!this.state.discoveries.includes(id)){this.state.discoveries.push(id);this.emit('ITEM_DISCOVERED',{itemId:id});}}
 isUnlocked(id){return this.state.unlocks.includes(id);}
 // Load-time reconciliation is silent: never replays rewards or completion events.
 reconcileUnlocks(state=this.state){
  const ids=new Set(state.unlocks),done=new Set(state.renovation.completedTaskIds);
  for(const u of this.content.unlocks)if(u.initial||((u.level!=null||u.taskIds?.length)&&(u.level==null||state.progression.level>=u.level)&&(u.taskIds||[]).every(id=>done.has(id))))ids.add(u.id);
  for(const level of this.content.levels)if(level.level<=state.progression.level)for(const id of level.unlockIds)ids.add(id);
  for(const task of this.content.tasks)if(done.has(task.id))for(const id of task.unlockIds||[])ids.add(id);
  state.unlocks=[...ids];
 }
 unlock(id){if(!this.content.unlocks.some(u=>u.id===id))return false;if(!this.isUnlocked(id)){this.state.unlocks.push(id);this.changed('CONTENT_UNLOCKED',{unlockId:id});}return true;}
 evaluateUnlocks(){for(const u of this.content.unlocks)if((u.level!=null||u.taskIds?.length)&&(!u.level||this.state.progression.level>=u.level)&&(u.taskIds||[]).every(id=>this.state.renovation.completedTaskIds.includes(id)))this.unlock(u.id);}
 addXP(amount){if(!Number.isSafeInteger(amount)||amount<0)return false;const p=this.state.progression;p.xp+=amount;let definition;while((definition=this.content.levels.find(l=>l.level===p.level))?.xpToNext!=null&&p.xp>=definition.xpToNext&&this.content.levels.some(l=>l.level===p.level+1)){p.xp-=definition.xpToNext;p.level++;const level=this.content.levels.find(l=>l.level===p.level);for(const id of level.unlockIds)this.unlock(id);this.enqueueRewards(level.rewards);this.emit('PLAYER_LEVEL_UP',{level:p.level});}this.evaluateUnlocks();this.changed('PROGRESSION_CHANGED');return true;}
 getProgression(){const p=this.state.progression;return {...p,xpToNext:this.content.levels.find(l=>l.level===p.level)?.xpToNext??null};}
 storeItem(index){const item=this.board.slots[index],d=this.board.definition(item),inv=this.state.inventory;if(!d?.canStore||inv.items.length>=inv.capacity)return false;inv.items.push({...item});this.board.slots[index]=null;this.changed('INVENTORY_CHANGED');return true;}
 retrieveItem(index){const inv=this.state.inventory,slot=this.board.empty()[0];if(!Number.isInteger(index)||!inv.items[index]||slot===undefined)return false;this.board.slots[slot]=inv.items.splice(index,1)[0];this.changed('INVENTORY_CHANGED');return true;}
 isBoardFull(){return !this.board.empty().length;}
 isInventoryFull(){return this.state.inventory.items.length>=this.state.inventory.capacity;}
 validRewards(rewards){return Array.isArray(rewards)&&rewards.every(r=>r.type==='unlock'?this.content.unlocks.some(u=>u.id===r.unlockId):Number.isSafeInteger(r.amount)&&r.amount>0&&(r.type==='item'?this.content.items.some(i=>i.id===r.itemId):r.type==='xp'||r.type==='currency'&&Object.hasOwn(this.state.currencies,r.currency)));}
 enqueueRewards(rewards=[]){if(!this.validRewards(rewards))return false;this.state.rewardQueue.push(...structuredClone(rewards));if(rewards.length)this.changed('REWARDS_QUEUED');return true;}
 claimReward(index=0){const reward=this.state.rewardQueue[index];if(!reward||!this.validRewards([reward]))return false;if(reward.type==='item'&&this.board.empty().length<reward.amount)return false;
  this.state.rewardQueue.splice(index,1);
  if(reward.type==='currency')this.state.currencies[reward.currency]+=reward.amount;
  if(reward.type==='xp')this.addXP(reward.amount);
  if(reward.type==='unlock')this.unlock(reward.unlockId);
  if(reward.type==='item'){const d=this.content.items.find(i=>i.id===reward.itemId);for(let n=0;n<reward.amount;n++){const item={type:d.type,level:d.tier};this.board.slots[this.board.empty()[0]]=item;this.discover(item);}}
  this.changed('REWARD_GRANTED',{reward});return true;
 }
 getZoneState(id){const z=this.content.zones.find(z=>z.id===id);if(!z)return null;const done=ids=>ids.length>0&&ids.every(id=>this.state.renovation.completedTaskIds.includes(id));return done(z.basicTaskIds)?done(z.premiumTaskIds)?2:1:0;}
 getAreaProgress(id){const a=this.content.areas.find(a=>a.id===id);if(!a)return null;const basic=(a.requiredBasicZoneIds||a.zoneIds).every(id=>this.getZoneState(id)>=1),premium=a.zoneIds.length>0&&a.zoneIds.every(id=>this.getZoneState(id)===2),available=this.content.tasks.some(t=>a.zoneIds.includes(t.zoneId)&&t.phase==='premium'&&t.available!==false);return {basicComplete:basic,premiumAvailable:basic&&available,premiumComplete:premium};}
 canPurchaseTask(id){const t=this.content.tasks.find(t=>t.id===id);if(!t)return {ok:false,reason:'missing-task'};if(t.available===false)return {ok:false,reason:'not-available'};const z=this.content.zones.find(z=>z.id===t.zoneId);if(this.state.renovation.completedTaskIds.includes(id))return {ok:false,reason:'already-completed'};if(!t.prerequisiteIds.every(id=>this.state.renovation.completedTaskIds.includes(id)))return {ok:false,reason:'prerequisite'};if(t.phase==='premium'&&!this.getAreaProgress(z.areaId)?.premiumAvailable)return {ok:false,reason:'basic-phase-required'};if(this.state.currencies.coins<t.coinCost)return {ok:false,reason:'insufficient-coins'};return {ok:true};}
 purchaseTask(id){const check=this.canPurchaseTask(id);if(!check.ok)return check;const t=this.content.tasks.find(t=>t.id===id),z=this.content.zones.find(z=>z.id===t.zoneId),a=this.content.areas.find(a=>a.id===z.areaId),rewards=t.rewards||[];if(!this.validRewards(rewards)||!this.validRewards(a.rewards||[])||(t.unlockIds||[]).some(id=>!this.content.unlocks.some(u=>u.id===id)))return {ok:false,reason:'invalid-rewards'};
  const before=this.getAreaProgress(a.id);this.state.currencies.coins-=t.coinCost;this.state.renovation.completedTaskIds.push(id);this.enqueueRewards(rewards);for(const unlock of t.unlockIds||[])this.unlock(unlock);this.evaluateUnlocks();const after=this.getAreaProgress(a.id);
  for(const phase of ['basic','premium'])if(!before[phase+'Complete']&&after[phase+'Complete'])this.emit('RENOVATION_PHASE_COMPLETED',{areaId:a.id,phase});
  if(after.premiumComplete&&!this.state.renovation.rewardedAreaIds.includes(a.id)){this.state.renovation.rewardedAreaIds.push(a.id);this.enqueueRewards(a.rewards||[]);}
  this.changed('RENOVATION_TASK_COMPLETED',{taskId:id,zoneId:z.id,effectType:t.effectType||null});return {ok:true};
 }
}
if(typeof module!=='undefined')module.exports=GameRuntime;
