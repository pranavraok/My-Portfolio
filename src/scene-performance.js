// Bounded diagnostics make rendering regressions visible without a debug overlay.
export function measureScene(host, renderer) {
  let start=0, previous=0, frames=0, work=0, slow=0, calls=0;
  return {
    begin(time) {
      if(previous&&time-previous>=250){start=time;frames=work=slow=calls=0;}
      if(previous && time-previous<250 && time-previous>25) slow++;
      previous=time;
      if(!start)start=time;
      renderer.info.autoReset=false;
      renderer.info.reset();
      return performance.now();
    },
    end(time, began) {
      const elapsed=performance.now()-began;
      if(!host.dataset.warmupMs)host.dataset.warmupMs=elapsed.toFixed(1);
      frames++;work+=elapsed;calls+=renderer.info.render.calls;
      if(time-start<1500)return;
      host.dataset.performance=JSON.stringify({fps:Math.round(frames*1000/(time-start)),frameMs:+(work/frames).toFixed(1),slowFrames:slow,drawCalls:Math.round(calls/frames)});
      start=time;frames=work=slow=calls=0;
    },
  };
}
