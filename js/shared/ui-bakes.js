'use strict';
// Shared by the offline exporter and live editor. Published recipes draw PNGs directly.
const uiBakeCache=new Map(),uiBakeImages=new Map();
for(const entry of window.UI_BAKES||[]){const image=new Image();image.src=entry.data;uiBakeImages.set(entry.key,{...entry,image});}
const uiBakesReady=Promise.all([...uiBakeImages.values()].map(e=>e.image.decode().catch(()=>{})));
function paintCachedUI(c,kind,variant,box,paint){
 const prefix={order:'fxBubble',currency:'fxCurrency',info:'fxInfo',tab:'fxInfo'}[kind];
 const key=JSON.stringify([kind,variant,Object.entries(state).filter(([k])=>k.startsWith(prefix))]);
 let entry=uiBakeCache.get(key);
 const baked=uiBakeImages.get(key);
 if(baked?.image.complete&&baked.image.naturalWidth){c.drawImage(baked.image,baked.x,baked.y);return;}
 if(!entry){
  const image=document.createElement('canvas');image.width=Math.ceil(box.width);image.height=Math.ceil(box.height);
  const d=image.getContext('2d');d.translate(-box.x,-box.y);paint(d);
  entry={key,kind,...box,image};if(uiBakeCache.size>=128)uiBakeCache.delete(uiBakeCache.keys().next().value);uiBakeCache.set(key,entry);
 }
 c.drawImage(entry.image,entry.x,entry.y);
}
