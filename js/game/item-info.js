'use strict';
// Presentation only: selection and item definitions remain owned by the game.
function drawItemInfo(c,g,session){
 const s=state,unit=g.W/1170,w=g.W*s.fxInfoWidth/100/unit,h=s.fxInfoHeight;
 const x=g.W*s.fxInfoX/100,y=g.H*(1-s.fxInfoBottom/100)-h*unit;
 const item=session.board.slots[session.selected],definition=session.board.definition(item);
 c.save();c.translate(x,y);c.scale(unit,unit);c.lineJoin='round';
 const paint=(fill,border,stroke)=>{c.fillStyle=fill;c.fill();if(stroke>0){c.lineWidth=stroke;c.strokeStyle=border;c.stroke();}};
 const radius=Math.min(s.fxInfoRadius,w/2,h/2),bow=Math.min(s.fxInfoCurve,Math.max(0,Math.min(w-2*radius,h-2*radius))/8);
 // Horizontal edges stay straight; corners match the gently bowed side tangents.
 const vertical=Math.atan2(2*bow,(h-2*radius)/2),handle=radius*.55228475;
 const hx=handle,hy=0,vx=Math.sin(vertical)*handle,vy=Math.cos(vertical)*handle;
 c.beginPath();c.moveTo(radius,0);
 c.quadraticCurveTo(w/2,0,w-radius,0);c.bezierCurveTo(w-radius+hx,hy,w-vx,radius-vy,w,radius);
 c.quadraticCurveTo(w+2*bow,h/2,w,h-radius);c.bezierCurveTo(w-vx,h-radius+vy,w-radius+hx,h-hy,w-radius,h);
 c.quadraticCurveTo(w/2,h,radius,h);c.bezierCurveTo(radius-hx,h-hy,vx,h-radius+vy,0,h-radius);
 c.quadraticCurveTo(-2*bow,h/2,0,radius);c.bezierCurveTo(vx,radius-vy,radius-hx,hy,radius,0);c.closePath();
 paint(s.fxInfoFill,s.fxInfoBorder,s.fxInfoStroke);
 if(definition){
  const title=`${definition.name}（等级${definition.tier}）`;
  c.font=`bold ${s.fxInfoTitleSize}px "${s.fxInfoTitleFont}", sans-serif`;
  const th=s.fxInfoTabHeight,pad=s.fxInfoTabPadding,iconSpace=s.fxInfoISize*.65;
  const tw=Math.min(w,Math.max(th,(c.measureText(title).width+pad*2+iconSpace)*s.fxInfoTabWidth/100));
  const slant=Math.min(s.fxInfoTabSlant,tw/3),r=Math.min(s.fxInfoTabRadius,th/2,(tw-slant)/4);
  c.save();c.translate(s.fxInfoTabX,s.fxInfoTabY);c.beginPath();
  c.moveTo(r,0);c.lineTo(tw-slant-r,0);c.quadraticCurveTo(tw-slant,0,tw-slant+r/2,r);
  c.lineTo(tw-r/2,th-r);c.quadraticCurveTo(tw,th,tw-r,th);c.lineTo(r,th);
  c.quadraticCurveTo(0,th,0,th-r);c.lineTo(0,r);c.quadraticCurveTo(0,0,r,0);c.closePath();
  const fill=c.createLinearGradient(0,0,0,th);fill.addColorStop(0,s.fxInfoTabFill);fill.addColorStop(1,s.fxInfoTabBottom);
  paint(fill,s.fxInfoTabBorder,s.fxInfoTabStroke);
  // All shading stays inside the same silhouette; no per-frame blur surfaces.
  c.save();c.clip();
  if(s.fxInfoTabInnerHeight>0&&s.fxInfoTabInnerOpacity>0){
   const depth=Math.min(th,s.fxInfoTabInnerHeight),shade=c.createLinearGradient(0,th-depth,0,th);
   shade.addColorStop(0,s.fxInfoTabInnerColor+'00');shade.addColorStop(1,s.fxInfoTabInnerColor);
   c.save();c.globalAlpha*=s.fxInfoTabInnerOpacity/100;c.fillStyle=shade;c.fillRect(0,th-depth,tw,depth);c.restore();
  }
  for(const [color,opacity,width,light]of [[s.fxInfoTabShadeColor,s.fxInfoTabShadeOpacity,s.fxInfoTabShadeWidth,false],[s.fxInfoTabLightColor,s.fxInfoTabLightOpacity,s.fxInfoTabLightWidth,true]]){
   if(width<=0||opacity<=0)continue;
   const rim=c.createLinearGradient(0,0,tw,th);
   rim.addColorStop(0,color+(light?'FF':'00'));rim.addColorStop(1,color+(light?'00':'FF'));
   c.save();c.globalAlpha*=opacity/100;c.strokeStyle=rim;c.lineWidth=width*2;c.stroke();c.restore();
  }
  c.restore();
  c.textAlign='left';c.textBaseline='middle';c.fillStyle=s.fxInfoTitleColor;
  c.fillText(title,pad,th/2,Math.max(1,tw-pad*2-iconSpace));
  c.font=`italic bold ${s.fxInfoISize}px "${s.fxInfoIFont}", sans-serif`;c.textAlign='center';
  const ix=tw-iconSpace/2-pad/2+s.fxInfoIX,iy=th/2+s.fxInfoIY;
  if(s.fxInfoIStroke>0){c.strokeStyle=s.fxInfoIBorder;c.lineWidth=s.fxInfoIStroke;c.strokeText('i',ix,iy);}
  c.fillStyle=s.fxInfoIColor;c.fillText('i',ix,iy);c.restore();
  c.font=`bold ${s.fxInfoBodySize}px "${s.fxInfoBodyFont}", sans-serif`;c.textAlign='left';c.textBaseline='middle';c.fillStyle=s.fxInfoBodyColor;
  c.fillText(definition.description||'合成相同的物品进行升级。',s.fxInfoTextX,s.fxInfoTextY,Math.max(1,w-s.fxInfoTextX-20));
 }
 c.restore();
}
