import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Experience from "./components/Experience.jsx";
import MusicPlayer from "./components/MusicPlayer.jsx";
import ContactCharacter from "./components/ContactCharacter.jsx";
import ProjectCarousel from "./components/ProjectCarousel.jsx";
import ProjectGallery from "./components/ProjectGallery.jsx";
import { Icon, Logo } from "./components/Icons.jsx";
import { profile, projects, awards } from "./data.js";
import { finishStartup } from "./startup.js";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });
const external = { target: "_blank", rel: "noopener noreferrer" };

function Home({ navigate, scrollTo, onPhase }) {
  return (
    <main id="main-content">
      <Experience scrollTo={scrollTo} onPhase={onPhase} />
      <ProjectCarousel projects={projects} navigate={navigate} />
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
      <Contact />
    </main>
  );
}

function Contact() {
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
        <span>© 2026 Pranav Rao</span>
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
          {project.fullTitle || project.title}
        </h1>
        <p>{project.description}</p>
        <div className="project-tags">
          {project.stack.map((tech) => (
            <span key={tech}>{tech}</span>
          ))}
        </div>
        <div className="project-actions project-hero-actions">
          {project.links.map((link, index) => (
            <a key={link.url} className={index === 0 ? "primary-button" : "secondary-button"} href={link.url} {...external}>
              {link.label} <Icon name="external" size={17} />
            </a>
          ))}
        </div>
      </section>
      <div className="project-page-visual content-width">
        <ProjectGallery project={project} />
      </div>
      <section className="project-story content-width">
        <div>
          <span className="eyebrow">ABOUT THE PROJECT</span>
          <h2>
            From idea
            <br />
            to experience.
          </h2>
          <dl className="project-facts">
            <div><dt>Period</dt><dd>{project.period}</dd></div>
            {project.contributors ? <div><dt>Contributors</dt><dd>{project.contributors.join(", ")}</dd></div> : null}
            {project.association ? <div><dt>Associated with</dt><dd>{project.association}</dd></div> : null}
          </dl>
          <a className="project-source-link" href={project.sourceUrl} {...external}>View on LinkedIn <Icon name="external" size={13} /></a>
        </div>
        <div>
          {project.story.split(/\n\s*\n/).map((paragraph, index) => <p key={index} className="project-description-paragraph">{paragraph}</p>)}
          <ul>
            {project.highlights.map((h) => (
              <li key={h}>
                <span>↗</span>
                {h}
              </li>
            ))}
          </ul>
          <div className="project-skills-list" aria-label="Project skills">{project.skills.map(skill => <span key={skill}>{skill}</span>)}</div>
        </div>
      </section>
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
  useEffect(()=>{if(!home)finishStartup();},[home]);
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
      if(document.querySelector("dialog[open]") || !lenis.current || !["Home","End"].includes(event.key) || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
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
        gsap.utils.toArray(".reveal, .project-card:not(.carousel-card)").forEach((el) =>
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
