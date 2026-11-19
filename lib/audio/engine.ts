/**
 * One AudioContext for the whole site, created inside the first user gesture.
 * Every voice passes through `master`, so the header's mute switch silences
 * the instrument samples and the metronome together.
 */

export type PianoVoice = "grand" | "felt" | "box" | "reed";

type Ctor = typeof AudioContext;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let dry: GainNode | null = null;
let send: GainNode | null = null;
let tail: ConvolverNode | null = null;
let muted = false;
const wetAmount = 0.28;
const watchers = new Set<(muted: boolean) => void>();

const HARMONICS: Record<PianoVoice, number[]> = {
  grand: [0, 1, 0.42, 0.2, 0.11, 0.06, 0.03, 0.015],
  felt: [0, 1, 0.16, 0.06, 0.02, 0.008],
  box: [0, 1, 0.05, 0.5, 0.02, 0.22, 0.01, 0.08],
  reed: [0, 1, 0.6, 0.45, 0.3, 0.2, 0.12, 0.08],
};

const waves = new Map<PianoVoice, PeriodicWave>();

function contextCtor(): Ctor | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext ??
    null
  );
}

/** Decaying noise burst: a small room, generated once instead of shipped. */
function impulse(ac: AudioContext): AudioBuffer {
  const rate = ac.sampleRate;
  const length = Math.floor(rate * 1.9);
  const buf = ac.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch += 1) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < length; i += 1) {
      const t = i / length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.6) * (1 - t * 0.2);
    }
  }
  return buf;
}

