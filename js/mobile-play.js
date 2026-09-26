'use strict';
// A presentation shell only: retain the same board, orders, save and map runtime.
(()=>{
 const query=new URLSearchParams(location.search);
 const player=window.MERGE_PLAYER_BUILD===true;
 const phone=matchMedia('(pointer: coarse) and (max-width: 900px)').matches;
 if(!player&&(query.has('editor')||(!query.has('play')&&!phone)))return;
 document.body.classList.add('mobile-play');
 if(player)document.body.classList.add('player-build');
 const gate=document.createElement('div');gate.className='play-gate';gate.innerHTML='<h1>海岛合成 · 试玩</h1><p>点击生成器获得物品，拖动同类同级物品合成。<br>拖到客人的订单上提交，赚取金币翻新餐厅。</p><button class="primary">开始试玩</button><p class="play-note">建议竖屏 · 进度保存在当前浏览器<br>测试期间，刷新会重置餐厅翻新进度和金币（100），体力每 5 分钟恢复 1 点</p>';document.body.appendChild(gate);
 const menu=window.createMobileEditorMenu?.();
 const restartBtn=player?document.createElement('button'):null;
 if(restartBtn){restartBtn.className='player-restart';restartBtn.textContent='重新开始';restartBtn.hidden=true;restartBtn.onclick=()=>{if(window.renovationScreen?.active){notify('请先返回合成界面再重新开始。');return;}if(!confirm('重新开始会重置棋盘、订单、金币和体力，确定吗？'))return;window.mergePlayTest.restart();};document.body.appendChild(restartBtn);}
 const begin=gate.querySelector('button');
 begin.onclick=async()=>{begin.disabled=true;begin.textContent='加载中…';try{await window.startupReady;await artworkReady;
   // A bundled URL works on Pages too; a local IndexedDB video still takes priority.
   if(!assets.video){const video=document.createElement('video');video.muted=true;video.loop=true;video.playsInline=true;video.preload='auto';video.src='assets/play-background.mp4';video.addEventListener('error',()=>notify('背景视频暂未加载，其他玩法可正常使用。'),{once:true});assets.video=video;state.topColor='#77CCDD';video.play().catch(()=>{});}
   await window.mergePlayTest.toggle();if(!window.mergePlayTest.active)throw Error('未能进入试玩，请重试。');gate.remove();if(menu)menu.hidden=false;if(restartBtn)restartBtn.hidden=false;
   resizePreview();drawCanvas();
  }catch(error){notify(error.message);}finally{begin.disabled=false;begin.textContent='开始试玩';}};
 canvas.addEventListener('contextmenu',e=>e.preventDefault());
 // Let the map own pinch gestures; never turn them into editor preview zoom.
 document.addEventListener('visibilitychange',()=>{if(document.hidden){assets.video?.pause();window.flushGameSave();}else updatePlayback();});
 window.visualViewport?.addEventListener('resize',resizePreview);
})();
