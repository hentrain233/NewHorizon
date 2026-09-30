'use strict';
// PSD 物品信息栏.psd layer boxes, in the 1320×2868 sheet. Selection still owns the text.
function infoLayout(){
 const layout={w:1320,h:2868,bar:[251,2606,818,224],shortHit:[451,2573,418,76],short:[446,2569,428,87],longHit:[409,2573,502,76],long:[404,2569,512,87],left:[31,2608,214,219],right:[1076,2608,214,219],body:[431,2696,456,38],title:40,bodySize:40.005,bodyColor:'#9C7B60'};
 // Move the whole footer together, including both title hit boxes and DOM buttons.
 for(const key of ['bar','shortHit','short','longHit','long','left','right','body'])layout[key][1]+=18;
 return layout;
}
function infoBox(g,box){const L=infoLayout();return {x:box[0]/L.w*g.W,y:box[1]/L.h*g.H,width:box[2]/L.w*g.W,height:box[3]/L.h*g.H};}
const infoArt={};
function blitInfo(c,g,name,box){if(typeof Image==='undefined')return;let img=infoArt[name];if(!img){img=infoArt[name]=new Image();img.onload=()=>{if(typeof drawCanvas==='function')drawCanvas();};img.src='assets/info-ui/'+name;}if(!img.complete||!img.naturalWidth)return;const d=infoBox(g,box);c.drawImage(img,d.x,d.y,d.width,d.height);}
function drawItemInfo(c,g,session){
 session.infoHit=null;
 const L=infoLayout(),item=session.board.slots[session.selected],definition=session.board.definition(item);
 c.save();
 blitInfo(c,g,'infoUI_info.png',L.bar);
 if(definition){
  const title=definition.name+'(Lv.'+definition.tier+')',sy=g.H/L.h,short=infoBox(g,L.shortHit);
  c.font=`400 ${L.title*sy}px "FZCuYuan", "PingFang SC", "Microsoft YaHei", sans-serif`;
  c.textAlign='center';c.textBaseline='middle';
  // ponytail: one cutoff. Add a width when a third tab asset exists.
  const wide=c.measureText(title).width>short.width*.72,tab=wide?infoBox(g,L.longHit):short;
  session.infoHit={x:tab.x,y:tab.y,width:tab.width,height:tab.height};
  c.save();const tx=tab.x+tab.width/2,ty=tab.y+tab.height/2;
  if(session.infoPressed){c.translate(tx,ty);c.scale(.96,.94);c.translate(-tx,-ty);}
  blitInfo(c,g,wide?'infoUI2.png':'infoUI.png',wide?L.long:L.short);
  // PSD: outside stroke 2px; normal #19709F shadow, distance 4px, size 1px.
  c.strokeStyle='#19709F';c.lineJoin='round';c.lineWidth=4*sy;
  c.shadowColor='#19709F';c.shadowOffsetY=4*sy;c.shadowBlur=sy;
  c.strokeText(title,tx,ty,tab.width*.86);
  c.shadowColor='transparent';c.shadowOffsetY=0;c.shadowBlur=0;
  c.fillStyle='#FFFFFF';c.fillText(title,tx,ty,tab.width*.86);c.restore();
  const body=infoBox(g,L.body);
  c.font=`400 ${L.bodySize*sy}px "FZCuYuan", "PingFang SC", "Microsoft YaHei", sans-serif`;c.fillStyle=L.bodyColor;
  c.fillText(definition.description||'合成相同的物品进行升级。',body.x+body.width/2,body.y+body.height/2,body.width);
 }
 c.restore();
}
// Cloud popup titles only; the bottom info tab always uses one expanding line.
function itemTitleLayout(name){
 const chars=[...name];
 if(chars.length<=5)return {lines:[name]};
 const tail=chars.length>=8?5:4;
 return {lines:[chars.slice(0,-tail).join(''),chars.slice(-tail).join('')]};
}
function drawCloudTitle(c,name){
 // 悬浮UI2「贝壳风铃」：方正粗圆简体 64，字心 (661, 490.5)。双行用悬浮UI的 56，行心距 80。
 // 描边外部 4。投影：正常、#19709F、100%、角度 90、距离 4、扩展 100%、大小 3。
 const laid=itemTitleLayout(name),two=laid.lines.length>1,size=two?56:64,x=661,ink='#19709F';
 const ys=two?[441.7,521.7]:[490.5];
 c.save();c.font=`400 ${size}px "FZCuYuan", "PingFang SC", "Microsoft YaHei", sans-serif`;c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.miterLimit=2;
 laid.lines.forEach((line,i)=>{
  const y=ys[i];
  c.strokeStyle=ink;c.fillStyle=ink;c.lineWidth=6;c.strokeText(line,x,y+4);c.fillText(line,x,y+4);
  c.lineWidth=8;c.strokeText(line,x,y);c.fillStyle='#FFFFFF';c.fillText(line,x,y);
 });
 c.restore();
}
