'use strict';
(()=>{
 const board=new MergeTestBoard(),pictures={};let active=false,loading=false,drag=null,selected=-1,keyboardSource=-1,effects=new Map();
 validateGameContent(GameContent);
 const runtime=new GameRuntime(GameContent,board,orderQueue);
 let saveService=null,resumePending=false;
 try{saveService=new GameSaveService(runtime,new GameSaveRepository(window.localStorage));resumePending=saveService.load();}catch(error){console.warn('游戏存档不可用，编辑器和测试仍可运行。',error);}
 runtime.scheduleSave=()=>saveService?.schedule();
 // Temporary renovation testing: a page load starts the restaurant from damaged.
 // Test refresh resets coins and restaurant purchases, but preserves energy and other progress.
 runtime.state.currencies.coins=100;
 runtime.recoverEnergy();
 setInterval(()=>{if(!document.hidden)runtime.recoverEnergy();},1000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)runtime.recoverEnergy();});
 const restaurantTasks=new Set(GameContent.tasks.filter(t=>t.zoneId==='zone_restaurant').map(t=>t.id));
 runtime.state.renovation.completedTaskIds=runtime.state.renovation.completedTaskIds.filter(id=>!restaurantTasks.has(id));
 runtime.state.renovation.rewardedAreaIds=runtime.state.renovation.rewardedAreaIds.filter(id=>id!=='area_restaurant');
 runtime.scheduleSave();
 window.gameRuntime=runtime;
 window.flushGameSave=()=>saveService?.flush()??false;
 window.addEventListener('pagehide',()=>saveService?.flush());
 document.addEventListener('visibilitychange',()=>{if(document.hidden)saveService?.flush();});
 let ready;const flights=new Map();
 const center=b=>({x:b.x+b.width/2,y:b.y+b.height/2});
 const busy=i=>flights.has(i);
 const session={failures:new Map(),get active(){return active;},set active(v){active=v;},get drag(){return drag;},set drag(v){drag=v;},get selected(){return selected;},set selected(v){selected=v;},get keyboardSource(){return keyboardSource;},set keyboardSource(v){keyboardSource=v;},get board(){return board;},get flights(){return flights;},get effects(){return effects;},set effects(v){effects=v;},get pictures(){return pictures;}};
 const {draw}=createPlaytestRenderer(session);
 const label=item=>item?`${board.definition(item)?.name||item.type} · ${item.level} 级`:'';
 const feedback=createPlaytestFeedback(session,label,message,center);
 bindPlaytestInput(session,feedback,message,busy,label,center);
 const editor=window.gameTools?.bind({session,toggle,restart,message,busy,label});
 function message(text){if(editor)editor.message(text);else if(active)notify(text);}
 function loadPictures(){return ready||(ready=Promise.all(Object.entries(window.MERGE_GAME_ASSETS||{}).map(([name,url])=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{pictures[name]=img;resolve();};img.onerror=()=>reject(new Error('图标加载失败：'+name));img.src=url;}))).then(()=>{if(GameContent.items.some(i=>!pictures[i.assetId]))throw new Error('缺少测试图标，请保留 game-assets.js。');}).catch(e=>{ready=null;throw e;}));}
 function lockEditor(locked){document.body.classList.toggle('testing',locked);editor?.lock(locked);resizePreview();}
 function restart(){drag=null;keyboardSource=-1;effects.clear();flights.clear();selected=board.reset();resetOrderCustomers();saveService?.schedule();message('点击生成器出物品；拖到空格移动，拖到同级同类物品合成。');drawCanvas();}
 async function toggle(){
  if(window.renovationScreen?.active||window.renovationScreen?.transitioning)return;
  if(loading)return;if(active){active=false;drag=null;keyboardSource=-1;effects.clear();flights.clear();lockEditor(false);drawCanvas();return;}
  if(window.gameTools?.mediaBusy()){notify('请等待预设处理完成，再启用测试。');return;}
  loading=true;editor?.loading(true);
  try{await Promise.all([loadPictures(),orderPortraitsReady,orderCheckReady]);active=true;lockEditor(true);if(resumePending){resumePending=false;refreshOrderButtons();message('已恢复上次的游戏进度。');drawCanvas();}else restart();setOrdersVisible(true);drawCanvas();canvas.focus({preventScroll:true});}
  catch(e){notify(e.message);}finally{loading=false;editor?.loading(false);}
 }
 session.showOrders=true;
 function submitOrderItem(id,index){if(!active||drag||busy(index)||!orderQueue.submit(id,board,index,performance.now()))return false;effects.delete(index);if(selected===index)selected=-1;keyboardSource=-1;message('订单已接收物品。');return true;}
 window.mergePlayTest={get active(){return active;},get animating(){return flights.size>0;},draw,toggle,getSnapshot:()=>structuredClone(board.slots),submitOrderItem,getItemImage:item=>pictures[item.type+item.level]};
})();
