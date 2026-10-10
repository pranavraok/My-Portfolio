// Original composition for Pranav's portfolio: "Window Light".
// Run `node scripts/compose-lofi.mjs` to recreate the seamless stereo WAV.
// No external samples, copyrighted recordings, or runtime dependencies.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const sampleRate = 32000;
const bpm = 76;
const beat = 60 / bpm;
const bars = 16;
const length = Math.round(bars * 4 * beat * sampleRate);
const duration = length / sampleRate;
const channels = [new Float64Array(length), new Float64Array(length)];
const tau = Math.PI * 2;
let seed = 0x7072616e;
const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12);
const smooth = (t) => t * t * (3 - 2 * t);
const attack = (t, seconds) => smooth(Math.min(1, t / seconds));
const release = (t, seconds, end) => smooth(Math.max(0, Math.min(1, (end - t) / seconds)));

// All sound tails wrap around the array, so the loop has no silent edge or fade.
function place(start, seconds, pan, sample) {
  const offset = Math.round(start * sampleRate);
  const count = Math.ceil(seconds * sampleRate);
  const left = Math.sqrt((1 - pan) / 2);
  const right = Math.sqrt((1 + pan) / 2);
  for (let n = 0; n < count; n++) {
    const i = ((offset + n) % length + length) % length;
    const value = sample(n / sampleRate, n);
    channels[0][i] += value * left;
    channels[1][i] += value * right;
  }
}

// Soft, slightly detuned tine piano. Every note has a gentle rounded attack.
function piano(start, midi, velocity = 1, pan = 0, seconds = 2.5) {
  const hz = frequency(midi);
  const detune = 0.9988 + random() * 0.0024;
  const phase = random() * tau;
  place(start, seconds, pan, (t) => {
    const round = Math.sin(tau * hz * t + 0.18 * Math.sin(tau * hz * 2 * t) * Math.exp(-t * 3.2));
    const body = 0.19 * Math.sin(tau * hz * detune * t + phase);
    const second = 0.09 * Math.sin(tau * hz * 2 * t + phase) * Math.exp(-t * 2.6);
    const tine = 0.032 * Math.sin(tau * hz * 3.99 * t) * Math.exp(-t * 5.5);
    const envelope = attack(t, 0.025) * Math.exp(-t * 1.05) * release(t, 0.32, seconds);
    return (round + body + second + tine) * envelope * velocity * 0.061;
  });
}

function bass(start, midi, velocity = 1, seconds = beat * 1.65) {
  const hz = frequency(midi);
  place(start, seconds, -0.025, (t) => {
    const envelope = attack(t, 0.035) * Math.exp(-t * 1.35) * release(t, 0.14, seconds);
    return (Math.sin(tau * hz * t) + 0.16 * Math.sin(tau * hz * 2 * t)) * envelope * velocity * 0.116;
  });
}

function kick(start, velocity = 1) {
  place(start, 0.4, 0, (t) => {
    // Integrating the exponential pitch sweep avoids a phase discontinuity.
    const phase = tau * (47 * t + 70 / 38 * (1 - Math.exp(-38 * t)));
    return Math.sin(phase) * attack(t, 0.004) * Math.exp(-t * 13) * release(t, 0.06, 0.4) * 0.135 * velocity;
  });
}

function brush(start, velocity = 1, pan = 0) {
  let low = 0;
  let band = 0;
  place(start, 0.2, pan, (t) => {
    low += 0.14 * ((random() * 2 - 1) - low);
    band += 0.032 * (low - band);
    const noise = low - band;
    const envelope = attack(t, 0.006) * Math.exp(-t * 25) * release(t, 0.04, 0.2);
    return (noise * 0.75 + Math.sin(tau * 172 * t) * Math.exp(-t * 48) * 0.075) * envelope * velocity * 0.055;
  });
}

function hat(start, velocity = 1, pan = 0.15) {
  let low = 0;
  let high = 0;
  place(start, 0.09, pan, (t) => {
    const white = random() * 2 - 1;
    low += 0.22 * (white - low);
    high += 0.065 * (white - high);
    return (low - high) * attack(t, 0.003) * Math.exp(-t * 58) * release(t, 0.02, 0.09) * velocity * 0.032;
  });
}

// Cmaj9 – Am9 – Fmaj9 – G13 – Em9 – Am9 – Dm9 – G13.
// Two bars per chord, with sparse top-line answers and a restrained swung beat.
const harmony = [
  { root: 36, voicing: [55, 59, 62, 64], melody: [76, 74] },
  { root: 33, voicing: [55, 59, 60, 64], melody: [72, 71] },
  { root: 29, voicing: [53, 57, 60, 64], melody: [69, 72] },
  { root: 31, voicing: [53, 57, 59, 64], melody: [71, 69] },
  { root: 28, voicing: [55, 59, 62, 66], melody: [71, 74] },
  { root: 33, voicing: [55, 59, 60, 64], melody: [72, 71] },
  { root: 26, voicing: [53, 57, 60, 64], melody: [69, 72] },
  { root: 31, voicing: [53, 57, 59, 64], melody: [71, 74] },
];

