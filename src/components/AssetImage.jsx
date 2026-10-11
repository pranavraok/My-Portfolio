import { useEffect, useRef, useState } from "react";

// Preserve each image's space while it loads and retry one interrupted request.
export default function AssetImage({ src, alt, width, height, loading = "lazy", ...props }) {
  const [request, setRequest] = useState({ src, attempt: 0, state: "loading" });
  const retryTimer = useRef(null);
  const current = request.src === src ? request : { src, attempt: 0, state: "loading" };
  useEffect(() => () => clearTimeout(retryTimer.current), [src]);
  const onError = () => {
    if (current.attempt === 0) {
      setRequest({ src, attempt: 0, state: "loading" });
      retryTimer.current = setTimeout(() => setRequest({ src, attempt: 1, state: "loading" }), 700);
    } else setRequest({ src, attempt: 1, state: "failed" });
  };
  return <span className="asset-image" data-state={current.state} style={{ "--image-width": width ? `${width}px` : undefined }}>
    <img {...props} key={`${src}-${current.attempt}`} src={current.attempt ? `${src}${src.includes("?") ? "&" : "?"}retry=1` : src} alt={alt} width={width} height={height} loading={loading} decoding="async" onLoad={() => setRequest({ src, attempt: current.attempt, state: "ready" })} onError={onError} />
    {current.state === "failed" ? <span className="asset-image-unavailable" role="img" aria-label={alt}>Preview unavailable</span> : null}
  </span>;
}
