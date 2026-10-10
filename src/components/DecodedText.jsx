import { useEffect, useState } from "react";

const symbols = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";

export default function DecodedText({ text, active = true, delay = 0 }) {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    if (!active || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(text);
      return;
    }
    let frame, started, last = 0;
    function update(time) {
      if (started === undefined) started = time;
      const elapsed = time - started - delay;
      if(elapsed < 0) { frame = requestAnimationFrame(update); return; }
      const progress = Math.min(1,elapsed/760);
      if(time-last > 45 || progress === 1) {
        last = time;
        setDisplay([...text].map((letter,index) => {
          if(letter === " " || index/text.length < progress) return letter;
          return symbols[(index*7+Math.floor(elapsed/55))%symbols.length];
        }).join(""));
      }
      if(progress < 1) frame = requestAnimationFrame(update);
    }
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  },[text,active,delay]);
  return <span className="decoded-text"><span className="sr-only">{text}</span><span aria-hidden="true">{display}</span></span>;
}
