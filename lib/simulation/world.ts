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
// Diplomatic causes (randomly generated from subject + dispute)
// ---------------------------------------------------------------------------

const DIPLOMATIC_SUBJECTS = [
  "a cheese tariff",
  "fishing rights",
  "an ambassador's cat",
  "a national bird",
  "a timezone",
  "a flag placement",
  "a pronunciation",
  "a goat island",
  "a potato export",
  "a bridge naming",
  "a royal wedding invitation",
  "a submarine cable",
];

const DIPLOMATIC_DISPUTES = [
  "dispute that escalated into sanctions",
  "disagreement that recalled both ambassadors",
  "violation involving a single trout",
  "debate that shut down all trade talks",
  "incident that scratched a priceless painting",
  "controversy over correct pronunciation of 'croissant'",
  "argument over whose turn it was to host the summit",
  "misunderstanding involving an uninhabited island",
  "scandal after a leaked diplomatic memo",
  "crisis triggered by an accidental airstrike on a hay bale",
];

export function randomDiplomaticCause(): string {
  const subject = DIPLOMATIC_SUBJECTS[Math.floor(Math.random() * DIPLOMATIC_SUBJECTS.length)];
  const dispute = DIPLOMATIC_DISPUTES[Math.floor(Math.random() * DIPLOMATIC_DISPUTES.length)];
  return `${subject} ${dispute}`;
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
