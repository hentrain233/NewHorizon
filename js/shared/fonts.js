'use strict';
// Embedded data avoids local-file CORS restrictions and system font dependencies.
// Title face is fonts/FZCuYuan-Web.woff2, family "FZCuYuan" in CSS.
let FZCuYuanLoaded=false;
const titleFontReady=(async()=>{
 try{
  const faces=await document.fonts.load('64px "FZCuYuan"');
  // FontFace.family serialization may retain quotes; use the faces returned by load.
  FZCuYuanLoaded=faces.some(font=>font.status==='loaded');
 }catch(error){console.error(error);}
})();
const bundledFontsReady=Promise.all([...(window.MERGE_FONT_ASSETS||[]).map(async spec=>{
 const face=new FontFace(spec.family,`url("${spec.source}")`,{style:spec.style,weight:spec.weight});
 try{await face.load();document.fonts.add(face);return face;}catch(error){notify(`字体加载失败：${spec.family}`);throw error;}
}),titleFontReady]);
bundledFontsReady.then(()=>{if(geometry)updatePreview();}).catch(()=>{});
function currencyFont(size=state.fxCurrencyFontSize){
 const name=state.fxCurrencyFont;
 // Display fonts already have heavy outlines: don't synthesize another bold layer.
 const weight=['Changa One','Lilita One','ZCOOL KuaiLe'].includes(name)?400:name==='Fredoka'?Math.min(700,Number(state.fxCurrencyFontWeight)):state.fxCurrencyFontWeight;
 return `${state.fxCurrencyItalic?'italic':'normal'} ${weight} ${size}px "${name}", sans-serif`;
}
