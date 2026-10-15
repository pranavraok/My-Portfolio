import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Scene from "./Scene.jsx";
import { Icon } from "./Icons.jsx";
import { profile } from "../data.js";
import DecodedText from "./DecodedText.jsx";
import { speakerState, toggleBackgroundMusic } from "../music.js";
import { advanceScrollPage } from "../scroll-motion.js";

const skills = [
  "Product Development",
  "Machine Learning Enthusiast",
  "AI Agents & Hardware Automation",
  "UI/UX Design",
  "Blockchain",
];

const clamp = (value) => Math.min(1, Math.max(0, value));
const smooth = (a, b, value) => {
  const t = clamp((value - a) / (b - a));
  return t*t*t*(10+t*(-15+6*t));
};

export default function Experience({ scrollTo, onPhase }) {
  const section = useRef(null);
  const timeline = useRef({ page: 0, scan: 0, walk: 0 });
  const [percent, setPercent] = useState(0);
  const [skillCard, setSkillCard] = useState(false);
  const [speakerPlaying,setSpeakerPlaying]=useState(speakerState.playing);
  useEffect(()=>{
    const update=event=>setSpeakerPlaying(event.detail.playing);
    window.addEventListener('portfolio-audio-state',update);
    setSpeakerPlaying(speakerState.playing);
    return()=>window.removeEventListener('portfolio-audio-state',update);
  },[]);
  useEffect(() => {
    const target = section.current;
    const stage = target.querySelector(".experience-stage");
    const room = target.querySelector(".room-card");
    const title = target.querySelector(".hero-copy");
    const cue = target.querySelector(".scroll-cue");
    const identity = target.querySelector(".holo-identity");
    const bio = target.querySelector(".holo-bio");
    const stack = target.querySelector(".holo-stack");
    const mobileCard = target.querySelector(".mobile-holo-card");
    const status = target.querySelector(".scan-status");
    const greetingButton = target.querySelector(".hero-greeting");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lastPercent = -1;
    let lastCard = false;
    let requestedPage=0,displayPage=0,initialized=false;
    const mobileQuery=matchMedia("(max-width: 600px), (max-width: 900px) and (max-aspect-ratio: 6/5), (max-width: 900px) and (max-height: 520px)");
    let height=stage.clientHeight,width=stage.clientWidth,sectionHeight=target.clientHeight;
    const measure=()=>{height=stage.clientHeight;width=stage.clientWidth;sectionHeight=target.clientHeight;};
    const reveal=(element,alpha,x=0,y=0)=>{
      element.style.opacity=alpha;
      element.style.visibility=alpha>0?'visible':'hidden';
      element.style.transform=`translate3d(${x}px,${y}px,0)`;
    };
    let settleScroll;
    const context = gsap.context(() => {
      if (!reduced)
        gsap.from(".hero-copy > *", {
          y: 18,
          opacity: 0,
          duration: 0.8,
          stagger: 0.12,
          delay: 0.12,
          ease: "power3.out",
        });
      const renderPage = (page,stageBounds=stage.getBoundingClientRect()) => {
        const mobile=mobileQuery.matches;
        const walk = smooth(0.08, 0.94, page);
        const scan = clamp(
          (page - (mobile ? 0.6 : 0.7)) / (mobile ? 1.7 : 1.65),
        );
        timeline.current = { ...timeline.current, page, walk, scan };
        const rounded = Math.round(scan * 100);
        if (rounded !== lastPercent) {
          setPercent(rounded);
          lastPercent = rounded;
        }
        const nextCard = scan > 0.64;
        if (nextCard !== lastCard) {
          setSkillCard(nextCard);
          lastCard = nextCard;
        }
        const phase = page > 0.28 ? "about" : "";
        if (
          stageBounds.bottom > height * 0.6 &&
          stageBounds.top < height * 0.35
        ) {
          onPhase(phase,page>.95);
        }
        const roomDeparture=smooth(.44,1.10,page);
        const roomShift=-roomDeparture*height*1.08;
        const rotation=reduced?0:roomDeparture*3;
        const scale=1-roomDeparture*(mobile?.16:.055);
        // Calculate the transformed card edge without reading layout after
        // writing transforms. Canvas clipping stays on the same scroll clock.
        const radians=rotation*Math.PI/180;
        timeline.current.roomBottom=clamp((height/2+roomShift+scale*(height*Math.cos(radians)+width*Math.abs(Math.sin(radians)))/2)/height);
        room.style.transform=`translate3d(0,${roomShift}px,0) rotate(${rotation}deg) scale(${scale})`;
        room.style.borderRadius=`${roomDeparture*48}px`;
        title.style.opacity=1-smooth(.25,.76,page);
        cue.style.opacity=1-smooth(.02,.2,page);
        greetingButton.style.visibility=page<.12?'visible':'hidden';
        const identityReveal = smooth(0.76, 1.04, page);
        const bioReveal = smooth(1.18, 1.48, page);
        const stackReveal = smooth(1.62, 1.98, page);
        reveal(identity,identityReveal,reduced?0:(1-identityReveal)*-18);
        reveal(bio,bioReveal,reduced?0:(1-bioReveal)*-18);
        reveal(stack,stackReveal,reduced?0:(1-stackReveal)*18);
        reveal(mobileCard,identityReveal,0,reduced?0:(1-identityReveal)*16);
        status.style.opacity=smooth(.75,1.02,page);
        const stagePhase=page<.75?'workspace':'hologram';
        if(stage.dataset.phase!==stagePhase)stage.dataset.phase=stagePhase;
        stage.dataset.scrollLag=Math.abs(requestedPage-page).toFixed(3);
      };
      const update=(self, instant=false)=>{
        const previousRequest=requestedPage;
        requestedPage=Math.min((self.progress*sectionHeight)/height,sectionHeight/height-1);
        if(instant||reduced||!initialized||Math.abs(requestedPage-previousRequest)>1.25){displayPage=requestedPage;initialized=true;renderPage(displayPage);}
      };
      settleScroll=(_time,deltaMs)=>{
        if(document.hidden||reduced||requestedPage===displayPage)return;
        // A shared clock keeps the chair, hands, camera and room card together
        // when a wheel tick or a touch swipe jumps across several poses.
        const bounds=stage.getBoundingClientRect();
        displayPage=bounds.bottom<=0||bounds.top>=window.innerHeight
          ? requestedPage
          : advanceScrollPage(displayPage,requestedPage,deltaMs);
        renderPage(displayPage,bounds);
      };
      gsap.ticker.add(settleScroll);
      const trigger = ScrollTrigger.create({
        trigger: target,
        start: "top top",
        end: "bottom top",
        onUpdate: update,
        onRefresh: self=>{measure();update(self,true);},
      });
      update(trigger);
    }, target);
    const refreshMusicLayout=()=>ScrollTrigger.refresh();
    window.addEventListener('portfolio-music-layout',refreshMusicLayout);
    return () => {window.removeEventListener('portfolio-music-layout',refreshMusicLayout);gsap.ticker.remove(settleScroll);context.revert();};
  }, [onPhase]);
  return (
    <section
      ref={section}
      className="experience-scroll"
      id="home"
      aria-label="Pranav’s interactive workspace and introduction"
    >
      <div id="about" className="about-anchor" aria-hidden="true" />
      <div className="experience-stage">
        <div className="blue-dust" aria-hidden="true" />
        <div className="room-card">
          <div className="hero-copy">
            <h1 id="hero-title">
              <span>Pranav</span>
              {" "}
              <span>Rao K</span>
            </h1>
            <div className="role-sticker"><DecodedText text="DEVELOPER & PRODUCT BUILDER" delay={300} /></div>
          </div>
        </div>
        <Scene mode="experience" timeline={timeline} />
        <button className="speaker-toggle" hidden aria-label={speakerPlaying?'Turn desk speaker off':'Turn desk speaker on'} aria-pressed={speakerPlaying} title={speakerPlaying?'Turn speaker off':'Turn speaker on'} onClick={toggleBackgroundMusic}/>
        <button className="hero-greeting" aria-label="Wave hello to Pranav" onClick={() => {
          if(section.current?.querySelector('.scene-experience')?.dataset.helloActive==='true')return;
          timeline.current.greetAt = performance.now();
        }} />
        <a
          className="scroll-cue"
          href="#about"
          aria-label="Scroll to about"
          onClick={(event) => {
            event.preventDefault();
            scrollTo("about");
          }}
        >
          <span className="mouse">
            <i />
          </span>
          <Icon name="down" />
        </a>
        <div className="desktop-holo-labels" aria-label="About Pranav">
          <div className="holo-label holo-identity">
            <strong><DecodedText text="Pranav" active={percent > 5} /></strong>
            <span>
              <Icon name="pin" size={15} /> <DecodedText text="Bengaluru, India" active={percent > 5} delay={150} />
            </span>
            <i className="connector" />
          </div>
          <div className="holo-label holo-bio">
            <p>
              <DecodedText text="I build full-stack products and intelligent automation that turn real problems into useful experiences." active={percent > 32} />
            </p>
            <i className="connector" />
          </div>
          <div className="holo-label holo-stack">
            <strong><DecodedText text="Skills" active={percent > 55} /></strong>
            <ul>
              {skills.map((skill) => <li key={skill}>{skill}</li>)}
            </ul>
            <a href={profile.resume} download>
              Get my resume <Icon name="arrow" size={15} />
            </a>
            <i className="connector" />
          </div>
        </div>
        <div className="mobile-holo-card" aria-live="off">
          <div
            className={`mobile-card-face ${skillCard ? "hidden" : ""}`}
            aria-hidden={skillCard}
          >
            <div className="mobile-identity">
              <strong>Pranav</strong>
              <span>
                <Icon name="pin" size={14} /> Bengaluru
              </span>
            </div>
            <p>
              I build full-stack products and intelligent automation that turn
              real problems into useful experiences.
            </p>
          </div>
          <div
            className={`mobile-card-face mobile-skills ${skillCard ? "" : "hidden"}`}
            aria-hidden={!skillCard}
          >
            <strong>Skills</strong>
            <ul>
              {skills.map((skill) => <li key={skill}>{skill}</li>)}
            </ul>
          </div>
        </div>
        <div className="scan-status">
          <div>
            <i style={{ width: `${percent}%` }} />
          </div>
          <strong>
            {percent}
            <small>%</small>
          </strong>
        </div>
      </div>
    </section>
  );
}
