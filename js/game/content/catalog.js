'use strict';
// Authoritative static content. Legacy type/level and asset keys are presentation adapters.
const GameContent = (() => {
 const chains=[['drinkgen','饮料生成器',3],['ice','冰品',9],['drink','饮料',9],['fishnet','渔网生成器',5],['fish','鱼',10],['shell','贝壳',10]].map(([key,name,maxTier])=>({id:'chain_'+key,key,name,maxTier,itemIds:Array.from({length:maxTier},(_,i)=>`item_${key}_${String(i+1).padStart(2,'0')}`)}));
 chains.push({id:'chain_chest',key:'chest',name:'宝箱',maxTier:1,itemIds:['item_chest_01']});
 const producerChains={drinkgen:['ice','drink'],fishnet:['fish','shell']};
 const itemNames={fish:'小虾 花甲 青口贝 扇贝 海星 生蚝 鲍鱼 章鱼 帝王蟹 大龙虾'.split(' '),shell:'海草 海葵 海螺 碎贝壳 贝壳 珍珠 贝壳手链 海滨风铃 海滨纪念球 瓶中海滨'.split(' '),ice:'一颗冰块 三颗冰块 一杯碎冰 一桶碎冰 刨冰 果酱刨冰 草莓刨冰 鲜果刨冰 豪华鲜果刨冰'.split(' '),drink:'瓶装水 苏打水 罐装汽水 瓶装汽水 冰啤酒 阿佩罗 夏日气泡特调 椰子水 无酒精椰子水特调'.split(' '),fishnet:'渔网 改良渔网 简易木筏 捕捞木筏 高级捕捞船'.split(' ')};
 const items=chains.flatMap(c=>c.itemIds.map((id,i)=>({id,name:itemNames[c.key]?.[i]||c.name,chainId:c.id,tier:i+1,mergeResultId:c.itemIds[i+1]||null,assetId:c.key+(i+1),type:c.key,tags:producerChains[c.key]?['producer']:[],producerId:producerChains[c.key]?'producer_'+c.key+'_'+(i+1):null,canStore:true,canSell:false,sellValue:0,description:''})));
 items.find(i=>i.type==='chest').tags.push('chest');
 // Per generator tier: [output tier, probability], shared by all producer families.
 const outputOdds=[[[1,.8],[2,.2]],[[1,.1],[2,.7],[3,.2]],[[2,.1],[3,.65],[4,.25]],[[3,.1],[4,.62],[5,.25],[6,.03]],[[4,.1],[5,.62],[6,.25],[7,.03]]];
 const producers=items.filter(i=>i.producerId).map(item=>({id:item.producerId,outputs:producerChains[item.type].flatMap(type=>outputOdds[item.tier-1].map(([tier,weight])=>({itemId:`item_${type}_${String(tier).padStart(2,'0')}`,weight:weight/2}))),energyCost:1,cooldown:0,charges:null,unlockId:null}));
 const customers=[['rabbit','兔兔'],['bear','熊'],['otter','獭獭'],['squirrel','飞鼠'],['wolf','狼'],['seagull','海鸥'],['tiger','老虎'],['crocodile','鳄鱼'],['parrot','鹦鹉']].map(([key,name])=>({id:'customer_'+key,name,portraitPrefix:name,unlockId:'customer_'+key}));
 const unlocks=[...chains.map(c=>({id:c.id,initial:true})),...producers.map(p=>({id:p.id,initial:true})),...customers.map(c=>({id:c.id,initial:true}))];
 const orders={id:'orders_counter_test',chainIds:['chain_ice','chain_drink','chain_fish','chain_shell'],stages:[[0,1,2,1],[5,2,3,1],[15,2,4,2],[30,3,5,2],[50,4,6,2],[70,5,7,3],[90,6,9,3]],xp:0,capacity:3};
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
