// The audio clock owns the loop; animation frames only update the desk display.
export function createBackgroundAudio({ audio, track, volume, onState, platform = window }) {
  let context, analyser, waveform, buffer, loading, current;
  let offset = 0, startedAt = 0, duration = track.loopDuration;
  let wanted = false, disposed = false, mode = 'buffer', status = 'ready';
  const nodes = new Set();
  const abort = new AbortController();

  function position() {
    if (mode === 'native') return audio.currentTime || 0;
    return current ? (offset + Math.max(0, context.currentTime - startedAt)) % duration : offset;
  }
  function snapshot() {
    return { status, mode, duration, position: position(), volume,
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
    else if (buffer) publish('waiting-for-tap');
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
  function loadBuffer() {
    if (buffer) return Promise.resolve(buffer);
    if (loading) return loading;
    loading = (async () => {
      for (const src of track.bufferSources) {
        try {
          const response = await platform.fetch(src, { signal: abort.signal });
          if (!response.ok) throw new Error('Track unavailable');
          const decoded = await context.decodeAudioData(await response.arrayBuffer());
          if (disposed) return;
          buffer = decoded;
          duration = Math.min(decoded.duration, track.loopDuration);
          return buffer;
        } catch (error) { if (disposed || error.name === 'AbortError') return; }
      }
      throw new Error('Audio decoding unavailable');
    })();
    return loading;
  }
  function startBuffer() {
    if (disposed || !wanted || !buffer) return;
    if (!current) {
      const source = context.createBufferSource(), gain = context.createGain();
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = 0;
      source.loopEnd = duration;
      source.connect(gain);
      gain.connect(analyser);
      const now = context.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 1.4);
      const node = { source, gain };
      nodes.add(node);
      source.onended = () => { source.disconnect(); gain.disconnect(); nodes.delete(node); };
      offset %= duration;
      startedAt = now;
      current = node;
      source.start(now, offset);
    }
    publish(context.state === 'running' ? 'playing' : 'waiting-for-tap');
  }
  function startNative() {
    mode = 'native';
    if (!audio.getAttribute('src')) {
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
    if (buffer) { startBuffer(); return; }
    publish('loading');
    loadBuffer().then(() => { if (wanted && !disposed) startBuffer(); })
      .catch(() => { if (wanted && !disposed) startNative(); });
  }
  function pause() {
    wanted = false;
    if (mode === 'native') { audio.autoplay = false; audio.pause(); }
    else if (current) {
      offset = position();
      const { source, gain } = current, now = context.currentTime;
      if (gain.gain.cancelAndHoldAtTime) gain.gain.cancelAndHoldAtTime(now);
      else { gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(gain.gain.value, now); }
      gain.gain.linearRampToValueAtTime(0, now + .12);
      source.stop(now + .13);
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
  const nativePlaying = () => { if (!wanted || disposed) audio.pause(); else publish('playing'); };
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
  return { start, pause, snapshot, meter, dispose };
}
