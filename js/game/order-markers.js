'use strict';
function orderItemKey(item){return item.type+':'+item.level;}
function orderMarkerState(entries,slots){
 const needed=new Set(),stock=new Map(),requirements=new Map();
 for(const item of slots)if(item){const key=orderItemKey(item);stock.set(key,(stock.get(key)||0)+1);}
 for(const e of entries){
  if(e.phase!=='waiting')continue;
  const remaining=new Map(stock);
  requirements.set(e.id,e.requirements.map(r=>{
   if(r.delivered)return true;
   const key=orderItemKey(r);needed.add(key);const count=remaining.get(key)||0;
   if(count)remaining.set(key,count-1);return count>0;
  }));
 }
 return {needed,requirements};
}
function orderCheckRect(box,fraction=.34,offsetX=0,offsetY=0){
 const width=Math.min(box.width,box.height)*fraction,height=width*678/820,pad=Math.min(box.width,box.height)*.035;
 return {x:Math.max(box.x,Math.min(box.x+box.width-width,box.x+box.width-pad-width+offsetX*box.width)),y:Math.max(box.y,Math.min(box.y+box.height-height,box.y+box.height-pad-height+offsetY*box.height)),width,height};
}
function orderRequirementIconSize(height,percent,item){return Math.max(1,height*.82*percent/100)*(item?.type==='ice'&&item.level===1?.5:1);}
function drawOrderCheck(c,box,board=false){const prefix=board?'fxBoardCheck':'fxOrderCheck',r=orderCheckRect(box,state[prefix+'Size']/100,state[prefix+'X']/100,state[prefix+'Y']/100);if(orderCheckImage.complete&&orderCheckImage.naturalWidth)c.drawImage(orderCheckImage,r.x,r.y,r.width,r.height);}
const orderCheckImage=new Image();
const orderCheckReady=new Promise((resolve,reject)=>{orderCheckImage.onload=resolve;orderCheckImage.onerror=()=>reject(new Error('订单对勾图片加载失败'));orderCheckImage.src=window.ORDER_CHECK_ASSET;});
orderCheckReady.catch(()=>{});
