import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

let apiPromise;
function soundCloudAPI() {
  if (window.SC?.Widget) return Promise.resolve(window.SC);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.async = true;
    script.onload = () => resolve(window.SC);
    script.onerror = () => { apiPromise = null; script.remove(); reject(new Error('Music connection unavailable')); };
    document.head.appendChild(script);
  });
  return apiPromise;
}

const SoundCloudSong = forwardRef(function SoundCloudSong({ href, title, volume, wanted, startAt = 0, onStatus, onFailure }, ref) {
  const host = useRef(null), player = useRef(null), latest = useRef(null), position = useRef(0), duration = useRef(0);
  latest.current = { volume, wanted, startAt, onStatus, onFailure };
  useImperativeHandle(ref, () => ({
    play() { player.current?.setVolume(Math.round(latest.current.volume * 100)); player.current?.play(); },
    pause() { player.current?.pause(); },
    position() { return position.current; },
    duration() { return duration.current; },
  }), []);
  useEffect(() => {
    let disposed = false, ready = false, started = false, restarting = false, blockedTimer;
    const container = host.current;
    const iframe = document.createElement('iframe');
    iframe.title = `${title} - SoundCloud music player`;
    iframe.width = '100%'; iframe.height = '166'; iframe.allow = 'autoplay';
    iframe.setAttribute('scrolling', 'no');
    iframe.src = `https://w.soundcloud.com/player/?${new URLSearchParams({ url: href, auto_play: 'false', visual: 'false', color: '#e8787c', show_user: 'true', show_artwork: 'false', show_comments: 'false', show_reposts: 'false', show_teaser: 'false', hide_related: 'true' })}`;
    container.appendChild(iframe);
    const connectionTimer = setTimeout(() => { if (!disposed && !ready) latest.current.onFailure('network'); }, 20000);
    soundCloudAPI().then(SC => {
      if (disposed) return;
      const widget = SC.Widget(iframe);
      player.current = widget;
      const bind = (event, callback) => widget.bind(event, data => { if (!disposed) callback(data); });
      bind(SC.Widget.Events.READY, () => {
        ready = true;
        clearTimeout(connectionTimer);
        widget.setVolume(Math.round(latest.current.volume * 100));
        widget.getDuration(ms => { if (!disposed) { duration.current = ms / 1000; container.dataset.duration = String(duration.current); } });
        if (latest.current.startAt > 0) widget.seekTo(latest.current.startAt * 1000);
        latest.current.onStatus('ready');
        if (latest.current.wanted) {
          widget.play();
          blockedTimer = setTimeout(() => { if (!disposed && !started && latest.current.wanted) latest.current.onStatus('blocked'); }, 4000);
        }
      });
      bind(SC.Widget.Events.PLAY, () => {
        restarting = false;
        latest.current.onStatus(started ? 'playing' : 'starting');
      });
      bind(SC.Widget.Events.PAUSE, () => { if (!restarting) latest.current.onStatus(started ? 'paused' : 'blocked'); });
      bind(SC.Widget.Events.FINISH, () => {
        if (latest.current.wanted) { restarting = true; widget.seekTo(0); widget.play(); }
        else latest.current.onStatus('paused');
      });
      bind(SC.Widget.Events.PLAY_PROGRESS, data => {
        position.current = data.currentPosition / 1000;
        container.dataset.position = position.current.toFixed(2);
        // PLAY can precede a browser autoplay rejection. Actual progress confirms sound.
        if (!started && data.currentPosition > 100) { started = true; clearTimeout(blockedTimer); latest.current.onStatus('playing'); }
      });
      bind(SC.Widget.Events.ERROR, () => latest.current.onFailure('stream'));
    }).catch(() => { if (!disposed) latest.current.onFailure('network'); });
    return () => {
      disposed = true; clearTimeout(connectionTimer); clearTimeout(blockedTimer);
      const widget = player.current;
      if (widget) { Object.values(window.SC.Widget.Events).forEach(event => widget.unbind(event)); widget.pause(); }
      player.current = null; container.replaceChildren();
    };
  }, [href, title]);
  useEffect(() => { player.current?.setVolume(Math.round(volume * 100)); }, [volume]);
  return <div className="hindi-stream" ref={host} />;
});
export default SoundCloudSong;
