import { useEffect, useRef, useState } from "react";

export default function Scene({ mode, progress }) {
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
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting || api.current || disposed) return;
        observer.disconnect();
        try {
          const { createScene } = await import("../scene.js");
          if (disposed) return;
          api.current = createScene(
            target,
            mode,
            () => currentProgress.current || 0,
          );
          target.dataset.ready = "true";
        } catch (error) {
          console.warn(
            "3D scene unavailable; displaying portrait fallback.",
            error.message,
          );
          if (!disposed) setFailed(true);
        }
      },
      { rootMargin: "250px" },
    );
    observer.observe(target);
    return () => {
      disposed = true;
      observer.disconnect();
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
        mode === "workspace"
          ? "An original 3D model of Pranav at his desk, with glasses, swept black hair, and a light blue shirt"
          : "Pranav’s 3D character on a glowing holographic platform"
      }
    >
      {failed ? (
        <img
          className="scene-fallback"
          src="/media/portrait.webp"
          alt="Pranav Rao K"
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
