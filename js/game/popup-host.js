'use strict';
// Shared modal shell. Panels supply artwork, layout, labels and interactions only.
function createPopupHost(session,runtime,scenePause){
 const dialog=document.createElement('dialog');dialog.id='item-details';
 const stage=document.createElement('div');stage.className='item-details-stage';
 const surface=document.createElement('canvas');surface.setAttribute('aria-hidden','true');
 stage.appendChild(surface);dialog.appendChild(stage);document.body.appendChild(dialog);
 const c=surface.getContext('2d'),snapshot=document.createElement('canvas');
 let panel=null,loading=false,openedAt=0,enteredAt=0,focusBefore=null,backdropFit='',frozenSize='',energyFrame='';
 function place(){
  if(!dialog.open)return;
  const sheet=panel.layout,r=canvas.getBoundingClientRect(),view=document.getElementById('viewport').getBoundingClientRect();
  const mobile=document.body.classList.contains('mobile-play'),frame=window.playFrame;
  const area=mobile?(frame||{left:0,top:0,width:innerWidth,height:innerHeight}):r,v=window.visualViewport,bounds=mobile?area:view;
  const left=Math.max(area.left,bounds.left,v?.offsetLeft||0),top=Math.max(area.top,bounds.top,v?.offsetTop||0);
  const right=Math.min(area.left+area.width,bounds.left+bounds.width,(v?.offsetLeft||0)+(v?.width||innerWidth));
  const bottom=Math.min(area.top+area.height,bounds.top+bounds.height,(v?.offsetTop||0)+(v?.height||innerHeight));
  const width=Math.max(1,right-left),height=Math.max(1,bottom-top);
  Object.assign(dialog.style,{left:left+'px',top:top+'px',width:width+'px',height:height+'px'});
  const fitLeft=Math.max(left,view.left),fitTop=Math.max(top,view.top),fitRight=Math.min(right,view.right),fitBottom=Math.min(bottom,view.bottom);
  const fitWidth=Math.max(1,fitRight-fitLeft),fitHeight=Math.max(1,fitBottom-fitTop);
  const refW=!mobile||frame?r.width:390,refTop=!mobile||frame?r.height*sheet.top/sheet.screen:844*sheet.top/sheet.screen;
  const scale=Math.min(refW/sheet.width,fitWidth/sheet.width,Math.max(1,fitHeight-16)/sheet.height);
  stage.style.width=sheet.width*scale+'px';stage.style.height=sheet.height*scale+'px';
  stage.style.left=(Math.max(fitLeft,Math.min(fitRight-sheet.width*scale,r.left+r.width/2-sheet.width*scale/2))-left)+'px';
  stage.style.top=(Math.max(fitTop+8,Math.min(fitBottom-8-sheet.height*scale,r.top+refTop+(panel.offsetY||0)*refW/1170))-top)+'px';
 }
 function button(label,box,action){
  const sheet=panel.layout,b=document.createElement('button');b.type='button';b.setAttribute('aria-label',label);
  Object.assign(b.style,{left:box.x/sheet.width*100+'%',top:(box.y-sheet.top)/sheet.height*100+'%',width:box.width/sheet.width*100+'%',height:box.height/sheet.height*100+'%'});
  b.onclick=action;stage.appendChild(b);return b;
 }
 function layer(delay,rise,paint){
  const t=Math.max(0,Math.min(1,(performance.now()-enteredAt-delay)/200)),a=1-(1-t)**3;
  c.save();c.globalAlpha=a;c.translate(0,(1-a)*rise);paint();c.restore();
 }
 function draw(){
  if(!dialog.open||!panel)return;
  c.clearRect(0,0,surface.width,surface.height);c.save();c.translate(0,-panel.layout.top);
  panel.draw(c,performance.now()-enteredAt,layer);c.restore();
 }
 async function openPanel(content){
  if(!content||loading||dialog.open||!session.active||window.renovationScreen?.active||window.renovationScreen?.busy)return;
  loading=true;
  try{
   if(openedAt&&!dialog.open)finishClose();
   await titleFontReady;await content.ready;
   if(!session.active||window.renovationScreen?.active||window.renovationScreen?.busy)return;
   drawCanvas();snapshot.width=canvas.width;snapshot.height=canvas.height;snapshot.getContext('2d').drawImage(canvas,0,0);
   frozenSize='';energyFrame='';focusBefore=document.activeElement;openedAt=enteredAt=performance.now();
   if(bleedDisplay){backdropFit=bleedDisplay.style.objectFit;bleedDisplay.style.objectFit='cover';}
   session.drag=null;session.keyboardSource=-1;panel=content;
   surface.width=panel.layout.width;surface.height=panel.layout.height;
   stage.querySelectorAll('button').forEach(b=>b.remove());dialog.setAttribute('aria-label',panel.label);dialog.removeAttribute('aria-description');
   dialog.showModal();scenePause.set('popup',true);updatePlayback();
   panel.start(button,close);place();draw();stage.querySelector('button')?.focus({preventScroll:true});
  }catch(error){if(dialog.open)close();notify(error.message);}finally{loading=false;}
 }
 function close(){if(dialog.open)dialog.close();}
 function finishClose(){
  if(!openedAt||dialog.open)return;openedAt=0;
  scenePause.set('popup',false);
  if(bleedDisplay)bleedDisplay.style.objectFit=backdropFit;
  runtime.recoverEnergy();if(!document.hidden)updatePlayback();
  panel?.stop?.();panel=null;surface.width=surface.height=0;snapshot.width=snapshot.height=0;frozenSize='';energyFrame='';
  resizePreview();drawCanvas();focusBefore?.focus({preventScroll:true});
 }
 function drawFrozen(target){
  if(!snapshot.width)return target;
  const g=geometry||calculateLayout();if(target.width!==g.W)target.width=g.W;if(target.height!==g.H)target.height=g.H;
  const ctx=target.getContext('2d'),size=target.width+':'+target.height;
  if(frozenSize!==size){ctx.clearRect(0,0,target.width,target.height);ctx.drawImage(snapshot,0,0,target.width,target.height);frozenSize=size;energyFrame='';}
  const energy=runtime.state.currencies.energy+':'+runtime.energySeconds();if(energyFrame===energy)return target;energyFrame=energy;
  const s=g.W/1170,y=state.fxCurrencyY*g.H/state.height,x=state.fxCurrencyX-80,w=state.fxCurrencyWidth+140,h=state.fxCurrencyHeight+56;
  const left=Math.max(0,x*s),top=Math.max(0,(y-16)*s),width=Math.min(w*s,target.width-left),height=Math.min(h*s,target.height-top),sx=snapshot.width/target.width,sy=snapshot.height/target.height;
  ctx.save();ctx.beginPath();ctx.rect(left,top,width,height);ctx.clip();ctx.clearRect(left,top,width,height);
  ctx.drawImage(snapshot,left*sx,top*sy,width*sx,height*sy,left,top,width,height);drawCurrencyUI(ctx,g,'energy');ctx.restore();return target;
 }
 dialog.addEventListener('close',finishClose);
 dialog.addEventListener('pointerdown',()=>dialog.classList.remove('keyboard-focus'));
 dialog.addEventListener('keydown',e=>{if(e.key==='Tab')dialog.classList.add('keyboard-focus');});
 dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
 surface.addEventListener('click',e=>{const sheet=panel.layout,r=surface.getBoundingClientRect(),x=(e.clientX-r.left)*sheet.width/r.width,y=(e.clientY-r.top)*sheet.height/r.height+sheet.top;if(x<sheet.inside.left||x>sheet.inside.right||y<sheet.inside.top||y>sheet.inside.bottom)close();});
 window.addEventListener('resize',place);window.visualViewport?.addEventListener('resize',place);window.visualViewport?.addEventListener('scroll',place);document.addEventListener('scroll',place,true);new ResizeObserver(place).observe(canvas);
 return {openPanel,close,draw,drawFrozen,stage,dialog,context:c,get active(){return dialog.open;}};
}
