'use strict';
function calculateLayout(){
 const W=state.width,H=state.height,sx=W/1170,sy=H/2532;
 state.margin=clamp(state.margin,0,Math.min(100*sx,(W-70)/2));
 const bw=W-state.margin*2;
 state.borderWidth=clamp(state.borderWidth,0,Math.min(20*sx,bw/20));
 state.cellGap=clamp(state.cellGap,0,Math.min(30*sx,bw/30,H*.012));
 state.paddingX=clamp(state.paddingX,0,Math.min(80*sx,bw*.15));
 state.paddingY=clamp(state.paddingY,0,Math.min(80*sy,H*.06));
 // Corner safety inset keeps rounded cells away from the rounded board corners.
 state.boardRadius=clamp(state.boardRadius,0,Math.min(80*sx,bw*.12,H*.08));
 state.borderWidth=Math.min(state.borderWidth,H*.025);
 if(state.linkPadding){const padding=Math.min(state.paddingY,80*sx,bw*.15);state.paddingX=padding;state.paddingY=padding;}
 const safeInset=Math.max(state.showBorder?state.borderWidth:0,state.boardRadius*.3);
 const px=Math.max(state.paddingX,safeInset),py=Math.max(state.paddingY,safeInset);
 const minimumHeight=2*py+8*state.cellGap+9*Math.max(1,Math.min(sx,sy)*3);
 const limit=H*(1-state.bottomReserved/100);
 state.barHeight=clamp(state.barHeight,Math.min(20*sy,H*.04),Math.min(400*sy,limit*.3));
 state.barThickness=clamp(state.barThickness,1,Math.max(1,state.barHeight*.6));
 state.barY=clamp(state.barY,0,Math.max(0,limit-state.barHeight-state.gapToBar-minimumHeight));
 state.topHeight=state.barY;
 const barBottom=state.barY+(state.showBar?state.barHeight:0);
 const minY=barBottom+state.gapToBar;
 state.boardY=clamp(state.boardY,minY,Math.max(minY,limit-minimumHeight));
 const avail=Math.max(minimumHeight,limit-state.boardY);
 const fromWidth=Math.max(1,(bw-2*px-6*state.cellGap)/7);
 const autoHeight=fromWidth*9+8*state.cellGap+2*py;
 const bh=clamp(state.gridMode==='auto'?autoHeight:state.boardHeight,minimumHeight,avail);
 if(state.gridMode==='manual')state.boardHeight=bh;
 const size=Math.max(.1,Math.min(fromWidth,(bh-2*py-8*state.cellGap)/9));
 const gw=7*size+6*state.cellGap,gh=9*size+8*state.cellGap;
 const grid={x:state.margin+(bw-gw)/2,y:state.boardY+(bh-gh)/2,width:gw,height:gh};
 const cells=Array.from({length:63},(_,i)=>({col:i%7,row:Math.floor(i/7),x:grid.x+(i%7)*(size+state.cellGap),y:grid.y+Math.floor(i/7)*(size+state.cellGap),width:size,height:size}));
 const g={W,H,sx,sy,bar:{x:-W*.12,y:state.barY,width:W*1.24,height:state.barHeight},barBottom,board:{x:state.margin,y:state.boardY,width:bw,height:bh},grid,size,cells,bottom:H-state.boardY-bh,limited:autoHeight>avail+.01};
 if(typeof document!=='undefined'&&document.body.classList.contains('mobile-play')){
  const viewport=document.getElementById('viewport');
  if(viewport.clientWidth>0&&viewport.clientHeight>0){
   // Change empty space, never cell/item/portrait dimensions. Very short screens fit uniformly.
   const minTop=(state.fxCurrencyY+state.fxCurrencyHeight+state.fxOrderPortraitHeight+40)*sx;
   const topSlack=Math.max(0,barBottom-minTop),footerSlack=Math.max(0,g.bottom-(state.fxInfoHeight+80)*sx);
   g.H=Math.round(Math.max(H-topSlack-footerSlack,W*viewport.clientHeight/viewport.clientWidth));
   const delta=g.H-H,shift=delta>=0?delta*.45:-Math.min(topSlack,-delta);
   g.bar.y+=shift;g.barBottom+=shift;g.board.y+=shift;g.grid.y+=shift;
   for(const cell of cells)cell.y+=shift;
   g.bottom=g.H-g.board.y-bh;
  }
 }
 return g;
}
// Both the local play shell and release use the same actual viewport dimensions.
function resizeMobilePreview(){
 if(!document.body.classList.contains('mobile-play'))return false;
 const viewport=document.getElementById('viewport'),next=calculateLayout();
 const changed=!geometry||geometry.W!==next.W||geometry.H!==next.H||geometry.board.y!==next.board.y;
 geometry=next;
 const scale=Math.min(viewport.clientWidth/next.W,viewport.clientHeight/next.H);
 canvas.style.maxWidth=next.W*scale+'px';canvas.style.maxHeight=next.H*scale+'px';
 if(changed)drawCanvas();
 return true;
}
