import { useEffect, useRef } from 'react';
import { selectSiteMode, siteModes } from '../site-mode.js';

export default function ModePicker() {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element.open) element.showModal();
    return () => { if (element.open) element.close(); };
  }, []);
  return <dialog ref={dialog} className="mode-picker" data-lenis-prevent aria-labelledby="mode-picker-title" aria-describedby="mode-picker-description" onCancel={event => event.preventDefault()}>
    <div className="mode-picker-intro">
      <span className="mode-picker-eyebrow">WELCOME TO MY WORKSPACE</span>
      <h2 id="mode-picker-title">Set the mood.</h2>
      <p id="mode-picker-description">Pick a soundtrack and a shade to settle into.</p>
    </div>
    <div className="mode-choices">
      {siteModes.map(mode => <button key={mode.id} className={`mode-choice mode-choice-${mode.id}`} aria-label={mode.action} onClick={() => {
        selectSiteMode(mode.id);
        dialog.current.close();
        // Reuse the existing greeting if it finished while choosing a mood.
        document.querySelector('.hero-greeting')?.click();
      }}>
        <span className={`mode-preview mode-preview-${mode.id}`} aria-hidden="true">
          <span className="mode-sky-orb"/><span className="mode-horizon mode-horizon-back"/><span className="mode-horizon mode-horizon-front"/>
          <span className="mode-preview-time">{mode.id === 'morning' ? '08:24' : '23:08'}</span>
          {mode.id === 'night' && <span className="mode-stars">✦ · ✧</span>}
        </span>
        <span className="mode-choice-copy"><span className="mode-choice-eyebrow">{mode.eyebrow}</span><strong>{mode.name}</strong><span className="mode-choice-description">{mode.description}</span><span className="mode-choice-enter">Come on in <span aria-hidden="true">↗</span></span></span>
      </button>)}
    </div>
    <p className="mode-picker-note">Music starts gently. Pause it whenever you like.</p>
  </dialog>;
}
