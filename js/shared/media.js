'use strict';
const artwork={};
const recolorCache=new Map();
const artworkReady=Promise.all([1,2,'coin','energy','premium'].map(n=>new Promise(resolve=>{
 const img=new Image();img.onload=()=>{artwork['background'+n]=img;resolve();if(geometry)updatePreview();};
 img.onerror=()=>{notify('内置图片加载失败，请保留背景及货币资源文件。');resolve();};
 img.src=typeof n==='number'?window.MERGE_BACKGROUND_ASSETS?.['background'+n]||'':window.MERGE_CURRENCY_ASSETS?.[n]||'';
})));
function artworkImage(n){
 const original=artwork['background'+n];if(!original)return null;
 const prefix=n===1?'imageWall':'imageBar';if(!state[prefix+'Tint'])return original;
 const color=state[prefix+'Color'],key=n+color;if(recolorCache.has(key))return recolorCache.get(key);
 // The color blend replaces hue/saturation but keeps the original wood lighting.
 const output=document.createElement('canvas');output.width=original.width;output.height=original.height;
 const c=output.getContext('2d');c.drawImage(original,0,0);
 const originalPixels=c.getImageData(0,0,output.width,output.height);
 c.globalCompositeOperation='color';c.fillStyle=color;c.fillRect(0,0,output.width,output.height);
 const tinted=c.getImageData(0,0,output.width,output.height);
 for(let i=3;i<tinted.data.length;i+=4)tinted.data[i]=originalPixels.data[i];
 c.putImageData(tinted,0,0);
 if(recolorCache.size>=4)recolorCache.delete(recolorCache.keys().next().value);recolorCache.set(key,output);return output;
}
function artworkFilter(prefix){return `brightness(${state[prefix+'Brightness']}%) saturate(${state[prefix+'Saturation']}%)`;}
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
function updatePlayback(){if(!assets.video)return;if(state.backgroundType==='video')assets.video.play().catch(()=>notify('浏览器暂停了自动播放，请点击预览继续。'));else assets.video.pause();}
function animate(){if(!document.hidden&&(window.mergePlayTest?.active||state.backgroundType==='video'&&assets.video?.readyState>=2&&!assets.video.paused))drawCanvas();requestAnimationFrame(animate);}
