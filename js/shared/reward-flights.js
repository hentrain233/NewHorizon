'use strict';
// Shared by orders, recycling and bundles. Legacy function names remain stable for callers.
const orderPayouts=[];
function currencyBarPoint(g,icon){
 const s=g.W/1170,i={energy:0,coin:1,premium:2}[icon],slot=state.fxCurrencyWidth+37,n=icon==='coin'?'Coin':icon==='energy'?'Energy':'Premium';
 return {x:(state.fxCurrencyX+i*(slot+state.fxCurrencyGap)+49+state['fxCurrency'+n+'X'])*s,y:(state.fxCurrencyY+state.fxCurrencyHeight/2+state['fxCurrency'+n+'Y'])*s};
}
function orderPayoutBalance(icon,actual){
 const now=performance.now();let hidden=0;
 for(const p of orderPayouts){if(p.icon!==icon)continue;let arrived=0;const flight=Math.max(1,state.fxRewardFlightDuration),gap=Math.max(0,state.fxRewardCoinGap);
  for(let i=0;i<p.count;i++)if(now-p.start-i*gap>=flight)arrived++;hidden+=p.amount-Math.round(p.amount*arrived/p.count);}
 return Math.max(0,actual-hidden);
}
function drawOrderPayouts(c,g){
 if(!orderPayouts.length)return;
 const now=performance.now(),W=6344,k=W/g.W,scale=state.fxRewardFlightScale;
 c.save();c.scale(g.W/W,g.W/W);
 for(const p of orderPayouts){const popFrom=(p.icon==='coin'?state.fxRewardCoinSize:state.fxRewardIconSize)*(p.icon==='energy'?.92:1)*(6344)/1170;RewardMotion.paintFlights(c,now,p.start,p.duration,p.count,{x:p.source.x*k,y:p.source.y*k},{x:p.target.x*k,y:p.target.y*k},(c,x,y,size)=>{const img=artwork['background'+p.icon];if(img)c.drawImage(img,x-size/2,y-size/2,size,size);},scale,popFrom);}
 c.restore();
 for(let i=orderPayouts.length-1;i>=0;i--){const p=orderPayouts[i],flight=Math.max(1,state.fxRewardFlightDuration),gap=Math.max(0,state.fxRewardCoinGap);if(now-p.start>=flight+(p.count-1)*gap+40)orderPayouts.splice(i,1);}
}
