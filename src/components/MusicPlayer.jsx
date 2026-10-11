import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons.jsx';
import SoundCloudSong from './SoundCloudSong.jsx';
import { ambientTrack, favoriteTracks, speakerState } from '../music.js';
import '../music-player.css';

const playlist=[...favoriteTracks,ambientTrack],storageKey='pranav-radio-v3';
function preferences(){
  try {const p=JSON.parse(localStorage.getItem(storageKey)||'{}');return {paused:p.paused===true,index:Math.max(0,playlist.findIndex(t=>t.id===p.track)),volume:Number.isFinite(p.volume)?Math.max(0,Math.min(1,p.volume)):.18};}
  catch{return {paused:false,index:0,volume:.18};}
}

export default function MusicPlayer(){
  const initial=useRef(null);
  if(!initial.current)initial.current=preferences();
  const [open,setOpen]=useState(false),[index,setIndex]=useState(initial.current.index);
  const [playing,setPlaying]=useState(false),[wanted,setWanted]=useState(!initial.current.paused);
  const [volume,setVolume]=useState(initial.current.volume),[status,setStatus]=useState('ready'),[error,setError]=useState('');
  const [streamVisible,setStreamVisible]=useState(playlist[initial.current.index].provider==='soundcloud'&&!initial.current.paused);
  const [providerError,setProviderError]=useState('');
  const audio=useRef(null),stream=useRef(null),button=useRef(null),panel=useRef(null);
  const wantedRef=useRef(!initial.current.paused),playingRef=useRef(false),indexRef=useRef(initial.current.index),volumeRef=useRef(initial.current.volume);
  const token=useRef(0),frame=useRef(null),analysis=useRef(null),savedPosition=useRef(0);
  const streamPlayed=useRef(false);
  const track=playlist[index];
  const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify({paused:!wantedRef.current,track:playlist[indexRef.current].id,volume:volumeRef.current}));}catch{/* Private browsing can disable preference storage. */}};
  function playback(value){
    playingRef.current=value;setPlaying(value);speakerState.playing=value;
    if(!value){speakerState.level=0;speakerState.bands.fill(0);cancelAnimationFrame(frame.current);return;}
    cancelAnimationFrame(frame.current);
    const meter=time=>{
      if(!playingRef.current)return;
      frame.current=requestAnimationFrame(meter);
      const analyser=analysis.current?.analyser;
      if(analyser && playlist[indexRef.current].provider!=='soundcloud'){
        analyser.getByteTimeDomainData(analysis.current.wave);
        const power=analysis.current.wave.reduce((sum,v)=>sum+((v-128)/128)**2,0)/analysis.current.wave.length;
        speakerState.level=Math.min(1,Math.sqrt(power)*7);
      }else speakerState.level=.11+.07*Math.pow(Math.max(0,Math.sin(time*.001*Math.PI*76/60)),4);
      for(let i=0;i<8;i++)speakerState.bands[i]=Math.max(.08,speakerState.level*(2+Math.sin(time*.001*1.4+i*.9)));
    };
    frame.current=requestAnimationFrame(meter);
  }
  function attachAnalysis(){
    if(analysis.current)return;
    try {
      const ctx=new (window.AudioContext||window.webkitAudioContext)(),analyser=ctx.createAnalyser();
      analyser.fftSize=256;
      ctx.createMediaElementSource(audio.current).connect(analyser);analyser.connect(ctx.destination);
      analysis.current={ctx,analyser,wave:new Uint8Array(256)};
    }catch{/* Native audio remains available without visual analysis. */}
  }
  async function start(userInitiated=true){
    const request=++token.current,selected=playlist[indexRef.current];
    wantedRef.current=true;setWanted(true);if(userInitiated)save();setError('');
    speakerState.title=selected.title;speakerState.artist=selected.artist;
    if(selected.provider==='soundcloud'){
      audio.current.pause();setStreamVisible(true);setStatus('starting');stream.current?.play();return;
    }
    stream.current?.pause();setStreamVisible(false);
    audio.current.src=selected.src;audio.current.loop=true;audio.current.volume=volumeRef.current;
    if(userInitiated){attachAnalysis();analysis.current?.ctx.resume();}
    try {
      await audio.current.play();
      if(request!==token.current)return;
      if(analysis.current?.ctx.state==='suspended'){setStatus('blocked');playback(false);return;}
      playback(true);setStatus('playing');
    }catch{if(request===token.current){playback(false);setStatus('blocked');}}
  }
  function pause(closeStream=false){
    ++token.current;wantedRef.current=false;setWanted(false);save();
    savedPosition.current=stream.current?.position()||0;
    audio.current.pause();stream.current?.pause();playback(false);setStatus('paused');
    if(closeStream)setStreamVisible(false);
  }
  function select(next){
    ++token.current;audio.current.pause();stream.current?.pause();playback(false);
    indexRef.current=next;setIndex(next);savedPosition.current=0;streamPlayed.current=false;
    speakerState.title=playlist[next].title;speakerState.artist=playlist[next].artist;
    setStreamVisible(playlist[next].provider==='soundcloud');save();
    if(wantedRef.current)start(true);
  }
  function streamStatus(next){
    if(playlist[indexRef.current].provider!=='soundcloud')return;
    setStatus(next);
    if(next==='playing'){streamPlayed.current=true;wantedRef.current=true;setWanted(true);save();playback(true);setError('');setProviderError('');}
    else if(next==='paused'){
      if(streamPlayed.current||!wantedRef.current){wantedRef.current=false;setWanted(false);save();}
      else setStatus('blocked');
      playback(false);
    }
    else if(next==='blocked'||next==='suspended')playback(false);
  }
  useEffect(()=>{
    document.documentElement.classList.toggle('has-hindi-player',streamVisible&&track.provider==='soundcloud');
    window.dispatchEvent(new Event('portfolio-music-layout'));
    return ()=>document.documentElement.classList.remove('has-hindi-player');
  },[streamVisible,track.provider]);
  useEffect(()=>{
    speakerState.title=playlist[indexRef.current].title;speakerState.artist=playlist[indexRef.current].artist;
    speakerState.volume=volumeRef.current;
    audio.current.volume=volumeRef.current;
    if(wantedRef.current)start(false);
    const unlock=()=>{if(wantedRef.current&&!playingRef.current)start(true);};
    const escape=event=>{if(event.key==='Escape'){setOpen(false);button.current?.focus();}};
    const outside=event=>{if(panel.current&&!panel.current.contains(event.target)&&!button.current?.contains(event.target))setOpen(false);};
    document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);
    document.addEventListener('keydown',escape);document.addEventListener('pointerdown',outside);
    return ()=>{++token.current;document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock);document.removeEventListener('keydown',escape);document.removeEventListener('pointerdown',outside);cancelAnimationFrame(frame.current);audio.current?.pause();analysis.current?.ctx.close();speakerState.playing=false;speakerState.level=0;};
  },[]);
  return <div className="music-shell" data-provider={track.provider||'studio'} data-playing={playing} data-status={status} data-provider-error={providerError}>
    <button ref={button} className={`sound-button music-toggle ${playing?'is-playing':''}`} aria-label="Computer music player" aria-expanded={open} aria-controls="computer-music-player" onClick={()=>setOpen(v=>!v)} title="Music controls"><Icon name={playing?'sound':'music'}/><span className="music-power"/></button>
    <audio ref={audio} preload="none" crossOrigin="anonymous" onPlaying={()=>{if(playlist[indexRef.current].provider!=='soundcloud'){playback(true);setStatus('playing');}}} onEnded={()=>{if(wantedRef.current)start(false);}}/>
    {streamVisible&&track.provider==='soundcloud'?<section className="hindi-dock" aria-label="Hindi romantic music player" data-lenis-prevent>
      <div className="hindi-dock-bar"><span>{track.title.toUpperCase()}</span><button aria-label="Pause and close Hindi player" onClick={()=>pause(true)}><Icon name="close" size={13}/></button></div>
      <SoundCloudSong ref={stream} href={track.href} title={track.title} volume={volume} wanted={wanted} startAt={savedPosition.current} onStatus={streamStatus} onFailure={code=>{setProviderError(String(code));playback(false);setStatus('unavailable');setError('The Hindi stream could not load here.');}}/>
      <div className="hindi-dock-caption"><span>{status==='blocked'?'Tap Play to start':playing?'Playing on desk speakers':error||'Soft Hindi romance'}</span><button aria-label={playing?'Pause music':'Play music'} onClick={()=>playing?pause():start(true)}><Icon name={playing?'pause':'play'} size={14}/></button><a href={track.href} target="_blank" rel="noreferrer" aria-label="Open the song on SoundCloud"><Icon name="arrow" size={12}/></a></div>
    </section>:null}
    {open?<div ref={panel} className="computer-player radio-controls" id="computer-music-player" role="dialog" aria-label="Computer music player" data-lenis-prevent>
      <div className="player-titlebar"><span>PRANAV FM</span><button aria-label="Close music controls" onClick={()=>{setOpen(false);button.current?.focus();}}><Icon name="close" size={13}/></button></div>
      <h2>{track.title}</h2><p>{track.artist}</p>
      <button className="radio-main-toggle" aria-label={playing?'Pause music':'Play music'} onClick={()=>playing?pause():start(true)}><Icon name={playing?'pause':'play'} size={18}/>{playing?'Pause':'Play'}</button>
      <div className="player-volume"><Icon name={volume?'sound':'mute'} size={15}/><input type="range" min="0" max="1" step=".01" aria-label="Music volume" value={volume} onChange={event=>{const v=Number(event.target.value);volumeRef.current=v;setVolume(v);audio.current.volume=v;speakerState.volume=v;save();}}/><span>{Math.round(volume*100)}%</span></div>
      <div className="player-list" aria-label="Playlist">{playlist.map((song,i)=><button key={song.id} className={i===index?'selected':''} onClick={()=>select(i)}><span>{String(i+1).padStart(2,'0')}</span><span>{song.title}<small>{song.artist}</small></span>{i===index?<span className="track-dot"/>:null}</button>)}</div>
      {error?<p className="player-error" role="alert">{error} <a href={favoriteTracks[0].href} target="_blank" rel="noreferrer">Listen on SoundCloud</a></p>:null}
      <p className="player-footnote">Loops until paused. Your choice is remembered.</p>
    </div>:null}
  </div>;
}
