const clamp=value=>Math.max(0,Math.min(1,value));
const ease=(a,b,value)=>{const t=clamp((value-a)/(b-a));return t*t*t*(10+t*(-15+6*t));};

export function footerSleepRequest(top,height,viewport){
  const progress=clamp((viewport*.65-top)/Math.max(1,height-viewport*.35));
  const p=clamp((progress-.5)/.32);
  return 1-p*p*(3-2*p);
}

// Let the head lift and eyes adjust before unfolding into the approved wave.
export function footerGreeting(seconds,sleep=0){
  const awake=1-clamp(sleep);
  return {
    unfold:ease(.30,1.60,seconds)*(1-ease(7.80,9.00,seconds))*awake,
    wave:ease(1.65,3.10,seconds)*(1-ease(6.30,7.80,seconds))*awake,
    waveTime:seconds+.65,
    blink:ease(.90,1.04,seconds)*(1-ease(1.12,1.40,seconds)),
    stretch:ease(.35,.95,seconds)*(1-ease(1.15,1.65,seconds))*awake,
    active:seconds>=0&&seconds<9.00,
  };
}

// The desktop composition leaves time to read the closed eyes and resting
// head before the character wakes, unfolds his arms and greets the visitor.
export function desktopFooterGreeting(seconds,sleep=0){
  const awake=1-clamp(sleep);
  return {
    unfold:ease(1.35,2.85,seconds)*(1-ease(9.50,11.10,seconds))*awake,
    wave:ease(2.75,4.35,seconds)*(1-ease(7.60,9.10,seconds))*awake,
    waveTime:seconds-.45,
    blink:ease(2.40,2.53,seconds)*(1-ease(2.60,2.83,seconds)),
    stretch:ease(1.45,2.25,seconds)*(1-ease(2.50,3.15,seconds))*awake,
    eyeHold:1-ease(.75,1.85,seconds),
    active:seconds>=0&&seconds<11.20,
  };
}
