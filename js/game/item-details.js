'use strict';
// PSD coordinates remain one uniformly scaled surface on phones and in the editor.
function createItemDetails(session,renderer,runtime){
 // One PSD layout. Drawing and hit targets both read these boxes, in the 1320×2868 sheet.
 const sheet={
  width:1320,screen:2868,top:335,height:1646,
  // Same picture as the original panel at (22, 335). Split only so the entrance can show the back, then the front.
  back:{x:61,y:444},front:{x:93,y:376},
  title:{x:661,y:448},
  close:{paint:{x:1091,y:544,w:67,h:72},hit:{x:1075,y:528,w:99,h:104}},
  inside:{left:62,top:375,right:1259,bottom:1933},
  grid:{x:206,y:667,col:246,row:230,size:166},
  arrow:{dx:0,dy:0,w:191,h:166},end:{dx:-2,dy:-2,w:170,h:170},
  question:{dx:71,dy:55,w:32,h:58},
  // Yellow corners sit on the green selected cell. Offsets keep the current picture.
  corners:{dx:-10,dy:-8,w:186,h:185,scale:.92},
  output:{x:660,y:1356},bed:{x:195,y:1417},
  producer:{frame:{x:576,y:1527,w:170,h:170},item:{x:578,y:1529,width:166,height:166}},
  info:{paint:{x:722,y:1488,w:60,h:67},hit:{x:710,y:1476,w:84,h:91}}
 };
 const pictures={},source=window.ITEM_DETAILS_ASSETS;
 const ready=Promise.all(Object.entries(source.images).map(([key,url])=>new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>{pictures[key]=image;resolve();};image.onerror=()=>reject(Error('物品详情素材加载失败'));image.src=url;
 })));
 ready.catch(()=>{});
 const dialog=document.createElement('dialog');dialog.id='item-details';dialog.setAttribute('aria-label','物品合成路线');
 const stage=document.createElement('div');stage.className='item-details-stage';
 const surface=document.createElement('canvas');surface.width=sheet.width;surface.height=sheet.height;surface.setAttribute('aria-hidden','true');
 stage.appendChild(surface);dialog.appendChild(stage);document.body.appendChild(dialog);
 const c=surface.getContext('2d'),snapshot=document.createElement('canvas'),still=document.createElement('canvas');
 let selected=null,items=[],producer=null,openedAt=0,enteredAt=0,loading=false,focusBefore=null,backdropFit='';
 const boxFor=i=>({x:sheet.grid.x+(i%4)*sheet.grid.col,y:sheet.grid.y+Math.floor(i/4)*sheet.grid.row,width:sheet.grid.size,height:sheet.grid.size});
 function knownTier(type){
  const ids=new Set(runtime.state.discoveries);
  return Math.max(0,...runtime.content.items.filter(d=>d.type===type&&ids.has(d.id)).map(d=>d.tier),...session.board.slots.filter(i=>i?.type===type).map(i=>i.level));
 }
 function place(){
  if(!dialog.open)return;
  const r=canvas.getBoundingClientRect(),view=document.getElementById('viewport').getBoundingClientRect();
  const mobile=document.body.classList.contains('mobile-play'),frame=window.playFrame;
  const area=mobile?(frame||view):r,v=window.visualViewport;
  const left=Math.max(area.left,view.left,v?.offsetLeft||0),top=Math.max(area.top,view.top,v?.offsetTop||0);
  const right=Math.min(area.left+area.width,view.right,(v?.offsetLeft||0)+(v?.width||innerWidth));
  const bottom=Math.min(area.top+area.height,view.bottom,(v?.offsetTop||0)+(v?.height||innerHeight));
  const width=Math.max(1,right-left),height=Math.max(1,bottom-top);
  Object.assign(dialog.style,{left:left+'px',top:top+'px',width:width+'px',height:height+'px'});
  // Editor follows its actual zoomed canvas. Phones keep their reference size and only shrink to fit.
  const refW=!mobile||frame?r.width:390,refTop=!mobile||frame?r.height*sheet.top/sheet.screen:844*sheet.top/sheet.screen;
  const scale=Math.min(refW/sheet.width,width/sheet.width,Math.max(1,height-16)/sheet.height);
  stage.style.width=sheet.width*scale+'px';stage.style.height=sheet.height*scale+'px';
  stage.style.left=Math.max(0,Math.min(width-sheet.width*scale,r.left+r.width/2-sheet.width*scale/2-left))+'px';
  stage.style.top=Math.max(8,Math.min(height-8-sheet.height*scale,r.top+refTop-top))+'px';
 }
 function button(label,box,action){
  const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',label);
  Object.assign(b.style,{left:box.x/sheet.width*100+'%',top:(box.y-sheet.top)/sheet.height*100+'%',width:box.width/sheet.width*100+'%',height:box.height/sheet.height*100+'%'});
  b.onclick=action;stage.appendChild(b);return b;
 }
 function select(item){
  const refocus=stage.contains(document.activeElement);
  selected={...item};const definition=session.board.definition(item),chain=runtime.content.chains.find(c=>c.id===definition.chainId);
  items=chain.itemIds.map(id=>runtime.content.items.find(d=>d.id===id));producer=null;
  if(!definition.producerId){
   producer=session.board.slots.filter(Boolean).filter(i=>{
    const p=runtime.content.producers.find(p=>p.id===session.board.definition(i)?.producerId);
    return p?.outputs.some(o=>runtime.content.items.find(d=>d.id===o.itemId)?.chainId===chain.id);
   }).sort((a,b)=>b.level-a.level)[0]||null;
  }
  for(const b of stage.querySelectorAll('button'))b.remove();
  const unlocked=knownTier(item.type);
  items.forEach((d,i)=>{
   const b=button(d.tier<=unlocked?`${d.name}，等级${d.tier}`:`等级${d.tier}，未解锁`,boxFor(i),()=>select({type:d.type,level:d.tier}));
   b.disabled=d.tier>unlocked;b.setAttribute('aria-pressed',String(d.tier===selected.level));
  });
  if(producer)button('查看生成器合成路线',{x:sheet.info.hit.x,y:sheet.info.hit.y,width:sheet.info.hit.w,height:sheet.info.hit.h},()=>{select(producer);stage.querySelector('button[aria-pressed="true"]')?.focus({preventScroll:true});});
  button('关闭物品详情',{x:sheet.close.hit.x,y:sheet.close.hit.y,width:sheet.close.hit.w,height:sheet.close.hit.h},close);
  if(refocus)stage.querySelector('button[aria-pressed="true"]')?.focus({preventScroll:true});
  dialog.setAttribute('aria-label',definition.name+'合成路线');draw();
 }
 const paint=(key,x,y,w,h)=>{const img=pictures[key];if(img)c.drawImage(img,x,y,w??img.width,h??img.height);};
 // Back, then the board, then the pieces on top. The next layer starts before the previous one finishes.
 const fade=delay=>{const t=Math.max(0,Math.min(1,(performance.now()-enteredAt-delay)/200));return 1-(1-t)**3;};
 function layer(delay,rise,drawLayer){
  const a=fade(delay);c.save();c.globalAlpha=a;c.translate(0,(1-a)*rise);drawLayer();c.restore();
 }
 function draw(){
  if(!dialog.open||!selected)return;
  c.clearRect(0,0,surface.width,surface.height);c.save();c.translate(0,-sheet.top);
  layer(0,22,()=>paint('back',sheet.back.x,sheet.back.y));
  layer(140,16,()=>paint('front',sheet.front.x,sheet.front.y));
  layer(280,10,()=>{
  paint('close',sheet.close.paint.x,sheet.close.paint.y,sheet.close.paint.w,sheet.close.paint.h);
  drawCloudTitle(c,session.board.definition(selected).name);
  const time=performance.now(),unlocked=knownTier(selected.type);
  items.forEach((d,i)=>{
   const box=boxFor(i),last=i===items.length-1,isSelected=d.tier===selected.level,bed=last?sheet.end:sheet.arrow;
   paint(isSelected?(last?'selected-end':'selected'):(last?'end':'cell'),box.x+bed.dx,box.y+bed.dy,bed.w,bed.h);
   if(d.tier<=unlocked)renderer.drawDetailsItem(c,box,{type:d.type,level:d.tier},100+i,time,pictures['icon-'+d.assetId]);
   else paint('question',box.x+sheet.question.dx,box.y+sheet.question.dy,sheet.question.w,sheet.question.h);
   if(isSelected){const k=sheet.corners,w=k.w*k.scale,h=k.h*k.scale;renderer.drawSelection(c,{x:box.x+k.dx+(k.w-w)/2,y:box.y+k.dy+(k.h-h)/2,width:w,height:h},time);}
  });
  if(!session.board.definition(selected).producerId){
   paint('output-label',sheet.output.x-pictures['output-label'].width/2,sheet.output.y);paint('producer-bed',sheet.bed.x,sheet.bed.y);
   if(producer){
    paint('producer',sheet.producer.frame.x,sheet.producer.frame.y,sheet.producer.frame.w,sheet.producer.frame.h);
    renderer.drawDetailsItem(c,sheet.producer.item,producer,120,time,pictures['icon-'+producer.type+producer.level]);
    paint('info',sheet.info.paint.x,sheet.info.paint.y,sheet.info.paint.w,sheet.info.paint.h);
   }
  }
  });
  c.restore();
 }
 async function open(item){
  if(!item||loading||dialog.open||!session.active||window.renovationScreen?.active||window.renovationScreen?.busy)return;
  loading=true;
  try{
   await ready;await titleFontReady;if(!session.active||window.renovationScreen?.active)return;
   drawCanvas();snapshot.width=canvas.width;snapshot.height=canvas.height;snapshot.getContext('2d').drawImage(canvas,0,0);
   const sky=state.transparentTop;state.transparentTop=true;
   try{drawCanvas();still.width=canvas.width;still.height=canvas.height;still.getContext('2d').drawImage(canvas,0,0);}
   finally{state.transparentTop=sky;}
   canvas.getContext('2d').drawImage(snapshot,0,0);
   focusBefore=document.activeElement;openedAt=enteredAt=performance.now();
   if(bleedDisplay){backdropFit=bleedDisplay.style.objectFit;bleedDisplay.style.objectFit='cover';}
   session.drag=null;session.keyboardSource=-1;dialog.showModal();select(item);place();stage.querySelector('button[aria-label="关闭物品详情"]').focus({preventScroll:true});
  }catch(error){notify(error.message);}finally{loading=false;}
 }
 function close(){if(dialog.open)dialog.close();}
 dialog.addEventListener('close',()=>{
  const elapsed=performance.now()-openedAt;renderer.resume(elapsed);
  if(bleedDisplay)bleedDisplay.style.objectFit=backdropFit;
  for(const entry of orderQueue.entries)for(const key of ['arrivedAt','completedAt'])if(entry[key]!=null)entry[key]+=elapsed;
  for(const payout of orderPayouts)payout.start+=elapsed;
  if(orderQueue.refillReadyAt!=null)orderQueue.refillReadyAt+=elapsed;orderFrame=performance.now();
  runtime.recoverEnergy();if(!document.hidden)updatePlayback();
  selected=null;resizePreview();drawCanvas();focusBefore?.focus({preventScroll:true});
 });
 dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
 surface.addEventListener('click',e=>{
  const r=surface.getBoundingClientRect(),x=(e.clientX-r.left)*sheet.width/r.width,y=(e.clientY-r.top)*sheet.height/r.height+sheet.top;
  if(x<sheet.inside.left||x>sheet.inside.right||y<sheet.inside.top||y>sheet.inside.bottom)close();
 });
 window.addEventListener('resize',place);
 window.visualViewport?.addEventListener('resize',place);
 window.visualViewport?.addEventListener('scroll',place);
 document.addEventListener('scroll',place,true);
 new ResizeObserver(place).observe(canvas);
 return {open,close,draw,get active(){return dialog.open;},drawFrozen(target){
  // The board, orders, and item motion stay on the frame from open. Video and the energy countdown keep moving.
  const g=geometry||calculateLayout();if(target.width!==g.W)target.width=g.W;if(target.height!==g.H)target.height=g.H;
  const ctx=target.getContext('2d');ctx.clearRect(0,0,target.width,target.height);
  drawTopBackground(ctx,g);
  const plate=still.width?still:snapshot;
  drawArtworkCover(ctx,plate,0,0,plate.width,plate.height,0,0,target.width,target.height);
  const s=g.W/1170,y=state.fxCurrencyY*g.H/state.height,x=state.fxCurrencyX-80,w=state.fxCurrencyWidth+140,h=state.fxCurrencyHeight+56;
  ctx.save();ctx.beginPath();ctx.rect(x*s,(y-16)*s,w*s,h*s);ctx.clip();drawTopBackground(ctx,g);drawCurrencyUI(ctx,g,'energy');ctx.restore();
  return target;
 }};
}
