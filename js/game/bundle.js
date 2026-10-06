'use strict';
// Original PSD coordinates; the item-details host owns sizing, shade, freeze and close.
window.MERGE_GAME_ASSETS={...window.MERGE_GAME_ASSETS,chest1:'assets/bundle/chest.png'};
function createWelcomeBundle(runtime,host){
 const art={},files=['base','set1','set2','button','button_pressed','close','off','off-motion','seastar','tata','tata-shadow','background-mask'];
 let ready;
 function load(){return ready||(ready=Promise.all([...files.map(name=>new Promise((resolve,reject)=>{
  const img=new Image();img.onload=()=>{art[name]=img;resolve();};img.onerror=()=>reject(Error('礼包素材加载失败：'+name));img.src='assets/bundle/'+name+'.png';
 })),new Promise((resolve,reject)=>{
  video.onloadeddata=()=>{video.onloadeddata=video.onerror=null;resolve();};video.onerror=()=>{video.onloadeddata=video.onerror=null;reject(Error('礼包背景视频加载失败'));};video.src='assets/bundle/background.mp4';video.load();
 })]).catch(error=>{ready=null;throw error;}));}
 const video=document.createElement('video');video.loop=true;video.muted=true;video.playsInline=true;video.preload='none';
 const frame=document.createElement('canvas'),f=frame.getContext('2d');let hasFrame=false,running=false,lastVideoTime=-1,entryFit='';
 const entry=document.createElement('button');entry.id='welcome-bundle-entry';entry.type='button';entry.setAttribute('aria-label','海滩欢迎礼包');
 entry.innerHTML='<img src="assets/bundle/off.png" alt="">';
 Object.assign(entry.style,{position:'fixed',zIndex:3,border:0,padding:0,background:'transparent',cursor:'pointer',touchAction:'manipulation'});
 Object.assign(entry.firstChild.style,{width:'100%',height:'100%',objectFit:'contain',display:'block'});document.body.appendChild(entry);
 entry.onclick=()=>{if(!runtime.state.welcomeBundleClaimed)host.openPanel(panel);};
 function placeEntry(){
  const hidden=!!runtime.state.welcomeBundleClaimed||!window.mergePlayTest?.active||!!window.renovationScreen?.active||!!window.renovationScreen?.busy||host.active;
  if(entry.hidden!==hidden)entry.hidden=hidden;
  if(entry.hidden)return;
  const r=canvas.getBoundingClientRect(),g=geometry,s=r.width/1170;
  const fit=[r.right-132*s,r.top+(state.fxCurrencyY*g.H/state.height+state.fxCurrencyHeight+28)*r.height/g.H,110*s,114*s];
  if(fit.join(',')===entryFit)return;entryFit=fit.join(',');
  Object.assign(entry.style,{left:fit[0]+'px',top:fit[1]+'px',width:fit[2]+'px',height:fit[3]+'px'});
 }
 let price,pendingRewards=null,pressedAt=null,claimTimer=null;
 function preparePrice(){
  if(price)return;
  const glyph=document.createElement('canvas');glyph.width=280;glyph.height=140;
  const g=glyph.getContext('2d');g.font='400 96.01199px "FZCuYuan"';g.fillStyle='#fff';g.fillText('$0.00',14,112);
  price=document.createElement('canvas');price.width=glyph.width;price.height=glyph.height;
  const c=price.getContext('2d');c.font=g.font;c.lineJoin='round';c.strokeStyle='#097104';c.lineWidth=14;c.strokeText('$0.00',14,112);
  // PSD outside-only 7px: remove the original glyph from the centered stroke first.
  c.globalCompositeOperation='destination-out';c.drawImage(glyph,0,0);
  c.globalCompositeOperation='source-over';c.drawImage(glyph,0,0);
 }
 const panel={get ready(){return load();},layout:{width:1320,screen:2868,top:307,height:1996,inside:{left:86,top:307,right:1202,bottom:2303}},
  start(button,close){
   const width=Math.min(1037,Math.ceil(canvas.getBoundingClientRect().width/1320*1037*Math.min(2,devicePixelRatio||1)));
   if(frame.width!==width){frame.width=Math.max(1,width);frame.height=Math.ceil(frame.width*1664/1037);hasFrame=false;lastVideoTime=-1;}
   running=true;pendingRewards=null;pressedAt=null;preparePrice();video.play().catch(()=>notify('背景视频暂时无法播放。'));
   button('关闭礼包',{x:1035,y:583,width:162,height:160},close);
   const claimButton=button('免费领取礼包',{x:354,y:1957,width:613,height:233},()=>{
    if(claimTimer!==null)return;
    pressedAt=performance.now();claimButton.disabled=true;host.draw();
    claimTimer=setTimeout(()=>{
    claimTimer=null;if(!running)return;
    const result=runtime.claimWelcomeBundle();
    if(!result.ok){pressedAt=null;claimButton.disabled=false;notify(result.reason==='full'?'合成盘已满，请先空出一个格子再领取。':'礼包已领取或暂时无法领取。');return;}
    const popup=document.querySelector('#item-details canvas').getBoundingClientRect(),game=canvas.getBoundingClientRect();
    pendingRewards=[['premium',50,156,137],['energy',100,417,133]].map(([icon,amount,x,y])=>({icon,amount,
     count:Math.max(1,Math.min(8,Math.ceil(Math.log2(amount+1)))),duration:state.fxRepairFillDuration,
     source:{x:(popup.left+(239+x*845/842)/1320*popup.width-game.left)*geometry.W/game.width,
      y:(popup.top+(1614+y*298/296-307)/1996*popup.height-game.top)*geometry.H/game.height},
     target:currencyBarPoint(geometry,icon)}));
    window.flushGameSave();close();placeEntry();notify('已领取：50 宝石、100 能量和一个宝箱。');
    },180);
   });
   claimButton.addEventListener('pointerdown',()=>{pressedAt=performance.now();host.draw();});
   const release=()=>{if(claimTimer===null){pressedAt=null;host.draw();}};
   claimButton.addEventListener('pointerup',release);claimButton.addEventListener('pointercancel',release);claimButton.addEventListener('pointerleave',release);
   placeEntry();
  },
  stop(){
   running=false;video.pause();
   clearTimeout(claimTimer);claimTimer=null;pressedAt=null;
   // The shared host has resumed old payout clocks before calling stop; new flights start now.
   if(pendingRewards){const start=performance.now();orderPayouts.push(...pendingRewards.map(p=>({...p,start})));pendingRewards=null;}
   if(runtime.state.welcomeBundleClaimed){
    for(const name of Object.keys(art))delete art[name];ready=null;
    video.onloadeddata=video.onerror=null;video.removeAttribute('src');video.load();
    frame.width=frame.height=0;hasFrame=false;lastVideoTime=-1;
    if(price)price.width=price.height=0;price=null;
   }
   placeEntry();
  },
  draw(c,time,layer){
   const paint=(name,x,y,w,h)=>c.drawImage(art[name],x,y,w,h);
   layer(0,22,()=>{
    paint('base',119,565,1083,1738);
    // Keep the last decoded frame across loop seeking: never replace it with a blank frame.
    if(video.readyState>=2&&video.videoWidth&&video.currentTime!==lastVideoTime){
     f.globalCompositeOperation='source-over';f.clearRect(0,0,frame.width,frame.height);f.drawImage(video,0,0,frame.width,frame.height);
     f.globalCompositeOperation='destination-in';f.drawImage(art['background-mask'],0,0,frame.width,frame.height);f.globalCompositeOperation='source-over';hasFrame=true;lastVideoTime=video.currentTime;
    }
    if(hasFrame)c.drawImage(frame,142,602,1037,1664);
    paint('set1',142,307,1029,437);
   });
   layer(140,16,()=>{
    c.save();c.translate(784,1858);c.rotate(Math.sin(time/8000*Math.PI*2)*Math.PI/60);c.translate(-784,-1858);
    paint('tata-shadow',-36.5,648,1133,1267);paint('tata',223.5,678,873,1207);c.restore();
    paint('set2',239,1614,845,298);
    const press=pressedAt===null?0:1-(1-Math.min(1,(performance.now()-pressedAt)/90))**3;
    paint('button',354,1957,613,233);
    if(pressedAt!==null){c.save();c.globalAlpha*=press;c.drawImage(art.button_pressed,14,9,613,233,354,1957,613,233);c.restore();}
    paint('seastar',86,1989,161,153);paint('close',1049,597,134,132);c.drawImage(price,536.73755-14,2101.12762-112+3*press);
   });
   layer(280,0,()=>{
    const elapsed=Math.max(0,time-280);
    if(elapsed>=200)paint('off',828,1898,231,235);
    else c.drawImage(art['off-motion'],Math.min(3,Math.floor(elapsed/50))*280,0,280,280,804,1876,280,280);
   });
  }
 };
 document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else if(running)video.play().catch(()=>{});});
 return {placeEntry,open:()=>entry.click(),get video(){return video;},get cachedImageCount(){return Object.keys(art).length;}};
}
