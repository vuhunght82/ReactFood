import { Platform, Vibration } from 'react-native';

export type SoundType = 'kitchen_bell' | 'dingdong' | 'beep_alert' | 'urgent_alarm' | 'fanfare' | 'siren' | 'custom';

export interface AlarmConfig {
  soundType: SoundType | string;
  volume: number; // 0 to 100
  repeatCount: number; // 1 to 10
  repeatInterval: number; // in seconds
  enableVibration?: boolean;
  enableWakeScreen?: boolean;
  customSoundUri?: string; // URI or Data URL from user device
  loopUntilClicked?: boolean; // Repeat indefinitely until user dismisses/clicks
}

let activeAudioCtx: any = null;
let activeAudioElement: any = null;
let activeIntervalId: any = null;
let activeTimeoutIds: any[] = [];
let wakeLockSentinel: any = null;

/**
 * Acquire screen wake lock on web/mobile browsers if supported
 */
export async function requestScreenWakeLock(): Promise<boolean> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
    try {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      console.log('💡 Screen Wake Lock acquired!');
      return true;
    } catch (e) {
      console.warn('Wake Lock request failed:', e);
    }
  }
  return false;
}

/**
 * Release screen wake lock
 */
export async function releaseScreenWakeLock() {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
      wakeLockSentinel = null;
      console.log('💡 Screen Wake Lock released.');
    } catch (e) {
      console.warn('Wake Lock release error:', e);
    }
  }
}

/**
 * Synthesizes a specific sound pattern using Web Audio API
 */
function playSynthSound(type: string, volume: number = 100) {
  if (Platform.OS !== 'web' && typeof window === 'undefined') return;

  try {
    const AudioCtxClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) return;

    if (!activeAudioCtx || activeAudioCtx.state === 'closed') {
      activeAudioCtx = new AudioCtxClass();
    }
    if (activeAudioCtx.state === 'suspended') {
      activeAudioCtx.resume();
    }

    const ctx = activeAudioCtx;
    const gainNode = ctx.createGain();
    const masterVol = Math.max(0.01, Math.min(1.0, volume / 100));
    gainNode.gain.setValueAtTime(masterVol * 0.4, ctx.currentTime);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'kitchen_bell': {
        // High-pitched double chime
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'sine';
        osc2.type = 'triangle';

        osc1.frequency.setValueAtTime(880, now); // A5
        osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.15);

        osc2.frequency.setValueAtTime(1046.5, now + 0.15); // C6
        osc2.frequency.exponentialRampToValueAtTime(2093, now + 0.35);

        gainNode.gain.setValueAtTime(masterVol * 0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        osc1.start(now);
        osc1.stop(now + 0.2);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.5);
        break;
      }

      case 'dingdong': {
        // Classic two-tone doorbell
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'sine';
        osc2.type = 'sine';

        osc1.frequency.setValueAtTime(659.25, now); // E5
        osc2.frequency.setValueAtTime(523.25, now + 0.3); // C5

        gainNode.gain.setValueAtTime(masterVol * 0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        osc1.start(now);
        osc1.stop(now + 0.3);
        osc2.start(now + 0.3);
        osc2.stop(now + 0.9);
        break;
      }

      case 'beep_alert': {
        // 3 rapid warning beeps
        for (let i = 0; i < 3; i++) {
          const startTime = now + i * 0.15;
          const osc = ctx.createOscillator();
          osc.type = 'square';
          osc.frequency.setValueAtTime(1200, startTime);

          const subGain = ctx.createGain();
          subGain.gain.setValueAtTime(masterVol * 0.3, startTime);
          subGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

          osc.connect(subGain);
          subGain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.1);
        }
        break;
      }

      case 'urgent_alarm':
      case 'siren': {
        // Pulsing urgent siren
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.linearRampToValueAtTime(1500, now + 0.3);
        osc.frequency.linearRampToValueAtTime(700, now + 0.6);

        gainNode.gain.setValueAtTime(masterVol * 0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

        osc.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.7);
        break;
      }

      case 'fanfare': {
        // Brass fanfare triad
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const startTime = now + idx * 0.12;
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);

          const subGain = ctx.createGain();
          subGain.gain.setValueAtTime(masterVol * 0.4, startTime);
          subGain.gain.exponentialRampToValueAtTime(0.001, startTime + (idx === 3 ? 0.5 : 0.12));

          osc.connect(subGain);
          subGain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + (idx === 3 ? 0.5 : 0.12));
        });
        break;
      }

      default: {
        // Fallback default chime
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gainNode.gain.setValueAtTime(masterVol * 0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }
    }
  } catch (e) {
    console.warn('Web Audio synthesis error:', e);
  }
}

