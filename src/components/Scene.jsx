import { useEffect, useRef, useState } from "react";
import { finishStartup } from "../startup.js";
import { createScene } from "../scene.js";

export default function Scene({ mode, progress, timeline }) {
  const host = useRef(null);
  const api = useRef(null);
  const currentProgress = useRef(progress);
  const retry = useRef(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    currentProgress.current = progress;
  }, [progress]);
  useEffect(() => {
    let disposed = false;
    const target = host.current;
    let observer,started=false,retryTimer,readyTimer,attempts=0;
    const initialize = async () => {
      if (started || api.current || disposed) return;
      started=true;
      attempts++;
      setFailed(false);
      target.dataset.ready="false";
      target.dataset.loadState="loading";
      target.setAttribute("aria-busy", "true");
      observer?.disconnect();
      try {
        const instance = await createScene(target, mode, () =>
          timeline ? timeline.current : currentProgress.current || 0,
        );
        if (disposed) { instance.dispose(); return; }
        api.current = instance;
        await Promise.race([
          instance.ready,
          new Promise((_, reject) => { readyTimer = setTimeout(() => reject(new Error("Character frame timed out")), 12000); }),
        ]);
        clearTimeout(readyTimer);
        if(disposed)return;
        target.dataset.ready = "true";
        target.dataset.loadState = "ready";
        target.setAttribute("aria-busy", "false");
        if(mode==='experience'||mode==='workspace')finishStartup();
      } catch (error) {
        clearTimeout(readyTimer);
        if(disposed)return;
        api.current?.dispose();
        api.current=null;
        started=false;
        if(attempts<3){
          target.dataset.loadState="retrying";
          retryTimer=setTimeout(initialize,attempts*1000);
          return;
        }
        console.warn(
          "3D scene could not load after three attempts.",
          error.message,
        );
        target.dataset.loadState="failed";
        target.setAttribute("aria-busy", "false");
        setFailed(true);
        if(mode==='experience'||mode==='workspace')finishStartup();
      }
    };
    const retryLoading=()=>{
      if(disposed||started||api.current)return;
      clearTimeout(retryTimer);attempts=0;
      void initialize();
    };
    retry.current=retryLoading;
    const recoverOnline=()=>{
      if(target.dataset.loadState==="failed"||target.dataset.loadState==="retrying")retryLoading();
    };
    window.addEventListener("online",recoverOnline);
    if(mode==='experience'||mode==='workspace')void initialize();
    else {
      observer = new IntersectionObserver(([entry])=>{
        if(entry.isIntersecting)void initialize();
      },{rootMargin:'1100px'});
      observer.observe(target);
    }
    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      clearTimeout(readyTimer);
      retry.current=null;
      window.removeEventListener("online",recoverOnline);
      observer?.disconnect();
      api.current?.dispose();
      api.current = null;
    };
  }, [mode]);
  return (
    <div
      ref={host}
      className={`scene scene-${mode}`}
      role={failed ? "group" : "img"}
      aria-label={
        mode === "workspace" || mode === "experience"
          ? "Pranav’s approved 3D avatar with swept black hair, clear glasses, headphones, a black hoodie and floral shorts, at a wheeled desk chair"
          : mode === "contact"
            ? "Pranav dozing beside parcels, then waking up and waving hello"
            : "Pranav’s 3D character on a glowing holographic platform"
      }
    >
      {failed ? (
        <>
        <img
          className="scene-fallback"
          src="/media/pranav-red-shirt.png"
          alt="Pranav Rao K"
          onLoad={()=>{if(mode==='experience'||mode==='workspace')finishStartup();}}
          onError={()=>{if(mode==='experience'||mode==='workspace')finishStartup();}}
        />
        <button className="scene-retry" onClick={()=>retry.current?.()}>
          Reload 3D character
        </button>
        </>
      ) : (
        <div className="scene-placeholder" aria-hidden="true">
          <span />
          <span />
          <span />
          <small className="scene-loading-label">Getting ready…</small>
        </div>
      )}
    </div>
  );
}
