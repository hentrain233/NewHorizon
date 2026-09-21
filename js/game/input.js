'use strict';
function bindPlaytestInput(session,feedback,message,busy,label,center){
 let orderPan=null;
 function at(p){return geometry.cells.findIndex(c=>p.x>=c.x&&p.x<c.x+c.width&&p.y>=c.y&&p.y<c.y+c.height);}
 function point(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height};}
 function cancel(){const id=orderPan?.id??session.drag?.id;orderPan=null;session.drag=null;session.keyboardSource=-1;if(id!==undefined&&canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);if(session.active)drawCanvas();}
 canvas.addEventListener('pointerdown',e=>{
  if(!session.active||e.button!==0||e.isPrimary===false||session.drag||orderPan)return;const p=point(e);
  if(session.keyboardSource<0&&hitOrderCustomer(p,geometry)){e.preventDefault();orderPan={id:e.pointerId,x:p.x,scroll:orderScroll};canvas.setPointerCapture(e.pointerId);return;}
  const i=at(p);if(i<0||busy(i))return;e.preventDefault();session.selected=i;session.keyboardSource=-1;
  if(session.board.slots[i]){const origin=center(geometry.cells[i]);session.drag={from:i,target:i,startX:e.clientX,startY:e.clientY,p,offset:{x:origin.x-p.x,y:origin.y-p.y},lift:performance.now(),moved:false,id:e.pointerId};canvas.setPointerCapture(e.pointerId);}
  message(label(session.board.slots[i])||'空格');drawCanvas();
 });
 canvas.addEventListener('pointermove',e=>{if(!session.active)return;if(orderPan?.id===e.pointerId){e.preventDefault();setOrderScroll(orderPan.scroll+(orderPan.x-point(e).x)*1170/geometry.W,geometry);return;}if(!session.drag||session.drag.id!==e.pointerId)return;e.preventDefault();if(!session.drag.moved&&Math.hypot(e.clientX-session.drag.startX,e.clientY-session.drag.startY)>5){session.drag.moved=true;session.drag.lift=performance.now();}session.drag.p=point(e);session.drag.target=at(session.drag.p);});
 canvas.addEventListener('pointerup',e=>{
  if(orderPan?.id===e.pointerId){orderPan=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);return;}
  if(!session.active||!session.drag||session.drag.id!==e.pointerId)return;const current=session.drag;session.drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
  const p=point(e),to=at(p),order=current.moved?hitOrderCustomer(p,geometry):null;
  if(order){if(!window.mergePlayTest.submitOrderItem(order.id,current.from)){session.failures.set(current.from,performance.now());message('这个订单不需要该物品，已放回原格。');}}
  else if(current.moved){if(!busy(to))feedback(session.board.move(current.from,to));}else if(to===current.from){feedback(session.board.generate(current.from));}drawCanvas();
 });
 canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('lostpointercapture',()=>{if(session.drag||orderPan)cancel();});window.addEventListener('blur',cancel);
 canvas.tabIndex=0;
 canvas.addEventListener('keydown',e=>{
  if(!session.active)return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter','Escape'].includes(e.key))e.preventDefault();
  if(e.key.startsWith('Arrow')){const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key];session.selected=Math.max(0,Math.min(62,(session.selected<0?0:session.selected)+delta));message(label(session.board.slots[session.selected])||'空格');drawCanvas();}
  else if(e.key===' '&&!busy(session.selected))feedback(session.board.generate(session.selected));
  else if(e.key==='Enter'){if(session.keyboardSource<0){if(session.board.slots[session.selected]&&!busy(session.selected)){session.keyboardSource=session.selected;message('用方向键选择目标格，再按回车移动或合成。');}}else{if(!busy(session.selected))feedback(session.board.move(session.keyboardSource,session.selected));session.keyboardSource=-1;}}
  else if(e.key==='Escape')cancel();
 });

}
