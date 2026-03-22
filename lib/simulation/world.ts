// ---------------------------------------------------------------------------
// World data: countries, cities, organizations, and other pools for
// template slot-filling. Real places, fake events.
// ---------------------------------------------------------------------------

export interface Country {
  name: string;
  capital: string;
  cities: string[];
  region: string;
}

export const COUNTRIES: Country[] = [
  {
    name: "Norway",
    capital: "Oslo",
    cities: ["Oslo", "Bergen", "Stavanger", "Tromsø"],
    region: "Europe",
  },
  {
    name: "Japan",
    capital: "Tokyo",
    cities: ["Tokyo", "Osaka", "Kyoto", "Yokohama"],
    region: "Asia",
  },
  {
    name: "Brazil",
    capital: "Brasília",
    cities: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
    region: "South America",
  },
  {
    name: "South Africa",
    capital: "Pretoria",
    cities: ["Johannesburg", "Cape Town", "Pretoria", "Durban"],
    region: "Africa",
  },
  {
    name: "United States",
    capital: "Washington D.C.",
    cities: ["New York", "Los Angeles", "Chicago", "Houston", "Miami"],
    region: "North America",
  },
  {
    name: "United Kingdom",
    capital: "London",
    cities: ["London", "Manchester", "Edinburgh", "Birmingham"],
    region: "Europe",
  },
  {
    name: "Australia",
    capital: "Canberra",
    cities: ["Sydney", "Melbourne", "Brisbane", "Perth"],
    region: "Oceania",
  },
  {
    name: "Germany",
    capital: "Berlin",
    cities: ["Berlin", "Frankfurt", "Munich", "Hamburg"],
    region: "Europe",
  },
  {
    name: "India",
    capital: "New Delhi",
    cities: ["Mumbai", "New Delhi", "Bangalore", "Chennai"],
    region: "Asia",
  },
  {
    name: "Canada",
    capital: "Ottawa",
    cities: ["Toronto", "Vancouver", "Montreal", "Calgary"],
    region: "North America",
  },
  {
    name: "Singapore",
    capital: "Singapore",
    cities: ["Singapore"],
    region: "Asia",
  },
  {
    name: "Switzerland",
    capital: "Bern",
    cities: ["Zurich", "Geneva", "Bern", "Basel"],
    region: "Europe",
  },
  {
    name: "Nigeria",
    capital: "Abuja",
    cities: ["Lagos", "Abuja", "Port Harcourt"],
    region: "Africa",
  },
  {
    name: "Argentina",
    capital: "Buenos Aires",
    cities: ["Buenos Aires", "Córdoba", "Rosario"],
    region: "South America",
  },
  {
    name: "South Korea",
    capital: "Seoul",
    cities: ["Seoul", "Busan", "Incheon"],
    region: "Asia",
  },
];

// ---------------------------------------------------------------------------
// Organisations & firms (fictional consulting / analysis firms)
// ---------------------------------------------------------------------------

export const ANALYST_FIRMS = [
  "Meridian Capital Research",
  "Blackstone Analytics",
  "Frontier Market Advisors",
  "Pinnacle Investment Group",
  "Cobalt Strategy Partners",
  "Summit Financial Research",
  "Ironclad Economics",
  "Osprey Market Intelligence",
];

export const AUTHORITIES = [
  "the Securities & Exchange Commission",
  "the Financial Conduct Authority",
  "Interpol's Financial Crimes Division",
  "the Department of Market Integrity",
  "the International Trade Authority",
];

export const DEPARTMENTS = [
  "engineering",
  "finance",
  "operations",
  "marketing",
  "legal",
  "R&D",
  "HR",
  "supply chain",
];

// ---------------------------------------------------------------------------
// Ridiculous items for event templates
// ---------------------------------------------------------------------------

