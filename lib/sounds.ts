"use client";

/**
 * Two-tone ascending chime notification sound.
 * Uses Web Audio API — no audio files needed.
 */

let audioCtx: AudioContext | null = null;
let lastPlayTime = 0;

const DEBOUNCE_MS = 500;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  volume: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** Play a two-tone ascending chime. Debounced. */
export function playNotificationSound() {
  const now = Date.now();
  if (now - lastPlayTime < DEBOUNCE_MS) return;
  lastPlayTime = now;

  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    playTone(ctx, 587, t, 0.12, 0.08);        // D5
    playTone(ctx, 880, t + 0.1, 0.15, 0.06);  // A5
  } catch {
    // Audio not available
  }
}
