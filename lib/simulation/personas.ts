import type { Persona } from "@/lib/interfaces/types";

export const PERSONAS: Persona[] = [
  // ── News orgs ──────────────────────────────────────────────────────────
  {
    id: "breaking-global",
    handle: "@BreakingGlobal",
    displayName: "Breaking Global News",
    type: "news",
    bio: "First with the news. Sometimes accurate.",
    traits: ["neutral", "breaking"],
  },
  {
    id: "official-gazette",
    handle: "@OfficialGazette",
    displayName: "The Global Gazette",
    type: "news",
    bio: "Award-winning journalism since 1847.",
    traits: ["neutral", "formal"],
  },
  {
    id: "market-pulse",
    handle: "@MarketPulse",
    displayName: "Market Pulse",
    type: "news",
    bio: "Real-time market coverage.",
    traits: ["neutral", "markets"],
    sectors: ["finance", "tech"],
  },

  // ── Analysts ───────────────────────────────────────────────────────────
  {
    id: "chad-investments",
    handle: "@ChadInvests",
    displayName: "Chad 📈",
    type: "analyst",
    bio: "Buy the dip. Always buy the dip.",
    traits: ["bullish", "overconfident"],
  },
  {
    id: "bearish-brenda",
    handle: "@BearishBrenda",
    displayName: "Brenda 📉",
    type: "analyst",
    bio: "Former hedge fund quant. Everything is overvalued.",
    traits: ["bearish", "data-driven"],
    sectors: ["finance", "tech"],
  },
  {
    id: "sector-sage",
    handle: "@SectorSage",
    displayName: "The Sector Sage",
    type: "analyst",
    bio: "25 years of sector rotation analysis. Subscriber count: 3.",
    traits: ["neutral", "sector-focused"],
  },

  // ── Shitposters ────────────────────────────────────────────────────────
  {
    id: "degen-dave",
    handle: "@DegenDave420",
    displayName: "Dave 🎰",
    type: "shitposter",
    bio: "YOLO'd my rent into fish futures",
    traits: ["chaotic", "bullish", "meme"],
  },
  {
    id: "market-witch",
    handle: "@MarketWitch444",
    displayName: "Cassandra ✨",
    type: "shitposter",
    bio: "I predicted 47 of the last 2 crashes",
    traits: ["bearish", "dramatic", "astrological"],
  },
  {
    id: "stonks-mcgee",
    handle: "@StonksMcGee",
    displayName: "Stonks 🚀",
    type: "shitposter",
    bio: "STONKS ONLY GO UP. this is financial advice.",
    traits: ["bullish", "chaotic", "meme"],
  },
  {
    id: "tinfoil-terry",
    handle: "@TinfoilTerry",
    displayName: "Terry 🛸",
    type: "shitposter",
    bio: "The market is controlled by Big Fishing. Wake up.",
    traits: ["conspiracy", "bearish"],
    sectors: ["agriculture", "mining"],
  },

  // ── Insiders / DM senders ──────────────────────────────────────────────
  {
    id: "goldbug-larry",
    handle: "@GoldBugLarry69",
    displayName: "Larry 🥇",
    type: "insider",
    bio: "Gold always goes up. Trust me bro.",
    traits: ["bullish-gold", "conspiracy", "dm-sender"],
    sectors: ["mining"],
  },
  {
    id: "crypto-karen",
    handle: "@CryptoKaren",
    displayName: "Karen 🔗",
    type: "insider",
    bio: "Decentralize everything. Even my grocery list.",
    traits: ["bullish", "crypto", "dm-sender"],
    sectors: ["tech", "finance"],
  },
  {
    id: "hedge-fund-hank",
    handle: "@HedgeFundHank",
    displayName: "Hank 🎩",
    type: "insider",
    bio: "I trade from my yacht. The yacht is rented.",
    traits: ["sophisticated", "dm-sender"],
  },
  {
    id: "senator-leak",
    handle: "@TotallyNotASenator",
    displayName: "Anonymous Official 🏛️",
    type: "insider",
    bio: "I may or may not have access to classified economic data.",
    traits: ["political", "dm-sender"],
  },
  {
    id: "quiet-quant",
    handle: "@QuietQuant",
    displayName: "QQ 🤫",
    type: "insider",
    bio: "...",
    traits: ["minimal", "accurate", "dm-sender"],
  },

  // ── Regular users ──────────────────────────────────────────────────────
  {
    id: "normie-nancy",
    handle: "@NancyInvests",
    displayName: "Nancy",
    type: "regular",
    bio: "Just started investing last week. How hard can it be?",
    traits: ["naive", "enthusiastic"],
  },
  {
    id: "boomer-bill",
    handle: "@BillFromAccounting",
    displayName: "Bill 📊",
    type: "regular",
    bio: "I've had the same portfolio since 1987 and I'm not changing it.",
    traits: ["conservative", "skeptical"],
    sectors: ["finance", "energy"],
  },
  {
    id: "reply-guy-rick",
    handle: "@RickReplies",
    displayName: "Rick",
    type: "regular",
    bio: "Well actually...",
    traits: ["contrarian", "pedantic"],
  },

  // ── Officials ──────────────────────────────────────────────────────────
  {
    id: "fed-chair",
    handle: "@FedChairOfficial",
    displayName: "Federal Reserve Chair",
    type: "official",
    bio: "Official communications from the Federal Reserve.",
    traits: ["formal", "impactful"],
  },
  {
    id: "trade-minister",
    handle: "@TradeMinistry",
    displayName: "Ministry of Trade",
    type: "official",
    bio: "Official trade policy updates.",
    traits: ["formal", "political"],
  },
];

/** DM-sending personas (subset of the above) and their accuracy ratings. */
export const DM_PERSONAS: Record<string, number> = {
  "goldbug-larry": 0.6,
  "crypto-karen": 0.4,
  "hedge-fund-hank": 0.7,
  "senator-leak": 0.8,
  "degen-dave": 0.3,
  "quiet-quant": 0.9,
};

export function getPersona(id: string): Persona | undefined {
  return PERSONAS.find((p) => p.id === id);
}

export function getPersonasByType(type: Persona["type"]): Persona[] {
  return PERSONAS.filter((p) => p.type === type);
}
