'use strict';
function createPlaytestFeedback(session,label,message,center){
 function feedback(result){
  if(result.kind==='full'){message('盘面已满，请先合成或重新开始。');return;}
  if(result.index>=0){session.selected=result.index;session.effects.set(result.index,performance.now());}
  if(result.kind==='spawn'){
   const from=center(geometry.cells[result.source]),to=center(geometry.cells[result.index]);
   session.flights.set(result.index,{from,to,start:performance.now(),duration:Math.min(360,200+Math.hypot(to.x-from.x,to.y-from.y)*.12)});
   session.effects.set(result.source,performance.now());message('已生成'+label(session.board.slots[result.index])+'。');
  }
  if(result.kind==='merge')message('合成成功：'+label(result.item)+(result.item.level===session.board.max[result.item.type]?'（最高级）':''));
  if(result.kind==='swap')message('已交换位置。');if(result.kind==='move')message('已移动到空格。');drawCanvas();
 }
 return feedback;
}
