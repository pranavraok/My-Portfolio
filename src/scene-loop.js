// Offscreen scenes own no animation frame callbacks or layout reads. Keep one
// initial frame for the loading screen, then resume on intersection/tab return.
export function startSceneLoop(host, draw, onVisibility=()=>{}) {
  let visible=false, frame=0, disposed=false, first=true;
  const schedule=()=>{
    if(!disposed&&!frame&&!document.hidden&&(first||visible))frame=requestAnimationFrame(tick);
  };
  const tick=time=>{
    frame=0;
    if(disposed||document.hidden||(!first&&!visible))return;
    first=false;
    draw(time);
    schedule();
  };
  const observer=new IntersectionObserver(([entry])=>{
    if(disposed)return;
    visible=entry.isIntersecting;
    onVisibility(visible);
    if(!visible&&frame&&!first){cancelAnimationFrame(frame);frame=0;}
    schedule();
  });
  const visibility=()=>{
    if(document.hidden){cancelAnimationFrame(frame);frame=0;}
    else schedule();
  };
  observer.observe(host);
  document.addEventListener('visibilitychange',visibility);
  schedule();
  return ()=>{
    disposed=true;cancelAnimationFrame(frame);observer.disconnect();
    document.removeEventListener('visibilitychange',visibility);
  };
}
