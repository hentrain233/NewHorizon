'use strict';
function rounded(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,Math.max(0,Math.min(r,w/2,h/2)));}
function fillRound(c,box,color,r){c.fillStyle=color;rounded(c,box.x,box.y,box.width,box.height,r);c.fill();}

function drawMedia(c,media,box,opt){
 const iw=media.videoWidth||media.naturalWidth||media.width,ih=media.videoHeight||media.naturalHeight||media.height;if(!iw||!ih)return;
 let dw=box.width,dh=box.height;
 if(opt.fit!=='stretch'){const ratio=(opt.fit==='cover'?Math.max:Math.min)(box.width/iw,box.height/ih);dw=iw*ratio;dh=ih*ratio;}
 dw*=opt.scale;dh*=opt.scale;
 const dx=box.x+(box.width-dw)*opt.x/100,dy=box.y+(box.height-dh)*opt.y/100;
 c.save();c.beginPath();c.rect(box.x,box.y,box.width,box.height);c.clip();c.globalAlpha=opt.opacity/100;c.drawImage(filteredMedia(media,opt,dw),dx,dy,dw,dh);c.restore();
}
function drawTopBackground(c,g){
 if(state.transparentTop||state.boardOnly)return;
 c.fillStyle=state.topColor;c.fillRect(0,0,g.W,state.template==='cottage'?g.barBottom:state.topHeight);
 const media=state.backgroundType==='image'?assets.image:state.backgroundType==='video'?getVideoFrame():null;
 if(media)drawMedia(c,media,{x:0,y:0,width:g.W,height:state.topHeight},{fit:state.fit,scale:state.mediaScale,x:state.positionX,y:state.positionY,opacity:state.mediaOpacity,blur:state.mediaBlur,brightness:state.mediaBrightness,saturation:state.mediaSaturation});
}
function drawBoardArea(c,g){
 const end=state.boardOnly?g.board.y+g.board.height:g.H;
 const areaTop=state.template==='cottage'?g.barBottom:state.topHeight;
 c.fillStyle=state.surroundColor;c.fillRect(0,areaTop,g.W,Math.max(0,end-areaTop));
 if(state.template==='cottage'&&state.planks){
  const img=artworkImage(1);if(img)c.drawImage(img,0,g.barBottom,g.W,Math.max(0,end-g.barBottom));return;
 }
 if(state.planks){
  c.save();c.beginPath();c.rect(0,state.topHeight,g.W,Math.max(0,end-state.topHeight));c.clip();
  const width=state.plankWidth,a=state.plankOpacity/100;
  for(let x=-width*.18,i=0;x<g.W;x+=width,i++){
   const gradient=c.createLinearGradient(x,0,x+width,0);
   gradient.addColorStop(0,rgba('#355C60',a*.5));gradient.addColorStop(.05,rgba('#FFFFFF',a*.6));gradient.addColorStop(.6,rgba('#FFFFFF',a*.1));gradient.addColorStop(1,rgba('#355C60',a*.18));
   c.fillStyle=gradient;c.fillRect(x,state.topHeight,width,end-state.topHeight);
   c.fillStyle=rgba('#3E737A',a);c.fillRect(x,state.topHeight,2*g.sx,end-state.topHeight);
  }c.restore();
 }
}
function drawSupports(c,g){
 if(state.template==='cottage')return;
 if(!state.supports||!state.showBar)return;
 c.save();const y=g.barBottom-4*g.sy,h=Math.max(0,g.board.y+g.board.height*.12-y),w=state.supportWidth;
 const beam=(x1,y1,x2,y2,width)=>{c.lineCap='round';c.strokeStyle=state.barFrontColor;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.strokeStyle=state.barTopColor;c.lineWidth=width*.68;c.stroke();};
 for(const [x,dir] of [[state.supportInset,1],[g.W-state.supportInset-w,-1]]){
  beam(x+w/2,y+Math.min(h*.65,70*g.sy),x+w/2+dir*95*g.sx,y,19*g.sx);
  const gradient=c.createLinearGradient(x,0,x+w,0);gradient.addColorStop(0,state.barFrontColor);gradient.addColorStop(.2,state.barTopColor);gradient.addColorStop(.75,mix(state.barTopColor,state.barFrontColor,.2));gradient.addColorStop(1,state.barFrontColor);
  c.fillStyle=gradient;c.fillRect(x,y,w,h);c.fillStyle=rgba(state.barFrontColor,state.woodOpacity/100);for(let j=1;j<5;j++)c.fillRect(x+w*j/5,y,1*g.sx,h);
 }c.restore();
}
function drawShadow(c,g){
 if(!state.showBar||!state.showBarShadow||!state.shadowHeight)return;
 c.save();c.beginPath();c.rect(0,g.barBottom,g.W,g.H-g.barBottom);c.clip();c.filter=`blur(${state.shadowBlur}px)`;
 const y=g.barBottom+state.shadowOffset;
 if(state.gradientShadow){const gradient=c.createLinearGradient(0,y,0,y+state.shadowHeight);gradient.addColorStop(0,rgba(state.shadowColor,state.shadowOpacity/100));gradient.addColorStop(1,rgba(state.shadowColor,0));c.fillStyle=gradient;}
 else c.fillStyle=rgba(state.shadowColor,state.shadowOpacity/100);
 c.fillRect(-g.W*.1,y,g.W*1.2,state.shadowHeight);c.restore();
}
function drawBar(c,g){
 if(!state.showBar)return;
 if(state.template==='cottage'){
  const img=artworkImage(2);if(!img)return;
  // Split the actual top/front/support pixels, keeping their texture and alpha.
  const x=-g.W*.012,w=g.W*1.024,topSource=70,bodySource=100;
  c.save();
  c.drawImage(img,0,0,img.width,topSource,x,g.bar.y,w,g.bar.height-state.barThickness);
  c.drawImage(img,0,topSource,img.width,bodySource-topSource,x,g.barBottom-state.barThickness,w,state.barThickness);
  if(state.supports&&state.supportHeight>0){const end=state.boardOnly?g.board.y+g.board.height:g.H;c.beginPath();c.rect(0,g.barBottom,g.W,Math.max(0,end-g.barBottom));c.clip();c.drawImage(img,0,bodySource,img.width,img.height-bodySource,x,g.barBottom,w,state.supportHeight);}
  c.restore();return;
 }
 const b=g.bar,frontY=b.y+b.height-state.barThickness,topH=frontY-b.y;
 c.save();rounded(c,b.x,b.y,b.width,b.height,state.barSoftness);c.clip();
 let gradient=c.createLinearGradient(0,b.y,0,frontY);
 gradient.addColorStop(0,mix(state.barTopColor,'#FFFFFF',.02));gradient.addColorStop(.5,mix(state.barTopColor,'#FFFFFF',.065));gradient.addColorStop(1,mix(state.barTopColor,state.barFrontColor,.1));
 c.fillStyle=gradient;c.fillRect(b.x,b.y,b.width,topH);
 gradient=c.createLinearGradient(0,frontY,0,b.y+b.height);gradient.addColorStop(0,mix(state.barFrontColor,state.barTopColor,.2));gradient.addColorStop(1,state.barFrontColor);c.fillStyle=gradient;c.fillRect(b.x,frontY,b.width,state.barThickness);
 // Long, deterministic low-contrast grain. No random flicker during updates.
 c.save();c.beginPath();c.rect(b.x,b.y,b.width,topH);c.clip();c.lineWidth=Math.max(.7,g.sx*1.2);c.strokeStyle=rgba(state.barFrontColor,state.woodOpacity/100);
 for(let i=0;i<16;i++){const y=b.y+((i*.137+0.07)%1)*topH,amp=(1+i%3)*state.woodScale*g.sy;const length=g.W*.7*state.woodStretch*state.woodScale;const x=-g.W*.6+(i%4)*g.W*.19;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+length*.32,y-amp,x+length*.7,y+amp,x+length,y);c.stroke();}c.restore();
 const depth=clamp(state.perspectiveDepth,0,topH*.8);
 if(depth>0){gradient=c.createLinearGradient(0,frontY-depth,0,frontY);gradient.addColorStop(0,rgba(state.barFrontColor,.10));gradient.addColorStop(.3,rgba(state.barTopColor,0));gradient.addColorStop(1,rgba(state.barTopColor,0));c.fillStyle=gradient;c.fillRect(b.x,frontY-depth,b.width,depth);}
 if(assets.texture)drawMedia(c,assets.texture,b,{fit:'cover',scale:state.textureScale,x:state.textureX,y:state.textureY,opacity:state.textureOpacity});
 c.strokeStyle=rgba('#FFFFFF',state.barHighlight/100);c.lineWidth=2*g.sy;c.beginPath();c.moveTo(b.x,frontY);c.lineTo(b.x+b.width,frontY);c.stroke();c.restore();
}
function drawBarTopStroke(c,g){
 if(!state.showBar||!state.barTopStroke||!state.barTopStrokeWidth)return;
 c.save();c.beginPath();c.rect(0,g.bar.y,g.W,g.bar.height);c.clip();
 c.strokeStyle=rgba(state.barTopStrokeColor,state.barTopStrokeOpacity/100);
 c.lineWidth=state.barTopStrokeWidth;c.filter=`blur(${state.barTopStrokeBlur}px)`;
 c.beginPath();c.moveTo(-g.W*.02,g.bar.y+state.barTopStrokeWidth/2);c.lineTo(g.W*1.02,g.bar.y+state.barTopStrokeWidth/2);c.stroke();c.restore();
}
function drawBoard(c,g){
 const b=g.board,color=effectiveColor('boardColor');
 if(state.boardAmbientShadow){c.save();c.shadowColor=rgba(state.boardAmbientColor,state.boardAmbientOpacity/100);c.shadowBlur=state.boardAmbientBlur;c.shadowOffsetY=0;fillRound(c,b,color,state.boardRadius);c.restore();}
 c.save();if(state.elevation){c.shadowColor=rgba(state.shadowColor,state.elevationOpacity/100);c.shadowBlur=state.elevationBlur;c.shadowOffsetY=state.elevationOffset;}fillRound(c,b,color,state.boardRadius);c.restore();
 if(state.showBorder&&state.borderWidth>0){c.save();c.globalAlpha=state.borderOpacity/100;c.strokeStyle=state.linkBorder?effectiveColor('deepColor'):state.borderColor;c.lineWidth=state.borderWidth;rounded(c,b.x+state.borderWidth/2,b.y+state.borderWidth/2,b.width-state.borderWidth,b.height-state.borderWidth,Math.max(0,state.boardRadius-state.borderWidth/2));c.stroke();c.restore();}
 if(state.showBorder&&state.borderWidth>0&&state.frameHighlight>0){
  c.save();c.globalAlpha=state.frameHighlight/100*state.borderOpacity/100;c.lineWidth=2*g.sx;
  for(const [inset,color] of [[2*g.sx,'#FFFFFF'],[state.borderWidth+2*g.sx,state.barFrontColor]]){c.strokeStyle=color;rounded(c,b.x+inset,b.y+inset,b.width-2*inset,b.height-2*inset,Math.max(0,state.boardRadius-inset));c.stroke();}c.restore();
 }
}
function drawGrid(c,g){
 const dark=effectiveColor('deepColor'),light=state.lightColor;
 for(const cell of g.cells){const useLight=(cell.col+cell.row)%2===(state.startCell==='light'?0:1),color=useLight?light:dark,r=g.size*state.cellRadius/100;fillRound(c,cell,color,r);
  if(state.cellBevel>0){c.save();rounded(c,cell.x,cell.y,cell.width,cell.height,r);c.clip();const gradient=c.createLinearGradient(cell.x,cell.y,cell.x+cell.width,cell.y+cell.height);gradient.addColorStop(0,rgba('#FFFFFF',state.cellBevel/100));gradient.addColorStop(.6,rgba('#FFFFFF',0));gradient.addColorStop(1,rgba(state.barFrontColor,state.cellBevel/200));c.fillStyle=gradient;c.fillRect(cell.x,cell.y,cell.width,cell.height);c.strokeStyle=rgba(useLight?state.barFrontColor:state.surroundColor,state.cellBevel/45);c.lineWidth=2*g.sx;c.stroke();c.restore();}
 }
}
let playSceneCache=null;
function playSceneLayers(g,includeHelpers){
 // Two layers retain the customer-behind-counter ordering. Videos never enter the cache.
 const key=JSON.stringify(Object.fromEntries(Object.entries(state).filter(([k])=>!k.startsWith('fx'))))+includeHelpers;
 const refs=[assets.image,assets.texture,artwork.background1,artwork.background2];
 if(playSceneCache?.key===key&&refs.every((r,i)=>r===playSceneCache.refs[i]))return playSceneCache;
 const make=()=>{const layer=document.createElement('canvas');layer.width=g.W;layer.height=g.H;return layer;};
 const back=make(),front=make(),b=back.getContext('2d'),f=front.getContext('2d');
 for(const c of [b,f]){c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';}
 if(state.backgroundType!=='video')drawTopBackground(b,g);drawBoardArea(b,g);drawSupports(b,g);drawShadow(b,g);
 drawBar(f,g);drawBarTopStroke(f,g);drawBoard(f,g);drawGrid(f,g);if(includeHelpers&&state.guides)window.drawEditorGuides?.(f,g);
 return playSceneCache={key,refs,back,front};
}
function drawCanvas(target=canvas,includeHelpers=true){
 const g=geometry||calculateLayout();if(target.width!==g.W)target.width=g.W;if(target.height!==g.H)target.height=g.H;
 const c=target===canvas?ctx:target.getContext('2d',{alpha:true,colorSpace:'srgb'});c.clearRect(0,0,g.W,g.H);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 if(target===canvas&&window.renovationScreen?.active){window.renovationScreen.draw(c,g);return target;}
 const cached=target===canvas&&window.mergePlayTest?.active&&g.W*g.H<=8000000?playSceneLayers(g,includeHelpers):null;
 if(cached){if(state.backgroundType==='video')drawTopBackground(c,g);c.drawImage(cached.back,0,0);}else{playSceneCache=null;drawTopBackground(c,g);drawBoardArea(c,g);drawSupports(c,g);drawShadow(c,g);}
 if(target===canvas&&includeHelpers&&typeof drawOrderCustomers==='function')drawOrderCustomers(c,g);
 if(cached)c.drawImage(cached.front,0,0);else{drawBar(c,g);drawBarTopStroke(c,g);drawBoard(c,g);drawGrid(c,g);if(includeHelpers&&state.guides)window.drawEditorGuides?.(c,g);}
 if(target===canvas&&includeHelpers)window.mergePlayTest?.draw(c,g);
 if(!state.boardOnly)drawCurrencyUI(c,g);
 if(target===canvas&&includeHelpers&&typeof drawOrderPayouts==='function')drawOrderPayouts(c,g);
 if(target===canvas&&includeHelpers)window.renovationScreen?.drawOverlay(c,g);
 return target;
}
