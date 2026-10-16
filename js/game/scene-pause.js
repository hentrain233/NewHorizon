'use strict';
// One clock for both map navigation and modal panels; nested reasons cannot resume each other.
function createScenePause(renderer){
 const reasons=new Set();let pausedAt=null;
 return {set(reason,value){
  if(value){if(!reasons.size)pausedAt=performance.now();reasons.add(reason);return;}
  if(!reasons.delete(reason)||reasons.size)return;
  const elapsed=performance.now()-pausedAt;pausedAt=null;renderer.resume(elapsed);
  for(const entry of orderQueue.entries)for(const key of ['arrivedAt','completedAt'])if(entry[key]!=null)entry[key]+=elapsed;
  for(const payout of orderPayouts)payout.start+=elapsed;
  if(orderQueue.refillReadyAt!=null)orderQueue.refillReadyAt+=elapsed;
  orderFrame=performance.now();
 }};
}
