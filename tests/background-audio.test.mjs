import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackgroundAudio } from '../src/background-audio.js';
import { ambientTrack, nightTrack, backgroundMusicVolume } from '../src/music.js';

const tick = () => new Promise(resolve => setImmediate(resolve));
function setup({ blocked = false, deferred = false, native = false, badOpus = false, deferredNight = false } = {}) {
  const events = [], contexts = [], fetches = [];
  let allow = !blocked, resolveFetch;
  class Context extends EventTarget {
    state = blocked ? 'suspended' : 'running'; currentTime = 0; destination = {}; sources = []; gains = [];
    constructor() { super(); contexts.push(this); }
    resume() { events.push('resume'); if (allow) { this.state = 'running'; this.dispatchEvent(new Event('statechange')); } return Promise.resolve(); }
    close() { this.state = 'closed'; return Promise.resolve(); }
    createAnalyser() { return { fftSize: 256, connect() {}, disconnect() {}, getByteTimeDomainData(a) { a.fill(128); } }; }
    createBufferSource() { const s = { connect() {}, disconnect() {}, start(...args) { this.started = args; }, stop(at) { this.stopped = at ?? true; } }; this.sources.push(s); return s; }
    createGain() { const g = { gain: { value: 0, ramps: [], setValueAtTime(v) { this.value = v; }, linearRampToValueAtTime(v,t) { this.ramps.push([v,t]); this.value = v; }, cancelAndHoldAtTime() {} }, connect() {}, disconnect() {} }; this.gains.push(g); return g; }
    decodeAudioData(bytes) { if (badOpus && bytes.byteLength === 1) return Promise.reject(new Error('unsupported')); return Promise.resolve({ duration: 66.9 }); }
  }
  class NativeAudio extends EventTarget {
    paused = true; currentTime = 0; attrs = {};
    getAttribute(k) { return k === 'src' ? this.src || null : this.attrs[k]; }
    removeAttribute(k) { if (k === 'src') this.src = ''; }
    play() { if (!allow) return Promise.reject(new Error('blocked')); this.paused = false; this.dispatchEvent(new Event('playing')); return Promise.resolve(); }
    pause() { this.paused = true; this.dispatchEvent(new Event('pause')); }
    load() {}
  }
  const response = src => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(src.endsWith('.ogg') ? 1 : 2) });
  const platform = { AudioContext: native ? undefined : Context, fetch(src) { events.push('fetch'); fetches.push(src); return (deferred || (deferredNight && src.includes('after-hours'))) ? new Promise(r => { resolveFetch = () => r(response(src)); }) : Promise.resolve(response(src)); } };
  const audio = new NativeAudio(), states = [];
  const player = createBackgroundAudio({ audio, track: ambientTrack, volume: backgroundMusicVolume, platform, onState(s) { states.push(s); } });
  return { player, audio, states, contexts, fetches, events, allow() { allow = true; }, resolve() { resolveFetch(); } };
}

test('allowed page-open playback starts one quiet, continuous loop', async () => {
  const s = setup(); s.player.start(); await tick();
  assert.equal(s.player.snapshot().playing, true);
  assert.deepEqual(s.events.slice(0,2), ['resume','fetch']);
  assert.equal(s.contexts[0].sources.length, 1);
  assert.equal(s.contexts[0].sources[0].loop, true);
  assert.equal(s.contexts[0].sources[0].loopEnd, 66.9);
  assert.equal(s.contexts[0].gains[0].gain.ramps[0][0], backgroundMusicVolume);
  assert.ok(backgroundMusicVolume >= .085 && backgroundMusicVolume <= .095);
  s.player.dispose();
});
test('blocked autoplay reports waiting, then a gesture resumes the same loop', async () => {
  const s = setup({ blocked: true }); s.player.start(); await tick();
  assert.equal(s.player.snapshot().status, 'waiting-for-tap');
  assert.equal(s.player.snapshot().playing, false);
  s.allow(); s.player.start(); await tick();
  assert.equal(s.player.snapshot().playing, true);
  assert.equal(s.contexts[0].sources.length, 1);
  s.player.dispose();
});
test('pausing while audio is loading never starts it when decoding finishes', async () => {
  const s = setup({ deferred: true }); s.player.start(); s.player.pause(); s.resolve(); await tick();
  assert.equal(s.player.snapshot().status, 'paused');
  assert.equal(s.contexts[0].sources.length, 0);
  s.player.start(); await tick(); assert.equal(s.contexts[0].sources.length, 1);
  s.player.dispose();
});
test('loop boundary wraps on audio time and pause/resume preserves position', async () => {
  const s = setup(); s.player.start(); await tick(); const c = s.contexts[0];
  c.currentTime = 67.2;
  assert.ok(Math.abs(s.player.snapshot().position - .3) < .00001);
  s.player.pause(); c.currentTime = 72; s.player.start(); await tick();
  assert.ok(Math.abs(c.sources[1].started[1] - .3) < .00001);
  assert.equal(c.gains[0].gain.ramps.at(-1)[0], 0);
  assert.ok(Math.abs(c.sources[0].stopped - 67.33) < 1e-9);
  s.player.dispose();
});
test('repeated unlock gestures share one request and do not double the audio', async () => {
  const s = setup({ deferred: true }); s.player.start(); s.player.start(); s.player.start();
  s.resolve(); await tick();
  assert.equal(s.fetches.length, 1); assert.equal(s.contexts[0].sources.length, 1);
  s.player.dispose();
});
test('unmount during download prevents stale playback and state updates', async () => {
  const s = setup({ deferred: true }); s.player.start(); s.player.dispose(); const n=s.states.length;
  s.resolve(); await tick();
  assert.equal(s.contexts[0].sources.length, 0); assert.equal(s.states.length,n); assert.equal(s.contexts[0].state,'closed');
});
test('an unsupported Opus decoder falls back to MP3 and keeps the exact loop point', async () => {
  const s = setup({ badOpus: true }); s.player.start(); await tick();
  assert.equal(s.fetches.length, 2); assert.equal(s.contexts[0].sources[0].loopEnd, 66.9);
  s.player.dispose();
});
test('native fallback uses the pre-attenuated mobile file and honors pause', async () => {
  const s=setup({ native:true }); s.player.start(); await tick();
  assert.equal(s.audio.src, ambientTrack.nativeSrc); assert.equal(s.audio.volume,1); assert.equal(s.audio.loop,true);
  assert.equal(s.player.snapshot().playing,true); s.player.pause();
  assert.equal(s.audio.paused,true); assert.equal(s.player.snapshot().status,'paused'); s.player.dispose();
});


