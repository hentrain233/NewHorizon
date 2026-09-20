'use strict';
const artwork={};
const recolorCache=new Map();
const artworkReady=Promise.all([1,2,'coin','energy'].map(n=>new Promise(resolve=>{
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
let videoFrameCache=null,videoFrameSource=null,videoFrameTime=-1;
function getVideoFrame(){
 const video=assets.video;
 if(videoFrameSource!==video){videoFrameSource=video;videoFrameCache=null;videoFrameTime=-1;}
 if(!video)return null;
 if(video.readyState>=2&&!video.seeking&&video.videoWidth&&video.videoHeight&&video.currentTime!==videoFrameTime){
  try{
   if(!videoFrameCache){videoFrameCache=document.createElement('canvas');videoFrameCache.width=video.videoWidth;videoFrameCache.height=video.videoHeight;}
   videoFrameCache.getContext('2d').drawImage(video,0,0,videoFrameCache.width,videoFrameCache.height);
   videoFrameTime=video.currentTime;
  }catch{ /* Retain the last decoded frame until the next one is available. */ }
 }
 return videoFrameCache;
}
function updatePlayback(){if(!assets.video)return;if(state.backgroundType==='video')assets.video.play().catch(()=>notify('浏览器暂停了自动播放，请点击预览继续。'));else assets.video.pause();}
function animate(){if(!document.hidden&&(window.mergePlayTest?.active||state.backgroundType==='video'&&assets.video?.readyState>=2&&!assets.video.paused))drawCanvas();requestAnimationFrame(animate);}
