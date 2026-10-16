'use strict';
// PSD coordinates remain one uniformly scaled surface on phones and in the editor.
function createItemDetails(session,renderer,runtime,host){
 // One PSD layout. Drawing and hit targets both read these boxes, in the 1320×2868 sheet.
 const itemSheet={
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
 const sheet=itemSheet,{stage,dialog,context:c}=host;
 const button=(...args)=>currentButton(...args),close=host.close;let currentButton;
 const pictures={},source=window.ITEM_DETAILS_ASSETS;
 let ready;
 const load=()=>ready||(ready=Promise.all(Object.entries(source.images).map(([key,url])=>new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>{pictures[key]=image;resolve();};image.onerror=()=>reject(Error('物品详情素材加载失败'));image.src=url;
 }))).catch(error=>{ready=null;throw error;}));
 let selected=null,items=[],producer=null,outputRows=[];
 function prepareOutputLabel(){
  if(pictures['products-label'])return;
  // PSD 产出: FZY4JW 48.006px, #2676A3, no layer effects. Rasterize once after font readiness.
  const label=document.createElement('canvas'),ctx=label.getContext('2d'),text='产出以下物品',font='400 48.006px "FZCuYuan"';
  ctx.font=font;const m=ctx.measureText(text);
  label.width=Math.ceil(m.width);label.height=46;
  ctx.font=font;ctx.fillStyle='#2676A3';ctx.fillText(text,0,m.actualBoundingBoxAscent);
  pictures['products-label']=label;
 }
 const boxFor=i=>({x:sheet.grid.x+(i%4)*sheet.grid.col,y:sheet.grid.y+Math.floor(i/4)*sheet.grid.row,width:sheet.grid.size,height:sheet.grid.size});
 function knownTier(type){
  const ids=new Set(runtime.state.discoveries);
  return Math.max(0,...runtime.content.items.filter(d=>d.type===type&&ids.has(d.id)).map(d=>d.tier),...session.board.slots.filter(i=>i?.type===type).map(i=>i.level));
 }
 function select(item){
  const refocus=stage.contains(document.activeElement);
  selected={...item};const definition=session.board.definition(item),chain=runtime.content.chains.find(c=>c.id===definition.chainId);
  items=chain.itemIds.map(id=>runtime.content.items.find(d=>d.id===id));producer=null;outputRows=[];
  if(definition.producerId){
   const recipe=runtime.content.producers.find(p=>p.id===definition.producerId);
   const outputs=[...new Set(recipe.outputs.filter(o=>o.weight>0).map(o=>o.itemId))].map(id=>runtime.content.items.find(d=>d.id===id));
   outputRows=[...new Set(outputs.map(d=>d.chainId))].map(id=>outputs.filter(d=>d.chainId===id).sort((a,b)=>a.tier-b.tier));
  }
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
   b.setAttribute('aria-pressed',String(d.tier===selected.level));
  });
  if(producer)button('查看生成器合成路线',{x:sheet.info.hit.x,y:sheet.info.hit.y,width:sheet.info.hit.w,height:sheet.info.hit.h},()=>{select(producer);stage.querySelector('button[aria-pressed="true"]')?.focus({preventScroll:true});});
  button('关闭物品详情',{x:sheet.close.hit.x,y:sheet.close.hit.y,width:sheet.close.hit.w,height:sheet.close.hit.h},close);
  if(refocus)stage.querySelector('button[aria-pressed="true"]')?.focus({preventScroll:true});
  dialog.setAttribute('aria-label',(item.level>unlocked?'未解锁':definition.name)+'合成路线');
  dialog.setAttribute('aria-description',definition.producerId?'产出以下物品：'+outputRows.flat().map(d=>`${d.name}（等级${d.tier}）`).join('、'):'由以下物品产出：'+(producer?session.board.definition(producer).name:'暂无'));
  host.draw();
 }
 const paint=(key,x,y,w,h)=>{const img=pictures[key];if(img)c.drawImage(img,x,y,w??img.width,h??img.height);};
 function draw(c,time,layer){
  layer(0,22,()=>paint('back',sheet.back.x,sheet.back.y));
  layer(140,16,()=>paint('front',sheet.front.x,sheet.front.y));
  layer(280,10,()=>{
  paint('close',sheet.close.paint.x,sheet.close.paint.y,sheet.close.paint.w,sheet.close.paint.h);
  const time=performance.now(),unlocked=knownTier(selected.type);
  drawCloudTitle(c,selected.level>unlocked?'未解锁':session.board.definition(selected).name);
  items.forEach((d,i)=>{
   const box=boxFor(i),last=i===items.length-1,isSelected=d.tier===selected.level,bed=last?sheet.end:sheet.arrow;
   paint(isSelected?(last?'selected-end':'selected'):(last?'end':'cell'),box.x+bed.dx,box.y+bed.dy,bed.w,bed.h);
   if(d.tier<=unlocked)renderer.drawDetailsItem(c,box,{type:d.type,level:d.tier},100+i,time,pictures['icon-'+d.assetId]||window.mergePlayTest?.getItemImage({type:d.type,level:d.tier}));
   else paint('question',box.x+sheet.question.dx,box.y+sheet.question.dy,sheet.question.w,sheet.question.h);
   if(isSelected){const k=sheet.corners,w=k.w*k.scale,h=k.h*k.scale;renderer.drawSelection(c,{x:box.x+k.dx+(k.w-w)/2,y:box.y+k.dy+(k.h-h)/2,width:w,height:h},time);}
  });
  if(session.board.definition(selected).producerId){
   paint('products-label',sheet.output.x-pictures['products-label'].width/2,sheet.output.y);
   paint('producer-bed',sheet.bed.x,sheet.bed.y);
   outputRows.forEach((row,r)=>row.forEach((d,i)=>{
    const box={x:sheet.output.x-((row.length-1)*sheet.grid.col+166)/2+i*sheet.grid.col,
     y:sheet.bed.y+(pictures['producer-bed'].height-(outputRows.length*166+(outputRows.length-1)*20))/2+r*186,width:166,height:166};
    paint('producer',box.x-2,box.y-2,170,170);
    renderer.drawDetailsItem(c,box,{type:d.type,level:d.tier},120+r*4+i,time,pictures['icon-'+d.assetId]);
   }));
  }else if(!session.board.definition(selected).tags.some(t=>t==='chest'||t==='tool')){
   paint('output-label',sheet.output.x-pictures['output-label'].width/2,sheet.output.y);paint('producer-bed',sheet.bed.x,sheet.bed.y);
   if(producer){
    paint('producer',sheet.producer.frame.x,sheet.producer.frame.y,sheet.producer.frame.w,sheet.producer.frame.h);
    renderer.drawDetailsItem(c,sheet.producer.item,producer,120,time,pictures['icon-'+producer.type+producer.level]);
    paint('info',sheet.info.paint.x,sheet.info.paint.y,sheet.info.paint.w,sheet.info.paint.h);
   }
  }
  });
 }
 function open(item){
  if(!item)return;
  return host.openPanel({label:'物品合成路线',layout:itemSheet,offsetY:128,
   get ready(){return load().then(prepareOutputLabel);},
   start(button){currentButton=button;select(item);},stop(){selected=null;},draw});
 }
 return {open,openPanel:host.openPanel,close:host.close,draw:host.draw,drawFrozen:host.drawFrozen,get active(){return host.active;}};
}
