import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Scene from "./Scene.jsx";
import { Icon } from "./Icons.jsx";
import { profile } from "../data.js";

const clamp = (value) => Math.min(1, Math.max(0, value));
const smooth = (a, b, value) => {
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export default function Experience({ scrollTo, onPhase }) {
  const section = useRef(null);
  const timeline = useRef({ page: 0, scan: 0, walk: 0 });
  const [percent, setPercent] = useState(0);
  const [skillCard, setSkillCard] = useState(false);
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
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lastPercent = -1;
    let lastCard = false;
    let lastPhase = "";
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
      const update = (self) => {
        const mobile = matchMedia("(max-width: 600px)").matches;
        const height = stage.clientHeight;
        const page = self.progress * (target.clientHeight / height - 1);
        const walk = smooth(0.035, 0.86, page);
        const scan = clamp(
          (page - (mobile ? 0.6 : 0.7)) / (mobile ? 1.7 : 1.65),
        );
        timeline.current = { page, walk, scan };
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
        if (phase !== lastPhase || self.progress === 0) {
          onPhase(phase);
          lastPhase = phase;
        }
        const roomShift = -page * height * 0.9;
        gsap.set(room, {
          y: roomShift,
          rotation: reduced ? 0 : walk * 3,
          scale: 1 - walk * (mobile ? 0.16 : 0.055),
          borderRadius: walk * 48,
        });
        gsap.set(title, { opacity: 1 - smooth(0.25, 0.76, page) });
        gsap.set(cue, { opacity: 1 - smooth(0.02, 0.2, page) });
        const identityReveal = smooth(0.76, 1.04, page);
        const bioReveal = smooth(1.18, 1.48, page);
        const stackReveal = smooth(1.62, 1.98, page);
        gsap.set(identity, {
          visibility: reduced && identityReveal < .5 ? "hidden" : "visible",
          opacity: identityReveal,
          x: reduced ? 0 : (1 - identityReveal) * -18,
        });
        gsap.set(bio, {
          visibility: reduced && bioReveal < .5 ? "hidden" : "visible",
          opacity: bioReveal,
          x: reduced ? 0 : (1 - bioReveal) * -18,
        });
        gsap.set(stack, {
          visibility: reduced && stackReveal < .5 ? "hidden" : "visible",
          opacity: stackReveal,
          x: reduced ? 0 : (1 - stackReveal) * 18,
        });
        gsap.set(mobileCard, {
          opacity: identityReveal,
          y: reduced ? 0 : (1 - identityReveal) * 16,
        });
        gsap.set(status, { opacity: smooth(0.75, 1.02, page) });
        stage.dataset.phase = page < 0.75 ? "workspace" : "hologram";
      };
      const trigger = ScrollTrigger.create({
        trigger: target,
        start: "top top",
        end: "bottom bottom",
        onUpdate: update,
        onRefresh: update,
      });
      update(trigger);
    }, target);
    return () => context.revert();
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
              <span>Rao K</span>
            </h1>
            <div className="role-sticker">DEVELOPER & ML ENGINEER</div>
          </div>
        </div>
        <Scene mode="experience" timeline={timeline} />
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
            <strong>Pranav</strong>
            <span>
              <Icon name="pin" size={15} /> Bengaluru, India
            </span>
            <i className="connector" />
          </div>
          <div className="holo-label holo-bio">
            <p>
              I build full-stack products and intelligent automation that turn
              real problems into useful experiences.
            </p>
            <i className="connector" />
          </div>
          <div className="holo-label holo-stack">
            <strong>Skills</strong>
            <ul>
              <li>React & Next.js</li>
              <li>Flutter & Supabase</li>
              <li>Python & Machine Learning</li>
              <li>Computer Vision & TensorFlow</li>
              <li>AI Agents & n8n</li>
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
              <li>React & Next.js</li>
              <li>Flutter & Supabase</li>
              <li>Python & Machine Learning</li>
              <li>Computer Vision & TensorFlow</li>
              <li>AI Agents & n8n</li>
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
