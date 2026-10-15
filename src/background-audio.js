// The audio clock owns the loop; animation frames only update the desk display.
export function createBackgroundAudio({ audio, track, volume, onState, platform = window }) {
  let context, analyser, waveform, current;
  let wanted = false, disposed = false, mode = 'buffer', status = 'ready';
  const nodes = new Set();
  const buffers = new Map(), downloads = new Map(), offsets = new Map();
  const abort = new AbortController();

  function position() {
    if (mode === 'native') return audio.currentTime || 0;
    return current ? (current.offset + Math.max(0, context.currentTime - current.startedAt)) % current.duration : offsets.get(track.id) || 0;
  }
  function snapshot() {
    return { status, mode, duration: current?.duration || track.loopDuration, position: position(), volume,
      track: track.id, activeTrack: current?.track.id || track.id, transitioning: nodes.size > 1,
      playing: wanted && (mode === 'native' ? !audio.paused : !!current && context?.state === 'running') };
  }
  function publish(next) {
    if (disposed) return;
    status = next;
    onState(snapshot());
  }
  function contextState() {
    if (!wanted || disposed) return;
    if (context.state === 'running' && current) publish('playing');
    else if (buffers.has(track.id)) publish('waiting-for-tap');
  }
  function openContext() {
    if (context) return true;
    const AudioContext = platform.AudioContext || platform.webkitAudioContext;
    if (!AudioContext) return false;
    try {
      context = new AudioContext({ latencyHint: 'playback' });
      analyser = context.createAnalyser();
      analyser.fftSize = 256;
      waveform = new Uint8Array(analyser.fftSize);
      analyser.connect(context.destination);
      context.addEventListener('statechange', contextState);
      return true;
    } catch { return false; }
  }
  function resumeContext() {
    // Invoke inside the gesture, before any network/decode await (Safari too).
    try { context.resume().catch(() => { if (wanted) publish('waiting-for-tap'); }); }
    catch { if (wanted) publish('waiting-for-tap'); }
  }
  function loadBuffer(target) {
    if (buffers.has(target.id)) return Promise.resolve(buffers.get(target.id));
    if (downloads.has(target.id)) return downloads.get(target.id);
    const loading = (async () => {
      for (const src of target.bufferSources) {
        try {
          const response = await platform.fetch(src, { signal: abort.signal });
          if (!response.ok) throw new Error('Track unavailable');
          const decoded = await context.decodeAudioData(await response.arrayBuffer());
          if (disposed) return;
          buffers.set(target.id, decoded);
          return decoded;
        } catch (error) { if (disposed || error.name === 'AbortError') return; }
      }
      throw new Error('Audio decoding unavailable');
    })().finally(() => downloads.delete(target.id));
    downloads.set(target.id, loading);
    return loading;
  }
  function fadeNodes(seconds) {
    if (!context) return;
    const now = context.currentTime;
    for (const node of nodes) {
      const end = Math.min(node.fadeEnd ?? Infinity, now + seconds);
      if (end <= now) continue;
      const parameter = node.gain.gain;
      if (parameter.cancelAndHoldAtTime) parameter.cancelAndHoldAtTime(now);
      else { parameter.cancelScheduledValues(now); parameter.setValueAtTime(parameter.value, now); }
      parameter.linearRampToValueAtTime(0, end);
      node.fadeEnd = end;
      node.source.stop(end + .01);
    }
  }
  function startBuffer(target, buffer) {
    if (disposed || !wanted || !buffer || target.id !== track.id) return;
    if (current?.track.id !== target.id) {
      if (current) offsets.set(current.track.id, position());
      // Keep the old soundtrack alive while downloading, then overlap both fades.
      fadeNodes(1.4);
      const source = context.createBufferSource(), gain = context.createGain();
      const duration = Math.min(buffer.duration, target.loopDuration);
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = 0;
      source.loopEnd = duration;
      source.connect(gain);
      gain.connect(analyser);
      const now = context.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 1.4);
      const offset = (offsets.get(target.id) || 0) % duration;
      const node = { source, gain, track: target, duration, offset, startedAt: now };
      nodes.add(node);
      source.onended = () => { source.disconnect(); gain.disconnect(); nodes.delete(node); };
      current = node;
      source.start(now, offset);
    }
    publish(context.state === 'running' ? 'playing' : 'waiting-for-tap');
  }
  function startNative() {
    mode = 'native';
    if (audio.getAttribute('src') !== track.nativeSrc) {
      audio.src = track.nativeSrc;
      audio.loop = true;
      audio.preload = 'auto';
      // Pre-attenuated file stays quiet on older iOS media implementations.
      audio.volume = 1;
    }
    audio.autoplay = wanted;
    publish('loading');
    try {
      audio.play().then(() => { if (wanted && !disposed) publish('playing'); })
        .catch(() => { if (wanted && !disposed) publish('waiting-for-tap'); });
    } catch { publish('waiting-for-tap'); }
  }
  function start() {
    if (disposed) return;
    wanted = true;
    if (mode === 'native' || !openContext()) { startNative(); return; }
    resumeContext();
    const target = track;
    if (buffers.has(target.id)) { startBuffer(target, buffers.get(target.id)); return; }
    publish('loading');
    loadBuffer(target).then(buffer => startBuffer(target, buffer))
      .catch(() => { if (wanted && !disposed && track.id === target.id) {
        if (current) { offsets.set(current.track.id, position()); fadeNodes(.12); current = null; }
        startNative();
      } });
  }
  function setTrack(next) {
    if (disposed || next.id === track.id) return;
    if (mode === 'native') offsets.set(track.id, position());
    track = next;
    if (wanted) start();
    else publish('paused');
  }
  function pause() {
    wanted = false;
    if (mode === 'native') { audio.autoplay = false; audio.pause(); }
    else {
      if (current) offsets.set(current.track.id, position());
      fadeNodes(.12);
      current = null;
    }
    publish('paused');
  }
  function meter() {
    if (!analyser || !snapshot().playing) return 0;
    analyser.getByteTimeDomainData(waveform);
    let sum = 0;
    for (const value of waveform) sum += ((value - 128) / 128) ** 2;
    return Math.min(.45, Math.sqrt(sum / waveform.length) * 5 / volume);
  }
  const nativePlaying = () => { if (!wanted || disposed) audio.pause(); else if (mode === 'native') publish('playing'); };
  const nativePaused = () => { if (!disposed && mode === 'native') publish(wanted ? 'waiting-for-tap' : 'paused'); };
  const nativeError = () => { if (mode === 'native') publish('unavailable'); };
  audio.addEventListener('playing', nativePlaying);
  audio.addEventListener('pause', nativePaused);
  audio.addEventListener('error', nativeError);

  function dispose() {
    disposed = true; wanted = false; abort.abort();
    audio.removeEventListener('playing', nativePlaying);
    audio.removeEventListener('pause', nativePaused);
    audio.removeEventListener('error', nativeError);
    audio.autoplay = false; audio.pause();
    audio.removeAttribute('src'); audio.load();
    for (const { source, gain } of nodes) {
      try { source.stop(); } catch { /* A fading source may have already ended. */ }
      source.disconnect(); gain.disconnect();
    }
    nodes.clear(); current = null;
    if (context) {
      context.removeEventListener('statechange', contextState);
      analyser?.disconnect();
      context.close().catch(() => {});
    }
  }
  return { start, pause, setTrack, snapshot, meter, dispose };
}
