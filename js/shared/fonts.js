'use strict';
// Embedded data avoids local-file CORS restrictions and system font dependencies.
const bundledFontsReady=Promise.all((window.MERGE_FONT_ASSETS||[]).map(async spec=>{
 const face=new FontFace(spec.family,`url("${spec.source}")`,{style:spec.style,weight:spec.weight});
 try{await face.load();document.fonts.add(face);return face;}catch(error){notify(`字体加载失败：${spec.family}`);throw error;}
}));
bundledFontsReady.then(()=>{if(geometry)updatePreview();}).catch(()=>{});
function currencyFont(){
 const name=state.fxCurrencyFont;
 // Display fonts already have heavy outlines: don't synthesize another bold layer.
 const weight=['Changa One','Lilita One','ZCOOL KuaiLe'].includes(name)?400:name==='Fredoka'?Math.min(700,Number(state.fxCurrencyFontWeight)):state.fxCurrencyFontWeight;
 return `${state.fxCurrencyItalic?'italic':'normal'} ${weight} ${state.fxCurrencyFontSize}px "${name}", sans-serif`;
}
