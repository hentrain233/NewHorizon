'use strict';
// Presentation only: random cloud targets are transient, never saved as gameplay.
const RenovationMotion={
 pressDuration:170,
 timing(fill=920,reveal=90){const sweepStart=fill+1100,revealStart=sweepStart+800*reveal/100;return {fill,sweepStart,revealStart,duration:Math.max(sweepStart+800,revealStart+900)};},
 fill(t){t=Math.max(0,Math.min(1,t));return 1-(1-t)**2;},
 bubble(now,age=null){
  if(age===null)return {sx:1,sy:1,dy:Math.sin(now/850)*9};
  const t=Math.max(0,Math.min(1,age/170)),s=Math.sin(t*Math.PI*3)*(1-t);
  return {sx:1+s*.16,sy:1-s*.20,dy:0};
 },
 flight(t,index,source,target,count=8){
  const q=t*t*(3-2*t),dx=target.x-source.x,dy=target.y-source.y,length=Math.hypot(dx,dy)||1,mid=(count-1)/2;
  const spread=(index-mid)/Math.max(mid,.001)*Math.min(290,length*.27)*Math.sin(Math.PI*q);
  return {x:source.x+dx*q+dy/length*spread,y:source.y+dy*q-dx/length*spread};
 },
 // Order coin and energy icons. k is 0 at the reward-icon size and 1 at the flying size; peak is from * peakScale.
 orderPopSize(k,from,flightSize,peakScale){
  const peak=from*peakScale,s=n=>n*n*(3-2*n);
  if(k<=0)return from;if(k>=1)return flightSize;
  return k<.42?from+(peak-from)*s(k/.42):peak+(flightSize-peak)*s((k-.42)/.58);
 },
 paintFlights(c,now,start,duration,count,source,target,drawIcon,scale=1,popFrom=0){
  for(let i=0;i<count;i++){
   let u,size;
   if(popFrom>0){
    const flight=Math.max(1,state.fxRewardFlightDuration),gap=Math.max(0,state.fxRewardCoinGap),pop=Math.min(Math.max(0,state.fxRewardPopDuration),flight),age=now-start-i*gap;
    if(age<0||age>flight)continue;u=age/flight;const flightSize=60*scale;
    size=pop>0&&age<pop?this.orderPopSize(age/pop,popFrom,flightSize,state.fxRewardPopScale):flightSize*(1-.25*(pop>=flight?1:(age-pop)/Math.max(1,flight-pop)));
   }else{u=((now-start)/duration-i*.055)/.615;if(u<0||u>1)continue;size=60*(1-.25*u)*scale;}
   const p=this.flight(u,i,source,target,count),step=.144*state.fxRepairTrailLength/100/24;c.save();c.lineCap='round';
   for(let j=0;j<24;j++){const a=this.flight(Math.max(0,u-(24-j)*step),i,source,target,count),z=this.flight(Math.max(0,u-(23-j)*step),i,source,target,count);c.globalAlpha=((j+1)/24)**1.5*.5*Math.min(1,popFrom>0?1:u*8,(1-u)*12);c.strokeStyle=state.fxRepairTrailColor;c.lineWidth=(.3+18*(j/23)**1.5)*scale;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(z.x,z.y);c.stroke();}
   c.globalAlpha=Math.min(1,popFrom>0?1:u*8,(1-u)*12);drawIcon(c,p.x,p.y,size);c.restore();
  }
 },
 createCloudMotion(random=Math.random){
  const clouds=new Map(),range=(a,b)=>a+(b-a)*random();
  function channel(now,min,max){return {from:range(min,max),to:range(min,max),start:now,duration:range(3500,7000),min,max};}
  function sample(ch,now){
   if(now>=ch.start+ch.duration){ch.from=ch.to;ch.to=range(ch.min,ch.max);ch.start=now;ch.duration=range(3500,7000);}
   const t=Math.max(0,Math.min(1,(now-ch.start)/ch.duration)),q=t*t*t*(t*(t*6-15)+10);
   return ch.from+(ch.to-ch.from)*q;
  }
  return (now,index)=>{if(!clouds.has(index))clouds.set(index,{x:channel(now,-65,65),size:channel(now,.984,1.016)});const c=clouds.get(index);return {dx:sample(c.x,now),scale:sample(c.size,now)};};
 },
 reveal(age,timing=this.timing()){
  const clamp=n=>Math.max(0,Math.min(1,n));
  if(age<170)return {phase:'press',progress:0,alpha:0};
  if(age<timing.sweepStart)return {phase:'dust',progress:0,alpha:0};
  return {phase:age<timing.sweepStart+800?'sweep':'sparkles',progress:clamp((age-timing.sweepStart)/800),alpha:age<timing.sweepStart+800?1:0};
 }
};
if(typeof module!=='undefined')module.exports=RenovationMotion;
