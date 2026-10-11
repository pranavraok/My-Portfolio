import { useEffect, useRef } from "react";
import Scene from "./Scene.jsx";

export default function ContactCharacter() {
  const host = useRef(null);
  const timeline = useRef({ sleep: 1, waveAt: -100,manualTop:null,readSleep:null });
  useEffect(() => {
    const node = host.current;
    const section = node.closest(".contact-stage");
    const clamp=value=>Math.max(0,Math.min(1,value));
    timeline.current.readSleep=()=>{
      const top=section.getBoundingClientRect().top;
      if(timeline.current.manualTop!==null){
        if(Math.abs(top-timeline.current.manualTop)<4)return 0;
        timeline.current.manualTop=null;
      }
      // Measure the visible footer directly. Cached scroll distances became
      // stale after fonts loaded or a phone viewport changed, leaving the
      // character half asleep even when the whole scene was on screen.
      const viewport=window.innerHeight;
      const progress=clamp((viewport*.65-top)/Math.max(1,section.clientHeight-viewport*.35));
      const p=clamp((progress-.5)/.32);
      return 1-p*p*(3-2*p);
    };
    return()=>{timeline.current.readSleep=null;};
  },[]);
  return <div ref={host} className="contact-character">
    <Scene mode="contact" timeline={timeline} />
    <div className="sleep-symbols" aria-hidden="true"><span>Z</span><span>Z</span><span>Z</span></div>
    <button className="character-greeting" aria-label="Say hi to Pranav" onClick={()=>{
      if(host.current.querySelector('.scene-contact')?.dataset.animationActive==='true')return;
      timeline.current.manualTop=host.current.closest('.contact-stage').getBoundingClientRect().top;
      timeline.current.sleep=0;
      timeline.current.waveAt=performance.now()/1000;
    }} />
  </div>;
}
