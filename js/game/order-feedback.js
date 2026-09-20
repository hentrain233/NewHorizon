'use strict';
// Two quadratic ballistic arcs separated by a short grounded pause.
function orderJumpOffset(elapsed,duration,height){
 if(elapsed<0||elapsed>=duration||duration<=0||height<=0)return 0;
 const t=elapsed/duration;
 const u=t<.48?t/.48:t<.55?0:(t-.55)/.45;
 return -height*(t<.48?1:.65)*4*u*(1-u)||0;
}
function orderCompletionHold(settings){return Math.max(settings.fxOrderHold,settings.fxOrderJumpHeight>0?settings.fxOrderJumpDuration:0)*1000;}
function orderEntrance(elapsed,duration,rise){const t=Math.max(0,Math.min(1,elapsed/duration)),ease=1-Math.pow(1-t,3);return {alpha:ease,offset:rise*(1-ease),done:t===1};}
if(typeof module!=='undefined')module.exports={orderJumpOffset,orderCompletionHold,orderEntrance};
