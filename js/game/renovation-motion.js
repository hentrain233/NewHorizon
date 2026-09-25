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
 paintFlights(c,now,start,duration,count,source,target,drawIcon,scale=1){
  for(let i=0;i<count;i++){const t=((now-start)/duration-i*.055)/.615;if(t<0||t>1)continue;const p=this.flight(t,i,source,target,count),step=.144*state.fxRepairTrailLength/100/24;c.save();c.lineCap='round';for(let j=0;j<24;j++){const a=this.flight(Math.max(0,t-(24-j)*step),i,source,target,count),z=this.flight(Math.max(0,t-(23-j)*step),i,source,target,count);c.globalAlpha=((j+1)/24)**1.5*.5*Math.min(1,t*8,(1-t)*12);c.strokeStyle=state.fxRepairTrailColor;c.lineWidth=(.3+18*(j/23)**1.5)*scale;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(z.x,z.y);c.stroke();}c.globalAlpha=Math.min(1,t*8,(1-t)*12);drawIcon(c,p.x,p.y,60*(1-.25*t)*scale);c.restore();}
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
