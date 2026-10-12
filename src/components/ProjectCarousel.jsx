import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons.jsx";
import AssetImage from "./AssetImage.jsx";

function ProjectCard({ project, navigate, duplicate, preload }) {
  const image = project.images[0];
  return (
    <li>
      <a
        href={`/project/${project.slug}`}
        className="project-card carousel-card"
        tabIndex={duplicate ? -1 : undefined}
        onClick={(event) => navigate(event, `/project/${project.slug}`)}
        style={{ "--card-accent": project.color }}
      >
        <div className="carousel-project-image">
          <AssetImage src={image.src} srcSet={image.srcSet} sizes="(max-width: 600px) 88vw, 360px" alt={duplicate ? "" : image.alt} width={image.width} height={image.height} loading={preload ? "eager" : "lazy"} fetchPriority="low" />
          <span className="carousel-project-open" aria-hidden="true"><Icon name="arrow" size={22} /></span>
        </div>
        <div className="carousel-project-copy">
          <span className="carousel-project-date">{project.period}</span>
          <h3>{project.title}</h3>
          <p>{project.category}</p>
        </div>
      </a>
    </li>
  );
}

export default function ProjectCarousel({ projects, navigate }) {
  const host = useRef(null);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [preload, setPreload] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "100px" });
    observer.observe(host.current);
    const assetObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setPreload(true); assetObserver.disconnect(); }
    }, { rootMargin: "1000px" });
    assetObserver.observe(host.current);
    return () => { observer.disconnect(); assetObserver.disconnect(); };
  }, []);
  const rows = [projects.slice(0, 6), projects.slice(6, 12)];
  const resetScroll = () => host.current?.querySelectorAll(".project-carousel-row").forEach(row => { row.scrollLeft = 0; });
  return (
    <section ref={host} className="projects-section project-carousel-section" id="projects" aria-labelledby="projects-title" data-running={visible && !paused} data-paused={paused}>
      <div className="project-carousel-header content-width">
        <div className="section-intro reveal">
          <span className="sticker">SELECTED WORK</span>
          <h2 id="projects-title">Projects<span className="orange-dot">.</span></h2>
          <p>12 projects. A little curiosity in every one.</p>
        </div>
        <button className="project-motion-toggle" aria-label={paused ? "Resume project carousels" : "Pause project carousels"} aria-pressed={paused} onClick={() => { resetScroll(); setPaused(value => !value); }}>
          <Icon name={paused ? "play" : "pause"} size={14} /> {paused ? "Play motion" : "Pause motion"}
        </button>
      </div>
      <div className="project-carousel-rows">
        {rows.map((row, index) => (
          <div key={index} className={`project-carousel-row row-${index === 0 ? "right" : "left"}`} role="group" aria-label={`Project row ${index + 1}, six projects moving ${index === 0 ? "right" : "left"}`} data-direction={index === 0 ? "right" : "left"} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.scrollLeft = 0; }}>
            <div className="project-carousel-track">
              {[false, true].map(duplicate => (
                <ul key={String(duplicate)} className="project-carousel-group" aria-hidden={duplicate ? true : undefined} data-duplicate={duplicate}>
                  {row.map(project => <ProjectCard key={project.slug} project={project} navigate={navigate} duplicate={duplicate} preload={preload} />)}
                </ul>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
