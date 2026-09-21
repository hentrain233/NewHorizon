'use strict';
const GAME_SAVE_VERSION=1;
// v0 is an optional older development snapshot, NOT an editor preset.
const gameSaveMigrations={0:(raw,content)=>{
 const resolve=i=>i?{itemId:content.items.find(d=>d.type===i.type&&d.tier===i.level)?.id||'removed:'+i.type+':'+i.level}:null;
 if(!Array.isArray(raw.slots))throw new Error('v0 requires gameplay slots; editor presets are not game saves');
 return {saveVersion:1,board:raw.slots.map(resolve),orders:[],completedCount:raw.completedCount||0,serial:0,domains:{currencies:{coins:raw.coins??320,energy:0,gems:0}}};
}};
function serializeGame(runtime){
 const item=i=>i?{itemId:runtime.board.definition(i)?.id||'removed:'+i.type+':'+i.level}:null;
 const domains=structuredClone(runtime.state);domains.inventory.items=runtime.state.inventory.items.map(item);
 return {saveVersion:GAME_SAVE_VERSION,contentVersion:runtime.content.contentVersion,updatedAt:new Date().toISOString(),domains,board:runtime.board.slots.map(item),completedCount:runtime.orders.completedCount,serial:runtime.orders.serial,
 orders:runtime.orders.entries.filter(e=>e.phase==='waiting').map(e=>({id:e.id,customerId:runtime.content.customers.find(c=>c.portraitPrefix===e.type)?.id,variant:e.variant,requirements:e.requirements.map(r=>({...item(r),delivered:!!r.delivered})),reward:e.reward,xpReward:e.xpReward||0,stageCount:e.stageCount}))};
}
function migrateGameSave(raw,content){let data=structuredClone(raw);let version=data.saveVersion??0;if(!Number.isInteger(version)||version<0||version>GAME_SAVE_VERSION)throw new Error('Unsupported saveVersion: '+version);while(version<GAME_SAVE_VERSION){data=gameSaveMigrations[version](data,content);if(data.saveVersion!==version+1)throw new Error('Migration must advance exactly one version');version=data.saveVersion;}return data;}
function hydrateGameSave(runtime,raw,warn=console.warn){
 const s=migrateGameSave(raw,runtime.content),fresh=structuredClone(runtime.state),c=runtime.content;
 const integer=(n,name)=>{if(!Number.isSafeInteger(n)||n<0)throw new Error('Invalid save field: '+name);return n;};
 if(!Array.isArray(s.board)||s.board.length!==63||!s.domains||!Array.isArray(s.orders))throw new Error('Invalid game save structure');
 const recovery=Array.isArray(s.domains.recovery)?structuredClone(s.domains.recovery):[];
 const recover=(value,domain)=>{warn('Missing content retained in recovery:',domain,value);recovery.push({domain,value});return null;};
 const item=(value,domain)=>{if(value===null)return null;const d=c.items.find(i=>i.id===value?.itemId);return d?{type:d.type,level:d.tier}:recover(value,domain);};
 const board=s.board.map(i=>item(i,'board'));
  if(s.domains.currencies)for(const key of Object.keys(fresh.currencies))fresh.currencies[key]=integer(s.domains.currencies[key]??fresh.currencies[key],key);
 // Pre-energy saves used zero as a visual placeholder, not an exhausted energy account.
 if(s.domains.energy){fresh.energy={updatedAt:integer(s.domains.energy.updatedAt,'energy timestamp')};}
 else{fresh.currencies.energy=100;fresh.energy={updatedAt:runtime.now()};}
 if(s.domains.progression){const p=s.domains.progression;integer(p.level,'level');integer(p.xp,'xp');if(!c.levels.some(l=>l.level===p.level)){recover(p,'progression');fresh.progression={level:c.levels[0].level,xp:0};}else fresh.progression={level:p.level,xp:p.xp};}
 if(s.domains.inventory){const i=s.domains.inventory;if(!Array.isArray(i.items))throw new Error('Invalid inventory');fresh.inventory={capacity:integer(i.capacity,'inventory capacity'),items:i.items.map(v=>item(v,'inventory')).filter(Boolean)};if(fresh.inventory.items.length>fresh.inventory.capacity)throw new Error('Inventory exceeds capacity');}
 for(const [field,defs]of [['unlocks',c.unlocks],['discoveries',c.items]])if(s.domains[field]){if(!Array.isArray(s.domains[field]))throw new Error('Invalid '+field);fresh[field]=[...new Set(s.domains[field].filter(id=>defs.some(d=>d.id===id)||(recover(id,field),false)))];}
 if(s.domains.renovation){const r=s.domains.renovation;if(!Array.isArray(r.completedTaskIds)||!Array.isArray(r.rewardedAreaIds))throw new Error('Invalid renovation');fresh.renovation={completedTaskIds:r.completedTaskIds.filter(id=>c.tasks.some(t=>t.id===id)||(recover(id,'tasks'),false)),rewardedAreaIds:r.rewardedAreaIds.filter(id=>c.areas.some(a=>a.id===id)||(recover(id,'areas'),false))};}
 if(s.domains.renovation?.camera){const {x,y}=s.domains.renovation.camera;if(Number.isFinite(x)&&Number.isFinite(y))fresh.renovation.camera={x,y};}
 if(s.domains.rewardQueue){if(!Array.isArray(s.domains.rewardQueue))throw new Error('Invalid reward queue');fresh.rewardQueue=s.domains.rewardQueue.filter(r=>runtime.validRewards([r])||(recover(r,'rewardQueue'),false));}
 const seen=new Set(),ids=new Set();const orders=s.orders.flatMap(e=>{const customer=c.customers.find(x=>x.id===e.customerId);if(!customer||!runtime.orders.catalog[customer.portraitPrefix]?.includes(e.variant)){recover(e,'orders');return [];}if(seen.has(e.customerId)||ids.has(e.id))throw new Error('Duplicate order/customer');seen.add(e.customerId);ids.add(e.id);integer(e.id,'order ID');integer(e.reward,'order reward');integer(e.xpReward??0,'order XP');if(!Array.isArray(e.requirements)||!e.requirements.length)throw new Error('Invalid requirements');const requirements=e.requirements.map(r=>{const i=item(r,'requirements');return i&&{...i,delivered:!!r.delivered};});if(requirements.some(r=>!r)){recover(e,'orders');return [];}if(requirements.every(r=>r.delivered))throw new Error('Waiting order already fulfilled');return [{id:e.id,type:customer.portraitPrefix,variant:e.variant,requirements,reward:e.reward,xpReward:e.xpReward||0,stageCount:e.stageCount||0,phase:'waiting',completedAt:null}];});
 if(orders.length>c.orders.capacity)throw new Error('Too many orders');
 const count=integer(s.completedCount,'completedCount'),serial=integer(s.serial,'serial');fresh.recovery=recovery;
 runtime.reconcileUnlocks(fresh);
 // Hydrate only after complete validation. Failed loads never partially alter runtime.
 runtime.state=fresh;runtime.board.slots=board;runtime.orders.entries=orders.map((e,i)=>({...e,slot:i}));runtime.orders.completedCount=count;runtime.orders.serial=Math.max(serial,...orders.map(e=>e.id),0);runtime.orders.refillReadyAt=null;return s;
}
class GameSaveRepository{
 constructor(adapter,key='merge-game-save'){this.adapter=adapter;this.key=key;}
 read(key){const raw=this.adapter.getItem(key);if(raw===null)return null;const data=JSON.parse(raw);if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Invalid save document: '+key);return data;}
 load(){return this.read(this.key);}
 backup(){return this.read(this.key+'.backup');}
 save(document){const text=JSON.stringify(document);this.adapter.setItem(this.key+'.pending',text);this.adapter.setItem(this.key,text);this.adapter.setItem(this.key+'.backup',text);this.adapter.removeItem(this.key+'.pending');}
 clear(){for(const key of [this.key,this.key+'.backup',this.key+'.pending'])this.adapter.removeItem(key);}
}
class GameSaveService{
 constructor(runtime,repository){this.runtime=runtime;this.repository=repository;this.timer=null;this.enabled=false;this.blocked=false;}
 load(){this.enabled=false;this.blocked=false;for(const source of ['load','backup'])try{const data=this.repository[source]();if(data!==null){hydrateGameSave(this.runtime,data);this.enabled=true;this.blocked=false;return true;}}catch(error){console.error('Game save '+source+' failed:',error);this.blocked=true;}this.enabled=!this.blocked;return false;}
 schedule(){if(!this.enabled||this.blocked)return;clearTimeout(this.timer);this.timer=setTimeout(()=>this.flush(),250);}
 flush(){clearTimeout(this.timer);this.timer=null;if(!this.enabled||this.blocked)return false;try{const data=serializeGame(this.runtime),probe=Object.create(this.runtime);probe.state=structuredClone(this.runtime.state);probe.board=Object.create(this.runtime.board);probe.orders=Object.create(this.runtime.orders);hydrateGameSave(probe,data);this.repository.save(data);return true;}catch(error){console.error('Game save failed:',error);return false;}}
}
if(typeof module!=='undefined')module.exports={GAME_SAVE_VERSION,gameSaveMigrations,serializeGame,migrateGameSave,hydrateGameSave,GameSaveRepository,GameSaveService};