for (let bar = 0; bar < bars; bar++) {
  const chord = harmony[Math.floor(bar / 2)];
  const start = bar * 4 * beat;
  const secondBar = bar % 2 === 1;
  for (let index = 0; index < chord.voicing.length; index++) {
    const midi = chord.voicing[index];
    const strum = index * 0.017;
    piano(start + 0.04 + strum, midi, 0.83 + random() * 0.12, (index - 1.5) * 0.15, beat * 3.8);
    piano(start + 2.5 * beat + strum, midi, 0.37 + random() * 0.09, (1.5 - index) * 0.12, beat * 2.45);
  }
  piano(start + (secondBar ? 1.55 : 3.05) * beat, chord.melody[secondBar ? 1 : 0], 0.32, secondBar ? 0.24 : -0.18, beat * 1.75);
  bass(start + 0.025, chord.root, 0.83);
  bass(start + 2.05 * beat, chord.root + 7, 0.55, beat * 1.05);
  bass(start + 3.35 * beat, chord.root + (secondBar ? 12 : 7), 0.36, beat * 0.65);
  kick(start + 0.012, 0.7);
  kick(start + 2.04 * beat, 0.55);
  if (bar % 4 === 3) kick(start + 3.55 * beat, 0.25);
  brush(start + 1.025 * beat, 0.7, -0.12);
  brush(start + 3.025 * beat, 0.55, -0.08);
  for (let eighth = 0; eighth < 8; eighth++) {
    const swing = eighth % 2 ? 0.065 : 0;
    const velocity = (eighth % 2 ? 0.24 : 0.38) + random() * 0.06;
    hat(start + (eighth / 2 + swing) * beat, velocity, 0.17 + random() * 0.07);
  }
}

// Periodic stereo room taps with a dark reverb tail. Crossfeed stays very subtle.
const dry = channels.map((channel) => Float64Array.from(channel));
const taps = [
  [0.127, 0.072], [0.191, 0.057], [0.273, 0.041],
  [0.389, 0.031], [0.557, 0.021], [0.743, 0.014], [1.013, 0.009],
];
for (let channel = 0; channel < 2; channel++) {
  const wet = new Float64Array(length);
  for (let tap = 0; tap < taps.length; tap++) {
    const [seconds, gain] = taps[tap];
    const delay = Math.round((seconds + channel * 0.023) * sampleRate);
    const source = dry[tap % 2 ? 1 - channel : channel];
    for (let i = 0; i < length; i++) wet[i] += source[(i - delay + length) % length] * gain;
  }
  // Settle the filter from the previous complete cycle before writing output.
  let low = 0;
  for (let i = 0; i < length; i++) low += 0.095 * (wet[i] - low);
  for (let i = 0; i < length; i++) {
    low += 0.095 * (wet[i] - low);
    channels[channel][i] += low;
  }
}

// Remove DC, round rare peaks, and match a comfortable listening level.
for (const channel of channels) {
  const dc = channel.reduce((sum, value) => sum + value, 0) / length;
  for (let i = 0; i < length; i++) channel[i] = Math.tanh((channel[i] - dc) * 1.35);
}
let squareSum = 0;
let rawPeak = 0;
for (const channel of channels) for (const sample of channel) {
  squareSum += sample * sample;
  rawPeak = Math.max(rawPeak, Math.abs(sample));
}
const gain = Math.min(0.108 / Math.sqrt(squareSum / (length * 2)), 0.76 / rawPeak);
const dataBytes = length * 2 * 2;
const wav = Buffer.alloc(44 + dataBytes);
wav.write('RIFF', 0);
wav.writeUInt32LE(36 + dataBytes, 4);
wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate * 4, 28);
wav.writeUInt16LE(4, 32);
wav.writeUInt16LE(16, 34);
wav.write('data', 36);
wav.writeUInt32LE(dataBytes, 40);
let peak = 0;
let sum = 0;
let seam = 0;
for (let i = 0; i < length; i++) for (let channel = 0; channel < 2; channel++) {
  const value = channels[channel][i] * gain;
  peak = Math.max(peak, Math.abs(value));
  sum += value * value;
  wav.writeInt16LE(Math.round(value * 32767), 44 + (i * 2 + channel) * 2);
}
for (const channel of channels) seam = Math.max(seam, Math.abs(channel[0] - channel[length - 1]) * gain);
const target = fileURLToPath(new URL('../public/music/studio-lofi.wav', import.meta.url));
await mkdir(fileURLToPath(new URL('../public/music/', import.meta.url)), { recursive: true });
await writeFile(target, wav);
console.log(JSON.stringify({ title: 'Window Light', original: true, bpm, bars, sampleRate, channels: 2, bitDepth: 16, duration, bytes: wav.length, peak, rms: Math.sqrt(sum / (length * 2)), seamSampleDelta: seam, target }, null, 2));
