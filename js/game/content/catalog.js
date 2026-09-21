'use strict';
// Authoritative static content. Legacy type/level and asset keys are presentation adapters.
const GameContent = (() => {
 const chains=[['drinkgen','饮料生成器',3],['ice','冰品',9],['drink','饮料',9]].map(([key,name,maxTier])=>({id:'chain_'+key,key,name,maxTier,itemIds:Array.from({length:maxTier},(_,i)=>`item_${key}_${String(i+1).padStart(2,'0')}`)}));
 const items=chains.flatMap(c=>c.itemIds.map((id,i)=>({id,name:c.name,chainId:c.id,tier:i+1,mergeResultId:c.itemIds[i+1]||null,assetId:c.key+(i+1),type:c.key,tags:c.key==='drinkgen'?['producer']:[],producerId:c.key==='drinkgen'?'producer_drinkgen_'+(i+1):null,canStore:true,canSell:false,sellValue:0,description:''})));
 const producers=[1,2,3].map(tier=>({id:'producer_drinkgen_'+tier,outputs:['ice','drink'].flatMap(type=>(tier===1?[1]:tier===2?[.8,.2]:[.4,.4,.2]).map((weight,i)=>({itemId:`item_${type}_${String(i+1).padStart(2,'0')}`,weight:weight/2}))),energyCost:1,cooldown:0,charges:null,unlockId:null}));
 const customers=[['rabbit','兔兔'],['bear','熊'],['otter','獭獭'],['squirrel','飞鼠'],['wolf','狼']].map(([key,name])=>({id:'customer_'+key,name,portraitPrefix:name,unlockId:'customer_'+key}));
 const unlocks=[...chains.map(c=>({id:c.id,initial:true})),...producers.map(p=>({id:p.id,initial:true})),...customers.map(c=>({id:c.id,initial:true}))];
 const orders={id:'orders_counter_test',chainIds:['chain_ice','chain_drink'],stages:[[0,1,2,1],[5,2,3,1],[15,2,4,2],[30,3,5,2],[50,4,6,2],[70,5,7,3],[90,6,9,3]],coinsPerTier:60,jitter:20,multiMin:1.05,multiMax:1.10,xp:0,capacity:3};
 const basicIds=['deck','awning','exterior','interior','floor'].map(k=>'restaurant_'+k);
 const tasks=basicIds.map((id,i)=>({id,name:['木板与苔藓','招牌与遮阳棚','外墙','内墙','地板'][i],zoneId:'zone_restaurant',phase:'basic',coinCost:50*(i+1),prerequisiteIds:i?[basicIds[i-1]]:[],rewards:[],unlockIds:[],effectType:'clean',mapAnchor:[[1980,2990],[1860,2650],[1030,2610],[1190,1900],[1370,2350]][i]}));
 // Reserved identity only, never purchasable: no premium renovation content/art yet.
 tasks.push({id:'restaurant_premium_reserved',name:'后续装修（未开放）',zoneId:'zone_restaurant',phase:'premium',available:false,coinCost:0,prerequisiteIds:[basicIds[4]],rewards:[],unlockIds:[]});
 const areas=[{id:'area_restaurant',zoneIds:['zone_restaurant'],phaseRule:'all-basic-before-premium',rewards:[]}];
 const zones=[{id:'zone_restaurant',areaId:'area_restaurant',basicTaskIds:basicIds,premiumTaskIds:['restaurant_premium_reserved']}];
 const data={contentVersion:2,energy:{initial:100,max:999,recoveryMs:300000},chains,items,producers,customers,unlocks,orders,levels:[{id:'level_1',level:1,xpToNext:null,rewards:[],unlockIds:[]}],areas,zones,tasks};
 const freeze=o=>{Object.values(o).forEach(v=>{if(v&&typeof v==='object')freeze(v);});return Object.freeze(o);};
 return freeze(data);
})();
if(typeof module!=='undefined')module.exports=GameContent;
