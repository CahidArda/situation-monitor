"use client";

/**
 * Single notification sound with debouncing.
 * Uses Web Audio API to generate a tone (no audio files needed).
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

/** Play a subtle notification ping. Debounced to at most once per 500 milliseconds. */
export function playNotificationSound() {
  const now = Date.now();
  if (now - lastPlayTime < DEBOUNCE_MS) return;
  lastPlayTime = now;

  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 800;
    gain.gain.value = 0.06;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Audio not available
  }
}
