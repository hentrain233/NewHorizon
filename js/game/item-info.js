'use strict';
// Presentation only: selection and item definitions remain owned by the game.
function drawItemInfo(c,g,session){
 const s=state,unit=g.W/1170,w=g.W*s.fxInfoWidth/100/unit,h=s.fxInfoHeight;
 const x=g.W*s.fxInfoX/100,y=g.H*(1-s.fxInfoBottom/100)-h*unit;
 const item=session.board.slots[session.selected],definition=session.board.definition(item);
 c.save();c.translate(x,y);c.scale(unit,unit);c.lineJoin='round';
 const radius=Math.min(s.fxInfoRadius,w/2,h/2),bow=Math.min(s.fxInfoCurve,Math.max(0,Math.min(w-2*radius,h-2*radius))/8);
 // Horizontal edges stay straight; corners match the gently bowed side tangents.
 const vertical=Math.atan2(2*bow,(h-2*radius)/2),handle=radius*.55228475;
 const hx=handle,hy=0,vx=Math.sin(vertical)*handle,vy=Math.cos(vertical)*handle;
 c.beginPath();c.moveTo(radius,0);
 c.quadraticCurveTo(w/2,0,w-radius,0);c.bezierCurveTo(w-radius+hx,hy,w-vx,radius-vy,w,radius);
 c.quadraticCurveTo(w+2*bow,h/2,w,h-radius);c.bezierCurveTo(w-vx,h-radius+vy,w-radius+hx,h-hy,w-radius,h);
 c.quadraticCurveTo(w/2,h,radius,h);c.bezierCurveTo(radius-hx,h-hy,vx,h-radius+vy,0,h-radius);
 c.quadraticCurveTo(-2*bow,h/2,0,radius);c.bezierCurveTo(vx,radius-vy,radius-hx,hy,radius,0);c.closePath();
 // Match the navigation frame's subtle external shadow, isolated from tab/text.
 c.save();c.shadowColor='#334d5260';c.shadowOffsetX=0;c.shadowOffsetY=6*unit;c.shadowBlur=3*unit;
 c.fillStyle=s.fxInfoFill;c.fill();c.restore();
 if(s.fxInfoStroke>0){c.lineWidth=s.fxInfoStroke;c.strokeStyle=s.fxInfoBorder;c.stroke();}
 if(definition){
  const title=`${definition.name}（等级${definition.tier}）`;
  c.font=`bold ${s.fxInfoTitleSize}px "${s.fxInfoTitleFont}", sans-serif`;
  const th=s.fxInfoTabHeight,pad=s.fxInfoTabPadding,iconSpace=s.fxInfoISize*.65;
  const tw=Math.min(w,Math.max(th,(c.measureText(title).width+pad*2+iconSpace)*s.fxInfoTabWidth/100));
  const slant=Math.min(s.fxInfoTabSlant,tw/3),r=Math.min(s.fxInfoTabRadius,th/2,(tw-slant)/4);
  c.save();c.translate(s.fxInfoTabX,s.fxInfoTabY);const tab=new Path2D();
  tab.moveTo(r,0);tab.lineTo(tw-slant-r,0);tab.quadraticCurveTo(tw-slant,0,tw-slant+r/2,r);
  tab.lineTo(tw-r/2,th-r);tab.quadraticCurveTo(tw,th,tw-r,th);tab.lineTo(r,th);
  tab.quadraticCurveTo(0,th,0,th-r);tab.lineTo(0,r);tab.quadraticCurveTo(0,0,r,0);tab.closePath();
  paintInfoTab(c,tab,th,s);
  if(s.fxInfoTabStroke>0){c.strokeStyle=s.fxInfoTabBorder;c.lineWidth=s.fxInfoTabStroke;c.stroke(tab);}
  c.textAlign='left';c.textBaseline='middle';c.fillStyle=s.fxInfoTitleColor;
  if(s.fxInfoTitleStroke>0){c.strokeStyle=s.fxInfoTitleBorder;c.lineWidth=s.fxInfoTitleStroke;c.strokeText(title,pad,th/2,Math.max(1,tw-pad*2-iconSpace));}
  c.fillText(title,pad,th/2,Math.max(1,tw-pad*2-iconSpace));
  const ix=tw-iconSpace/2-pad/2+s.fxInfoIX,iy=th/2+s.fxInfoIY;
  drawInfoI(c,ix,iy,s.fxInfoISize,s.fxInfoIStroke,s.fxInfoIBorder,s.fxInfoIColor);c.restore();
  c.font=`bold ${s.fxInfoBodySize}px "${s.fxInfoBodyFont}", sans-serif`;c.textAlign='left';c.textBaseline='middle';c.fillStyle=s.fxInfoBodyColor;
  c.fillText(definition.description||'合成相同的物品进行升级。',s.fxInfoTextX,s.fxInfoTextY,Math.max(1,w-s.fxInfoTextX-20));
 }
 c.restore();
}
function paintInfoTab(c,path,h,s){
 const fill=c.createLinearGradient(0,0,0,h);
 fill.addColorStop(0,s.fxInfoTabFill);fill.addColorStop(.5,s.fxInfoTabMiddle);fill.addColorStop(1,s.fxInfoTabBottom);
 c.fillStyle=fill;c.fill(path);c.save();c.clip(path);
 const rim=(x,y,width,color,opacity,blur)=>{
  if(width<=0||opacity<=0)return;
  c.save();c.translate(x,y);c.strokeStyle=color;c.lineJoin='round';
  const passes=blur>0?8:1,alpha=opacity/100;
  for(let i=passes;i>=1;i--){c.lineWidth=width+blur*2*i/passes;c.globalAlpha=alpha*(passes-i+1)/(passes*(passes+1)/2);c.stroke(path);}
  c.restore();
 };
 rim(s.fxInfoTabShadeX,s.fxInfoTabShadeY,s.fxInfoTabShadeWidth,s.fxInfoTabShadeColor,s.fxInfoTabShadeOpacity,s.fxInfoTabShadeBlur);
 rim(s.fxInfoTabShadeX,s.fxInfoTabShadeY,s.fxInfoTabShadeWidth,s.fxInfoTabShadeColor,s.fxInfoTabInnerOpacity,s.fxInfoTabShadeBlur);
 rim(s.fxInfoTabLightX,s.fxInfoTabLightY,s.fxInfoTabLightWidth,s.fxInfoTabLightColor,s.fxInfoTabLightOpacity,s.fxInfoTabLightBlur);
 rim(s.fxInfoTabLightX,s.fxInfoTabLightY,s.fxInfoTabLightWidth,s.fxInfoTabLightColor,s.fxInfoTabLeftLightOpacity,s.fxInfoTabLightBlur);
 c.restore();
}
// Fredoka bold "i": stem bottom, corner radius and the gap under the dot are adjustable.
function drawInfoI(c,x,y,size,stroke,border,fill){
 const k=size/1000,stemTop=498,left=35,width=181,bottom=Math.min(stemTop-1,-9+state.fxInfoIShorten/k),dotBottom=stemTop+state.fxInfoIGap/k;
 const X=g=>(g-125.5)*k,Y=g=>-(g-500)*k,w=width*k;
 c.save();c.translate(x,y);c.transform(1,0,-.21,1,0,0);c.beginPath();
 const box=(gx,gy,gh)=>{const r=Math.max(0,Math.min(state.fxInfoIRadius,w/2,gh*k/2)),x0=X(gx),y0=Y(gy+gh),h=gh*k;c.moveTo(x0+r,y0);c.arcTo(x0+w,y0,x0+w,y0+h,r);c.arcTo(x0+w,y0+h,x0,y0+h,r);c.arcTo(x0,y0+h,x0,y0,r);c.arcTo(x0,y0,x0+w,y0,r);c.closePath();};
 box(left,bottom,stemTop-bottom);box(left,dotBottom,width);
 c.fillStyle=fill;if(stroke>0){c.strokeStyle=border;c.lineWidth=stroke;c.lineJoin='round';c.stroke();}c.fill();
 c.restore();
}
