import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Experience from "./components/Experience.jsx";
import MusicPlayer from "./components/MusicPlayer.jsx";
import ContactCharacter from "./components/ContactCharacter.jsx";
import { Icon, Logo } from "./components/Icons.jsx";
import { profile, projects, awards } from "./data.js";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });
const external = { target: "_blank", rel: "noopener noreferrer" };

function ProjectCover({ project, large = false }) {
  if (project.cover === "tradeledger")
    return (
      <div
        className="project-art trade-art"
        aria-label="Illustration of trading performance analytics"
      >
        <div className="art-brand">
          T<span>↗</span>
        </div>
        <div className="mock-dashboard">
          <div className="mock-sidebar">
            <b>TL</b>
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="mock-chart">
            <span>YOUR TRADING. IN PERSPECTIVE.</span>
            <strong>TradeLedger</strong>
            <svg viewBox="0 0 320 80" aria-hidden="true">
              <path
                d="M0 68 30 60 55 66 83 42 110 51 144 25 171 39 201 16 230 24 266 8 295 15 320 2"
                fill="none"
                stroke="#7be2b1"
                strokeWidth="3"
              />
              <path
                d="M0 68 30 60 55 66 83 42 110 51 144 25 171 39 201 16 230 24 266 8 295 15 320 2V80H0Z"
                fill="#7be2b1"
                opacity=".12"
              />
            </svg>
            <div className="mock-stats">
              <i />
              <i />
              <i />
            </div>
          </div>
        </div>
        <span className="art-small">LOG. LEARN. IMPROVE.</span>
      </div>
    );
  if (project.cover === "hostelvoice")
    return (
      <div
        className="project-art hostel-art"
        aria-label="Illustration of the HostelVoice campus platform"
      >
        <div className="campus-building">
          <span>HV</span>
          <div>
            {Array.from({ length: 12 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
          <b />
        </div>
        <div className="campus-bubble">
          Hello, campus.<span>✦</span>
        </div>
        <div className="campus-cloud" />
        <span className="art-small">HOSTELVOICE</span>
      </div>
    );
  return (
    <div
      className={`project-art screenshot-art ${["MR", "ET"].includes(project.code) ? "mobile-art" : ""}`}
      style={{ "--art-color": project.color }}
    >
      <div className="art-orbit" />
      <div className="art-orbit second" />
      <div className="screen-frame">
        <div className="screen-dots">
          <i />
          <i />
          <i />
        </div>
        <img
          src={`/media/project-${project.code}.jpg`}
          alt={`${project.title} application preview`}
          loading={large ? "eager" : "lazy"}
          decoding="async"
        />
      </div>
      <span className="art-small">{project.title}</span>
      <span className="art-decoration" aria-hidden="true">
        {project.slug === "nutrigo"
          ? "✳"
          : project.slug === "saanvi"
            ? "✦"
            : "+"}
      </span>
    </div>
  );
}

function ProjectCard({ project, navigate }) {
  return (
    <a
      href={`/project/${project.slug}`}
      className="project-card"
      onClick={(event) => navigate(event, `/project/${project.slug}`)}
    >
      <div className="project-visual">
        <ProjectCover project={project} />
        <span className="project-open">
          <Icon name="arrow" size={28} />
        </span>
        <span className="project-year">{project.year}</span>
      </div>
      <h3>{project.title}</h3>
      <p>{project.category}</p>
    </a>
  );
}

function Home({ navigate, scrollTo, onPhase }) {
  return (
    <main id="main-content">
      <Experience scrollTo={scrollTo} onPhase={onPhase} />
      <section
        className="projects-section content-width"
        id="projects"
        aria-labelledby="projects-title"
      >
        <div className="section-intro reveal">
          <span className="sticker">SELECTED</span>
          <h2 id="projects-title">
            Projects<span className="orange-dot">.</span>
          </h2>
          <p>Ideas, experiments, and things I’ve shipped.</p>
        </div>
        <div className="project-grid">
          {projects.map((project) => (
            <ProjectCard
              key={project.slug}
              project={project}
              navigate={navigate}
            />
          ))}
          <a
            className="project-card new-project"
            href={`mailto:${profile.email}`}
          >
            <div className="project-visual">
              <span className="big-plus">+</span>
              <span className="new-project-note">YOUR IDEA GOES HERE</span>
            </div>
            <h3>Start a new project</h3>
            <p>Let’s make something good.</p>
          </a>
        </div>
      </section>
      <section
        className="journey-section content-width"
        aria-labelledby="journey-title"
      >
        <div className="section-intro reveal">
          <span className="sticker orange-sticker">ALONG THE WAY</span>
          <h2 id="journey-title">A few milestones.</h2>
        </div>
        <div className="awards-grid">
          {awards.map((award) => (
            <article key={award.title} className="award reveal">
              <div className="award-image">
                <img
                  src={`/media/awards/${award.image}.webp`}
                  alt={`${award.title} achievement`}
                  loading="lazy"
                />
                <span>{award.result}</span>
              </div>
              <span className="award-date">{award.date}</span>
              <h3>{award.title}</h3>
              <p>{award.detail}</p>
            </article>
          ))}
        </div>
        <div className="experience-row reveal">
          <span className="experience-year">2025</span>
          <div>
            <span className="eyebrow">EXPERIENCE</span>
            <h3>Machine Learning Intern</h3>
            <p>Fox Trading Solutions · March–April 2025</p>
          </div>
          <p className="experience-detail">
            From data preparation to model training and evaluation — applying
            machine learning to practical problems.
          </p>
        </div>
        <div className="journey-education reveal">
          <span className="education-period">2024–2028</span>
          <div>
            <h3>Computer Science</h3>
            <p>M. S. Ramaiah University of Applied Sciences · CGPA 9.02</p>
          </div>
          <a className="back-link" href={profile.resume} download>
            Resume <Icon name="down" size={16} />
          </a>
        </div>
      </section>
      <Contact scrollTo={scrollTo} />
    </main>
  );
}

function Contact({ scrollTo }) {
  return (
    <section
      className="contact-section"
      id="contact"
      aria-labelledby="contact-title"
    >
      <div className="contact-stage">
        <ContactCharacter />
        <div className="contact-copy">
          <h2 id="contact-title">
            Let’s work
            <br />
            together!
          </h2>
          <div className="social-links">
            <a
              href={`mailto:${profile.email}`}
              aria-label="Send Pranav an email"
            >
              <Icon name="mail" size={25} />
            </a>
            <a
              href={profile.github}
              {...external}
              aria-label="Pranav on GitHub"
            >
              <Icon name="github" size={25} />
            </a>
            <a
              href={profile.linkedin}
              {...external}
              aria-label="Pranav on LinkedIn"
            >
              <Icon name="linkedin" size={25} />
            </a>
            <a className="resume-link" href={profile.resume} download>
              Resume <Icon name="down" size={17} />
            </a>
          </div>
        </div>
      </div>
      <footer>
        <a className="back-to-top" href="#home" aria-label="Back to top" onClick={event => {
          event.preventDefault();
          if(scrollTo) scrollTo("home");
          else window.scrollTo({top:0,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"});
        }}><Icon name="down" size={25}/></a>
        <span>Made with curiosity & code.</span>
        <span className="avatar-credit">Avatar created with <a href="https://www.meshy.ai/" {...external}>Meshy</a>.</span>
        <span className="avatar-credit">Music: <a href="https://www.youtube.com/watch?v=g7wCkTvU_VY" {...external}>Tera Mera Rishta — Mustafa Zahid · Curova Lofi</a>.</span>
        <span>© {new Date().getFullYear()} Pranav Rao K</span>
      </footer>
    </section>
  );
}

function ProjectPage({ project, navigate }) {
  const currentIndex = projects.indexOf(project);
  const next = projects[(currentIndex + 1) % projects.length];
  return (
    <main
      id="main-content"
      className="project-page"
      style={{ "--project-color": project.color }}
    >
      <div className="project-page-top content-width">
        <a
          className="back-link"
          href="/#projects"
          onClick={(e) => navigate(e, "/", "projects")}
        >
          <Icon name="back" size={20} /> Back to projects
        </a>
        <span>
          {String(currentIndex + 1).padStart(2, "0")} /{" "}
          {String(projects.length).padStart(2, "0")}
        </span>
      </div>
      <section className="project-page-heading content-width">
        <span className="sticker">
          {project.year} / {project.stack[0].toUpperCase()}
        </span>
        <h1 tabIndex="-1">
          {project.title}
          <span className="orange-dot">.</span>
        </h1>
        <p>{project.description}</p>
        <div className="project-tags">
          {project.stack.map((tech) => (
            <span key={tech}>{tech}</span>
          ))}
        </div>
      </section>
      <div className="project-page-visual content-width">
        <ProjectCover project={project} large />
      </div>
      <section className="project-story content-width">
        <div>
          <span className="eyebrow">ABOUT THE PROJECT</span>
          <h2>
            From idea
            <br />
            to experience.
          </h2>
        </div>
        <div>
          <p>{project.story}</p>
          <ul>
            {project.highlights.map((h) => (
              <li key={h}>
                <span>↗</span>
                {h}
              </li>
            ))}
          </ul>
          <div className="project-actions">
            {project.url ? (
              <a className="primary-button" href={project.url} {...external}>
                Visit project <Icon name="external" size={17} />
              </a>
            ) : null}
            {project.repo ? (
              <a className="secondary-button" href={project.repo} {...external}>
                <Icon name="github" size={18} /> View source
              </a>
            ) : null}
          </div>
        </div>
      </section>
      {project.code ? (
        <section className="project-demo content-width">
          <div className="section-intro">
            <span className="sticker">IN ACTION</span>
            <h2>Take a closer look.</h2>
            <p>The original project walkthrough.</p>
          </div>
          <video
            key={project.slug}
            controls
            playsInline
            preload="none"
            poster={`/media/project-${project.code}.jpg`}
            aria-label={`${project.title} demo video`}
          >
            <source
              src={`/media/project-${project.code}.mp4`}
              type="video/mp4"
            />
            Your browser doesn’t support video.{" "}
            <a href={`/media/project-${project.code}.mp4`}>Download the demo</a>
            .
          </video>
        </section>
      ) : null}
      <a
        href={`/project/${next.slug}`}
        className="next-project content-width"
        onClick={(e) => navigate(e, `/project/${next.slug}`)}
      >
        <div>
          <span className="eyebrow">UP NEXT</span>
          <h2>{next.title}</h2>
        </div>
        <span>
          <Icon name="arrow" size={38} />
        </span>
      </a>
      <Contact />
    </main>
  );
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [active, setActive] = useState("");
  const [sceneBlue, setSceneBlue] = useState(false);
  const [transition, setTransition] = useState(false);
  const lenis = useRef(null);
  const transitionTimer = useRef(null);
  const routeScroll = useRef(null);
  const root = useRef(null);
  const project = projects.find((p) => path === `/project/${p.slug}`);
  const home = path === "/";
  const onExperiencePhase = useCallback((phase,dark) => {
    setActive(phase);
    setSceneBlue(dark);
  },[]);
  function scrollTo(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (lenis.current)
      lenis.current.scrollTo(el, { offset: -18, duration: 1.3 });
    else el.scrollIntoView({ behavior: "auto" });
  }
  function navigate(event, target, section) {
    if (
      event?.metaKey ||
      event?.ctrlKey ||
      event?.shiftKey ||
      event?.altKey ||
      event?.button > 0
    )
      return;
    event?.preventDefault();
    if (target === path) {
      if (section) scrollTo(section);
      return;
    }
    setTransition(true);
    clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => {
      history.pushState({}, "", target + (section ? `#${section}` : ""));
      routeScroll.current = section;
      setPath(target);
      window.scrollTo(0, 0);
      lenis.current?.scrollTo(0, { immediate: true });
      setTimeout(() => setTransition(false), 180);
    }, 220);
  }
  useEffect(() => {
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const engine = new Lenis({
        autoRaf: true,
        lerp: 0.085,
        smoothWheel: true,
      });
      lenis.current = engine;
      engine.on("scroll", ScrollTrigger.update);
    }
    const pop = () => {
      setPath(window.location.pathname);
      setTransition(false);
    };
    window.addEventListener("popstate", pop);
    const jump = event => {
      if(!lenis.current || !["Home","End"].includes(event.key) || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
      event.preventDefault();
      lenis.current.scrollTo(event.key === "Home" ? 0 : document.documentElement.scrollHeight, {immediate:true});
    };
    window.addEventListener("keydown",jump);
    return () => {
      window.removeEventListener("popstate", pop);
      window.removeEventListener("keydown",jump);
      clearTimeout(transitionTimer.current);
      lenis.current?.destroy();
      lenis.current = null;
    };
  }, []);
  useEffect(() => {
    document.title = project
      ? `${project.title} — Pranav Rao K`
      : "Pranav Rao K — Developer & Product Builder";
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const context = gsap.context(() => {
      if (!reduced) {
        gsap.utils.toArray(".reveal, .project-card").forEach((el) =>
          gsap.from(el, {
            y: 35,
            opacity: 0,
            duration: 0.65,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 94%", once: true },
          }),
        );
      }
    }, root);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting)
            setActive(entry.target.id === "home" ? "" : entry.target.id);
        });
      },
      { rootMargin: "-30% 0px -40% 0px" },
    );
    ["projects", "contact"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
      const id = routeScroll.current || location.hash.slice(1);
      routeScroll.current = null;
      if (id) scrollTo(id);
      if (project)
        document
          .querySelector(".project-page-heading h1")
          ?.focus({ preventScroll: true });
    }, 100);
    return () => {
      context.revert();
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [path]);
  const blue = home && active === "about" && sceneBlue;
  return (
    <div
      ref={root}
      className={`site ${home ? "is-home" : ""} ${active ? "has-started" : ""} ${blue ? "is-blue" : ""}`}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <a
          className="brand"
          href="/"
          aria-label="Pranav Rao K home"
          onClick={(e) => {
            if (home) {
              e.preventDefault();
              scrollTo("home");
            } else navigate(e, "/");
          }}
        >
          {home ? <Logo /> : <Icon name="back" size={25} />}
        </a>
        <nav aria-label="Main navigation">
          {["about", "projects", "contact"].map((id) => (
            <a
              key={id}
              href={`/#${id}`}
              className={
                active === id || (project && id === "projects") ? "active" : ""
              }
              onClick={(e) => {
                if (home) {
                  e.preventDefault();
                  scrollTo(id);
                } else navigate(e, "/", id);
              }}
            >
              {id}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <a className="get-in-touch" href={`mailto:${profile.email}`}>
            Get in touch <Icon name="arrow" size={16} />
          </a>
          <MusicPlayer />
        </div>
      </header>
      {home ? (
        <Home navigate={navigate} scrollTo={scrollTo} onPhase={onExperiencePhase} />
      ) : project ? (
        <ProjectPage project={project} navigate={navigate} />
      ) : (
        <main className="not-found" id="main-content">
          <span className="sticker">404</span>
          <h1>A little off track.</h1>
          <p>Let’s get you back to the workspace.</p>
          <a
            className="primary-button"
            href="/"
            onClick={(e) => navigate(e, "/")}
          >
            Back home <Icon name="arrow" />
          </a>
        </main>
      )}
      <div
        className={`route-transition ${transition ? "visible" : ""}`}
        aria-hidden="true"
      >
        <Logo />
        <span>JUST A MOMENT</span>
      </div>
    </div>
  );
}
