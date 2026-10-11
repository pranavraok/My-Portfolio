import { useRef } from "react";
import Scene from "./Scene.jsx";

export default function ContactCharacter() {
  const host = useRef(null);
  const timeline = useRef({ waveAt: -100,manualTop:null });
  return <div ref={host} className="contact-character">
    <Scene mode="contact" timeline={timeline} />
    <div className="sleep-symbols" aria-hidden="true"><span>Z</span><span>Z</span><span>Z</span></div>
    <button className="character-greeting" aria-label="Say hi to Pranav" onClick={()=>{
      if(host.current.querySelector('.scene-contact')?.dataset.animationActive==='true')return;
      timeline.current.manualTop=host.current.closest('.contact-stage').getBoundingClientRect().top;
      timeline.current.waveAt=performance.now()/1000;
    }} />
  </div>;
}
