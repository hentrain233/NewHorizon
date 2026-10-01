'use strict';
// Tray artwork replaces the drawn speech bubble. Width and height are design pixels at a 1170-wide canvas.
const orderPlateImage=new Image();
orderPlateImage.onload=()=>{if(typeof updatePreview==='function')updatePreview();};
orderPlateImage.src=window.ORDER_PLATE_ASSET||'';
function orderBubbleWidth(){return state.fxBubbleWidth;}
function orderBubbleHeight(){return state.fxBubbleHeight;}
function orderStride(){return state.fxBubbleWidth+state.fxOrderGap;}
function paintOrderBubble(c){
 const img=orderPlateImage;
 if(!img.complete||!img.naturalWidth)return;
 c.drawImage(img,0,0,state.fxBubbleWidth,state.fxBubbleHeight);
}
