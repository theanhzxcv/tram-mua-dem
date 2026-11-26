import { useCallback, useEffect, useRef, useState } from '../lib/html.js';
import { MUSIC_TRACKS } from '../data/constants.js';
import { useLocalStorage } from './useLocalStorage.js';

function createStereoPinkAirBuffer(ctx, seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.065;
      b6 = white * 0.115926;
      data[i] = pink * 0.72 + white * 0.085;
    }
  }
  return buffer;
}

function createShortWhiteBuffer(ctx, seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createSoftSpaceReverb(ctx) {
  try {
    const dur = 0.58;
    const len = Math.floor(ctx.sampleRate * dur);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const decay = Math.pow(1 - i / len, 2.8);
        d[i] = (Math.random() * 2 - 1) * decay * 0.38;
      }
    }
    const convolver = ctx.createConvolver();
    convolver.buffer = ir;
    return convolver;
  } catch (_) {
    const delay = ctx.createDelay(0.4);
    delay.delayTime.value = 0.095;
    return delay;
  }
}

export function useRainAudio(onToast) {
  const [rainDensity, setRainDensity] = useLocalStorage('tram_rain_density', 55);
  const [rainVolume, setRainVolume] = useLocalStorage('tram_rain_volume', 62);
  const [musicVolume, setMusicVolume] = useLocalStorage('tram_music_volume', 55);
  const [trackIdx, setTrackIdx] = useLocalStorage('tram_music_track', 0);

  const [rainAudioOn, setRainAudioOn] = useState(false);
  const [musicAudioOn, setMusicAudioOn] = useState(false);
  const [sleepMinutes, setSleepMinutes] = useState(0);
  const [sleepRemainingSec, setSleepRemainingSec] = useState(0);

  const nodesRef = useRef({
    ctx: null,
    rainMasterGain: null,
    rainHpFilter: null,
    rainLpFilter: null,
    dropletBusGain: null,
    dropletSpaceSend: null,
    sharedWhiteNoiseBuffer: null,
    musicMasterGain: null
  });

  const dropletTimerRef = useRef(null);
  const musicTimerRef = useRef(null);
  const musicStepRef = useRef(0);
  const sleepEndRef = useRef(0);
  const onToastRef = useRef(onToast);
  onToastRef.current = onToast;
  const stateRef = useRef({
    rainAudioOn,
    musicAudioOn,
    rainDensity,
    rainVolume,
    musicVolume,
    trackIdx
  });

  stateRef.current = {
    rainAudioOn,
    musicAudioOn,
    rainDensity,
    rainVolume,
    musicVolume,
    trackIdx
  };

  const ensureAudioContext = useCallback(() => {
    try {
      const n = nodesRef.current;
      if (!n.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
          onToast?.('Trình duyệt không hỗ trợ Web Audio API.');
          return false;
        }
        const ctx = new AudioCtx();
        const rainMasterGain = ctx.createGain();
        rainMasterGain.gain.value = 0;
        rainMasterGain.connect(ctx.destination);

        const bedSource = ctx.createBufferSource();
        bedSource.buffer = createStereoPinkAirBuffer(ctx, 4.0);
        bedSource.loop = true;

        const rainHpFilter = ctx.createBiquadFilter();
        rainHpFilter.type = 'highpass';
        rainHpFilter.frequency.value = 550;
        rainHpFilter.Q.value = 0.707;

        const rainLpFilter = ctx.createBiquadFilter();
        rainLpFilter.type = 'lowpass';
        rainLpFilter.frequency.value = 7200;
        rainLpFilter.Q.value = 0.65;

        const rainEqFilter = ctx.createBiquadFilter();
        rainEqFilter.type = 'peaking';
        rainEqFilter.frequency.value = 2800;
        rainEqFilter.Q.value = 1.05;
        rainEqFilter.gain.value = 2.5;

        const breezeGain = ctx.createGain();
        breezeGain.gain.value = 0.9;
        const breezeLfo = ctx.createOscillator();
        breezeLfo.type = 'sine';
        breezeLfo.frequency.value = 0.095;
        const breezeDepth = ctx.createGain();
        breezeDepth.gain.value = 0.11;
        breezeLfo.connect(breezeDepth);
        breezeDepth.connect(breezeGain.gain);
        breezeLfo.start(0);

        const rainBedGain = ctx.createGain();
        rainBedGain.gain.value = 0.56;

        bedSource.connect(rainHpFilter);
        rainHpFilter.connect(rainLpFilter);
        rainLpFilter.connect(rainEqFilter);
        rainEqFilter.connect(breezeGain);
        breezeGain.connect(rainBedGain);
        rainBedGain.connect(rainMasterGain);
        bedSource.start(0);

        const sharedWhiteNoiseBuffer = createShortWhiteBuffer(ctx, 0.25);
        const dropletBusGain = ctx.createGain();
        dropletBusGain.gain.value = 0.85;
        dropletBusGain.connect(rainMasterGain);

        const reverbNode = createSoftSpaceReverb(ctx);
        const reverbWetGain = ctx.createGain();
        reverbWetGain.gain.value = 0.26;
        const dropletSpaceSend = ctx.createGain();
        dropletSpaceSend.gain.value = 0.52;

        dropletSpaceSend.connect(reverbNode);
        reverbNode.connect(reverbWetGain);
        reverbWetGain.connect(rainMasterGain);

        const musicMasterGain = ctx.createGain();
        musicMasterGain.gain.value = 0;
        musicMasterGain.connect(ctx.destination);

        nodesRef.current = {
          ctx,
          rainMasterGain,
          rainHpFilter,
          rainLpFilter,
          dropletBusGain,
          dropletSpaceSend,
          sharedWhiteNoiseBuffer,
          musicMasterGain
        };
      }

      if (nodesRef.current.ctx.state === 'suspended') {
        nodesRef.current.ctx.resume();
      }
      return true;
    } catch (_) {
      onToast?.('Trình duyệt chưa cho phép phát âm thanh lúc này.');
      return false;
    }
  }, [onToast]);

  const triggerWaterPlink = useCallback((now, intensityScale) => {
    const { ctx, dropletBusGain, dropletSpaceSend } = nodesRef.current;
    if (!ctx || !dropletBusGain) return;

    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    const startFreq = 1000 + Math.random() * 1800;
    const glideSec = 0.018 + Math.random() * 0.017;
    const endFreq = startFreq * (1.28 + Math.random() * 0.28);
    const totalDur = glideSec + 0.025 + Math.random() * 0.028;
    const peak = (0.018 + Math.random() * 0.024) * intensityScale;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.min(endFreq, 6400), now + glideSec);

    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peak, now + 0.003);
    env.gain.exponentialRampToValueAtTime(0.0001, now + totalDur);

    osc.connect(env);
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime((Math.random() * 2 - 1) * 0.85, now);
      env.connect(panner);
      panner.connect(dropletBusGain);
      if (dropletSpaceSend) panner.connect(dropletSpaceSend);
    } else {
      env.connect(dropletBusGain);
      if (dropletSpaceSend) env.connect(dropletSpaceSend);
    }

    osc.start(now);
    osc.stop(now + totalDur + 0.015);
  }, []);

  const triggerCrispPatter = useCallback((now, intensityScale) => {
    const { ctx, sharedWhiteNoiseBuffer, dropletBusGain, dropletSpaceSend } = nodesRef.current;
    if (!ctx || !sharedWhiteNoiseBuffer || !dropletBusGain) return;

    const src = ctx.createBufferSource();
    src.buffer = sharedWhiteNoiseBuffer;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2400 + Math.random() * 3100, now);
    bp.Q.setValueAtTime(4.8 + Math.random() * 4.2, now);

    const burstSec = 0.01 + Math.random() * 0.012;
    const env = ctx.createGain();
    const peak = (0.045 + Math.random() * 0.055) * intensityScale;

    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peak, now + 0.002);
    env.gain.exponentialRampToValueAtTime(0.0001, now + burstSec);

    src.connect(bp);
    bp.connect(env);

    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime((Math.random() * 2 - 1) * 0.9, now);
      env.connect(panner);
      panner.connect(dropletBusGain);
      if (dropletSpaceSend) panner.connect(dropletSpaceSend);
    } else {
      env.connect(dropletBusGain);
      if (dropletSpaceSend) env.connect(dropletSpaceSend);
    }

    src.start(now, Math.random() * 0.18, burstSec + 0.01);
  }, []);

  const stopDropletScheduler = useCallback(() => {
    if (dropletTimerRef.current) {
      clearTimeout(dropletTimerRef.current);
      dropletTimerRef.current = null;
    }
  }, []);

  const scheduleNextDroplet = useCallback(() => {
    stopDropletScheduler();
    const s = stateRef.current;
    const { ctx } = nodesRef.current;
    if (!s.rainAudioOn || s.rainDensity <= 0 || s.rainVolume <= 0 || !ctx) return;

    const densityNorm = s.rainDensity / 100;
    const volNorm = s.rainVolume / 100;
    const intensityScale = 0.45 + densityNorm * 0.55;
    const now = ctx.currentTime;

    if (Math.random() < 0.62) {
      triggerCrispPatter(now, intensityScale);
    } else {
      triggerWaterPlink(now, intensityScale);
    }

    if (densityNorm > 0.55 && Math.random() < densityNorm * 0.45) {
      const extraOffset = 0.025 + Math.random() * 0.065;
      if (Math.random() < 0.7) {
        triggerCrispPatter(now + extraOffset, intensityScale * 0.85);
      } else {
        triggerWaterPlink(now + extraOffset, intensityScale * 0.8);
      }
    }

    const baseDelay = Math.max(42, 340 - densityNorm * 270 - volNorm * 25);
    const jitter = baseDelay * (0.45 + Math.random() * 1.15);
    dropletTimerRef.current = setTimeout(scheduleNextDroplet, jitter);
  }, [stopDropletScheduler, triggerCrispPatter, triggerWaterPlink]);

  // Apply rain audio parameters whenever controls change
  useEffect(() => {
    const { ctx, rainMasterGain, rainHpFilter, rainLpFilter } = nodesRef.current;
    if (!ctx || !rainMasterGain) return;

    const now = ctx.currentTime;
    const densityNorm = rainDensity / 100;
    const densityScale = rainDensity === 0 ? 0 : 0.28 + densityNorm * 0.72;
    const sleepFade = sleepMinutes > 0 && sleepRemainingSec > 0 && sleepRemainingSec <= 12
      ? sleepRemainingSec / 12
      : 1;
    const targetVol = rainAudioOn ? (rainVolume / 100) * 0.68 * densityScale * sleepFade : 0;

    rainMasterGain.gain.setTargetAtTime(targetVol, now, 0.22);
    if (rainHpFilter) rainHpFilter.frequency.setTargetAtTime(550, now, 0.2);
    if (rainLpFilter) rainLpFilter.frequency.setTargetAtTime(6400 + densityNorm * 1000, now, 0.25);

    if (rainAudioOn && rainDensity > 0 && rainVolume > 0) {
      if (!dropletTimerRef.current) scheduleNextDroplet();
    } else {
      stopDropletScheduler();
    }
  }, [rainAudioOn, rainDensity, rainVolume, sleepMinutes, sleepRemainingSec, scheduleNextDroplet, stopDropletScheduler]);

  const playSoftNote = useCallback((freq, startOffset, duration, type, peakGain, cutoffHz) => {
    const { ctx, musicMasterGain } = nodesRef.current;
    if (!ctx || !musicMasterGain || !stateRef.current.musicAudioOn) return;

    const now = ctx.currentTime + startOffset;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoffHz || 1200, now);

    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peakGain, now + 0.06);
    env.gain.exponentialRampToValueAtTime(0.0005, now + duration);

    osc.connect(filter);
    filter.connect(env);
    env.connect(musicMasterGain);

    osc.start(now);
    osc.stop(now + duration + 0.08);
  }, []);

  const runCurrentTrackStep = useCallback(() => {
    const { ctx } = nodesRef.current;
    const s = stateRef.current;
    if (!s.musicAudioOn || !ctx) return;

    const track = MUSIC_TRACKS[s.trackIdx % MUSIC_TRACKS.length].id;
    const step = musicStepRef.current;

    if (track === 'lofi') {
      const chords = [
        [261.63, 329.63, 392.0, 493.88],
        [220.0, 261.63, 329.63, 392.0],
        [174.61, 220.0, 261.63, 329.63],
        [196.0, 246.94, 293.66, 349.23]
      ];
      const chord = chords[step % chords.length];
      chord.forEach((f, idx) => playSoftNote(f, idx * 0.06, 3.3, 'triangle', 0.062, 880));
      playSoftNote(chord[0] / 2, 0, 3.1, 'sine', 0.072, 420);
    } else if (track === 'piano') {
      const arps = [
        [146.83, 220.0, 293.66, 349.23, 440.0],
        [116.54, 174.61, 233.08, 293.66, 349.23],
        [196.0, 233.08, 293.66, 349.23, 392.0],
        [110.0, 164.81, 220.0, 277.18, 329.63]
      ];
      const notes = arps[step % arps.length];
      notes.forEach((f, idx) => {
        playSoftNote(f, idx * 0.42, 2.2, 'sine', 0.078, 1300);
        playSoftNote(f * 2, idx * 0.42, 1.1, 'triangle', 0.017, 1600);
      });
    } else if (track === 'chime') {
      const pentatonic = [587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];
      const padFreq = step % 2 === 0 ? 196.0 : 220.0;
      playSoftNote(padFreq, 0, 3.8, 'sine', 0.048, 500);
      playSoftNote(padFreq * 1.5, 0.2, 3.5, 'sine', 0.032, 620);
      for (let k = 0; k < 3; k++) {
        const bell = pentatonic[Math.floor(Math.random() * pentatonic.length)];
        playSoftNote(bell, 0.25 + k * 0.85, 2.4, 'sine', 0.044, 2400);
      }
    } else if (track === 'musicbox') {
      const melody = [
        [523.25, 659.25, 783.99, 987.77],
        [880.0, 783.99, 659.25, 523.25],
        [698.46, 880.0, 783.99, 659.25],
        [587.33, 659.25, 523.25, 392.0]
      ];
      const phrase = melody[step % melody.length];
      phrase.forEach((f, idx) => {
        playSoftNote(f, idx * 0.58, 1.75, 'sine', 0.058, 2600);
        playSoftNote(f * 2, idx * 0.58, 0.7, 'sine', 0.014, 3200);
      });
    }
    musicStepRef.current++;
  }, [playSoftNote]);

  // Apply music volume and track scheduling
  useEffect(() => {
    const { ctx, musicMasterGain } = nodesRef.current;
    if (!ctx || !musicMasterGain) return;

    const sleepFade = sleepMinutes > 0 && sleepRemainingSec > 0 && sleepRemainingSec <= 12
      ? sleepRemainingSec / 12
      : 1;
    const target = musicAudioOn ? (musicVolume / 100) * 0.48 * sleepFade : 0;
    musicMasterGain.gain.setTargetAtTime(target, ctx.currentTime, 0.18);
  }, [musicAudioOn, musicVolume, sleepMinutes, sleepRemainingSec]);

  useEffect(() => {
    if (musicTimerRef.current) {
      clearInterval(musicTimerRef.current);
      musicTimerRef.current = null;
    }
    if (!musicAudioOn) return;
    if (!ensureAudioContext()) return;

    const track = MUSIC_TRACKS[trackIdx % MUSIC_TRACKS.length];
    runCurrentTrackStep();
    musicTimerRef.current = setInterval(runCurrentTrackStep, track.intervalMs || 3000);

    return () => {
      if (musicTimerRef.current) {
        clearInterval(musicTimerRef.current);
        musicTimerRef.current = null;
      }
    };
  }, [musicAudioOn, trackIdx, ensureAudioContext, runCurrentTrackStep]);

  // Sleep timer countdown
  useEffect(() => {
    if (sleepMinutes <= 0) return;
    const timer = setInterval(() => {
      const rem = Math.max(0, Math.ceil((sleepEndRef.current - Date.now()) / 1000));
      if (rem <= 0) {
        setSleepRemainingSec(0);
        setSleepMinutes(0);
        setRainAudioOn(false);
        setMusicAudioOn(false);
        onToastRef.current?.('🌙 Hẹn giờ ngủ đã kết thúc — Chúc bạn ngủ thật ngon.');
      } else {
        setSleepRemainingSec(rem);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [sleepMinutes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDropletScheduler();
      if (musicTimerRef.current) clearInterval(musicTimerRef.current);
      if (nodesRef.current.ctx && nodesRef.current.ctx.state !== 'closed') {
        try { nodesRef.current.ctx.close(); } catch (_) {}
      }
    };
  }, [stopDropletScheduler]);

  const toggleRainAudio = useCallback(() => {
    if (!ensureAudioContext()) return;
    setRainAudioOn((prev) => !prev);
  }, [ensureAudioContext]);

  const ensureRainOn = useCallback(() => {
    if (!ensureAudioContext()) return;
    setRainAudioOn(true);
  }, [ensureAudioContext]);

  const toggleMusicAudio = useCallback(() => {
    if (!ensureAudioContext()) return;
    setMusicAudioOn((prev) => !prev);
  }, [ensureAudioContext]);

  const selectTrack = useCallback((index, autoPlay = true) => {
    const safeIdx = ((index % MUSIC_TRACKS.length) + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
    musicStepRef.current = 0;
    setTrackIdx(safeIdx);
    if (autoPlay && ensureAudioContext()) {
      setMusicAudioOn(true);
    }
    onToast?.(`🎵 Đang chọn: ${MUSIC_TRACKS[safeIdx].name}`);
  }, [ensureAudioContext, onToast, setTrackIdx]);

  const nextTrack = useCallback(() => {
    if (!musicAudioOn) {
      if (!ensureAudioContext()) return;
      setMusicAudioOn(true);
      onToast?.(`🎵 Đang phát: ${MUSIC_TRACKS[trackIdx % MUSIC_TRACKS.length].name}`);
    } else {
      selectTrack(trackIdx + 1, true);
    }
  }, [musicAudioOn, ensureAudioContext, trackIdx, selectTrack, onToast]);

  const setSleepTimer = useCallback((mins) => {
    sleepEndRef.current = mins > 0 ? Date.now() + mins * 60 * 1000 : 0;
    setSleepMinutes(mins);
    setSleepRemainingSec(mins * 60);
    if (mins > 0) {
      onToast?.(`🌙 Đã đặt hẹn giờ tắt âm thanh sau ${mins} phút`);
    } else {
      onToast?.('Đã tắt hẹn giờ ngủ');
    }
  }, [onToast]);

  const playBreathCue = useCallback((phaseKey) => {
    if (!ensureAudioContext()) return;
    const { ctx } = nodesRef.current;
    if (!ctx) return;

    const freqMap = {
      inhale: 432,
      hold: 528,
      exhale: 360
    };
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqMap[phaseKey] || 432, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }, [ensureAudioContext]);

  return {
    rainAudioOn,
    musicAudioOn,
    rainDensity,
    setRainDensity,
    rainVolume,
    setRainVolume,
    musicVolume,
    setMusicVolume,
    trackIdx: trackIdx % MUSIC_TRACKS.length,
    currentTrack: MUSIC_TRACKS[trackIdx % MUSIC_TRACKS.length],
    sleepMinutes,
    sleepRemainingSec,
    toggleRainAudio,
    ensureRainOn,
    toggleMusicAudio,
    selectTrack,
    nextTrack,
    setSleepTimer,
    playBreathCue
  };
}
