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
  const fill=c.createLinearGradient(0,0,0,th);fill.addColorStop(0,s.fxInfoTabFill);fill.addColorStop(1,s.fxInfoTabBottom);
  c.fillStyle=fill;c.fill(tab);if(s.fxInfoTabStroke>0){c.strokeStyle=s.fxInfoTabBorder;c.lineWidth=s.fxInfoTabStroke;c.stroke(tab);}
  // All shading stays inside the same silhouette; no per-frame blur surfaces.
  c.save();c.clip(tab);
  // Each light/shadow is ONE connected path with one transform and shared softness.
  const lightEdge=new Path2D();lightEdge.moveTo(0,th-r);lightEdge.lineTo(0,r);lightEdge.quadraticCurveTo(0,0,r,0);lightEdge.lineTo(tw-slant-r,0);lightEdge.quadraticCurveTo(tw-slant,0,tw-slant+r/2,r);
  const shadeEdge=new Path2D();shadeEdge.moveTo(tw-slant+r/2,r);shadeEdge.lineTo(tw-r/2,th-r);shadeEdge.quadraticCurveTo(tw,th,tw-r,th);shadeEdge.lineTo(r,th);shadeEdge.quadraticCurveTo(0,th,0,th-r);
  for(const [key,edge]of [['Shade',shadeEdge],['Light',lightEdge]]){
   const prefix='fxInfoTab'+key,color=s[prefix+'Color'],width=s[prefix+'Width'];
   const primary=s[prefix+'Opacity'],secondary=key==='Light'?s.fxInfoTabLeftLightOpacity:s.fxInfoTabInnerOpacity;
   if(width<=0||Math.max(primary,secondary)<=0)continue;
   const blur=s[prefix+'Blur'];
   c.save();c.translate(s[prefix+'X'],s[prefix+'Y']);
   const rim=c.createLinearGradient(0,0,0,th);
   const tint=opacity=>color+Math.round(opacity*2.55).toString(16).padStart(2,'0');
   rim.addColorStop(0,tint(key==='Light'?primary:0));
   rim.addColorStop(.5,tint(key==='Light'?secondary:primary));
   rim.addColorStop(1,tint(key==='Light'?0:secondary));
   c.strokeStyle=rim;c.lineCap='round';
   // Feather the stroke with bounded passes, also on browsers without Canvas filter.
   const passes=blur>0?8:1,alpha=c.globalAlpha;
   for(let i=passes;i>=1;i--){c.lineWidth=width*2+blur*2*i/passes;c.globalAlpha=alpha*(passes-i+1)/(passes*(passes+1)/2);c.stroke(edge);}
   c.restore();
  }
  c.restore();
  c.textAlign='left';c.textBaseline='middle';c.fillStyle=s.fxInfoTitleColor;
  if(s.fxInfoTitleStroke>0){c.strokeStyle=s.fxInfoTitleBorder;c.lineWidth=s.fxInfoTitleStroke;c.strokeText(title,pad,th/2,Math.max(1,tw-pad*2-iconSpace));}
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
