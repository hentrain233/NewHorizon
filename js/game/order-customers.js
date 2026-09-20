'use strict';
const orderImages={},orderCatalog={};
for(const key of Object.keys(window.ORDER_PORTRAITS||{})){const m=key.match(/^(.*)([a-z])$/);if(m&&window.ORDER_PORTRAITS[key+'1'])(orderCatalog[m[1]]??=[]).push(m[2]);}
const orderQueue=new OrderQueue(orderCatalog);

let ordersVisible=false,orderFrame=0,orderScroll=0;
const orderPortraitsReady=Promise.all(Object.entries(window.ORDER_PORTRAITS||{}).map(([key,url])=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{orderImages[key]=img;resolve();};img.onerror=()=>reject(new Error('订单立绘加载失败：'+key));img.src=url;})));
orderPortraitsReady.catch(()=>{});
function orderPose(e,g,scroll=orderScroll){
 const s=g.W/1170,key=Object.keys(ORDER_ANIMAL_TYPES).find(k=>ORDER_ANIMAL_TYPES[k]===e.type),prefix='fxAnimal'+key;
 return {x:(state.fxOrderStartX+e.slot*state.fxOrderStep+(state[prefix+'X']??0)-scroll)*s,bottom:g.barBottom+(state.fxOrderPortraitY+(state[prefix+'Y']??0))*s,height:state.fxOrderPortraitHeight*s*(state[prefix+'Scale']??100)/100};
}
// Keep the original default bubble baseline, independent of every portrait Y adjustment.
function orderBubbleBottom(g){return g.barBottom+(-6-state.fxBubbleGap)*g.W/1170;}
// Bounds use settled queue slots, so arrival animation cannot stretch the scroll range.
function orderScrollMax(g){
 const s=g.W/1170,halfBubble=orderBubbleWidth()*g.W*.82/1510/2;
 let right=g.W;
 orderQueue.entries.forEach((e,i)=>{
  const p=orderPose({...e,slot:i},g,0);
  let halfPortrait=0;
  for(const suffix of ['', '1']){const img=orderImages[e.type+e.variant+suffix];if(img)halfPortrait=Math.max(halfPortrait,p.height*img.width/img.height/2);}
  right=Math.max(right,p.x+halfPortrait+12*s,p.x+state.fxBubbleX*s+halfBubble+12*s);
 });
 return Math.max(0,(right-g.W)/s);
}
function setOrderScroll(value,g){orderScroll=Math.max(0,Math.min(orderScrollMax(g),value));}
function drawOrderCustomers(c,g){
 if(!ordersVisible||!window.mergePlayTest?.active)return;
 const now=performance.now(),dt=Math.min(.1,(now-orderFrame)/1000||0);orderFrame=now;
 const hold=orderCompletionHold(state);
 orderQueue.update(now,hold,state.fxOrderFade*1000);
 orderQueue.refillWhenSettled(now);
 setOrderScroll(orderScroll,g);
 c.save();c.beginPath();c.rect(0,0,g.W,g.barBottom);c.clip();
 orderQueue.entries.forEach((e,i)=>{
  if(e.arrivedAt===undefined){e.arrivedAt=now;e.arrivalSlot=e.slot;}
  const entrance=orderEntrance(now-e.arrivedAt,state.fxOrderEnterDuration*1000,state.fxOrderEnterRise);e.entering=!entrance.done;
  if(e.entering)e.slot=i+(e.arrivalSlot-i)*(1-entrance.alpha);
  else e.slot+=Math.sign(i-e.slot)*Math.min(Math.abs(i-e.slot),dt/state.fxOrderSlide);
  const p=orderPose(e,g),img=orderImages[e.type+e.variant+(e.phase==='complete'?'1':'')];if(!img)return;
  if(e.completedAt!==null&&!e.rewarded&&now-e.completedAt>=hold){e.rewarded=true;notify(e.type+'：已获得 '+e.reward+' 金币，正在离开。');}
  const alpha=entrance.alpha*(e.completedAt===null?1:Math.max(0,1-Math.max(0,now-e.completedAt-hold)/(state.fxOrderFade*1000)));e.alpha=alpha;
  const jump=e.completedAt===null?0:orderJumpOffset(now-e.completedAt,state.fxOrderJumpDuration*1000,state.fxOrderJumpHeight)*g.W/1170;
  const w=p.height*img.width/img.height;c.save();c.globalAlpha=alpha;c.drawImage(img,p.x-w/2,p.bottom-p.height+jump+entrance.offset*g.W/1170,w,p.height);c.restore();
 });
 c.restore();
}
function drawCustomerBubbles(c,g,markers){
 if(!ordersVisible)return;
 orderQueue.entries.forEach(e=>{const p=orderPose(e,g),scale=g.W*.82/1510,h=449*state.fxBubbleHeight/100,w=orderBubbleWidth(),s=g.W/1170;
  c.save();c.globalAlpha=e.alpha??1;c.translate(p.x-w*scale/2+state.fxBubbleX*s,orderBubbleBottom(g)-h*scale);c.scale(scale,scale);paintOrderBubble(c);
  c.fillStyle='#A36F48';c.textAlign='center';c.textBaseline='middle';
  if(e.phase==='waiting'){
   const step=(w-40)/e.requirements.length;
   e.requirements.forEach((r,i)=>{const img=window.mergePlayTest.getItemImage(r),x=20+step*(i+.5),size=orderRequirementIconSize(h,state.fxOrderItemScale,r),y=(h-size)/2;c.save();if(r.delivered)c.globalAlpha*=.4;if(img)c.drawImage(img,x-size/2,y,size,size);c.restore();if(r.delivered||markers?.requirements.get(e.id)?.[i])drawOrderCheck(c,{x:x-size/2,y,width:size,height:size});});
  }
  c.restore();
 });
}
function refreshOrderButtons(){window.refreshOrderTools?.();}
function setOrdersVisible(value){ordersVisible=value;if(value&&!orderQueue.entries.length)while(orderQueue.add()){}orderFrame=performance.now();const actions=document.getElementById('order-actions');if(actions)actions.hidden=!value;refreshOrderButtons();}
function resetOrderCustomers(){orderScroll=0;orderQueue.reset();const input=document.getElementById('order-count-input');if(input){delete input.dataset.dirty;input.value=0;}refreshOrderButtons();}
function hitOrderCustomer(point,g){
 if(!ordersVisible||!window.mergePlayTest?.active)return null;
 const entries=[...orderQueue.entries].filter(e=>!e.entering).reverse(),s=g.W/1170,scale=g.W*.82/1510;
 // Bubbles are in front; hit them before testing the exposed portraits.
 for(const e of entries){const p=orderPose(e,g),w=orderBubbleWidth()*scale,h=449*state.fxBubbleHeight/100*scale,x=p.x-w/2+state.fxBubbleX*s,y=orderBubbleBottom(g)-h;if(point.x>=x&&point.x<=x+w&&point.y>=y&&point.y<=y+h)return e;}
 for(const e of entries){const p=orderPose(e,g),img=orderImages[e.type+e.variant+(e.phase==='complete'?'1':'')];if(!img)continue;const w=p.height*img.width/img.height;if(point.x>=p.x-w/2&&point.x<=p.x+w/2&&point.y>=p.bottom-p.height&&point.y<g.bar.y)return e;}
 return null;
}
