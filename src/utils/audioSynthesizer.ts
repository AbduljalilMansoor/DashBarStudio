// Web Audio implementation of AlarmSounds.java
class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private currentSource: AudioNode | null = null;
  private athanAudio: HTMLAudioElement | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public stopAll() {
    if (this.currentSource) {
      try {
        (this.currentSource as any).stop?.();
      } catch (e) {
        // ignore
      }
      this.currentSource = null;
    }
    if (this.athanAudio) {
      this.athanAudio.pause();
      this.athanAudio.currentTime = 0;
    }
  }

  // -------------------------------------------------------------
  // SEAT BELT REMINDER
  // Tone 0: Marimba strike
  // Tone 1: Soft bell ping
  // Tone 2: Digital beeps
  // Level 1: Soft, Level 2: Firm, Level 3: Urgent
  // -------------------------------------------------------------
  public playSeatBelt(tone: number, level: number = 2, volumePct: number = 25) {
    this.stopAll();
    const ctx = this.getContext();
    const vol = Math.max(0.01, Math.min(1.0, volumePct / 100));

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(vol * 0.8, ctx.currentTime);
    masterGain.connect(ctx.destination);
    this.currentSource = masterGain;

    const basePitch = level === 1 ? 523.25 : level === 2 ? 659.25 : 783.99; // C5, E5, G5
    const repeats = level === 1 ? 2 : level === 2 ? 3 : 4;
    const interval = level === 3 ? 0.22 : 0.35;

    for (let r = 0; r < repeats; r++) {
      const start = ctx.currentTime + r * interval;
      if (tone === 0) {
        // Marimba strike: fundamental + 3.99x + 9.9x partials with fast decay
        this.synthesizeMarimbaStrike(ctx, masterGain, basePitch, start);
      } else if (tone === 1) {
        // Soft bell ping
        this.synthesizeBell(ctx, masterGain, basePitch * 1.2, start, 0.45);
      } else {
        // Digital beeps (pulse/square with clean envelope)
        this.synthesizeDigitalBeep(ctx, masterGain, basePitch * 1.5, start, 0.12);
      }
    }
  }

  // -------------------------------------------------------------
  // DOOR OPEN IN D/R
  // Tone 0: Triple chime (default)
  // Tone 1: Rising chime
  // Tone 2: Falling chime
  // -------------------------------------------------------------
  public playDoorOpenDrive(tone: number, volumePct: number = 30) {
    this.stopAll();
    const ctx = this.getContext();
    const vol = Math.max(0.01, Math.min(1.0, volumePct / 100));

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(vol, ctx.currentTime);
    masterGain.connect(ctx.destination);
    this.currentSource = masterGain;

    if (tone === 1) {
      // Rising chime: three bells going up (784, 988, 1319 Hz)
      this.synthesizeBell(ctx, masterGain, 784, ctx.currentTime + 0.0, 0.4);
      this.synthesizeBell(ctx, masterGain, 988, ctx.currentTime + 0.26, 0.4);
      this.synthesizeBell(ctx, masterGain, 1319, ctx.currentTime + 0.52, 0.6);
    } else if (tone === 2) {
      // Falling chime: three bells going down (1319, 1047, 784 Hz)
      this.synthesizeBell(ctx, masterGain, 1319, ctx.currentTime + 0.0, 0.4);
      this.synthesizeBell(ctx, masterGain, 1047, ctx.currentTime + 0.26, 0.4);
      this.synthesizeBell(ctx, masterGain, 784, ctx.currentTime + 0.52, 0.6);
    } else {
      // Triple chime: 1047, 1047, 1319 Hz
      this.synthesizeBell(ctx, masterGain, 1047, ctx.currentTime + 0.0, 0.35);
      this.synthesizeBell(ctx, masterGain, 1047, ctx.currentTime + 0.21, 0.35);
      this.synthesizeBell(ctx, masterGain, 1319, ctx.currentTime + 0.42, 0.7);
    }
  }

  // -------------------------------------------------------------
  // DOOR AJAR (OUTSIDE SPEAKER HORN & WHISTLES)
  // 0: Sedan horn (twin tone 420 & 525 Hz with rich drive)
  // 1: Whistle · Swoop
  // 2: Whistle · Chirp
  // 3: Whistle · Trill
  // -------------------------------------------------------------
  public playDoorAjarHorn(hornType: number, seconds: number = 3, volumePct: number = 60) {
    this.stopAll();
    const ctx = this.getContext();
    const vol = Math.max(0.01, Math.min(1.0, volumePct / 100));

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(vol * 0.9, ctx.currentTime);
    masterGain.connect(ctx.destination);
    this.currentSource = masterGain;

    if (hornType === 0) {
      // Classic Sedan Horn: 5 fast blasts repeating
      const blastLen = 0.12;
      const blastOff = 0.08;
      const cycleGap = 0.38;
      let t = 0;
      const totalSec = Math.min(seconds, 6);

      while (t < totalSec) {
        for (let i = 0; i < 5 && t < totalSec; i++) {
          this.synthesizeSedanBlast(ctx, masterGain, ctx.currentTime + t, blastLen);
          t += blastLen + blastOff;
        }
        t += cycleGap;
      }
    } else if (hornType === 1) {
      // Whistle Swoop: smooth rising and falling pitch frequency
      this.synthesizeWhistleSwoop(ctx, masterGain, seconds);
    } else if (hornType === 2) {
      // Whistle Chirp: short high-energy blips
      this.synthesizeWhistleChirp(ctx, masterGain, seconds);
    } else {
      // Whistle Trill: wavering frequency modulation
      this.synthesizeWhistleTrill(ctx, masterGain, seconds);
    }
  }

  // -------------------------------------------------------------
  // ATHAN TAKBEER AUDIO PREVIEW
  // -------------------------------------------------------------
  public playAthan(recording: 'aqsa' | 'ali', volumePct: number = 70) {
    this.stopAll();
    const file = recording === 'ali' ? '/athan_ali.mp3' : '/athan_aqsa.mp3';
    this.athanAudio = new Audio(file);
    this.athanAudio.volume = Math.max(0.01, Math.min(1.0, volumePct / 100));
    this.athanAudio.play().catch(e => {
      console.warn('Audio playback error (user interaction required):', e);
    });
  }

  // --- Synthesis Subroutines ---

  private synthesizeBell(ctx: AudioContext, destination: AudioNode, freq: number, startTime: number, duration: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.7, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private synthesizeMarimbaStrike(ctx: AudioContext, destination: AudioNode, fundamental: number, startTime: number) {
    const partials = [
      { mult: 1.0, gain: 0.8, tau: 0.22 },
      { mult: 3.99, gain: 0.35, tau: 0.08 },
      { mult: 9.9, gain: 0.12, tau: 0.03 }
    ];

    partials.forEach(p => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(fundamental * p.mult, startTime);

      gain.gain.setValueAtTime(p.gain, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + p.tau * 3);

      osc.connect(gain);
      gain.connect(destination);
      osc.start(startTime);
      osc.stop(startTime + p.tau * 3);
    });
  }

  private synthesizeDigitalBeep(ctx: AudioContext, destination: AudioNode, freq: number, startTime: number, duration: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.5, startTime);
    gain.gain.setValueAtTime(0.5, startTime + duration - 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private synthesizeSedanBlast(ctx: AudioContext, destination: AudioNode, startTime: number, duration: number) {
    // Twin frequencies for automotive horn: 420 Hz & 525 Hz
    [420, 525, 840].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 2 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(f, startTime);

      const amp = idx === 2 ? 0.15 : 0.35;
      gain.gain.setValueAtTime(amp, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  private synthesizeWhistleSwoop(ctx: AudioContext, destination: AudioNode, totalDuration: number) {
    const count = Math.min(3, Math.ceil(totalDuration / 1.2));
    for (let i = 0; i < count; i++) {
      const start = ctx.currentTime + i * 1.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, start);
      osc.frequency.exponentialRampToValueAtTime(2600, start + 0.4);
      osc.frequency.exponentialRampToValueAtTime(1800, start + 0.8);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.6, start + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.85);

      osc.connect(gain);
      gain.connect(destination);
      osc.start(start);
      osc.stop(start + 0.9);
    }
  }

  private synthesizeWhistleChirp(ctx: AudioContext, destination: AudioNode, totalDuration: number) {
    const count = Math.min(6, Math.ceil(totalDuration / 0.5));
    for (let i = 0; i < count; i++) {
      const start = ctx.currentTime + i * 0.45;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2200, start);
      osc.frequency.linearRampToValueAtTime(3200, start + 0.15);

      gain.gain.setValueAtTime(0.7, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.2);

      osc.connect(gain);
      gain.connect(destination);
      osc.start(start);
      osc.stop(start + 0.22);
    }
  }

  private synthesizeWhistleTrill(ctx: AudioContext, destination: AudioNode, totalDuration: number) {
    const start = ctx.currentTime;
    const dur = Math.min(totalDuration, 4.0);

    const carrier = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const gain = ctx.createGain();

    carrier.frequency.setValueAtTime(2400, start);
    mod.frequency.setValueAtTime(18, start); // 18 Hz vibrato/trill
    modGain.gain.setValueAtTime(200, start);

    mod.connect(carrier.frequency);
    carrier.connect(gain);
    gain.connect(destination);

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.5, start + 0.2);
    gain.gain.setValueAtTime(0.5, start + dur - 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

    carrier.start(start);
    mod.start(start);
    carrier.stop(start + dur);
    mod.stop(start + dur);
  }
}

export const audioSynthesizer = new AudioSynthesizer();
