'use strict';
function createPlaytestRenderer(session){
 const itemShadows=new Map();
 function itemShadow(item,img){
  const key=item.type+item.level;if(itemShadows.has(key))return itemShadows.get(key);
  const n=256,out=document.createElement('canvas');out.width=out.height=n;
  const s=out.getContext('2d');
  // Anchor near the PNG's feet, with a small downward/contact offset before projection.
  s.save();s.setTransform(1,0,-.22,.62,n*(.22*.94+.015),n*(.94*(1-.62)+.018));
  s.drawImage(img,n*.03,n*.03,n*.94,n*.94);s.restore();
  s.globalCompositeOperation='source-in';
  const depth=s.createLinearGradient(0,n*.52,0,n*.96);
  depth.addColorStop(0,'rgba(40,54,58,0)');depth.addColorStop(.5,'rgba(40,54,58,.025)');depth.addColorStop(1,'rgba(40,54,58,.28)');
  s.fillStyle=depth;s.fillRect(0,0,n,n);
  // Fade before the cell border instead of ending in a visible hard clipping line.
  s.globalCompositeOperation='destination-in';
  for(const horizontal of [true,false]){
   const edge=s.createLinearGradient(0,0,horizontal?n:0,horizontal?0:n);
   edge.addColorStop(0,'transparent');edge.addColorStop(.08,'#000');edge.addColorStop(.92,'#000');edge.addColorStop(1,'transparent');
   s.fillStyle=edge;s.fillRect(0,0,n,n);
  }
  itemShadows.set(key,out);return out;
 }
 // Integrate a positive velocity curve: slow near 40%, then accelerate; fixed duration.
 const sweepPath=[0];
 const sweepSpeed=t=>.09+1.05*(1-Math.exp(-(((t-.4)/.19)**2)))+.55*Math.max(0,t-.4);
 for(let i=1;i<=200;i++)sweepPath[i]=sweepPath[i-1]+(sweepSpeed((i-1)/200)+sweepSpeed(i/200))/400;
 const sweepTotal=sweepPath[200];
 function sweepProgress(t){const f=Math.max(0,Math.min(1,t))*200,i=Math.min(199,Math.floor(f));return (sweepPath[i]+(sweepPath[i+1]-sweepPath[i])*(f-i))/sweepTotal;}
 function drawMaxLevelSparkles(c,g,item,index,time,behind=false){
  const tier=session.board.getEffectTier(item);
  if(tier==='none'||state.fxStarOpacity<=0||state.fxStarCount<=0||session.flights.has(index))return;
  if(session.drag?.from===index||session.keyboardSource===index)return;
  const b=g.cells[index],count=tier==='near-max'?Math.max(0,Math.round(state.fxStarCount*.6)):Math.round(state.fxStarCount);
  const backCount=Math.floor(count*.4),stars=[];
  const positions=[[.18,.38],[.8,.65],[.35,.24],[.69,.48],[.4,.8]];
  for(let j=0;j<count;j++){
   if((j<backCount)!==behind)continue;
   const p=positions[j]||[.16+((j*.618)%1)*.68,.16+((j*.382)%1)*.68];
   const min=Math.min(state.fxStarMin,state.fxStarMax),max=Math.max(state.fxStarMin,state.fxStarMax);
   stars.push([p[0],p[1],(min+(max-min)*((j*.673+.31)%1))/100,j]);
  }
  c.save();rounded(c,b.x,b.y,b.width,b.height,b.width*state.cellRadius/100);c.clip();
  for(let i=0;i<stars.length;i++){
   const [x,y,size,id]=stars[i],cycle=2016+state.fxStarCooldown*1000,clock=time/cycle+index*.137+id*.317;
   const phase=clock%1,visible=2016/cycle;
   // A quiet off interval between each appearance; orientation stays vertical/horizontal.
   const pulse=phase<visible?Math.sin(Math.PI*phase/visible)**2:0,r=b.width*size*(.65+.35*pulse);
   c.save();c.translate(b.x+x*b.width,b.y+y*b.height);
   c.globalAlpha=pulse*state.fxStarOpacity/100;
   const weights=[state.fxStarWeight1,state.fxStarWeight2,state.fxStarWeight3],sum=weights.reduce((a,b)=>a+b,0);
   const random=(Math.sin(index*127.1+id*311.7+Math.floor(clock)*74.7)*43758.5453)%1;
   let pick=((random+1)%1)*sum,colorIndex=0;
   if(sum>0){for(let k=0;k<3;k++){pick-=weights[k];if(pick<0){colorIndex=k;break;}}}
   const color=state['fxStarColor'+(colorIndex+1)];
   if(pulse>.001)c.drawImage(starSprite(color,b.width*.012/r),-r*2,-r*2,r*4,r*4);c.restore();
  }
  c.restore();
 }
 const starSprites=new Map();
 function starSprite(color,blurRatio,outline=null){
  const key=color+':'+blurRatio.toFixed(2)+':'+(outline||'');if(starSprites.has(key))return starSprites.get(key);
  const sprite=document.createElement('canvas');sprite.width=sprite.height=128;
  const c=sprite.getContext('2d'),r=32;c.translate(64,64);
   const halo=c.createRadialGradient(0,0,0,0,0,r*1.8);
   halo.addColorStop(0,'rgba(255,245,217,.18)');halo.addColorStop(1,'rgba(255,255,255,0)');
   c.fillStyle=halo;c.beginPath();c.arc(0,0,r*1.8,0,Math.PI*2);c.fill();
   c.fillStyle=color;c.shadowColor=color;c.shadowBlur=r*blurRatio;
   // Thin axis-aligned rays flowing into a small solid center, matching the reference.
   c.beginPath();c.moveTo(0,-r*1.25);
   c.bezierCurveTo(r*.025,-r*.12,r*.12,-r*.025,r,0);
   c.bezierCurveTo(r*.12,r*.025,r*.025,r*.12,0,r*1.25);
   c.bezierCurveTo(-r*.025,r*.12,-r*.12,r*.025,-r,0);
   c.bezierCurveTo(-r*.12,-r*.025,-r*.025,-r*.12,0,-r*1.25);c.closePath();
   if(outline){c.save();c.shadowBlur=0;c.strokeStyle=outline;c.lineWidth=3;c.lineJoin='round';c.stroke();c.restore();}c.fill();
   c.shadowBlur=0;c.fillStyle='#FFFFFF';c.beginPath();c.arc(0,0,r*.15,0,Math.PI*2);c.fill();
  if(starSprites.size>=64)starSprites.delete(starSprites.keys().next().value);
  starSprites.set(key,sprite);return sprite;
 }
 // Share the exact cached item sparkle artwork with renovation feedback.
 createPlaytestRenderer.starSprite=starSprite;
 let foilCanvas,bandCanvas,sweepSpectrum;
 const sweepFrames=new Map();let sweepSignature="";
 function drawPrismaticSweep(c,g,item,index,time){
  if(state.fxSweepOpacity<=0||state.fxSweepWidth<=0||session.board.getEffectTier(item)!=='max'||session.flights.has(index)||session.drag?.from===index||session.keyboardSource===index)return;
  const duration=state.fxSweepDuration*1000,cycle=duration+state.fxSweepCooldown*1000;
  const elapsed=(time+index*.137*cycle)%cycle;if(elapsed>=duration)return;
  const frameCount=Math.max(1,Math.ceil(duration*.06)),frame=Math.round(elapsed/duration*frameCount),phase=frame/frameCount*.3;
  const signature=[frameCount,state.fxSweepWidth,state.fxSweepTaper,state.fxSweepCurve,state.fxSweepAngle].join(":");
  if(signature!==sweepSignature){sweepSignature=signature;sweepFrames.clear();}
  const img=session.pictures[item.type+item.level];if(!img)return;
  foilCanvas??=document.createElement('canvas');
  const n=256;if(foilCanvas.width!==n){foilCanvas.width=n;foilCanvas.height=n;}
  const f=foilCanvas.getContext('2d');f.clearRect(0,0,n,n);
  // Mask the moving rainbow to the PNG's alpha, never to its rectangular bounds.
  f.globalCompositeOperation='source-over';f.drawImage(img,0,0,n,n);
  f.globalCompositeOperation='source-in';
  const t=phase/.3,slow=Math.exp(-(((t-.4)/.19)**2));
  const progress=sweepProgress(t),x=-n*.8+progress*n*2.6;
  if(!sweepSpectrum){
  sweepSpectrum=document.createElement('canvas');sweepSpectrum.width=1024;sweepSpectrum.height=1;
  const spectrum=sweepSpectrum.getContext('2d'),gradient=spectrum.createLinearGradient(0,0,1024,0);
  for(const [stop,color]of [[0,'transparent'],[.14,'#A3DAF5'],[.32,'#C3B4ED'],[.46,'#F0C2E4'],[.5,'#FFFDF4'],[.54,'#F5E6B3'],[.72,'#BDEBD9'],[.86,'#ADE3ED'],[1,'transparent']])gradient.addColorStop(stop,color);
  spectrum.fillStyle=gradient;spectrum.fillRect(0,0,1024,1);
  }
  // Draw a padded light layer, rotate it, then mask to the unchanged item silhouette.
  const pad=n/2;
  bandCanvas??=document.createElement('canvas');if(bandCanvas.width!==n*2){bandCanvas.width=n*2;bandCanvas.height=n*2;}
  const cached=sweepFrames.get(frame);
  if(!cached){
  const band=bandCanvas.getContext('2d');band.setTransform(1,0,0,1,0,0);band.clearRect(0,0,n*2,n*2);band.translate(pad,pad);
  {
   // Scanline ribbon: smooth asymmetric growth, widest at the image center.
   const envelope=Math.sin(Math.PI*progress)**2,width=n*state.fxSweepWidth/100*(.28+.72*envelope);
   // Reverse curvature across the midpoint: upper-left bow → straight → lower-right bow.
   const bend=n*.24*Math.cos(Math.PI*progress)*state.fxSweepCurve/100,tilt=-.36+.54*progress;
   for(let y=-pad;y<n+pad;y++){
    const q=(y-n/2)/(n/2),center=x+n*.2+tilt*(y-n/2)+bend*(q*q-.35);
    // Lens-shaped ribbon: full width in the middle, narrowing smoothly toward both tips.
    const taper=state.fxSweepTaper/100,localWidth=Math.max(.01,width*(1-taper+taper*Math.max(0,1-q*q)));
    band.drawImage(sweepSpectrum,center-localWidth/2,y,localWidth,1);
   }
  }
  const saved=document.createElement('canvas');saved.width=saved.height=n;const rotated=saved.getContext('2d');rotated.translate(n/2,n/2);rotated.rotate(state.fxSweepAngle*Math.PI/180);rotated.drawImage(bandCanvas,-n/2-pad,-n/2-pad);
  if(sweepFrames.size>=64)sweepFrames.delete(sweepFrames.keys().next().value);
  sweepFrames.set(frame,saved);
  }
  f.drawImage(sweepFrames.get(frame),0,0);
  f.globalCompositeOperation='source-over';
  const b=g.cells[index],size=b.width*.94;
  c.save();rounded(c,b.x,b.y,b.width,b.height,b.width*state.cellRadius/100);c.clip();
  const opacity=state.fxSweepOpacity/100*(.57+.22*slow)/.79*Math.min(1,t/.08,(1-t)/.08);
  const dx=b.x+(b.width-size)/2,dy=b.y+(b.height-size)/2;
  // One selected blend operation, with no hidden second pass altering the chosen result.
  c.globalCompositeOperation=state.fxSweepBlend;c.globalAlpha=opacity;
  c.filter=`saturate(${state.fxSweepSaturation}%) brightness(${state.fxSweepBrightness}%)`;
  c.drawImage(foilCanvas,dx,dy,size,size);c.restore();
 }
 function drawIcon(c,g,item,index,time,alpha=1){
  const box=g.cells[index],img=session.pictures[item.type+item.level];if(!img)return;const elapsed=time-(session.effects.get(index)??-1000);
  const failed=time-(session.failures?.get(index)??-1000);
  const shake=failed<360?Math.sin(failed*.075)*(1-failed/360)*box.width*.075:elapsed<320?Math.sin(elapsed*.065)*(1-elapsed/320)*box.width*.025:0;
  if(failed>=360)session.failures?.delete(index);
  if(elapsed>=320)session.effects.delete(index);
  c.save();rounded(c,box.x,box.y,box.width,box.height,box.width*state.cellRadius/100);c.clip();c.globalAlpha=alpha;
  const flight=session.flights.get(index);let scale=1;
  if(flight){const t=(time-flight.start-45-flight.duration)/150;if(t<0){c.restore();return;}if(t>=1)session.flights.delete(index);else{const u=t-1;scale=1+2.1*u*u*u+1.1*u*u;}}
  if(item.type==='ice'&&item.level===1)scale*=.5;
  const shadowSize=box.width*scale;
  c.save();c.filter=`blur(${box.width*.008}px)`;
  c.drawImage(itemShadow(item,img),box.x+(box.width-shadowSize)/2+shake,box.y+(box.height-shadowSize)/2,shadowSize,shadowSize);c.restore();
  const size=box.width*.94*scale;c.drawImage(img,box.x+(box.width-size)/2+shake,box.y+(box.height-size)/2,size,size);c.restore();
 }
 function drawFlights(c,g,time){
  for(const [index,f]of session.flights){
   const raw=(time-f.start-45)/f.duration;if(raw<0||raw>=1)continue;
   const curve=t=>{const u=t*t*(3-2*t),bend=Math.min(g.cells[index].width*.8,Math.hypot(f.to.x-f.from.x,f.to.y-f.from.y)*.3);return {x:f.from.x+(f.to.x-f.from.x)*u,y:f.from.y+(f.to.y-f.from.y)*u-Math.sin(Math.PI*u)*bend};};
   c.save();c.lineCap='round';
   for(let n=16;n>0;n--){const a=curve(Math.max(0,raw-n*.012)),b=curve(Math.max(0,raw-(n-1)*.012));c.strokeStyle=`rgba(255,225,138,${(1-n/17)*.7})`;c.lineWidth=(1-n/18)*9*g.sx;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
   const p=curve(raw);c.shadowColor='#FFE39C';c.shadowBlur=20*g.sx;c.fillStyle='#FFFEED';c.beginPath();c.arc(p.x,p.y,6*g.sx,0,Math.PI*2);c.fill();c.restore();
  }
 }
 function drawDragged(c,g,time){
  if(!session.drag?.moved)return;const item=session.board.slots[session.drag.from],img=session.pictures[item.type+item.level],box=g.cells[session.drag.from];
  const t=Math.min(1,(time-session.drag.lift)/130),lift=1-(1-t)**3,size=box.width*.94*(1+.1*lift)*(item.type==='ice'&&item.level===1?.5:1);
  c.save();c.translate(session.drag.p.x+session.drag.offset.x,session.drag.p.y+session.drag.offset.y-box.width*.09*lift);c.rotate(-.035*lift);
  c.shadowColor='rgba(22,65,68,.26)';c.shadowBlur=box.width*.13*lift;c.shadowOffsetX=box.width*.08*lift;c.shadowOffsetY=-box.width*.06*lift;
  c.drawImage(img,-size/2,-size/2,size,size);c.restore();
 }
 let selectionTarget=-1,selectionStart=0;
 function drawSelection(c,b,time){
  const size=b.width,thickness=size*state.fxSelectionThickness/100,rim=thickness*(.086/.06);
  // 50% retains the former edge position; higher values expand beyond the cell.
  const inset=rim/2+size*.005+(size-rim-size*.01)*(1-state.fxSelectionScale/50)/2;
  const arm=Math.min(size*.16,(size-2*inset)*.32);
  const radius=Math.min(arm,state.fxSelectionRadius/100*size),color=state.fxSelectionColor;
  c.save();
  const breath=state.fxSelectionBreath?1+state.fxSelectionBreathAmount/100*(1-Math.cos((time-selectionStart)*Math.PI*2/(state.fxSelectionBreathDuration*1000)))/2:1;
  c.translate(b.x+b.width/2,b.y+b.height/2);c.scale(breath,breath);c.translate(-b.x-b.width/2,-b.y-b.height/2);
  for(const [right,bottom]of [[false,false],[true,false],[false,true],[true,true]]){
   c.save();c.translate(right?b.x+b.width-inset:b.x+inset,bottom?b.y+b.height-inset:b.y+inset);c.scale(right?-1:1,bottom?-1:1);
   const path=()=>{c.beginPath();c.moveTo(0,arm);c.lineTo(0,radius);if(radius>0)c.quadraticCurveTo(0,0,radius,0);else c.lineTo(0,0);c.lineTo(arm,0);};
   c.lineCap='round';c.lineJoin='round';
   // Warm soft rim around the solid fill, with no line connecting the four corners.
   c.shadowColor='rgba(133,87,30,.28)';c.shadowBlur=size*.018;c.shadowOffsetY=size*.006;
   c.strokeStyle=mix(color,'#A96626',.48);c.lineWidth=rim;path();c.stroke();
   c.shadowBlur=0;c.shadowOffsetY=0;c.strokeStyle=color;c.lineWidth=thickness;path();c.stroke();
   c.restore();
  }
  c.restore();
 }
 function draw(c,g){
  if(!session.active)return;const time=performance.now();
  const markers=session.showOrders?orderMarkerState(orderQueue.entries,session.board.slots):null;
  if(session.showOrders){drawCustomerBubbles(c,g,markers);refreshOrderButtons();}
  for(let i=0;i<63;i++)if(session.board.slots[i])drawMaxLevelSparkles(c,g,session.board.slots[i],i,time,true);
  for(let i=0;i<63;i++)if(session.board.slots[i])drawIcon(c,g,session.board.slots[i],i,time,session.drag?.moved&&session.drag.from===i?0.2:1);
  for(let i=0;i<63;i++)if(session.board.slots[i])drawPrismaticSweep(c,g,session.board.slots[i],i,time);
  for(let i=0;i<63;i++)if(session.board.slots[i])drawMaxLevelSparkles(c,g,session.board.slots[i],i,time);
  const target=session.drag?.moved?session.drag.target:session.selected;
  if(target!==selectionTarget){selectionTarget=target;selectionStart=time;}
  if(target>=0)drawSelection(c,g.cells[target],time);
  if(markers)for(let i=0;i<session.board.slots.length;i++){const item=session.board.slots[i];if(item&&markers.needed.has(orderItemKey(item))&&!session.flights.has(i)&&session.drag?.from!==i&&session.keyboardSource!==i)drawOrderCheck(c,g.cells[i],true);}
  drawFlights(c,g,time);drawDragged(c,g,time);
 }

 return {draw};
}
