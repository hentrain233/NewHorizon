'use strict';
const artwork={};
const recolorCache=new Map();
const artworkReady=Promise.all([1,'1-new',2,'2a','2b','coin','energy','energyCorner','premium',...(window.BAR_BAKES||[]).map(b=>b.id)].map(n=>new Promise(resolve=>{
 const img=new Image();img.onload=()=>{artwork['background'+n]=img;resolve();if(geometry)updatePreview();};
 img.onerror=()=>{notify('内置图片加载失败，请保留背景及货币资源文件。');resolve();};
 img.src=n==='1-new'?'assets/background1-new.png':String(n).startsWith('bar-')?'assets/baked-bars/'+n+'.png':window.MERGE_BACKGROUND_ASSETS?.['background'+n]||window.MERGE_CURRENCY_ASSETS?.[n]||'';
})));
function artworkImage(n){
 // The new preset is finished artwork; keep the original preset's tint settings untouched.
 if(n===1&&state.wallArt==='new'&&artwork['background1-new'])return artwork['background1-new'];
 let name=n===2&&state.barArt==='a'?'background2a':n===2&&state.barArt==='b'?'background2b':'background'+n;
 let original=artwork[name];if(!original&&n===2){name='background2';original=artwork.background2;}if(!original)return null;
 const prefix=n===1?'imageWall':'imageBar',tint=!!state[prefix+'Tint'],brightness=(state[prefix+'Brightness']??100)/100,saturation=(state[prefix+'Saturation']??100)/100;
 if(!tint&&brightness===1&&saturation===1)return original;
 const color=state[prefix+'Color'],key=name+'|'+tint+'|'+color+'|'+brightness+'|'+saturation;if(recolorCache.has(key))return recolorCache.get(key);
 // Bake tint, brightness and saturation into pixels. Canvas filters are dropped on some browsers.
 const output=document.createElement('canvas');output.width=original.width;output.height=original.height;
 const c=output.getContext('2d',{willReadFrequently:true});c.drawImage(original,0,0);
 if(tint){const originalPixels=c.getImageData(0,0,output.width,output.height);c.globalCompositeOperation='color';c.fillStyle=color;c.fillRect(0,0,output.width,output.height);const tinted=c.getImageData(0,0,output.width,output.height);for(let i=3;i<tinted.data.length;i+=4)tinted.data[i]=originalPixels.data[i];c.putImageData(tinted,0,0);}
 if(brightness!==1||saturation!==1){const pixels=c.getImageData(0,0,output.width,output.height),data=pixels.data;for(let i=0;i<data.length;i+=4){const l=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];for(let k=0;k<3;k++)data[i+k]=Math.max(0,Math.min(255,(l+(data[i+k]-l)*saturation)*brightness));}c.putImageData(pixels,0,0);}
 if(recolorCache.size>=4)recolorCache.delete(recolorCache.keys().next().value);recolorCache.set(key,output);return output;
}
// Keep the last presented frame across loop seeks / decoder stalls. Never expose the white base.
let videoFrameCache=null,videoFrameSource=null,videoFrameTime=-1,videoFrameRevision=0,videoFrameDrawAt=-Infinity;
function getVideoFrame(){
 const video=assets.video;
 if(videoFrameSource!==video){videoFrameSource=video;videoFrameCache=null;videoFrameTime=-1;}
 if(!video)return null;
 if(video.readyState>=2&&!video.seeking&&video.videoWidth&&video.videoHeight&&video.currentTime!==videoFrameTime&&performance.now()-videoFrameDrawAt>=33){
  try{
   if(!videoFrameCache){videoFrameCache=document.createElement('canvas');videoFrameCache.width=Math.min(640,video.videoWidth);videoFrameCache.height=Math.round(video.videoHeight*videoFrameCache.width/video.videoWidth);}
   videoFrameCache.getContext('2d').drawImage(video,0,0,videoFrameCache.width,videoFrameCache.height);
   videoFrameTime=video.currentTime;
   videoFrameRevision++;videoFrameDrawAt=performance.now();
  }catch{ /* Retain the last decoded frame until the next one is available. */ }
 }
 return videoFrameCache;
}
// Small, cached pixel blur works on browsers without Canvas 2D filter (including older iOS).
// Linear sliding windows avoid a costly per-pixel radius loop or full-resolution readback.
const mediaFilterCache=new WeakMap();
function filteredMedia(media,opt,drawWidth){
 if(media===videoFrameCache&&assets.video?.dataset.baked==='true')return media;
 const width=media.naturalWidth||media.width,height=media.naturalHeight||media.height;
 const w=Math.min(640,width),h=Math.max(1,Math.round(height*w/width));
 const radius=opt.blur>0?Math.max(1,Math.round(opt.blur*w/drawWidth*.7)):0;
 const brightness=(opt.brightness??100)/100,saturation=(opt.saturation??100)/100;
 if(!radius&&brightness===1&&saturation===1)return media;
 const key=[w,h,radius,brightness,saturation,media===videoFrameCache?videoFrameRevision:0].join(':');
 let entry=mediaFilterCache.get(media);if(entry?.key===key)return entry.canvas;
 if(!entry){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;entry={canvas,context:canvas.getContext('2d',{willReadFrequently:true}),scratch:new Uint8ClampedArray(w*h*4)};mediaFilterCache.set(media,entry);}
 const c=entry.context;c.clearRect(0,0,w,h);c.drawImage(media,0,0,w,h);
 const pixels=c.getImageData(0,0,w,h),data=pixels.data,temp=entry.scratch;
 const pass=(src,dst,horizontal)=>{const length=horizontal?w:h,lines=horizontal?h:w,stride=horizontal?4:w*4,span=radius*2+1;
  for(let line=0;line<lines;line++){const base=horizontal?line*w*4:line*4;
   for(let channel=0;channel<4;channel++){let sum=0;for(let j=-radius;j<=radius;j++)sum+=src[base+Math.max(0,Math.min(length-1,j))*stride+channel];
    for(let i=0;i<length;i++){dst[base+i*stride+channel]=sum/span;sum+=src[base+Math.min(length-1,i+radius+1)*stride+channel]-src[base+Math.max(0,i-radius)*stride+channel];}
   }
  }
 };
 if(radius)for(let n=0;n<2;n++){pass(data,temp,true);pass(temp,data,false);}
 if(brightness!==1||saturation!==1)for(let i=0;i<data.length;i+=4){const l=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];for(let k=0;k<3;k++)data[i+k]=(l+(data[i+k]-l)*saturation)*brightness;}
 c.putImageData(pixels,0,0);entry.key=key;return entry.canvas;
}
function useDefaultVideo(){
 const video=document.createElement('video');video.muted=true;video.loop=true;video.playsInline=true;video.preload='auto';video.dataset.defaultBackground='true';
 video.addEventListener('loadeddata',()=>{videoFrameCache=null;videoFrameTime=-1;updatePreview();});
 video.addEventListener('error',()=>notify('背景视频暂未加载，请检查内置视频文件。'));
 assets.video?.pause();assets.video=video;
 if(location.protocol==='file:'&&!window.LOCAL_BACKGROUND_VIDEOS){
  const script=document.createElement('script');script.src='assets/local-background-videos.js';script.onload=()=>updatePlayback();script.onerror=()=>notify('本地视频预览资源缺失，请重新烘焙视频。');document.head.appendChild(script);
 }
 updatePlayback();return video;
}
function updatePlayback(){
 const video=assets.video;if(!video)return;
 if(video.dataset.defaultBackground){
  const baked=window.MERGE_PLAYER_BUILD===true||(state.mediaBlur===8&&state.mediaBrightness===105&&state.mediaSaturation===80);
  const source=location.protocol==='file:'?window.LOCAL_BACKGROUND_VIDEOS?.[baked?'baked':'raw']:'assets/play-background'+(baked?'-baked':'')+'.mp4';
  if(!source)return;
  if(video.getAttribute('src')!==source){video.dataset.baked=String(baked);video.src=source;videoFrameCache=null;videoFrameTime=-1;}
 }
 if(state.backgroundType==='video'&&!document.hidden&&!window.renovationScreen?.active&&!window.itemDetails?.active)video.play().catch(()=>{});else video.pause();
}
function animate(){
 const start=performance.now();
 if(!document.hidden){if(window.itemDetails?.active){if(orderSurface)orderSurface.hidden=true;window.itemDetails.drawFrozen(canvas);window.itemDetails.draw();}else if(window.mergePlayTest?.active||state.backgroundType==='video'&&assets.video?.readyState>=2&&!assets.video.paused)drawPlayFrame();}
 const moving=!window.itemDetails?.active&&(window.renovationScreen?.active?window.renovationScreen?.moving:window.mergePlayTest?.moving);
 const interval=document.hidden?250:moving||window.renovationScreen?.busy?1000/60:1000/20;
 setTimeout(()=>requestAnimationFrame(animate),Math.max(0,interval-(performance.now()-start)-5));
}
