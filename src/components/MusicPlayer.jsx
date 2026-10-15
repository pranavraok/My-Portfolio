import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons.jsx';
import { createBackgroundAudio } from '../background-audio.js';
import { musicTracks, backgroundMusicVolume, speakerState } from '../music.js';
import { getSiteMode } from '../site-mode.js';
import '../music-player.css';

const storageKey = 'pranav-background-music-session-v1';
function preferences() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
    return { paused: saved.paused === true };
  } catch { return { paused: false }; }
}
function save(paused) {
  try { sessionStorage.setItem(storageKey, JSON.stringify({ paused, volume: backgroundMusicVolume })); }
  catch { /* Playback still works when storage is disabled. */ }
}

export default function MusicPlayer() {
  const [initial] = useState(preferences);
  const [state, setState] = useState({ playing: false, status: 'ready', mode: 'buffer' });
  const audio = useRef(null), button = useRef(null), host = useRef(null), player = useRef(null);
  const wanted = useRef(false);

  useEffect(() => {
    let frame, disposed = false;
    function describe(track) {
      speakerState.title = track.title;
      speakerState.artist = track.artist;
      speakerState.volume = backgroundMusicVolume;
    }
    const track = musicTracks[getSiteMode()];
    describe(track);
    wanted.current = !initial.paused;
    const controller = createBackgroundAudio({
      audio: audio.current, track, volume: backgroundMusicVolume,
      onState(next) {
        if (disposed) return;
        const changed = speakerState.playing !== next.playing;
        speakerState.playing = next.playing;
        if (!next.playing) { speakerState.level = 0; speakerState.bands.fill(0); }
        setState({ playing: next.playing, status: next.status, mode: next.mode, mood: getSiteMode(), track: next.track });
        if (changed) window.dispatchEvent(new CustomEvent('portfolio-audio-state', { detail: { playing: next.playing } }));
      },
    });
    player.current = controller;
    if (wanted.current) controller.start();
    else controller.pause();
    function meter() {
      const current = controller.snapshot();
      if (host.current) {
        host.current.dataset.position = current.position.toFixed(3);
        host.current.dataset.loopDuration = String(current.duration);
        host.current.dataset.volume = String(current.volume);
        host.current.dataset.activeTrack = current.activeTrack;
        host.current.dataset.transitioning = String(current.transitioning);
      }
      speakerState.progress = current.duration ? current.position / current.duration : 0;
      if (current.playing) {
        speakerState.level = controller.meter();
        for (let i = 0; i < 8; i++) speakerState.bands[i] = Math.max(.03, speakerState.level * (1.5 + Math.sin(performance.now() * .001 + i * .8)));
      }
      frame = requestAnimationFrame(meter);
    }
    frame = requestAnimationFrame(meter);
    const chooseMode = event => {
      const next = musicTracks[event.detail.mode];
      if (!next) return;
      describe(next);
      controller.setTrack(next);
    };
    const unlock = event => {
      if (button.current?.contains(event.target) || event.target?.closest?.('.speaker-toggle')) return;
      if (wanted.current && controller && !controller.snapshot().playing) controller.start();
    };
    const toggle = () => {
      if (!controller) return;
      const current = controller.snapshot();
      if (current.playing || current.status === 'loading') {
        wanted.current = false; save(true); controller.pause();
      } else { wanted.current = true; save(false); controller.start(); }
    };
    const retry = () => { if (!document.hidden && wanted.current) controller?.start(); };
    const gestures = ['pointerup', 'touchend', 'click', 'keydown'];
    for (const name of gestures) document.addEventListener(name, unlock, { passive: true });
    window.addEventListener('portfolio-toggle-audio', toggle);
    window.addEventListener('portfolio-mode-change', chooseMode);
    window.addEventListener('pageshow', retry);
    document.addEventListener('visibilitychange', retry);
    return () => {
      disposed = true;
      for (const name of gestures) document.removeEventListener(name, unlock);
      window.removeEventListener('portfolio-toggle-audio', toggle);
      window.removeEventListener('portfolio-mode-change', chooseMode);
      window.removeEventListener('pageshow', retry);
      document.removeEventListener('visibilitychange', retry);
      cancelAnimationFrame(frame); controller?.dispose(); player.current = null;
      speakerState.playing = false; speakerState.level = 0; speakerState.progress = 0;
    };
  }, [initial]);

  const requested = state.playing || state.status === 'loading';
  return <div ref={host} className="music-shell" data-provider="local-audio" data-playing={state.playing} data-status={state.status} data-playback={state.mode} data-mood={state.mood || 'pending'} data-track={state.track}>
    <button ref={button} className={`sound-button music-toggle ${state.playing ? 'is-playing' : ''}`} aria-label={requested ? 'Pause background music' : 'Play background music'} aria-pressed={state.playing} title={requested ? 'Pause background music' : 'Play background music'} onClick={() => {
      if (requested) { wanted.current = false; save(true); player.current?.pause(); }
      else { wanted.current = true; save(false); player.current?.start(); }
    }}><Icon name={requested ? 'pause' : 'play'} size={18}/><span className="music-power" aria-hidden="true"/></button>
    <audio ref={audio} preload="none" loop playsInline />
  </div>;
}
