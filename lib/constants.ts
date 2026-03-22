// ---------------------------------------------------------------------------
// Simulation timing constants — everything expressed in ticks
// ---------------------------------------------------------------------------

/** Duration of one simulation tick in seconds */
export const TICK_DURATION_SECONDS = 10;

/** Duration of one tick in milliseconds */
export const TICK_DURATION_MS = TICK_DURATION_SECONDS * 1000;

/** Number of ticks between event triggers (tick endpoint cooldown) */
export const EVENT_COOLDOWN_TICKS = 2; // 2 ticks = 20 seconds

/** How many ticks to look back when calculating price change */
export const CHANGE_LOOKBACK_TICKS = 5;

// ---------------------------------------------------------------------------
// Chain cooldowns (in ticks)
// ---------------------------------------------------------------------------

export const COOLDOWN_TICKS = {
  noise: 3,                // 30s
  "time-traveler": 12,    // 2 min
  "insider-trading": 5,   // 50s
  "ceo-scandal": 6,       // 60s
  "diplomatic-incident": 8, // 80s
  "pump-and-dump": 6,     // 60s
  "product-launch": 5,    // 50s
  "market-boom": 9,       // 90s
} as const;

// ---------------------------------------------------------------------------
// Chain step delays (in ticks)
// ---------------------------------------------------------------------------

/** Convert a tick count to seconds for ctx.sleep / delaySeconds */
export function ticksToSeconds(ticks: number): number {
  return ticks * TICK_DURATION_SECONDS;
}

// ---------------------------------------------------------------------------
// DM / chain expiry (in ticks)
// ---------------------------------------------------------------------------

/** DM messages expire after this many ticks */
export const DM_EXPIRY_TICKS = 60; // 60 × 10s = 10 minutes

/** Active chains auto-expire after this many ticks (safety net) */
export const CHAIN_EXPIRY_TICKS = 30; // 30 × 10s = 5 minutes

// ---------------------------------------------------------------------------
// Derived values for Redis TTLs
// ---------------------------------------------------------------------------

export const DM_TTL_SECONDS = DM_EXPIRY_TICKS * TICK_DURATION_SECONDS;
export const CHAIN_TTL_SECONDS = CHAIN_EXPIRY_TICKS * TICK_DURATION_SECONDS;

// ---------------------------------------------------------------------------
// UI polling intervals (in ms)
// ---------------------------------------------------------------------------

/** How often the frontend polls the tick endpoint */
export const TICK_POLL_MS = TICK_DURATION_MS;

/** How often to poll for new tweets */
export const TWEET_POLL_MS = TICK_DURATION_MS;

/** How often to poll for news */
export const NEWS_POLL_MS = TICK_DURATION_MS * 2;

/** How often to poll DM conversations */
export const DM_POLL_MS = TICK_DURATION_MS;

/** How often to poll market prices */
export const MARKET_POLL_MS = TICK_DURATION_MS;

/** How often to poll market history */
export const MARKET_HISTORY_POLL_MS = TICK_DURATION_MS * 2;

// ---------------------------------------------------------------------------
// UI display helpers
// ---------------------------------------------------------------------------

/** Format tick count as human-readable duration */
export function formatTickDuration(ticks: number): string {
  const totalSeconds = ticks * TICK_DURATION_SECONDS;
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds > 0 ? `${minutes}m${seconds}s` : `${minutes}m`;
}
