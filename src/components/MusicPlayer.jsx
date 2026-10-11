import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons.jsx';
import { ambientTrack, speakerState } from '../music.js';
import '../music-player.css';

const storageKey='pranav-background-music-v1';
function preferences(){
  try{const saved=JSON.parse(localStorage.getItem(storageKey)||localStorage.getItem('pranav-radio-v3')||'{}');return {paused:saved.paused===true,volume:Number.isFinite(saved.volume)?Math.max(0,Math.min(.35,saved.volume)):.14};}
  catch{return {paused:false,volume:.14};}
}

export default function MusicPlayer(){
  const initial=useRef(null);if(!initial.current)initial.current=preferences();
  const audio=useRef(null),button=useRef(null),wanted=useRef(!initial.current.paused),playingRef=useRef(false),analysis=useRef(null),frame=useRef(null),generation=useRef(0);
  const [playing,setPlaying]=useState(false),[status,setStatus]=useState('ready');
  const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify({paused:!wanted.current,volume:initial.current.volume}));}catch{/* Storage can be disabled by the visitor. */}};
  function playback(value){
    playingRef.current=value;setPlaying(value);speakerState.playing=value;cancelAnimationFrame(frame.current);
    if(!value){speakerState.level=0;speakerState.bands.fill(0);return;}
    const meter=()=>{if(!playingRef.current)return;const analyser=analysis.current?.analyser;if(analyser){analyser.getByteTimeDomainData(analysis.current.wave);let sum=0;for(const v of analysis.current.wave)sum+=((v-128)/128)**2;speakerState.level=Math.min(.45,Math.sqrt(sum/analysis.current.wave.length)*5);}for(let i=0;i<8;i++)speakerState.bands[i]=Math.max(.03,speakerState.level*(1.5+Math.sin(performance.now()*.001+i*.8)));frame.current=requestAnimationFrame(meter);};
    frame.current=requestAnimationFrame(meter);
  }
  function attachAnalysis(){
    if(analysis.current)return;
    try{const ctx=new (window.AudioContext||window.webkitAudioContext)(),analyser=ctx.createAnalyser();analyser.fftSize=256;ctx.createMediaElementSource(audio.current).connect(analyser);analyser.connect(ctx.destination);analysis.current={ctx,analyser,wave:new Uint8Array(256)};}
    catch{/* Native playback remains available without speaker visualization. */}
  }
  async function start(fromGesture=false){
    if(!audio.current)return;const request=++generation.current;wanted.current=true;save();
    if(fromGesture){attachAnalysis();try{await analysis.current?.ctx.resume();}catch{/* Keep native playback available. */}}
    try{await audio.current.play();if(request!==generation.current||!wanted.current)return;if(analysis.current?.ctx.state==='suspended'){playback(false);setStatus('waiting-for-tap');return;}playback(true);setStatus('playing');}
    catch{if(request===generation.current){playback(false);setStatus('waiting-for-tap');}}
  }
  function pause(){++generation.current;wanted.current=false;save();audio.current?.pause();playback(false);setStatus('paused');}
  useEffect(()=>{
    speakerState.title=ambientTrack.title;speakerState.artist=ambientTrack.artist;speakerState.volume=initial.current.volume;audio.current.volume=initial.current.volume;
    if(wanted.current)start(false);
    const unlock=event=>{if(button.current?.contains(event.target))return;if(wanted.current&&!playingRef.current)start(true);};
    document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);
    return()=>{++generation.current;document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock);cancelAnimationFrame(frame.current);audio.current?.pause();analysis.current?.ctx.close();speakerState.playing=false;speakerState.level=0;};
  },[]);
  return <div className="music-shell" data-provider="original-lofi" data-playing={playing} data-status={status}>
    <button ref={button} className={`sound-button music-toggle ${playing?'is-playing':''}`} aria-label={playing?'Pause background music':'Play background music'} aria-pressed={playing} title={playing?'Pause background music':'Play background music'} onClick={()=>playingRef.current?pause():start(true)}><Icon name={playing?'pause':'play'} size={18}/><span className="music-power" aria-hidden="true"/></button>
    <audio ref={audio} preload="auto" loop onPlaying={()=>{if(analysis.current?.ctx.state!=='suspended'){playback(true);setStatus('playing');}}} onPause={()=>{playback(false);if(!wanted.current)setStatus('paused');}} onError={()=>{playback(false);setStatus('unavailable');}}><source src={ambientTrack.src} type="audio/ogg"/><source src="/music/soft-lofi.mp3" type="audio/mpeg"/></audio>
  </div>;
}