test('a mode change waits for its download, then crossfades on the same audio clock', async () => {
  const s = setup({ deferredNight: true }); s.player.start(); await tick();
  const c = s.contexts[0]; c.currentTime = 10;
  s.player.setTrack(nightTrack);
  assert.equal(s.player.snapshot().playing, true);
  assert.equal(s.player.snapshot().activeTrack, ambientTrack.id);
  assert.equal(c.sources[0].stopped, undefined);
  s.resolve(); await tick();
  assert.equal(s.contexts.length, 1);
  assert.equal(s.player.snapshot().activeTrack, nightTrack.id);
  assert.equal(c.sources[1].loopEnd, 65.5);
  assert.deepEqual(c.gains[0].gain.ramps.at(-1), [0, 11.4]);
  assert.deepEqual(c.gains[1].gain.ramps.at(-1), [backgroundMusicVolume, 11.4]);
  assert.ok(c.sources[0].stopped > 11.4 && c.sources[0].stopped < 11.42);
  s.player.dispose();
});
test('switching a paused mood stays silent and resumes only the chosen soundtrack', async () => {
  const s = setup(); s.player.start(); await tick();
  const c = s.contexts[0]; c.currentTime = 7;
  s.player.pause(); s.player.setTrack(nightTrack); await tick();
  assert.equal(s.player.snapshot().playing, false);
  assert.equal(s.fetches.length, 1);
  s.player.start(); await tick();
  assert.equal(s.player.snapshot().activeTrack, nightTrack.id);
  assert.equal(c.sources[1].loopEnd, 65.5);
  c.currentTime = 9;
  s.player.setTrack(ambientTrack); await tick();
  assert.equal(s.fetches.length, 2);
  assert.equal(s.contexts.length, 1);
  assert.equal(c.sources.at(-1).started[1], 7);
  s.player.dispose();
});
test('quickly reversing a mode choice ignores a late download', async () => {
  const s = setup({ deferredNight: true }); s.player.start(); await tick();
  s.player.setTrack(nightTrack); s.player.setTrack(ambientTrack);
  s.resolve(); await tick();
  assert.equal(s.player.snapshot().activeTrack, ambientTrack.id);
  assert.equal(s.contexts[0].sources.length, 1);
  assert.equal(s.contexts[0].sources[0].stopped, undefined);
  s.player.dispose();
});
test('pause silences every side of an active crossfade', async () => {
  const s = setup(); s.player.start(); await tick();
  const c = s.contexts[0]; c.currentTime = 5;
  s.player.setTrack(nightTrack); await tick(); c.currentTime = 5.2;
  s.player.pause();
  assert.equal(s.player.snapshot().playing, false);
  for (const gain of c.gains) {
    assert.equal(gain.gain.ramps.at(-1)[0], 0);
    assert.ok(gain.gain.ramps.at(-1)[1] <= 5.321);
  }
  s.player.dispose(); assert.equal(c.state, 'closed');
});
test('pausing during a new download prevents that soundtrack from starting later', async () => {
  const s = setup({ deferredNight: true }); s.player.start(); await tick();
  s.player.setTrack(nightTrack); s.player.pause(); s.resolve(); await tick();
  assert.equal(s.player.snapshot().playing, false);
  assert.equal(s.contexts[0].sources.length, 1);
  s.player.start(); await tick();
  assert.equal(s.player.snapshot().activeTrack, nightTrack.id);
  s.player.dispose();
});
test('the native fallback switches to the correct quiet file and respects pause', async () => {
  const s = setup({ native: true }); s.player.start(); await tick();
  s.player.setTrack(nightTrack); await tick();
  assert.equal(s.audio.src, nightTrack.nativeSrc); assert.equal(s.audio.volume, 1);
  s.player.pause(); s.player.setTrack(ambientTrack); await tick();
  assert.equal(s.audio.paused, true);
  s.player.start(); await tick();
  assert.equal(s.audio.src, ambientTrack.nativeSrc);
  s.player.dispose();
});
