'use strict';
// Presentation only: purchases and persistence belong to GameRuntime/GameSaveService.
(()=>{
 const runtime=window.gameRuntime,tasks=runtime.content.tasks.filter(t=>t.zoneId==='zone_restaurant'&&t.phase==='basic');
 const W=1170,H=2532,world={width:6344,height:3968};
 const cloudMotion=RenovationMotion.createCloudMotion();
 const camera={x:1573,y:2354,zoom:.75}; // World-space center; zoom is deliberately transient.
 let active=false,loading=false,transition=null,animation=null,pan=null,pinch=null,ready=null,background=null,building=null,stage=-1,cameraTween=null;
 const images=new Map(),pointers=new Map();let cloudSprite=null,repairPoints=[];
 const sweepCanvas=document.createElement('canvas');sweepCanvas.width=640;sweepCanvas.height=457;
 const sweepContext=sweepCanvas.getContext('2d');
 const wrap=document.getElementById('canvas-wrap');wrap.style.position='relative';
 const overlay=document.createElement('div');overlay.style.cssText='position:absolute;pointer-events:none;z-index:3';wrap.appendChild(overlay);
 function placeOverlay(){overlay.style.left=canvas.offsetLeft+'px';overlay.style.top=canvas.offsetTop+'px';overlay.style.width=canvas.clientWidth+'px';overlay.style.height=canvas.clientHeight+'px';}
 new ResizeObserver(placeOverlay).observe(wrap);new ResizeObserver(placeOverlay).observe(canvas);placeOverlay();
 const nav=document.createElement('button');nav.id='renovation-nav';nav.textContent='翻新餐厅';nav.className='renovation-nav';overlay.appendChild(nav);
 const controls=document.createElement('div');controls.className='renovation-map-controls';controls.hidden=true;
 controls.innerHTML='<button aria-label="缩小地图">−</button><span>75%</span><button aria-label="放大地图">＋</button><button class="locate" aria-label="定位当前清理任务">定位任务</button>';overlay.appendChild(controls);
 const zoomText=controls.querySelector('span'),[minus,plus,locate]=controls.querySelectorAll('button');
 const limit=(n,a,b)=>Math.max(a,Math.min(b,n)),ease=t=>1-(1-t)**3;
 const completed=()=>{let n=0;while(n<tasks.length&&runtime.state.renovation.completedTaskIds.includes(tasks[n].id))n++;return n;};
 const task=()=>tasks[stage];
 const redraw=()=>drawCanvas();
 function clampCamera(){const bound=(v,size,view)=>view>=size?size/2:limit(v,view/2,size-view/2);camera.x=bound(camera.x,world.width,W/camera.zoom);camera.y=bound(camera.y,world.height,H/camera.zoom);}
 function saveCamera(){runtime.state.renovation.camera={x:camera.x,y:camera.y};runtime.changed('RENOVATION_CAMERA_CHANGED');}
 const screen=(x,y)=>({x:(x-camera.x)*camera.zoom+W/2,y:(y-camera.y)*camera.zoom+H/2});
 const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};};
 function loadImage(url){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('餐厅图片加载失败，请检查素材文件。'));image.src=url;});}
 function loadAssets(){return ready||(ready=new Promise((resolve,reject)=>{if(window.RENOVATION_ASSETS)return resolve();const script=document.createElement('script');script.src='js/game/renovation-assets.js';script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('餐厅素材加载失败'));};document.head.appendChild(script);}).then(async()=>{background=await loadImage(window.RENOVATION_ASSETS.background);cloudSprite=await loadImage(window.RENOVATION_ASSETS.cloudSprite);building=window.RENOVATION_ASSETS.building;}).catch(e=>{ready=null;throw e;}));}
 async function loadStage(n){if(!images.has(n))images.set(n,await loadImage(window.RENOVATION_ASSETS.stages[n]));for(const key of images.keys())if(Math.abs(key-n)>1)images.delete(key);return images.get(n);}
 function setZoom(z,p={x:W/2,y:H/2}){if(animation||transition)return;const x=camera.x+(p.x-W/2)/camera.zoom,y=camera.y+(p.y-H/2)/camera.zoom;camera.zoom=limit(z,.65,1.2);camera.x=x-(p.x-W/2)/camera.zoom;camera.y=y-(p.y-H/2)/camera.zoom;clampCamera();zoomText.textContent=Math.round(camera.zoom*100)+'%';saveCamera();redraw();}
 minus.onclick=()=>setZoom(camera.zoom-.05);plus.onclick=()=>setZoom(camera.zoom+.05);
 function focusTask(smooth=true){const t=task();if(!t)return;const target={x:t.mapAnchor[0],y:t.mapAnchor[1]-H*.17/camera.zoom};if(smooth)cameraTween={from:{...camera},to:target,start:performance.now()};else{Object.assign(camera,target);clampCamera();saveCamera();}}
 locate.onclick=()=>{if(!animation&&!transition)focusTask();};
 function setActive(value){active=value;nav.textContent=value?'返回合成':'翻新餐厅';controls.hidden=!value;for(const el of document.querySelectorAll('#test-toolbar button,#playtest'))el.disabled=value;canvas.setAttribute('aria-label',value?'餐厅翻新地图。拖动查看，滚轮或双指缩放，点击金币气泡清理。':'合成测试盘');}
 // The white transition is an isolated hook; replace its draw/timing without changing scenes.
 function beginTransition(toMap){transition={start:performance.now(),duration:600,toMap,switched:false};nav.disabled=true;redraw();}
 async function navigate(){if(loading||transition)return;if(active){saveCamera();window.flushGameSave();animation=null;cameraTween=null;beginTransition(false);return;}
  loading=true;nav.disabled=true;nav.textContent='加载中…';try{if(!window.mergePlayTest.active)await window.mergePlayTest.toggle();if(!window.mergePlayTest.active)return;await loadAssets();stage=completed();await loadStage(stage);Object.assign(camera,{x:1573,y:2354},runtime.state.renovation.camera||{},{zoom:.75});clampCamera();zoomText.textContent='75%';beginTransition(true);}catch(e){notify(e.message);}finally{loading=false;if(!transition){nav.disabled=false;nav.textContent='翻新餐厅';}}
 }
 // Some mobile browsers suppress the compatibility click immediately after a drag.
 // Handle a stationary touch release too, without navigating twice on normal browsers.
 let navTouch=null,lastNavTouch=-Infinity;
 nav.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&e.isPrimary)navTouch={id:e.pointerId,x:e.clientX,y:e.clientY};});
 nav.addEventListener('pointercancel',()=>{navTouch=null;});
 nav.addEventListener('pointerup',e=>{const touch=navTouch;navTouch=null;if(!touch||touch.id!==e.pointerId||nav.disabled||Math.hypot(e.clientX-touch.x,e.clientY-touch.y)>10)return;lastNavTouch=performance.now();void navigate();});
 nav.onclick=e=>{if(e.detail===0||performance.now()-lastNavTouch>700)void navigate();};
 function bubble(){const t=animation?.task||task();if(!t)return null;const p=screen(...t.mapAnchor);return {x:p.x-100,y:p.y-250,width:200,height:210,anchor:p};}
 async function buy(){if(animation||loading||transition||!task())return;const t=task(),check=runtime.canPurchaseTask(t.id);if(!check.ok){notify(check.reason==='insufficient-coins'?'金币不足，需要 '+t.coinCost+' 金币。':'当前步骤暂时不能清理。');return;}
  loading=true;try{await loadStage(stage+1);await prepareStars(stage);if(!active||transition)return;const before=runtime.state.currencies.coins,result=runtime.purchaseTask(t.id);if(!result.ok)return;
   // Save committed purchase before starting presentation. Closing mid-animation is safe.
   if(!window.flushGameSave())notify('本机存档暂不可用，请勿关闭页面，避免进度丢失。');
   const timing=RenovationMotion.timing(state.fxRepairFillDuration,state.fxRepairReveal);
   animation={start:performance.now(),from:before,cost:t.coinCost,task:t,previous:stage,timing,duration:timing.duration};cameraTween=null;pan=null;redraw();
  }catch(e){notify(e.message);}finally{loading=false;}
 }
 function displayCoins(){if(!active||!animation)return runtime.state.currencies.coins;const t=RenovationMotion.fill((performance.now()-animation.start)/animation.timing.fill);return runtime.state.currencies.coins+animation.cost-Math.round(animation.cost*t);}
 async function prepareStars(index){
  const box=window.RENOVATION_ASSETS.effects[index],img=await loadImage(box.url),tmp=document.createElement('canvas');tmp.width=96;tmp.height=96;const c=tmp.getContext('2d');c.drawImage(img,0,0,96,96);const data=c.getImageData(0,0,96,96).data,candidates=[];
  for(let y=5;y<96;y+=9)for(let x=5;x<96;x+=9)if(data[(y*96+x)*4+3]>160)candidates.push({x:box.x+x/96*box.width,y:box.y+y/96*box.height});
  repairPoints=Array.from({length:Math.min(12,candidates.length)},(_,i)=>candidates[Math.floor(i*candidates.length/Math.min(12,candidates.length))]);
 }
 function drawRepairStars(c,now){if(!animation||!createPlaytestRenderer.starSprite)return;const age=now-animation.start-animation.timing.revealStart;if(age<0)return;const sprite=createPlaytestRenderer.starSprite('#FFFBE0',.08,'#AD813E');c.save();for(let i=0;i<repairPoints.length;i++){const t=(age-i*22)/620;if(t<0||t>1)continue;const pulse=Math.sin(t*Math.PI)**2,size=state.fxRepairStarSize*(.65+.35*pulse),p=repairPoints[i];c.globalAlpha=pulse;c.drawImage(sprite,p.x-size/2,p.y-size/2,size,size);}c.restore();}
 function coin(c,x,y,size){const img=artwork.backgroundcoin;if(img)c.drawImage(img,x-size/2,y-size/2,size,size);else{c.fillStyle='#FFC83D';c.beginPath();c.arc(x,y,size*.4,0,Math.PI*2);c.fill();}}
 function drawClouds(c,now){
  if(!cloudSprite)return;
  const left=camera.x-W/2/camera.zoom,right=camera.x+W/2/camera.zoom,top=camera.y-H/2/camera.zoom,bottom=camera.y+H/2/camera.zoom;
  window.RENOVATION_ASSETS.clouds.forEach((box,i)=>{const m=cloudMotion(now,i),w=box.width*m.scale,h=box.height*m.scale,x=box.x+(box.width-w)/2+m.dx,y=box.y+(box.height-h)/2;
   if(x>right||x+w<left||y>bottom||y+h<top)return;c.drawImage(cloudSprite,x,y,w,h);
  });
 }
 function drawRepairEffect(c,now){
  if(!animation)return;
  const m=RenovationMotion.reveal(now-animation.start,animation.timing);if(!m.alpha)return;
  const s=sweepContext,w=sweepCanvas.width,h=sweepCanvas.height,span=w+h,band=span*state.fxRepairWidth/100,center=-band+(span+2*band)*m.progress;
  s.clearRect(0,0,w,h);s.save();
  // x+y is constant along each edge: a parallel diagonal band travels down-right.
  const gradient=s.createLinearGradient((center-band/2)/2,(center-band/2)/2,(center+band/2)/2,(center+band/2)/2);
  const colors=Array.from({length:Number(state.fxRepairColors)||3},(_,i)=>state['fxRepairColor'+(i+1)]);
  gradient.addColorStop(0,colors[0]+'00');colors.forEach((color,i)=>gradient.addColorStop(.15+.7*i/(colors.length-1),color));gradient.addColorStop(1,colors.at(-1)+'00');
  s.fillStyle=gradient;s.beginPath();s.moveTo(center-band/2,0);s.lineTo(center+band/2,0);s.lineTo(center+band/2-h,h);s.lineTo(center-band/2-h,h);s.closePath();s.fill();
  s.globalCompositeOperation='destination-in';s.drawImage(images.get(animation.previous+1),0,0,w,h);s.restore();
  c.save();c.globalCompositeOperation=state.fxRepairBlend;c.globalAlpha=state.fxRepairOpacity/100;c.drawImage(sweepCanvas,building.x,building.y,building.width,building.height);c.restore();
 }
 function bubblePath(c,b){const {x,y,width:w,height:h}=b,r=45,mid=x+w/2;c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(mid+18,y+h);c.lineTo(mid,y+h+25);c.lineTo(mid-18,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();}
 function drawBubble(c,now){const b=bubble();if(!b)return;const age=animation?now-animation.start:0;if(animation&&age>animation.timing.fill+100)return;
  const motion=RenovationMotion.bubble(now,animation?age:null),cx=b.x+b.width/2,cy=b.y+b.height/2;
  c.save();c.translate(cx,cy+motion.dy);c.scale(motion.sx,motion.sy);c.translate(-cx,-cy);
  c.shadowColor='rgba(64,87,76,.23)';c.shadowBlur=12;c.shadowOffsetY=8;bubblePath(c,b);c.fillStyle='#FFFBEC';c.fill();c.shadowColor='transparent';
  c.save();bubblePath(c,b);c.clip();const fill=animation?RenovationMotion.fill(age/animation.timing.fill):0;c.fillStyle='#83DE68';c.fillRect(b.x,b.y+(b.height+25)*(1-fill),b.width,(b.height+25)*fill);c.restore();
  c.strokeStyle='#A8875A';c.lineWidth=5;bubblePath(c,b);c.stroke();coin(c,b.x+b.width/2,b.y+73,92);c.textAlign='center';c.textBaseline='middle';c.font='bold 43px sans-serif';c.fillStyle='#77543C';c.fillText(String((animation?.task||task()).coinCost),b.x+b.width/2,b.y+155);c.restore();
 }
 function drawDust(c,now){if(!animation)return;const age=now-animation.start-animation.timing.fill;if(age<0||age>1100)return;const t=age/1100,p=screen(...animation.task.mapAnchor),alpha=Math.min(t*6,(1-t)*5,1);
  c.save();c.globalAlpha=alpha;for(let i=0;i<15;i++){const angle=i*2.399+Math.sin(t*14+i)*.16,rx=150+(i%4)*57,ry=75+(i%3)*48;const x=p.x+Math.cos(angle)*rx,y=p.y-30+Math.sin(angle)*ry;const r=(64+i%3*20)*(1+.1*Math.sin(t*24+i));c.fillStyle=i%3?'#FFFCF0':'#E5F1EE';c.strokeStyle='#CDDED6';c.lineWidth=3;c.beginPath();c.ellipse(x,y,r,r*.8,0,0,Math.PI*2);c.fill();c.stroke();}c.restore();
 }
 function drawFlights(c,now){if(!animation)return;const b=bubble(),source={x:state.fxCurrencyX+state.fxCurrencyWidth+37+state.fxCurrencyGap+49+state.fxCurrencyCoinX,y:state.fxCurrencyY+state.fxCurrencyHeight/2+state.fxCurrencyCoinY},target={x:b.anchor.x,y:b.y+73};for(let i=0;i<8;i++){const t=((now-animation.start)/animation.timing.fill-i*.055)/.615;if(t<0||t>1)continue;const p=RenovationMotion.flight(t,i,source,target),step=.144*state.fxRepairTrailLength/100/24;c.save();c.lineCap='round';for(let j=0;j<24;j++){const a=RenovationMotion.flight(Math.max(0,t-(24-j)*step),i,source,target),z=RenovationMotion.flight(Math.max(0,t-(23-j)*step),i,source,target);c.globalAlpha=((j+1)/24)**1.5*.5*Math.min(1,t*8,(1-t)*12);c.strokeStyle=state.fxRepairTrailColor;c.lineWidth=.3+18*(j/23)**1.5;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(z.x,z.y);c.stroke();}c.globalAlpha=Math.min(1,t*8,(1-t)*12);coin(c,p.x,p.y,60*(1-.25*t));c.restore();}}
 function update(now){if(cameraTween){const t=limit((now-cameraTween.start)/500,0,1);camera.x=cameraTween.from.x+(cameraTween.to.x-cameraTween.from.x)*ease(t);camera.y=cameraTween.from.y+(cameraTween.to.y-cameraTween.from.y)*ease(t);clampCamera();if(t===1){cameraTween=null;saveCamera();}}
  if(animation&&now-animation.start>=animation.duration){stage=completed();animation=null;focusTask();}
 }
 function draw(c,g){const now=performance.now();update(now);c.save();c.scale(g.W/W,g.H/H);c.save();c.translate(W/2,H/2);c.scale(camera.zoom,camera.zoom);c.translate(-camera.x,-camera.y);c.fillStyle='#54BFD5';c.fillRect(camera.x-W/2/camera.zoom,camera.y-H/2/camera.zoom,W/camera.zoom,H/camera.zoom);c.drawImage(background,0,0,world.width,world.height);drawClouds(c,now);const visible=animation&&now-animation.start>=animation.timing.revealStart?animation.previous+1:stage;const img=images.get(visible)||images.get(stage);if(img)c.drawImage(img,building.x,building.y,building.width,building.height);drawRepairEffect(c,now);drawRepairStars(c,now);c.restore();
  drawBubble(c,now);drawDust(c,now);c.textAlign='center';c.font='bold 30px sans-serif';c.fillStyle='#285D65';c.fillText(stage===5?'餐厅已清理完成':`${stage+1} / 5 · ${task()?.name||''}`,W/2,H-110);c.restore();drawCurrencyUI(c,g);c.save();c.scale(g.W/W,g.H/H);drawFlights(c,now);c.restore();drawOverlay(c,g);
 }
 function drawOverlay(c,g){if(!transition)return;const t=limit((performance.now()-transition.start)/transition.duration,0,1);if(t>=.5&&!transition.switched){transition.switched=true;setActive(transition.toMap);}c.save();c.globalAlpha=1-Math.abs(2*t-1);c.fillStyle='#FFFFFF';c.fillRect(0,0,g.W,g.H);c.restore();if(t===1){transition=null;nav.disabled=false;}}
 function stop(e){e.preventDefault();e.stopImmediatePropagation();}
 canvas.addEventListener('pointerdown',e=>{if(!active&&!transition)return;stop(e);if(!active||transition||e.button!==0)return;const p=point(e);pointers.set(e.pointerId,p);canvas.setPointerCapture(e.pointerId);if(animation)return;cameraTween=null;pan={id:e.pointerId,start:p,from:{...camera},moved:false};if(pointers.size===2){const a=[...pointers.values()];pinch={distance:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),zoom:camera.zoom};pan=null;}},true);
 canvas.addEventListener('pointermove',e=>{if(!active)return;stop(e);if(!pointers.has(e.pointerId))return;const p=point(e);pointers.set(e.pointerId,p);if(animation||transition)return;if(pinch&&pointers.size===2){const a=[...pointers.values()];setZoom(pinch.zoom*Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)/Math.max(1,pinch.distance),{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2});return;}if(pan?.id!==e.pointerId)return;if(Math.hypot(p.x-pan.start.x,p.y-pan.start.y)>14)pan.moved=true;if(pan.moved){camera.x=pan.from.x-(p.x-pan.start.x)/camera.zoom;camera.y=pan.from.y-(p.y-pan.start.y)/camera.zoom;clampCamera();redraw();}},true);
 function end(e){if(!active&&!transition)return;stop(e);pointers.delete(e.pointerId);const old=pan;pan=null;if(pointers.size<2)pinch=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(old&&!old.moved&&e.type==='pointerup'&&!animation&&!transition){const p=point(e),b=bubble();if(b){const m=RenovationMotion.bubble(performance.now()),cx=b.x+b.width/2,cy=b.y+b.height/2;const x=cx+(p.x-cx)/m.sx,y=cy+(p.y-cy-m.dy)/m.sy;bubblePath(ctx,b);if(ctx.isPointInPath(x,y))void buy();}}saveCamera();}
 canvas.addEventListener('pointerup',end,true);canvas.addEventListener('pointercancel',end,true);canvas.addEventListener('lostpointercapture',e=>{if(active){pointers.delete(e.pointerId);pan=null;pinch=null;}},true);
 canvas.addEventListener('wheel',e=>{if(active){stop(e);setZoom(camera.zoom+(e.deltaY<0?.025:-.025),point(e));}},{capture:true,passive:false});
 canvas.addEventListener('keydown',e=>{if(!active)return;stop(e);if(e.key==='Escape')void navigate();if(e.key==='+'||e.key==='=')setZoom(camera.zoom+.05);if(e.key==='-')setZoom(camera.zoom-.05);if(e.key==='Enter')void buy();if(!animation&&!transition&&e.key.startsWith('Arrow')){camera.x+=({ArrowLeft:-100,ArrowRight:100}[e.key]||0)/camera.zoom;camera.y+=({ArrowUp:-100,ArrowDown:100}[e.key]||0)/camera.zoom;clampCamera();saveCamera();}},true);
 window.renovationScreen={get active(){return active;},get busy(){return loading||!!transition;},get transitioning(){return !!transition;},draw,drawOverlay,displayCoins,navigate,getSnapshot:()=>({active,stage,camera:{...camera},animating:!!animation,effect:animation?RenovationMotion.reveal(performance.now()-animation.start,animation.timing).phase:null,revealed:!!animation&&performance.now()-animation.start>=animation.timing.revealStart,bubble:bubble()})};
})();
