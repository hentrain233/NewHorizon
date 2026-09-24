'use strict';
const OrderContent=typeof module!=='undefined'?require('./content/catalog.js'):GameContent;
class OrderQueue{
 constructor(catalog,random=Math.random,content=OrderContent){this.catalog=catalog;this.random=random;this.content=content;this.entries=[];this.serial=0;this.completedCount=0;this.isEligible=()=>true;this.onChange=()=>{};this.difficulty=()=>this.completedCount;}
 static stage(n,config=OrderContent.orders){return [...config.stages].reverse().find(s=>n>=s[0]).slice(1);}
 roll(min,max){return min+Math.floor(this.random()*(max-min+1));}
 setCompletedCount(value){if(!Number.isSafeInteger(value)||value<0)return false;this.completedCount=value;this.onChange('ORDER_DIFFICULTY_CHANGED');return true;}
 makeRequest(){const config=this.content.orders,[min,max,limit]=OrderQueue.stage(this.difficulty(),config),count=this.roll(1,limit),chains=config.chainIds.map(id=>this.content.chains.find(c=>c.id===id)).filter(c=>this.isEligible(c.id));if(!chains.length)return null;const requirements=Array.from({length:count},()=>{const chain=chains[this.roll(0,chains.length-1)],eligible=this.content.items.filter(d=>d.chainId===chain.id&&d.tier>=min&&d.tier<=max);if(!eligible.length)throw new Error('No eligible order tiers: '+chain.id);const item=eligible[this.roll(0,eligible.length-1)];return {type:item.type,level:item.tier};});const pay=level=>{let center=(2**(level-1))*4*(1+.2*level)+10*level;if(level<=5)center*=1-.1*(6-level);const low=.9+.02*level,high=1+.02*level,span=high-low,roll=()=>low+this.random()*span,factor=level>=9?Math.max(roll(),roll()):roll();return Math.round(center*factor*.7);};return {requirements,reward:requirements.reduce((sum,r)=>sum+pay(r.level),0),xpReward:config.xp,stageCount:this.completedCount};}
 add(){const types=Object.keys(this.catalog).filter(t=>{const customer=this.content.customers.find(c=>c.portraitPrefix===t);return customer&&!this.entries.some(e=>e.type===t)&&this.isEligible(customer.unlockId);});if(this.entries.length>=this.content.orders.capacity||!types.length)return false;const type=types[Math.floor(this.random()*types.length)],variants=this.catalog[type],variant=variants[Math.floor(this.random()*variants.length)],request=this.makeRequest();if(!request)return false;this.entries.push({id:++this.serial,type,variant,phase:'waiting',completedAt:null,slot:this.entries.length,...request});this.onChange('ORDER_ADDED');return true;}
 reset(){this.entries=[];this.refillReadyAt=null;this.completedCount=0;this.onChange('ORDERS_RESET');while(this.add()){};}
 complete(id,now){const e=this.entries.find(e=>e.id===id);if(!e||e.phase!=='waiting')return false;e.phase='complete';e.completedAt=now;this.completedCount++;this.onChange('ORDER_COMPLETED',e);return true;}
 submit(id,board,index,now){if(!Number.isInteger(index)||index<0||index>=board.slots.length)return false;const item=board.slots[index],e=this.entries.find(e=>e.id===id),r=e?.phase==='waiting'&&e.requirements.find(r=>!r.delivered&&r.type===item?.type&&r.level===item?.level);if(!r)return false;board.slots[index]=null;r.delivered=true;if(e.requirements.every(r=>r.delivered))this.complete(id,now);this.onChange('ORDER_ITEM_SUBMITTED');return true;}
 refill(){while(this.add()){this.entries[this.entries.length-1].slot=Math.max(this.content.orders.capacity,...this.entries.slice(0,-1).map(e=>e.slot+1));}}
 refillWhenSettled(now){
  // Do not run arrival and left-compaction animations over the same space.
  if(this.entries.length>=this.content.orders.capacity||this.entries.some((e,i)=>e.phase==='complete'||e.entering||Math.abs(e.slot-i)>.001)){this.refillReadyAt=null;return;}
  if(this.refillReadyAt==null){this.refillReadyAt=now+120;return;}
  if(now<this.refillReadyAt)return;
  this.refillReadyAt=null;this.refill();
 }
 update(now,hold,fade){this.entries=this.entries.filter(e=>e.completedAt===null||now-e.completedAt<hold+fade);}
}
if(typeof module!=='undefined')module.exports=OrderQueue;
