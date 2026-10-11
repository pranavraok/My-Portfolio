const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Chair, hands, camera and labels all consume this same scroll position.
// Small gestures retain their timing; large swipes catch up without a long queue.
export function advanceScrollPage(current, target, deltaMs) {
  const gap = target - current;
  if (Math.abs(gap) < .0001) return target;
  const delta = clamp(deltaMs, 0, 50) / 1000;
  let step = gap * (1 - Math.exp(-delta * 10));
  if (target <= 1.15 && current <= .94) {
    const baseSpeed = current > .18 && current < .46 ? .14 : .18;
    const urgency = clamp((Math.abs(gap) - .10) / .45, 0, 1);
    const blend = urgency * urgency * (3 - 2 * urgency);
    const speed = baseSpeed + (1.8 - baseSpeed) * blend;
    step = clamp(step, -delta * speed, delta * speed);
  }
  return current + step;
}
