// Keep an existing scene alive when the browser temporarily releases its GPU.
export function scenePixelRatio(width, height, mobile, deviceRatio = window.devicePixelRatio) {
  const pixelBudget = mobile ? 1400000 : 4500000;
  return Math.min(deviceRatio, mobile ? 1.35 : 1.75, Math.sqrt(pixelBudget / Math.max(1, width * height)));
}

export function watchSceneContext(renderer, host) {
  let lost = false;
  const canvas = renderer.domElement;
  const onLost = (event) => {
    event.preventDefault();
    lost = true;
    host.dataset.ready = "false";
    host.dataset.graphics = "recovering";
  };
  const onRestored = () => {
    lost = false;
    // Three rebuilds its GPU resources before this listener runs. The scene
    // becomes ready only after a new frame is drawn, not just after the event.
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  return {
    get lost() { return lost; },
    rendered() {
      if (lost) return;
      if (host.dataset.ready !== "true") host.dataset.ready = "true";
      if (host.dataset.graphics !== "ready") host.dataset.graphics = "ready";
    },
    dispose() {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    },
  };
}