/**
 * Plays either a custom audio source (from device) or a synthesized tone
 */
function playAudioSource(type: string, volume: number = 100, customSoundUri?: string) {
  if (type === 'custom' && customSoundUri) {
    try {
      if (Platform.OS === 'web' && typeof Audio !== 'undefined') {
        if (activeAudioElement) {
          try {
            activeAudioElement.pause();
            activeAudioElement.currentTime = 0;
          } catch {}
        }
        activeAudioElement = new Audio(customSoundUri);
        activeAudioElement.volume = Math.max(0.01, Math.min(1.0, volume / 100));
        activeAudioElement.play().catch((err: any) => {
          console.warn('Custom audio playback error, falling back to chime:', err);
          playSynthSound('kitchen_bell', volume);
        });
        return;
      }
    } catch (e) {
      console.warn('Custom audio source error:', e);
    }
  }

  // Synthesizer fallback
  playSynthSound(type, volume);
}

/**
 * Triggers the full order alarm sequence (sound loop, vibration, screen wake lock)
 */
export function playOrderAlarm(config: AlarmConfig) {
  stopOrderAlarm(); // Clear any existing alarm

  const soundType = config.soundType || 'kitchen_bell';
  const volume = config.volume ?? 100;
  const repeatCount = Math.max(1, Math.min(10, config.repeatCount ?? 3));
  const repeatIntervalMs = Math.max(300, (config.repeatInterval ?? 2) * 1000);
  const loopUntilClicked = !!config.loopUntilClicked;

  // 1. Acquire wake lock if enabled
  if (config.enableWakeScreen !== false) {
    requestScreenWakeLock();
  }

  // 2. Trigger vibration if enabled
  if (config.enableVibration !== false) {
    try {
      Vibration.vibrate([0, 500, 200, 500, 200, 500], false);
    } catch (e) {
      console.warn('Vibration error:', e);
    }
  }

  // 3. Play first iteration immediately
  playAudioSource(soundType, volume, config.customSoundUri);

  let playCount = 1;
  if (!loopUntilClicked && playCount >= repeatCount) return;

  // 4. Schedule repeated iterations
  activeIntervalId = setInterval(() => {
    // If loopUntilClicked is true, keep repeating indefinitely!
    if (loopUntilClicked || playCount < repeatCount) {
      playAudioSource(soundType, volume, config.customSoundUri);
      if (config.enableVibration !== false) {
        try {
          Vibration.vibrate([0, 400], false);
        } catch {}
      }
      playCount++;
    } else {
      stopOrderAlarm();
    }
  }, repeatIntervalMs);
}

/**
 * Immediately stops any playing alarm audio, intervals, vibrations, and wake locks
 */
export function stopOrderAlarm() {
  if (activeIntervalId) {
    clearInterval(activeIntervalId);
    activeIntervalId = null;
  }

  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {}
    activeAudioElement = null;
  }

  activeTimeoutIds.forEach((id) => clearTimeout(id));
  activeTimeoutIds = [];

  try {
    Vibration.cancel();
  } catch {}

  releaseScreenWakeLock();
}
