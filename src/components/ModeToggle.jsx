import { useEffect, useState } from 'react';
import { getSiteMode, selectSiteMode } from '../site-mode.js';

export default function ModeToggle() {
  const [mode, setMode] = useState(getSiteMode);
  useEffect(() => {
    const update = () => setMode(getSiteMode());
    window.addEventListener('portfolio-mode-change', update);
    return () => window.removeEventListener('portfolio-mode-change', update);
  }, []);
  const night = mode === 'night';
  const label = night ? 'Switch to Morning Calm' : 'Switch to After Hours';
  return <button type="button" className="sound-button mode-toggle" data-mode={mode} aria-label={label} aria-pressed={night} title={`${night ? 'After Hours' : 'Morning Calm'} · ${label}`} onClick={() => selectSiteMode(night ? 'morning' : 'night')}>
    <svg className="mode-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/></svg>
    <svg className="mode-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.5 14.2A8.8 8.8 0 0 1 9.8 3.5a8.8 8.8 0 1 0 10.7 10.7Z"/><path d="M18 3v4m-2-2h4"/></svg>
  </button>;
}
