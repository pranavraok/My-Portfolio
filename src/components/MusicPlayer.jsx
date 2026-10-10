import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons.jsx";
import { ambientTrack, favoriteTracks, speakerState } from "../music.js";
import "../music-player.css";

const playlist = favoriteTracks.length
  ? [...favoriteTracks, ambientTrack]
  : [ambientTrack];
const clamp = (value) => Math.max(0, Math.min(1, value));
const formatTime = (seconds) => {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, "0")}`;
};

export default function MusicPlayer() {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [volume, setVolume] = useState(0.3);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  const panel = useRef(null),
    button = useRef(null),
    meter = useRef(null),
    bars = useRef(null),
    audio = useRef(null),
    engine = useRef(null),
    playingRef = useRef(false),
    volumeRef = useRef(0.3),
    frame = useRef(null);
  const track = playlist[index];
  function updateRoomSound() {
    const e = engine.current;
    if (!e) return;
    const stage = document.querySelector(".experience-stage");
    const page = stage
      ? Math.max(0, window.scrollY / Math.max(stage.clientHeight, 1))
      : 3;
    const proximity = 1 - clamp(page / 2.5);
    e.pan.pan.setTargetAtTime(
      innerWidth > 600 ? 0.45 * proximity : 0,
      e.ctx.currentTime,
      0.25,
    );
    e.filter.frequency.setTargetAtTime(
      1250 + 1750 * proximity,
      e.ctx.currentTime,
      0.25,
    );
    e.master.gain.setTargetAtTime(
      volumeRef.current * (0.65 + 0.35 * proximity),
      e.ctx.currentTime,
      0.16,
    );
  }
  function initialize() {
    if (engine.current) return engine.current;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const input = ctx.createGain(),
      ambient = ctx.createGain(),
      filter = ctx.createBiquadFilter(),
      pan = ctx.createStereoPanner(),
      master = ctx.createGain(),
      analyser = ctx.createAnalyser();
    filter.type = "lowpass";
    filter.frequency.value = 3000;
    filter.Q.value = 0.45;
    ambient.gain.value = 0;
    master.gain.value = volumeRef.current;
    ambient.connect(input);
    input.connect(filter);
    filter.connect(pan);
    pan.connect(master);
    master.connect(analyser);
    analyser.connect(ctx.destination);
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.75;
    const media = ctx.createMediaElementSource(audio.current);
    media.connect(input);
    [130.81, 164.81, 196, 261.63].forEach((frequency, i) => {
      const oscillator = ctx.createOscillator(),
        gain = ctx.createGain(),
        lfo = ctx.createOscillator(),
        depth = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.detune.value = i % 2 ? 3 : -3;
      gain.gain.value = 0.1;
      oscillator.connect(gain);
      gain.connect(ambient);
      oscillator.start();
      lfo.frequency.value = 0.07 + i * 0.025;
      depth.gain.value = 0.025;
      lfo.connect(depth);
      depth.connect(gain.gain);
      lfo.start();
    });
    engine.current = {
      ctx,
      ambient,
      filter,
      pan,
      master,
      analyser,
      media,
      bins: new Uint8Array(analyser.frequencyBinCount),
      wave: new Uint8Array(analyser.fftSize),
      started: 0,
      offset: 0,
    };
    updateRoomSound();
    return engine.current;
  }
  function stop() {
    const e = engine.current;
    if (e && playingRef.current)
      e.offset += (performance.now() - e.started) / 1000;
    audio.current?.pause();
    e?.ctx.suspend();
    playingRef.current = false;
    setPlaying(false);
    speakerState.playing = false;
    speakerState.level = 0;
    speakerState.bands.fill(0);
    if (meter.current) meter.current.value = 0;
    cancelAnimationFrame(frame.current);
  }
  async function start(selected = track) {
    setError("");
    try {
      const e = initialize();
      await e.ctx.resume();
      e.ambient.gain.setTargetAtTime(
        selected.kind === "ambient" ? 1 : 0,
        e.ctx.currentTime,
        0.08,
      );
      if (selected.kind === "ambient") {
        audio.current.pause();
        e.started = performance.now();
      } else {
        if (audio.current.getAttribute("src") !== selected.src) {
          audio.current.src = selected.src;
          audio.current.load();
        }
        await audio.current.play();
      }
      playingRef.current = true;
      setPlaying(true);
      speakerState.playing = true;
      speakerState.title = selected.title;
      speakerState.artist = selected.artist;
      updateRoomSound();
      let last = 0;
      cancelAnimationFrame(frame.current);
      const tick = (now) => {
        if (!playingRef.current) return;
        frame.current = requestAnimationFrame(tick);
        e.analyser.getByteFrequencyData(e.bins);
        e.analyser.getByteTimeDomainData(e.wave);
        let sum = 0;
        for (const value of e.wave) sum += ((value - 128) / 128) ** 2;
        speakerState.level = Math.min(1, Math.sqrt(sum / e.wave.length) * 7);
        for (let i = 0; i < 8; i++) {
          const p = 1 + i * 3;
          speakerState.bands[i] = Math.min(
            1,
            (e.bins[p] + e.bins[p + 1]) / 510,
          );
        }
        if (meter.current) meter.current.value = speakerState.level;
        if (bars.current)
          [...bars.current.children].forEach((bar, i) => {
            bar.style.transform = `scaleY(${Math.max(0.08, speakerState.bands[i])})`;
          });
        if (now - last > 500) {
          setElapsed(
            selected.kind === "ambient"
              ? e.offset + (now - e.started) / 1000
              : audio.current.currentTime,
          );
          last = now;
        }
      };
      frame.current = requestAnimationFrame(tick);
    } catch {
      stop();
      setError("Unable to play this track. Please try again.");
    }
  }
  function select(nextIndex) {
    const resume = playingRef.current;
    stop();
    setIndex(nextIndex);
    setElapsed(0);
    setDuration(0);
    if (engine.current) engine.current.offset = 0;
    const next = playlist[nextIndex];
    speakerState.title = next.title;
    speakerState.artist = next.artist;
    if (resume) start(next);
  }
  useEffect(() => {
    const close = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const outside = (event) => {
      if (
        panel.current &&
        !panel.current.contains(event.target) &&
        !button.current?.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", outside);
    window.addEventListener("scroll", updateRoomSound, { passive: true });
    window.addEventListener("resize", updateRoomSound);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("scroll", updateRoomSound);
      window.removeEventListener("resize", updateRoomSound);
      cancelAnimationFrame(frame.current);
      audio.current?.pause();
      engine.current?.ctx.close();
      speakerState.playing = false;
      speakerState.level = 0;
    };
  }, []);
  return (
    <div className="music-shell">
      <button
        ref={button}
        className={`sound-button music-toggle ${playing ? "is-playing" : ""}`}
        aria-label="Computer music player"
        aria-expanded={open}
        aria-controls="computer-music-player"
        onClick={() => setOpen((value) => !value)}
        title="Music from the desk computer"
      >
        <Icon name={playing ? "sound" : "music"} />
        <span className="music-power" />
      </button>
      <audio
        ref={audio}
        preload="none"
        crossOrigin="anonymous"
        onLoadedMetadata={() =>
          setDuration(
            Number.isFinite(audio.current.duration)
              ? audio.current.duration
              : 0,
          )
        }
        onEnded={() =>
          playlist.length > 1 ? select((index + 1) % playlist.length) : stop()
        }
        onError={() => {
          if (playingRef.current) {
            stop();
            setError("This track is unavailable.");
          }
        }}
      />
      {open ? (
        <div
          ref={panel}
          className={`computer-player ${playing ? "playing" : ""}`}
          id="computer-music-player"
          role="dialog"
          aria-label="Computer music player"
            data-lenis-prevent
        >
          <div className="player-titlebar">
            <div>
              <i />
              <i />
              <i />
            </div>
            <span>PRANAV FM</span>
            <button
              aria-label="Close music player"
              onClick={() => {
                setOpen(false);
                button.current?.focus();
              }}
            >
              <Icon name="close" size={13} />
            </button>
          </div>
          <div className="player-headline">
            <span className="player-led" />
            <span>
              {playing ? "ON THE DESK SPEAKERS" : "YOUR DESK. YOUR SOUNDTRACK."}
            </span>
            <Icon name="computer" size={15} />
          </div>
          <div className="player-track">
            <div className="vinyl-record">
              <div>
                <span>PR</span>
              </div>
            </div>
            <div>
              <h2>{track.title}</h2>
              <p>{track.artist}</p>
              <span className="player-format">
                {track.kind === "ambient" ? "AMBIENT LOOP" : "PLAYLIST"}
              </span>
            </div>
          </div>
          <div className="player-equalizer" ref={bars} aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
          <meter
            ref={meter}
            className="player-meter"
            max="1"
            value="0"
            aria-label="Speaker activity"
          />
          <div className="player-timeline">
            <span>{formatTime(elapsed)}</span>
            {track.kind === "ambient" ? (
              <div className="ambient-progress">
                <i />
              </div>
            ) : (
              <input
                aria-label="Track position"
                type="range"
                min="0"
                max={duration || 1}
                step="1"
                value={Math.min(elapsed, duration || 0)}
                disabled={!duration}
                onChange={(event) => {
                  audio.current.currentTime = Number(event.target.value);
                  setElapsed(Number(event.target.value));
                }}
              />
            )}
            <span>{track.kind === "ambient" ? "∞" : formatTime(duration)}</span>
          </div>
          <div className="player-controls">
            <button
              aria-label="Previous song"
              disabled={playlist.length < 2}
              onClick={() =>
                select((index + playlist.length - 1) % playlist.length)
              }
            >
              <Icon name="previous" size={20} />
            </button>
            <button
              className="player-play"
              aria-label={playing ? "Pause music" : "Play music"}
              aria-pressed={playing}
              onClick={() => (playing ? stop() : start())}
            >
              <Icon name={playing ? "pause" : "play"} size={23} />
            </button>
            <button
              aria-label="Next song"
              disabled={playlist.length < 2}
              onClick={() => select((index + 1) % playlist.length)}
            >
              <Icon name="next" size={20} />
            </button>
          </div>
          <div className="player-volume">
            <Icon name={volume ? "sound" : "mute"} size={15} />
            <input
              type="range"
              min="0"
              max="1"
              step=".01"
              aria-label="Music volume"
              value={volume}
              onChange={(event) => {
                const value = Number(event.target.value);
                setVolume(value);
                volumeRef.current = value;
                speakerState.volume = value;
                updateRoomSound();
              }}
            />
            <span>{Math.round(volume * 100)}%</span>
          </div>
          {playlist.length > 1 ? (
            <div className="player-list" aria-label="Playlist">
              {playlist.map((song, i) => (
                <button
                  key={song.id}
                  className={i === index ? "selected" : ""}
                  onClick={() => select(i)}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    {song.title}
                    <small>{song.artist}</small>
                  </span>
                  {i === index ? <span className="track-dot" /> : null}
                </button>
              ))}
            </div>
          ) : null}
          {error ? (
            <p className="player-error" role="alert">
              {error}
            </p>
          ) : null}
          <p className="player-footnote">A little music. A little momentum.</p>
        </div>
      ) : null}
    </div>
  );
}