export const SCANDAL_REASONS = [
  {
    short: "fishing breaks",
    detail:
      "demanded 4-hour fishing breaks during earnings season",
  },
  {
    short: "iguana policy",
    detail:
      "tried to mandate emotional support iguanas for all employees",
  },
  {
    short: "chair incident",
    detail:
      "replaced all executive chairs with beanbags without board approval",
  },
  {
    short: "rename attempt",
    detail:
      'attempted to rename the company to "CoolCorp420" during an investor call',
  },
  {
    short: "pirate cosplay",
    detail:
      "showed up to the annual shareholder meeting dressed as a pirate",
  },
  {
    short: "lunch nap decree",
    detail:
      "issued a mandatory post-lunch nap decree and installed company-wide hammocks",
  },
  {
    short: "astrology-based decisions",
    detail:
      "admitted to making all major business decisions based on daily horoscopes",
  },
  {
    short: "office goat",
    detail:
      'introduced a "company goat" that ate the Q3 financial reports',
  },
  {
    short: "meeting ban",
    detail:
      "banned all meetings and replaced them with carrier pigeon memos",
  },
  {
    short: "theme song",
    detail:
      "commissioned a 14-minute company theme song and played it at every meeting",
  },
];

// ---------------------------------------------------------------------------
// Diplomatic causes (randomly generated from topic + escalation)
// Any topic can pair with any escalation and still make sense.
// ---------------------------------------------------------------------------

/** The thing the countries are arguing about */
const DIPLOMATIC_TOPICS = [
  "cheese tariffs",
  "fishing rights",
  "a national bird designation",
  "timezone boundaries",
  "potato export quotas",
  "a disputed bridge name",
  "olive oil grading standards",
  "the correct way to brew tea",
  "goat grazing rights",
  "a submarine cable route",
  "migratory bird flight paths",
  "the ownership of a tiny uninhabited island",
];

/** How the argument escalated — works with any topic */
const DIPLOMATIC_ESCALATIONS = [
  "after both sides recalled their ambassadors",
  "leading to a full trade embargo",
  "resulting in a strongly worded letter to the UN",
  "causing both nations to cancel a joint summit",
  "after a leaked diplomatic cable went viral",
  "prompting emergency sessions in both parliaments",
  "after a diplomat slammed a table and stormed out",
  "with sanctions threatened by both sides",
  "after negotiations collapsed in under 4 minutes",
  "sparking protests outside both embassies",
];

export function randomDiplomaticCause(): { topic: string; escalation: string } {
  const topic = DIPLOMATIC_TOPICS[Math.floor(Math.random() * DIPLOMATIC_TOPICS.length)];
  const escalation = DIPLOMATIC_ESCALATIONS[Math.floor(Math.random() * DIPLOMATIC_ESCALATIONS.length)];
  return { topic, escalation };
}

// ---------------------------------------------------------------------------
// Ridiculous products (randomly generated from adjective + noun)
// ---------------------------------------------------------------------------

const PRODUCT_ADJECTIVES = [
  "AI-powered",
  "blockchain",
  "organic military-grade",
  "luxury",
  "smart",
  "noise-canceling",
  "NFT-authenticated",
  "subscription-based",
  "solar-powered",
  "fish-scented",
  "quantum-encrypted",
  "self-driving",
  "voice-activated",
  "artisanal",
  "cloud-connected",
  "decentralized",
  "holographic",
  "biodegradable",
];

const PRODUCT_NOUNS = [
  "spoon",
  "umbrella",
  "sunscreen",
  "cargo shorts",
  "toaster",
  "hat",
  "pencils",
  "doorbell",
  "flashlight",
  "cologne",
  "yoga mat",
  "briefcase",
  "toilet seat",
  "lawn mower",
  "pillow",
  "fridge magnet",
  "stapler",
  "office chair",
];

export function randomProduct(): string {
  const adj = PRODUCT_ADJECTIVES[Math.floor(Math.random() * PRODUCT_ADJECTIVES.length)];
  const noun = PRODUCT_NOUNS[Math.floor(Math.random() * PRODUCT_NOUNS.length)];
  return `${adj} ${noun}`;
}

/** @deprecated Use randomProduct() instead */
export const RIDICULOUS_PRODUCTS = [
  "fish-scented cologne",
  "AI-powered spoon",
  "blockchain umbrella",
  "organic military-grade sunscreen",
  "luxury cargo shorts",
  "smart toaster with built-in stock ticker",
  "noise-canceling hat",
  "NFT-authenticated artisanal pencils",
  "subscription-based doorbell",
  "solar-powered flashlight",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickRandomN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export function pickRandomCountryPair(): [Country, Country] {
  const shuffled = [...COUNTRIES].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}
