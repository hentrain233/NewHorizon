'use strict';
// The existing flight and trail math, shared without depending on the renovation scene.
const RewardMotion={
 flight(t,index,source,target,count=8){
  const q=t*t*(3-2*t),dx=target.x-source.x,dy=target.y-source.y,length=Math.hypot(dx,dy)||1,mid=(count-1)/2;
  const spread=(index-mid)/Math.max(mid,.001)*Math.min(290,length*.27)*Math.sin(Math.PI*q);
  return {x:source.x+dx*q+dy/length*spread,y:source.y+dy*q-dx/length*spread};
 },
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
 }
};
if(typeof module!=='undefined')module.exports=RewardMotion;
