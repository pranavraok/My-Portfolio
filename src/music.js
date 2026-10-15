export const backgroundMusicVolume = 0.09;

export const morningTrack = {
  id: "pranav-soft-melody",
  title: "Pranav's Melody",
  artist: "Pranav · Soft mix",
  kind: "ambient",
  bufferSources: ["/music/pranav-melody-loop.ogg", "/music/pranav-melody-loop.mp3"],
  nativeSrc: "/music/pranav-melody-loop-soft.mp3",
  loopDuration: 66.9,
  loop: true,
};

export const nightTrack = {
  id: "after-hours-selected-excerpt",
  title: "After Hours",
  artist: "Selected evening soundtrack",
  kind: "ambient",
  bufferSources: ["/music/after-hours-loop.ogg", "/music/after-hours-loop.mp3"],
  nativeSrc: "/music/after-hours-loop-soft.mp3",
  loopDuration: 65.5,
  loop: true,
};

export const musicTracks = { morning: morningTrack, night: nightTrack };
export const ambientTrack = morningTrack;

// Shared with the desk monitor. Audio analysis stays out of React's render loop.
export const speakerState = {
  playing: false,
  title: ambientTrack.title,
  artist: ambientTrack.artist,
  level: 0,
  progress: 0,
  bands: Array(8).fill(0),
  volume: backgroundMusicVolume,
};

export function toggleBackgroundMusic(){window.dispatchEvent(new Event('portfolio-toggle-audio'));}

export function drawComputerRadio(ctx, width, height, time = 0) {
  const s = speakerState;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#142d26";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#234a3e";
  ctx.fillRect(0, 0, width, 30);
  ["#ee6266", "#efc477", "#7ad4b0"].forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(16 + i * 18, 15, 5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "#a9c4b6";
  ctx.font = "11px monospace";
  ctx.fillText("PRANAV FM · DESK SPEAKERS", 100, 20);
  const x = 118,
    y = 151,
    r = 75;
  ctx.fillStyle = "#0c1714";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  for (let n = 0; n < 5; n++) {
    ctx.strokeStyle = "#365849";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r - 8 - n * 9, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "#ea5c63";
  ctx.beginPath();
  ctx.arc(x, y, 29, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f1eee4";
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(s.playing ? time * 0.8 : 0);
  ctx.fillStyle = "#fa9e9d";
  ctx.fillRect(0, -22, 16, 5);
  ctx.restore();
  ctx.fillStyle = "#f0f3e8";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(s.title.slice(0, 21), 220, 102);
  ctx.fillStyle = "#9cbba9";
  ctx.font = "15px sans-serif";
  ctx.fillText(s.artist.slice(0, 27), 220, 127);
  ctx.fillStyle = s.playing ? "#81dbb7" : "#719687";
  ctx.font = "bold 12px monospace";
  ctx.fillText(
    s.playing ? "ON THE SPEAKERS" : "PRESS PLAY TO TUNE IN",
    220,
    163,
  );
  for (let i = 0; i < 8; i++) {
    const h = s.playing ? 8 + s.bands[i] * 47 : 4;
    ctx.fillStyle = i < 5 ? "#8ae1bc" : "#e97979";
    ctx.fillRect(222 + i * 25, 228 - h, 14, h);
  }
  ctx.fillStyle = "#264f40";
  ctx.fillRect(37, 276, width - 74, 3);
  ctx.fillStyle = "#e8787b";
  ctx.fillRect(
    37,
    276,
    s.progress * (width - 74),
    3,
  );
  ctx.fillStyle = "#8bac9b";
  ctx.font = "11px monospace";
  ctx.fillText("A GOOD DAY STARTS WITH A GOOD TRACK.", 37, 302);
}
