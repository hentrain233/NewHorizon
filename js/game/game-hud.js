'use strict';
// Main-game buttons are independent of the renovation scene and map artwork.
function createGameHUD(runtime){
 const style=(el,key,value)=>{if(el.style[key]!==value)el.style[key]=value;};
 const wrap=document.getElementById('canvas-wrap');wrap.style.position='relative';
 const overlay=document.createElement('div');overlay.style.cssText='position:absolute;pointer-events:none;z-index:3';wrap.appendChild(overlay);

 function placeOverlay(){overlay.style.left=canvas.offsetLeft+'px';overlay.style.top=canvas.offsetTop+'px';overlay.style.width=canvas.clientWidth+'px';overlay.style.height=canvas.clientHeight+'px';}
 new ResizeObserver(placeOverlay).observe(wrap);new ResizeObserver(placeOverlay).observe(canvas);placeOverlay();
 const nav=document.createElement('button');nav.id='renovation-nav';nav.setAttribute('aria-label','翻新餐厅');nav.className='renovation-nav';overlay.appendChild(nav);
 nav.innerHTML='<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 3 C82 3 94 12 97 46 C99 80 89 94 55 97 C20 99 6 90 3 56 C0 21 12 4 50 3Z" fill="#FFEBD2" stroke="#A18166" stroke-width="2"/></svg><img src="assets/map-icon.png" alt="">';
 const inventory=document.createElement('button');inventory.type='button';inventory.id='inventory-nav';inventory.className='renovation-nav inventory-nav';inventory.setAttribute('aria-label','仓库');
 inventory.innerHTML=nav.innerHTML;inventory.querySelector('img').src='assets/inventory-icon.png';overlay.appendChild(inventory);
 const recycle=document.createElement('button');recycle.type='button';recycle.id='recycle-item';recycle.className='renovation-nav recycle-nav';recycle.setAttribute('aria-label','回收物品');recycle.hidden=true;
 recycle.innerHTML='<img src="assets/info-ui/infoUI_recycle2.png" alt="">';overlay.appendChild(recycle);
 recycle.onclick=()=>window.mergePlayTest.recycleSelected();
 for(const button of [nav,inventory,recycle])button.addEventListener('pointerdown',()=>{if(!button.disabled)button.animate([{transform:'scale(1)'},{transform:'scale(1.12,.82)',offset:.35},{transform:'scale(.97,1.05)',offset:.75},{transform:'scale(1)'}],{duration:170,easing:'ease-out'});});
 // Some mobile browsers suppress the compatibility click immediately after a drag.
 // Handle a stationary touch release too, without navigating twice on normal browsers.
 let navTouch=null,lastNavTouch=-Infinity;
 nav.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&e.isPrimary)navTouch={id:e.pointerId,x:e.clientX,y:e.clientY};});
 nav.addEventListener('pointercancel',()=>{navTouch=null;});
 nav.addEventListener('pointerup',e=>{const touch=navTouch;navTouch=null;if(!touch||touch.id!==e.pointerId||nav.disabled||Math.hypot(e.clientX-touch.x,e.clientY-touch.y)>10)return;lastNavTouch=performance.now();void hud.navigate?.();});
 nav.onclick=e=>{if(e.detail===0||performance.now()-lastNavTouch>700)void hud.navigate?.();};
 function placeInfoButton(el,box){
  style(el,'left',box[0]/1320*100+'%');style(el,'top',box[1]/2868*100+'%');style(el,'width',box[2]/1320*100+'%');style(el,'height',box[3]/2868*100+'%');
  style(el,'right','auto');style(el,'bottom','auto');style(el,'aspectRatio','auto');style(el,'opacity','1');
 }
 function draw(g){
  const active=!!window.renovationScreen?.active;
  window.welcomeBundle?.placeEntry();
  recycle.hidden=active||!window.mergePlayTest.active||runtime.recyclePrice(window.mergePlayTest.selectedItem)===0;
  if(!recycle.hidden){
   placeInfoButton(recycle,infoLayout().recycle);recycle.disabled=!window.mergePlayTest.canRecycle;
   const src='assets/info-ui/'+(state.fxInfoRecycleArt==='solid'?'infoUI_recycle.png':'infoUI_recycle2.png');
   if(recycle.querySelector('img').getAttribute('src')!==src)recycle.querySelector('img').src=src;
   const label='回收物品，获得 '+runtime.recyclePrice(window.mergePlayTest.selectedItem)+' 金币';
   if(recycle.getAttribute('aria-label')!==label)recycle.setAttribute('aria-label',label);
  }
  nav.classList.toggle('info-art',!active);inventory.classList.add('info-art');
  const navImage=active?'assets/stall-icon.png':'assets/info-ui/infoUI_ButtonRight.png';
  if(nav.querySelector('img').getAttribute('src')!==navImage)nav.querySelector('img').src=navImage;
  if(inventory.querySelector('img').getAttribute('src')!=='assets/info-ui/infoUI_ButtonLeft.png')inventory.querySelector('img').src='assets/info-ui/infoUI_ButtonLeft.png';
  const bottom=(g?.navBottom??state.fxNavBottom)+'%';
  if(active){if(nav.style.bottom!==bottom)nav.style.bottom=bottom;for(const key of ['top','left','width','height','right','aspectRatio','opacity'])style(nav,key,'');inventory.hidden=true;style(inventory,'bottom',bottom);style(inventory,'opacity','');}
  else{placeInfoButton(nav,infoLayout().right);placeInfoButton(inventory,infoLayout().left);inventory.hidden=false;}
  // Keep the test-only restart control away from both the new icon and the bottom board row.
  const restart=document.querySelector('.player-restart');if(restart){style(restart,'bottom',active?'':'auto');style(restart,'top',active?'':'max(8px, env(safe-area-inset-top))');}
  const stallScale=String((state.fxNavStallScale??100)/100);if(nav.style.getPropertyValue('--stall-icon-scale')!==stallScale)nav.style.setProperty('--stall-icon-scale',stallScale);
 }
 const hud={overlay,nav,draw,navigate:null};
 return hud;
}
