'use strict';
// Coins and energy belong to GameRuntime. Premium currency remains a placeholder.
const CURRENCY_PREVIEW=[{icon:'energy',value:'194'},{icon:'coin',value:'320'},{icon:null,value:'—'}];
function drawCurrencyText(c,text,x,y,spacing){
 if(!spacing){c.save();c.textAlign='right';c.fillText(text,x,y);c.restore();return;}
 const chars=Array.from(text),widths=chars.map(ch=>c.measureText(ch).width);
 let cursor=x-(widths.reduce((a,b)=>a+b,0)+spacing*(chars.length-1));
 c.save();c.textAlign='left';
 chars.forEach((ch,i)=>{c.fillText(ch,cursor,y);cursor+=widths[i]+spacing;});c.restore();
}
function drawCurrencyUI(c,g){
 const s=g.W/1170;
 c.save();c.scale(s,s);
 const y=state.fxCurrencyY,h=state.fxCurrencyHeight,gap=state.fxCurrencyGap,left=state.fxCurrencyX,slot=state.fxCurrencyWidth+37;
 const radius=Math.min(state.fxCurrencyRadius,h/2,state.fxCurrencyWidth/2);
 CURRENCY_PREVIEW.forEach((entry,i)=>{
  const x=left+i*(slot+gap),pillX=x+37,pillW=state.fxCurrencyWidth;
  c.save();c.shadowColor=rgba(state.fxCurrencyShadowColor,state.fxCurrencyShadowOpacity/100);c.shadowBlur=state.fxCurrencyShadowBlur*s;c.shadowOffsetX=state.fxCurrencyShadowX*s;c.shadowOffsetY=state.fxCurrencyShadowY*s;
  const fill=c.createLinearGradient(0,y,0,y+h);
  fill.addColorStop(0,'#FFFAF1');fill.addColorStop(.5,'#FFF3E0');fill.addColorStop(1,'#F5E4CC');
  rounded(c,pillX,y,pillW,h,radius);c.fillStyle=fill;c.fill();c.restore();
  c.save();rounded(c,pillX,y,pillW,h,radius);c.clip();
  const bevel=c.createLinearGradient(0,y,0,y+h);bevel.addColorStop(0,'rgba(255,255,255,.45)');bevel.addColorStop(.14,'rgba(255,255,255,0)');bevel.addColorStop(.88,'rgba(153,96,51,0)');bevel.addColorStop(1,'rgba(153,96,51,.10)');
  c.fillStyle=bevel;c.fillRect(pillX,y,pillW,h);c.restore();
  rounded(c,pillX,y,pillW,h,radius);c.lineWidth=1.5;c.strokeStyle='#BFA98F';c.stroke();
  c.font=currencyFont();c.textAlign='right';c.textBaseline='middle';
  // Anchor to the capsule's right edge, independent of digit count and spacing.
  const value=entry.icon==='coin'&&window.mergePlayTest?.active?String(window.renovationScreen?.displayCoins()??gameRuntime.state.currencies.coins):entry.icon==='energy'&&window.mergePlayTest?.active?String(gameRuntime.state.currencies.energy):entry.value;
  c.fillStyle=state.fxCurrencyTextColor;drawCurrencyText(c,value,pillX+pillW-36+state.fxCurrencyTextX,y+h*.54+state.fxCurrencyTextY,state.fxCurrencyLetterSpacing);
  const icon=entry.icon&&artwork['background'+entry.icon];
  if(entry.icon==='energy'&&window.mergePlayTest?.active){const seconds=gameRuntime.energySeconds();if(seconds){c.save();c.font='bold 24px sans-serif';c.textAlign='center';c.fillStyle='#31585B';c.fillText(Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'),pillX+pillW/2,y+h+20);c.restore();}}
  if(icon){
   const size=entry.icon==='energy'?145:137,ratio=icon.width/icon.height;
   const ih=size*state.fxCurrencyIconScale/100,iw=ih*ratio;
   const prefix=entry.icon==='energy'?'fxCurrencyEnergy':'fxCurrencyCoin';
   c.drawImage(icon,x+49-iw/2+state[prefix+'X'],y+h/2-ih/2+state[prefix+'Y'],iw,ih);
  }
 });
 c.restore();
}
