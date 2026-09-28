'use strict';
// Recipe values are also the cache key: editor changes fall back to live rendering.
window.BAR_BAKES=['current','b'].map(barArt=>({
 id:barArt==='current'?'bar-original':'bar-dark',width:1170,height:228,
 settings:{barArt,barHeight:100,barThickness:34,supportHeight:128,imageBarTint:true,imageBarColor:barArt==='current'?'#EACDA4':'#FED090',imageBarBrightness:barArt==='current'?100:120,imageBarSaturation:barArt==='current'?100:75,barTopStroke:true,barTopStrokeWidth:12,barTopStrokeColor:'#A88B68',barTopStrokeOpacity:20,barTopStrokeBlur:8}
}));