export function audio(): AudioContext | null {
  const Ctor = contextCtor();
  if (!Ctor) return null;
  if (!ctx) {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);

    dry = ctx.createGain();
    dry.gain.value = 1;
    dry.connect(master);

    tail = ctx.createConvolver();
    tail.buffer = impulse(ctx);
    send = ctx.createGain();
    send.gain.value = wetAmount;
    send.connect(tail);
    tail.connect(master);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(next: boolean): void {
  muted = next;
  const ac = ctx;
  if (ac && master) {
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.setTargetAtTime(next ? 0 : 1, ac.currentTime, 0.02);
  }
  for (const fn of watchers) fn(next);
}

export function watchMute(fn: (muted: boolean) => void): () => void {
  watchers.add(fn);
  return () => {
    watchers.delete(fn);
  };
}

export function midiToFreq(midi: number, cents = 0): number {
  return 440 * Math.pow(2, (midi - 69) / 12 + cents / 1200);
}

function bus(ac: AudioContext, gain: number, room: number) {
  const amp = ac.createGain();
  amp.gain.value = gain;
  amp.connect(dry!);
  if (room > 0) {
    const tap = ac.createGain();
    tap.gain.value = room;
    amp.connect(tap);
    tap.connect(send!);
  }
  return amp;
}

export type NoteHandle = { stop: (at?: number) => void };

/** Struck string: bright attack, darkening decay, optional hammer transient. */
export function strike(opts: {
  freq: number;
  when?: number;
  dur?: number;
  gain?: number;
  voice?: PianoVoice;
  room?: number;
}): NoteHandle | null {
  const ac = audio();
  if (!ac) return null;
  const {
    freq,
    when = ac.currentTime,
    dur = 1.6,
    gain = 0.5,
    voice = "grand",
    room = 0.5,
  } = opts;

  let wave = waves.get(voice);
  if (!wave) {
    const parts = HARMONICS[voice];
    wave = ac.createPeriodicWave(
      new Float32Array(parts.length),
      new Float32Array(parts),
      { disableNormalization: false },
    );
    waves.set(voice, wave);
  }

  const out = bus(ac, 1, room);
  const tone = ac.createBiquadFilter();
  tone.type = "lowpass";
  tone.Q.value = 0.6;
  tone.frequency.setValueAtTime(Math.min(11000, freq * 9 + 900), when);
  tone.frequency.exponentialRampToValueAtTime(
    Math.max(420, freq * 2.4),
    when + dur * 0.7,
  );
  tone.connect(out);

  const amp = ac.createGain();
  const peak = gain * (voice === "box" ? 0.5 : 0.62);
  amp.gain.setValueAtTime(0.0001, when);
  amp.gain.exponentialRampToValueAtTime(peak, when + 0.006);
  amp.gain.exponentialRampToValueAtTime(peak * 0.28, when + dur * 0.32);
  amp.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  amp.connect(tone);

  const osc = ac.createOscillator();
  osc.setPeriodicWave(wave);
  osc.frequency.setValueAtTime(freq, when);
  osc.connect(amp);

  const twin = ac.createOscillator();
  twin.setPeriodicWave(wave);
  twin.frequency.setValueAtTime(freq, when);
  twin.detune.setValueAtTime(4, when);
  const twinAmp = ac.createGain();
  twinAmp.gain.value = 0.3;
  twin.connect(twinAmp).connect(amp);

  osc.start(when);
  twin.start(when);
  osc.stop(when + dur + 0.05);
  twin.stop(when + dur + 0.05);

  let hammer: AudioBufferSourceNode | null = null;
  if (voice === "grand" || voice === "reed") {
    const len = Math.floor(ac.sampleRate * 0.03);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    hammer = ac.createBufferSource();
    hammer.buffer = buf;
    const hp = ac.createBiquadFilter();
    hp.type = "bandpass";
    hp.frequency.value = Math.min(6000, freq * 4);
    hp.Q.value = 0.9;
    const hg = ac.createGain();
    hg.gain.value = gain * 0.16;
    hammer.connect(hp).connect(hg).connect(out);
    hammer.start(when);
  }

  let released = false;
  return {
    stop(at = ac.currentTime) {
      if (released) return;
      released = true;
      const t = Math.max(at, when + 0.01);
      amp.gain.cancelScheduledValues(t);
      amp.gain.setValueAtTime(Math.max(amp.gain.value, 0.0001), t);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      try {
        osc.stop(t + 0.26);
        twin.stop(t + 0.26);
      } catch {
        /* already stopped by its own envelope */
      }
    },
  };
}

/** Bowed string: slow attack, vibrato, a breath of bow noise. */
export function bow(opts: {
  freq: number;
  when?: number;
  dur?: number;
  gain?: number;
  vibrato?: number;
  room?: number;
}): NoteHandle | null {
  const ac = audio();
  if (!ac) return null;
  const {
    freq,
    when = ac.currentTime,
    dur = 1.8,
    gain = 0.4,
    vibrato = 0.4,
    room = 0.6,
  } = opts;

  const out = bus(ac, 1, room);
  const body = ac.createBiquadFilter();
  body.type = "lowpass";
  body.frequency.value = Math.min(7000, freq * 6 + 1200);
  body.Q.value = 1.1;
  body.connect(out);

  const amp = ac.createGain();
  const peak = gain * 0.5;
  amp.gain.setValueAtTime(0.0001, when);
  amp.gain.linearRampToValueAtTime(peak, when + 0.14);
  amp.gain.setValueAtTime(peak, when + Math.max(0.2, dur - 0.35));
  amp.gain.linearRampToValueAtTime(0.0001, when + dur);
  amp.connect(body);

  const osc = ac.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(freq, when);
  const oscGain = ac.createGain();
  oscGain.gain.value = 0.55;
  osc.connect(oscGain).connect(amp);

  const twin = ac.createOscillator();
  twin.type = "sawtooth";
  twin.frequency.setValueAtTime(freq, when);
  twin.detune.setValueAtTime(-6, when);
  const twinGain = ac.createGain();
  twinGain.gain.value = 0.3;
  twin.connect(twinGain).connect(amp);

  const lfo = ac.createOscillator();
  lfo.frequency.value = 5.4;
  const lfoGain = ac.createGain();
  lfoGain.gain.setValueAtTime(0, when);
  lfoGain.gain.linearRampToValueAtTime(vibrato * 22, when + 0.5);
  lfo.connect(lfoGain);
  lfoGain.connect(osc.detune);
  lfoGain.connect(twin.detune);

  const noiseLen = Math.floor(ac.sampleRate * dur);
  const noiseBuf = ac.createBuffer(1, noiseLen, ac.sampleRate);
  const noiseData = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseLen; i += 1) {
    noiseData[i] = (Math.random() * 2 - 1) * 0.5;
  }
  const noise = ac.createBufferSource();
  noise.buffer = noiseBuf;
  const noiseFilter = ac.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = freq * 3;
  noiseFilter.Q.value = 0.7;
  const noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(0.0001, when);
  noiseGain.gain.linearRampToValueAtTime(gain * 0.05, when + 0.1);
  noiseGain.gain.linearRampToValueAtTime(0.0001, when + dur);
  noise.connect(noiseFilter).connect(noiseGain).connect(out);

  osc.start(when);
  twin.start(when);
  lfo.start(when);
  noise.start(when);
  const end = when + dur + 0.05;
  osc.stop(end);
  twin.stop(end);
  lfo.stop(end);

  let released = false;
  return {
    stop(at = ac.currentTime) {
      if (released) return;
      released = true;
      const t = Math.max(at, when + 0.02);
      amp.gain.cancelScheduledValues(t);
      amp.gain.setValueAtTime(Math.max(amp.gain.value, 0.0001), t);
      amp.gain.linearRampToValueAtTime(0.0001, t + 0.18);
      noiseGain.gain.cancelScheduledValues(t);
      noiseGain.gain.setValueAtTime(Math.max(noiseGain.gain.value, 0.0001), t);
      noiseGain.gain.linearRampToValueAtTime(0.0001, t + 0.18);
      for (const node of [osc, twin, lfo]) {
        try {
          node.stop(t + 0.22);
        } catch {
          /* already stopped */
        }
      }
      try {
        noise.stop(t + 0.22);
      } catch {
        /* already stopped */
      }
    },
  };
}

export function tick(when: number, accent: boolean, gain: number): void {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  osc.type = accent ? "triangle" : "sine";
  osc.frequency.value = accent ? 1720 : 1180;
  const amp = ac.createGain();
  const peak = gain * (accent ? 0.4 : 0.24);
  amp.gain.setValueAtTime(0.0001, when);
  amp.gain.exponentialRampToValueAtTime(peak, when + 0.002);
  amp.gain.exponentialRampToValueAtTime(0.0001, when + 0.055);
  osc.connect(amp).connect(master!);
  osc.start(when);
  osc.stop(when + 0.07);
}

/** Wall-clock time of the audio graph, for scheduling visuals against sound. */
export function now(): number {
  return ctx ? ctx.currentTime : 0;
}