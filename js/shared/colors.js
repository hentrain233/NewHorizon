'use strict';
function rgbToHsl(hex){
 const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;
 let h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));h=max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;h=((h*60)%360+360)%360;}return [h,s*100,l*100];
}
function hslToHex(h,s,l){s=clamp(s,0,100)/100;l=clamp(l,0,100)/100;const a=s*Math.min(l,1-l);return '#'+[0,8,4].map(n=>{const k=(n+h/30)%12;return Math.round((l-a*Math.max(-1,Math.min(k-3,9-k,1)))*255).toString(16).padStart(2,'0');}).join('').toUpperCase();}
function effectiveColor(key){const [h,s,l]=rgbToHsl(state[key]);return hslToHex(h,s+state.saturationOffset,l+state.brightnessOffset);}
