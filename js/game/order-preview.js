'use strict';
// Independent body dimensions; width never changes the drawing scale.
function orderBubbleWidth(){return 1502*state.fxBubbleWidth/82;}
function orderBubblePath(){
 const w=orderBubbleWidth(),h=449*state.fxBubbleHeight/100;
 const r=Math.min(124*state.fxBubbleRadius/100,h/2,w/2-20);
 const span=Math.min(188*state.fxBubbleTailWidth/100,w-2*r);
 const a=r+(w-2*r-span)*state.fxBubbleTailPosition/100;
 const bend=state.fxBubbleTailBend/100,th=state.fxBubbleTailHeight/100;
 const p=new Path2D();p.moveTo(r,0);p.lineTo(a,0);
 const tail=(x,y)=>[a+x/188*span,y*th];
 if(th>0){
  p.bezierCurveTo(...tail(9,0),...tail(13,-1),...tail(19,-10));
  p.bezierCurveTo(...tail(50,-49*bend),...tail(105,-105),...tail(135,-114));
  p.bezierCurveTo(...tail(153,-120),...tail(163,-112),...tail(161,-90));
  p.bezierCurveTo(...tail(159,-65),...tail(154-8*(bend-1),-32),...tail(160,-15));
  p.bezierCurveTo(...tail(163,-3),...tail(171,0),...tail(188,0));
 }else p.lineTo(a+span,0);
 p.lineTo(w-r,0);p.bezierCurveTo(w-r*.43,0,w,r*.43,w,r);
 p.lineTo(w,h-r);p.bezierCurveTo(w,h-r*.41,w-r*.43,h,w-r,h);
 p.lineTo(r,h);p.bezierCurveTo(r*.4,h,0,h-r*.41,0,h-r);
 p.lineTo(0,r);p.bezierCurveTo(0,r*.43,r*.43,0,r,0);p.closePath();return p;
}
function paintBubbleFill(c,path,h){
 const fill=c.createLinearGradient(0,0,0,h);
 fill.addColorStop(0,state.fxBubbleTop);fill.addColorStop(.5,state.fxBubbleMiddle);fill.addColorStop(1,state.fxBubbleBottom);
 c.fillStyle=fill;c.fill(path);c.save();c.clip(path);
 // Feather in pixels. Canvas filter blur is ignored on some phones and leaves a hard stroke on the clip.
 // full: stroke is centered on the outline, so double it and the clip keeps one full width inside.
 const rim=(x,y,width,color,opacity,blur,full)=>{
  if(width<=0||opacity<=0)return;
  c.save();c.translate(x,y);c.strokeStyle=color;c.lineJoin='round';c.lineCap='round';
  const passes=blur>0?8:1,alpha=opacity/100,cover=full?2:1;
  for(let i=passes;i>=1;i--){c.lineWidth=(width+blur*2*i/passes)*cover;c.globalAlpha=alpha*(passes-i+1)/(passes*(passes+1)/2);c.stroke(path);}
  c.restore();
 };
 rim(3,7,15,'#FFFFFF',state.fxBubbleHighlight,6,false);
 rim(0,0,state.fxBubbleShadeWidth,state.fxBubbleShade,state.fxBubbleShadeOpacity,state.fxBubbleShadeBlur,true);
 c.restore();
}
function paintOrderBubble(c){
 const path=orderBubblePath(),h=449*state.fxBubbleHeight/100;
 c.save();paintBubbleFill(c,path,h);
 if(state.fxBubbleStroke>0){c.lineWidth=state.fxBubbleStroke;c.lineJoin='round';c.strokeStyle=state.fxBubbleBorder;c.stroke(path);}
 c.restore();
}
