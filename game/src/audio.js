// Dapur Kilat — every sound is synthesized with WebAudio: no audio files,
// nothing to load. A chop is a filtered noise burst, the wok is looped noise
// through a low-pass filter, the bell is two sines. All calls are safe when
// the browser has no audio (headless screenshots) — they just do nothing.

export function createAudio() {
  let ctx = null;
  let muted = false;
  let sizzleNodes = null;

  function ensure() {
    if (ctx || muted) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, dur, type, vol, when, slideTo) {
    const ac = ensure();
    if (!ac) return;
    try {
      const t0 = ac.currentTime + (when || 0);
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch {
      /* audio is decoration; a failure never stops the game */
    }
  }

  function noiseBurst(dur, filterFreq, vol) {
    const ac = ensure();
    if (!ac) return;
    try {
      const len = Math.max(1, Math.floor(ac.sampleRate * dur));
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ac.createBufferSource();
      src.buffer = buf;
      const filter = ac.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = filterFreq || 1200;
      const gain = ac.createGain();
      gain.gain.value = vol || 0.25;
      src.connect(filter).connect(gain).connect(ac.destination);
      src.start();
    } catch {
      /* ignore */
    }
  }

  return {
    unlock() {
      const ac = ensure();
      if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
    },
    toggleMute() {
      muted = !muted;
      if (muted) this.stopSizzle();
      return muted;
    },
    isMuted() {
      return muted;
    },
    chop() {
      noiseBurst(0.09, 2400, 0.35);
    },
    pickup() {
      tone(520, 0.07, 'triangle', 0.12);
    },
    place() {
      tone(340, 0.08, 'triangle', 0.12);
    },
    ding() {
      tone(880, 0.25, 'sine', 0.18);
      tone(1318, 0.35, 'sine', 0.14, 0.08);
    },
    success() {
      tone(523, 0.12, 'triangle', 0.16);
      tone(659, 0.12, 'triangle', 0.16, 0.09);
      tone(784, 0.22, 'triangle', 0.18, 0.18);
    },
    fail() {
      tone(220, 0.3, 'sawtooth', 0.12, 0, 110);
    },
    levelUp() {
      tone(392, 0.1, 'square', 0.1);
      tone(523, 0.1, 'square', 0.1, 0.08);
      tone(659, 0.16, 'square', 0.12, 0.16);
    },
    startSizzle() {
      const ac = ensure();
      if (!ac || sizzleNodes) return;
      try {
        const len = ac.sampleRate * 1;
        const buf = ac.createBuffer(1, len, ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        const src = ac.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const filter = ac.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 4200;
        filter.Q.value = 0.6;
        const gain = ac.createGain();
        gain.gain.value = 0.05;
        src.connect(filter).connect(gain).connect(ac.destination);
        src.start();
        sizzleNodes = { src, gain };
      } catch {
        sizzleNodes = null;
      }
    },
    stopSizzle() {
      if (!sizzleNodes) return;
      try {
        sizzleNodes.src.stop();
      } catch {
        /* already stopped */
      }
      sizzleNodes = null;
    },
  };
}
