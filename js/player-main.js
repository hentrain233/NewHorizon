'use strict';
// Player-only bootstrap. Shares design defaults and rendering, never loads editor controls.
state={...DEFAULT_STATE,...STARTUP_PRESET.state,guides:false};
function notify(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4200);}
function resizePreview(){
 if(resizeMobilePreview())return;
 const viewport=$('viewport');
 const scale=Math.max(.015,Math.min(viewport.clientWidth/state.width,viewport.clientHeight/state.height));
 canvas.style.maxWidth=state.width*scale+'px';canvas.style.maxHeight=state.height*scale+'px';
}
function updatePreview(){geometry=calculateLayout();drawCanvas();resizePreview();}
canvas.addEventListener('click',updatePlayback);
new ResizeObserver(resizePreview).observe($('viewport'));
updatePreview();
requestAnimationFrame(animate);
window.startupReady=Promise.resolve();
