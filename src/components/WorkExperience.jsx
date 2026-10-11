import { workExperience } from "../work-experience-data.js";
import { profile } from "../data.js";
import { Icon } from "./Icons.jsx";

export default function WorkExperience() {
  return (
    <section className="work-experience-section content-width" id="experience" aria-labelledby="work-experience-title">
      <div className="work-experience-heading">
        <div className="section-intro reveal">
          <span className="sticker">BUILDING & LEARNING</span>
          <h2 id="work-experience-title">Experience<span className="orange-dot">.</span></h2>
          <p>Products, people, and the work along the way.</p>
        </div>
        <a className="work-resume-link" href={profile.resume} download>Resume <Icon name="down" size={16} /></a>
      </div>
      <ol className="work-experience-timeline">
        {workExperience.map(job => (
          <li key={job.id} className="work-experience-entry reveal">
            <div className="work-entry-year"><span>{job.year}</span><i aria-hidden="true" /></div>
            <article className="work-experience-card" aria-labelledby={`role-${job.id}`}>
              <div className="work-card-heading">
                <div className="work-company-logo">
                  {job.logo ? <img src={job.logo} alt={`${job.company} logo`} width="60" height="60" loading="lazy" /> : <span aria-hidden="true">{job.initials}</span>}
                </div>
                <div className="work-role-heading">
                  <h3 id={`role-${job.id}`}>{job.role}</h3>
                  <div className="work-company-line">
                    {job.url ? <a href={job.url} target="_blank" rel="noopener noreferrer">{job.company} <Icon name="external" size={12} /></a> : <span>{job.company}</span>}
                    <span className="work-employment-type">{job.type}</span>
                  </div>
                </div>
              </div>
              <div className="work-role-meta"><span>{job.period}{job.duration ? ` · ${job.duration}` : ""}</span>{job.location ? <span><Icon name="pin" size={13} />{job.location}</span> : null}</div>
              <div className="work-role-description">{job.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
              <ul className="work-focus-areas" aria-label={`${job.company} responsibilities`}>{job.areas.map(area => <li key={area}>{area}</li>)}</ul>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
