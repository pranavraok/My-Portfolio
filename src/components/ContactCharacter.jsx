import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Scene from "./Scene.jsx";

export default function ContactCharacter() {
  const host = useRef(null);
  const timeline = useRef({ sleep: 1, waveAt: -100 });
  useEffect(() => {
    const node = host.current;
    const section = node.closest(".contact-stage");
    const update = self => {
      const p = gsap.utils.clamp(0,1,(self.progress-.5)/.32);
      timeline.current.sleep = 1-p*p*(3-2*p);
      node.style.setProperty("--sleep",timeline.current.sleep);
    };
    const trigger = ScrollTrigger.create({trigger:section,start:"top 65%",end:"bottom bottom",onUpdate:update,onRefresh:update});
    update(trigger);
    return () => trigger.kill();
  },[]);
  return <div ref={host} className="contact-character">
    <Scene mode="contact" timeline={timeline} />
    <div className="sleep-symbols" aria-hidden="true"><span>Z</span><span>Z</span><span>Z</span></div>
    <button className="character-greeting" aria-label="Say hi to Pranav" onClick={()=>{
      timeline.current.sleep=0;
      timeline.current.waveAt=performance.now()/1000;
      host.current.style.setProperty("--sleep",0);
    }} />
  </div>;
}
