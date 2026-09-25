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
function orderPortraitShift(g){return (state.fxOrderPortraitX??0)*g.W/1170;}
// Bounds use settled queue slots, so arrival animation cannot stretch the scroll range.
function orderScrollMax(g){
 const s=g.W/1170,halfBubble=orderBubbleWidth()*g.W*.82/1510/2;
 let right=g.W;
 orderQueue.entries.forEach((e,i)=>{
  const p=orderPose({...e,slot:i},g,0);
  let halfPortrait=0;
  for(const suffix of ['', '1']){const img=orderImages[e.type+e.variant+suffix];if(img)halfPortrait=Math.max(halfPortrait,p.height*img.width/img.height/2);}
  right=Math.max(right,p.x+orderPortraitShift(g)+halfPortrait+12*s,p.x+state.fxBubbleX*s+halfBubble+12*s,p.x+orderPortraitShift(g)+(state.fxRewardX+state.fxRewardWidth+12)*s);
 });
 return Math.max(0,(right-g.W)/s);
}
function setOrderScroll(value,g){orderScroll=Math.max(0,Math.min(orderScrollMax(g),value));}
function formatOrderReward(value){
 if(value<1000)return String(value);
 const unit=value>=1e9?1e9:value>=1e6?1e6:1e3;
 const precision=value/unit<100?10:1;
 return (Math.floor(value/unit*precision)/precision).toString()+({1000:'k',1000000:'m',1000000000:'b'}[unit]);
}
function orderRewardRows(order){
 // Use the existing currency reward shape; legacy order.reward is the coin payout.
 const amounts={gems:0,energy:0,coins:order.reward||0};
 for(const reward of order.rewards||[])if(reward.type==='currency'&&Object.hasOwn(amounts,reward.currency)&&Number.isSafeInteger(reward.amount)&&reward.amount>0)amounts[reward.currency]+=reward.amount;
 return [['gems','premium'],['energy','energy'],['coins','coin']].filter(([key])=>Number.isSafeInteger(amounts[key])&&amounts[key]>0).map(([key,icon])=>({icon,amount:amounts[key]}));
}
function drawOrderRewards(c,g,e){
 const rows=orderRewardRows(e);if(!rows.length)return;
 const s=g.W/1170,p=orderPose(e,g),a=state,pad=a.fxRewardPadding,w=a.fxRewardWidth,h=rows.length*a.fxRewardRowHeight+pad*2;
 const bubbleHeight=449*a.fxBubbleHeight/100*g.W*.82/1510;
 c.save();c.globalAlpha=e.alpha??1;
 c.translate(p.x+orderPortraitShift(g)+a.fxRewardX*s,orderBubbleBottom(g)-bubbleHeight+(a.fxRewardY-h)*s);c.scale(s,s);
 rounded(c,0,0,w,h,Math.min(a.fxRewardRadius,w/2,h/2));c.fillStyle=rgba(a.fxRewardFill,a.fxRewardOpacity/100);c.fill();
 c.font=currencyFont(a.fxRewardFontSize);c.textAlign='right';c.textBaseline='middle';
 rows.forEach((row,i)=>{
  const colorKey=row.icon==='energy'?'Energy':row.icon==='premium'?'Premium':'Text';
  c.fillStyle=a['fxReward'+colorKey+'Color'];c.strokeStyle=a['fxReward'+colorKey+'Border'];
  const y=pad+(i+.5)*a.fxRewardRowHeight,img=artwork['background'+row.icon],size=row.icon==='coin'?a.fxRewardCoinSize:a.fxRewardIconSize;
  if(img){const scale=size/Math.max(img.width,img.height);c.drawImage(img,pad+(size-img.width*scale)/2+a.fxRewardIconX,y-img.height*scale/2+a.fxRewardIconY,img.width*scale,img.height*scale);}
  const text='+'+formatOrderReward(row.amount),tx=w-pad+a.fxRewardTextX,ty=y+a.fxRewardTextY,maxWidth=Math.max(1,tx-pad*2-size-a.fxRewardIconX);
  if(a.fxRewardTextStroke>0){c.lineJoin='round';c.lineWidth=a.fxRewardTextStroke;drawCurrencyText(c,text,tx,ty,a.fxRewardLetterSpacing,'strokeText',maxWidth);}
  drawCurrencyText(c,text,tx,ty,a.fxRewardLetterSpacing,'fillText',maxWidth);
 });c.restore();
}
const generatorRewardIcons=new Map();
function generatorRewardIcon(type){
 const img=window.mergePlayTest?.getItemImage({type,level:1}),star=createPlaytestRenderer?.starSprite;if(!img||!star)return img||null;
 if(generatorRewardIcons.has(type))return generatorRewardIcons.get(type);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=160;const g=canvas.getContext('2d');
 g.drawImage(img,28,28,104,104);
 [[26,34,22],[128,30,18],[30,124,16],[132,118,20]].forEach(([x,y,size],i)=>{const sprite=star(state['fxStarColor'+(i%3+1)]||'#F9E6B4');g.globalAlpha=(state.fxStarOpacity??85)/100;g.drawImage(sprite,x-size,y-size,size*2,size*2);});
 generatorRewardIcons.set(type,canvas);return canvas;
}
function drawGeneratorReward(c,g,e){
 if(!e.generator)return;
 const rows=orderRewardRows(e),s=g.W/1170,p=orderPose(e,g),a=state,pad=a.fxRewardPadding,w=a.fxRewardWidth;
 const currencyH=rows.length*a.fxRewardRowHeight+pad*2,box=a.fxRewardRowHeight+pad*2,gap=10;
 const bubbleHeight=449*a.fxBubbleHeight/100*g.W*.82/1510;
 const top=orderBubbleBottom(g)-bubbleHeight+(a.fxRewardY-(rows.length?currencyH:0))*s-(gap+box)*s;
 c.save();c.globalAlpha=e.alpha??1;c.translate(p.x+orderPortraitShift(g)+a.fxRewardX*s,top);c.scale(s,s);
 rounded(c,0,0,w,box,Math.min(a.fxRewardRadius,w/2,box/2));c.fillStyle=rgba(a.fxRewardFill,a.fxRewardOpacity/100);c.fill();
 const icon=generatorRewardIcon(e.generator.type);if(icon){const size=a.fxRewardGeneratorSize;c.drawImage(icon,(w-size)/2,(box-size)/2+a.fxRewardGeneratorY,size,size);}
 c.restore();
}
const orderPayouts=[];
function rewardRowPoint(e,g,icon){
 const rows=orderRewardRows(e),s=g.W/1170,p=orderPose(e,g),a=state,pad=a.fxRewardPadding;
 const h=rows.length*a.fxRewardRowHeight+pad*2,bubbleHeight=449*a.fxBubbleHeight/100*g.W*.82/1510;
 const i=Math.max(0,rows.findIndex(r=>r.icon===icon));
 return {x:p.x+orderPortraitShift(g)+(a.fxRewardX+a.fxRewardWidth/2)*s,y:orderBubbleBottom(g)-bubbleHeight+(a.fxRewardY-h+pad+(i+.5)*a.fxRewardRowHeight)*s};
}
function currencyBarPoint(g,icon){
 const s=g.W/1170,i={energy:0,coin:1,premium:2}[icon],slot=state.fxCurrencyWidth+37,n=icon==='coin'?'Coin':icon==='energy'?'Energy':'Premium';
 return {x:(state.fxCurrencyX+i*(slot+state.fxCurrencyGap)+49+state['fxCurrency'+n+'X'])*s,y:(state.fxCurrencyY+state.fxCurrencyHeight/2+state['fxCurrency'+n+'Y'])*s};
}
function beginOrderPayout(e,g){
 if(e.payoutStarted||e.completedAt==null)return;e.payoutStarted=true;
 const count=Math.max(1,...e.requirements.map(r=>r.level)),start=e.completedAt,duration=state.fxRepairFillDuration;
 for(const row of orderRewardRows(e))if(row.icon==='coin'||row.icon==='energy')orderPayouts.push({icon:row.icon,amount:row.amount,count,start,duration,source:rewardRowPoint(e,g,row.icon),target:currencyBarPoint(g,row.icon)});
}
function orderPayoutBalance(icon,actual){
 const now=performance.now();let hidden=0;
 for(const p of orderPayouts){if(p.icon!==icon)continue;let arrived=0;for(let i=0;i<p.count;i++)if(((now-p.start)/p.duration-i*.055)/.615>=1)arrived++;hidden+=p.amount-Math.round(p.amount*arrived/p.count);}
 return Math.max(0,actual-hidden);
}
function drawOrderPayouts(c,g){
 if(!orderPayouts.length)return;
 const now=performance.now(),W=window.RENOVATION_ASSETS?.width||6344,k=W/g.W;
 c.save();c.scale(g.W/W,g.W/W);
 for(const p of orderPayouts)RenovationMotion.paintFlights(c,now,p.start,p.duration,p.count,{x:p.source.x*k,y:p.source.y*k},{x:p.target.x*k,y:p.target.y*k},(c,x,y,size)=>{const img=artwork['background'+p.icon];if(img)c.drawImage(img,x-size/2,y-size/2,size,size);},4);
 c.restore();
 for(let i=orderPayouts.length-1;i>=0;i--){const p=orderPayouts[i];if((now-p.start)/p.duration>=.615+(p.count-1)*.055+0.05)orderPayouts.splice(i,1);}
}
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
  if(e.completedAt!==null)beginOrderPayout(e,g);
  if(e.completedAt!==null&&!e.rewarded&&now-e.completedAt>=hold)e.rewarded=true;
  const alpha=entrance.alpha*(e.completedAt===null?1:Math.max(0,1-Math.max(0,now-e.completedAt-hold)/(state.fxOrderFade*1000)));e.alpha=alpha;
  const jump=e.completedAt===null?0:orderJumpOffset(now-e.completedAt,state.fxOrderJumpDuration*1000,state.fxOrderJumpHeight)*g.W/1170;
  const w=p.height*img.width/img.height,px=p.x+orderPortraitShift(g);c.save();c.globalAlpha=alpha;c.drawImage(img,px-w/2,p.bottom-p.height+jump+entrance.offset*g.W/1170,w,p.height);c.restore();
 });
 // A separate pass keeps every reward panel above all character portraits.
 orderQueue.entries.forEach(e=>{drawGeneratorReward(c,g,e);drawOrderRewards(c,g,e);});
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
function resetOrderCustomers(){orderScroll=0;orderPayouts.length=0;orderQueue.reset();const input=document.getElementById('order-count-input');if(input){delete input.dataset.dirty;input.value=0;}refreshOrderButtons();}
function hitOrderCustomer(point,g){
 if(!ordersVisible||!window.mergePlayTest?.active)return null;
 const entries=[...orderQueue.entries].filter(e=>!e.entering).reverse(),s=g.W/1170,scale=g.W*.82/1510;
 // Bubbles are in front; hit them before testing the exposed portraits.
 for(const e of entries){const p=orderPose(e,g),w=orderBubbleWidth()*scale,h=449*state.fxBubbleHeight/100*scale,x=p.x-w/2+state.fxBubbleX*s,y=orderBubbleBottom(g)-h;if(point.x>=x&&point.x<=x+w&&point.y>=y&&point.y<=y+h)return e;}
  for(const e of entries){const p=orderPose(e,g),img=orderImages[e.type+e.variant+(e.phase==='complete'?'1':'')];if(!img)continue;const w=p.height*img.width/img.height,px=p.x+orderPortraitShift(g);if(point.x>=px-w/2&&point.x<=px+w/2&&point.y>=p.bottom-p.height&&point.y<g.bar.y)return e;}
 return null;
}
