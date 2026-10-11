import { useEffect, useRef, useState } from "react";
import { finishStartup } from "../startup.js";

export default function Scene({ mode, progress, timeline }) {
  const host = useRef(null);
  const api = useRef(null);
  const currentProgress = useRef(progress);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    currentProgress.current = progress;
  }, [progress]);
  useEffect(() => {
    let disposed = false;
    const target = host.current;
    let observer,started=false;
    const initialize = async () => {
      if (started || api.current || disposed) return;
      started=true;
      observer?.disconnect();
      try {
        const { createScene } = await import("../scene.js");
        if (disposed) return;
        const instance = await createScene(target, mode, () =>
          timeline ? timeline.current : currentProgress.current || 0,
        );
        if (disposed) { instance.dispose(); return; }
        api.current = instance;
        await instance.ready;
        if(disposed)return;
        target.dataset.ready = "true";
        if(mode==='experience'||mode==='workspace')finishStartup();
      } catch (error) {
        console.warn(
          "3D scene unavailable; displaying portrait fallback.",
          error.message,
        );
        if (!disposed) setFailed(true);
      }
    };
    if(mode==='experience'||mode==='workspace')void initialize();
    else {
      observer = new IntersectionObserver(([entry])=>{
        if(entry.isIntersecting)void initialize();
      },{rootMargin:'250px'});
      observer.observe(target);
    }
    return () => {
      disposed = true;
      observer?.disconnect();
      api.current?.dispose();
      api.current = null;
    };
  }, [mode]);
  return (
    <div
      ref={host}
      className={`scene scene-${mode}`}
      role="img"
      aria-label={
        mode === "workspace" || mode === "experience"
          ? "Pranav’s approved 3D avatar with swept black hair, clear glasses, headphones, a black hoodie and floral shorts, at a wheeled desk chair"
          : mode === "contact"
            ? "Pranav dozing beside parcels, then waking up and waving hello"
            : "Pranav’s 3D character on a glowing holographic platform"
      }
    >
      {failed ? (
        <img
          className="scene-fallback"
          src="/media/pranav-red-shirt.png"
          alt="Pranav Rao K"
          onLoad={()=>{if(mode==='experience'||mode==='workspace')finishStartup();}}
          onError={()=>{if(mode==='experience'||mode==='workspace')finishStartup();}}
        />
      ) : (
        <div className="scene-placeholder" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}
