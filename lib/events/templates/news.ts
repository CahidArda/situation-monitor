import type { NewsCategory } from "@/lib/interfaces/types";

// ---------------------------------------------------------------------------
// Typed params for each news template type
// ---------------------------------------------------------------------------

export type CeoResignationParams = {
  company: string;
  ticker: string;
  ceoName: string;
  sector: string;
  city: string;
  country: string;
  scandalDetail: string;
  boardReaction: string;
  yearAppointed: string;
  ceoStatement: string;
  interimCeo: string;
  analystReaction: string;
  direction: string;
  percent: string;
  price: string;
};

export type SectorReportParams = {
  sector: string;
  direction: string;
  percent: string;
  reason: string;
  majorCompanies: string;
  catalyst: string;
  analystQuote: string;
  analystName: string;
  firmName: string;
  globalDirection: string;
  globalPercent: string;
};

export type DiplomaticIncidentParams = {
  country1: string;
  country2: string;
  city: string;
  issue: string;
  incident: string;
  official1Name: string;
  official1Title: string;
  official2Name: string;
  quote1: string;
  quote2: string;
  issueDetail: string;
  previousIncident: string;
  affectedSectors: string;
  mainIndex: string;
  indexDirection: string;
  indexPercent: string;
};

export type ArrestParams = {
  personName: string;
  role: string;
  city: string;
  country: string;
  charges: string;
  knownFor: string;
  authority: string;
  investigation: string;
  lawyerName: string;
  lawyerQuote: string;
  significance: string;
  additionalContext: string;
};

export type ProductLaunchParams = {
  company: string;
  ticker: string;
  product: string;
  direction: string;
  percent: string;
  analystReaction: string;
};

export type MarketCrashParams = {
  sector: string;
  percent: string;
  reason: string;
  affectedCompanies: string;
  analystName: string;
  analystQuote: string;
};

export type RegulatoryInvestigationParams = {
  company: string;
  ticker: string;
  percent: string;
  detail: string;
};

export type InsiderActivityParams = {
  company: string;
  ticker: string;
  direction: string;
  percent: string;
};

// ---------------------------------------------------------------------------
// Template type
// ---------------------------------------------------------------------------

export type NewsEventType =
  | "ceo-resignation"
  | "sector-report"
  | "diplomatic-incident"
  | "arrest"
  | "product-launch"
  | "market-crash"
  | "regulatory-investigation"
  | "insider-activity";

type NewsTemplate<P> = {
  headline: (p: P) => string;
  summary: (p: P) => string;
  body: (p: P) => string;
  category: NewsCategory;
};

type NewsEventParams = {
  "ceo-resignation": CeoResignationParams;
  "sector-report": SectorReportParams;
  "diplomatic-incident": DiplomaticIncidentParams;
  "arrest": ArrestParams;
  "product-launch": ProductLaunchParams;
  "market-crash": MarketCrashParams;
  "regulatory-investigation": RegulatoryInvestigationParams;
  "insider-activity": InsiderActivityParams;
};

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

const newsTemplates: {
  [E in NewsEventType]: NewsTemplate<NewsEventParams[E]>[];
} = {
  "ceo-resignation": [
    {
      headline: (p) =>
        `${p.company} CEO ${p.ceoName} Steps Down Amid ${p.scandalDetail} Controversy`,
      summary: (p) =>
        `The board of ${p.company} has accepted the resignation of CEO ${p.ceoName}. Shares moved ${p.direction} ${p.percent}% in after-hours trading.`,
      body: (p) =>
        `${p.city}, ${p.country} — In a move that stunned the ${p.sector} industry, ${p.company} announced today that CEO ${p.ceoName} has tendered their resignation, effective immediately.

The departure comes after ${p.scandalDetail}. Sources close to the board describe the situation as "${p.boardReaction}."

${p.ceoName}, who took the helm of ${p.company} in ${p.yearAppointed}, released a brief statement: "${p.ceoStatement}"

Interim CEO ${p.interimCeo} will assume leadership while the board conducts a search for a permanent replacement. Industry analysts ${p.analystReaction}.

${p.company} shares (${p.ticker}) ${p.direction === "up" ? "rose" : "fell"} ${p.percent}% to $${p.price} in after-hours trading.`,
      category: "business",
    },
  ],

  "sector-report": [
    {
      headline: (p) =>
        `${p.sector} Sector ${p.direction === "up" ? "Surges" : "Tumbles"} as ${p.reason}`,
      summary: (p) =>
        `The ${p.sector} sector index moved ${p.direction} ${p.percent}% today, driven by ${p.reason}.`,
      body: (p) =>
        `Global markets saw significant movement in the ${p.sector} sector today as ${p.reason}.

The sector index ${p.direction === "up" ? "gained" : "lost"} ${p.percent}% over the trading session, with major players including ${p.majorCompanies} ${p.direction === "up" ? "leading the charge" : "bearing the brunt"}.

Analysts point to ${p.catalyst} as the primary driver. "${p.analystQuote}," said ${p.analystName} of ${p.firmName}.

The movement has implications for the broader market, with the global index shifting ${p.globalDirection} ${p.globalPercent}% in sympathy.`,
      category: "markets",
    },
  ],

  "diplomatic-incident": [
    {
      headline: (p) =>
        `${p.country1} and ${p.country2} Clash Over ${p.issue}`,
      summary: (p) =>
        `Diplomatic tensions rose between ${p.country1} and ${p.country2} after ${p.incident}. Markets in both regions reacted sharply.`,
      body: (p) =>
        `${p.city}, ${p.country1} — Relations between ${p.country1} and ${p.country2} deteriorated sharply today after ${p.incident}.

${p.official1Name}, the ${p.official1Title} of ${p.country1}, called the situation "${p.quote1}." In response, ${p.official2Name} of ${p.country2} described it as "${p.quote2}."

The dispute centers on ${p.issueDetail}. Observers note that this marks an escalation from ${p.previousIncident}.

Markets in both regions reacted, with ${p.affectedSectors} sectors seeing immediate movement. The ${p.mainIndex} index shifted ${p.indexDirection} ${p.indexPercent}%.`,
      category: "world",
    },
  ],

  "arrest": [
    {
      headline: (p) =>
        `${p.personName} Arrested on ${p.charges} Charges`,
      summary: (p) =>
        `Prominent ${p.role} ${p.personName} was arrested today in ${p.city} on charges of ${p.charges}.`,
      body: (p) =>
        `${p.city}, ${p.country} — ${p.personName}, known for ${p.knownFor}, was taken into custody by ${p.authority} early this morning on charges of ${p.charges}.

The arrest follows ${p.investigation}. ${p.personName}'s lawyer, ${p.lawyerName}, stated that their client "${p.lawyerQuote}."

The case has drawn attention due to ${p.significance}. ${p.additionalContext}`,
      category: "breaking",
    },
  ],

  "product-launch": [
    {
      headline: (p) =>
        `${p.company} Unveils ${p.product} to Mixed Reactions`,
      summary: (p) =>
        `${p.company} announced its latest product, ${p.product}. Shares moved ${p.direction} ${p.percent}%.`,
      body: (p) =>
        `${p.company} surprised markets today with the announcement of ${p.product}, a move that analysts are calling "bold" at best and "baffling" at worst.

Shares of ${p.company} (${p.ticker}) moved ${p.direction} ${p.percent}% on the news. ${p.analystReaction}

The product is expected to ship in the coming months, though some observers question whether there is genuine demand for such an offering.`,
      category: "business",
    },
  ],

  "market-crash": [
    {
      headline: (p) =>
        `${p.sector} Sector in Freefall: Index Drops ${p.percent}%`,
      summary: (p) =>
        `The ${p.sector} sector suffered a sharp decline today as ${p.reason}.`,
      body: (p) =>
        `Markets were rocked today as the ${p.sector} sector index plunged ${p.percent}%, with ${p.affectedCompanies} among the hardest hit.

The selloff was triggered by ${p.reason}. "${p.analystQuote}," said ${p.analystName}.

Investors are advised to monitor the situation closely as the sector searches for a floor.`,
      category: "breaking",
    },
  ],

  "regulatory-investigation": [
    {
      headline: (p) =>
        `Regulators Investigating Unusual Trading in ${p.company} (${p.ticker})`,
      summary: (p) =>
        `${p.ticker} shares dropped ${p.percent}% after a sharp spike, drawing regulatory attention.`,
      body: (p) =>
        `${p.company} (${p.ticker}) experienced a dramatic reversal today, falling ${p.percent}% after an unexplained surge earlier in the session.

${p.detail}

Several accounts that promoted ${p.ticker} have since gone quiet.`,
      category: "breaking",
    },
  ],

  "insider-activity": [
    {
      headline: (p) =>
        `${p.company} (${p.ticker}) Shares ${p.direction === "up" ? "Surge" : "Drop"} ${p.percent}% on Unusual Activity`,
      summary: (p) =>
        `Unusual trading patterns in ${p.ticker} preceded today's sharp ${p.direction === "up" ? "rise" : "decline"}.`,
      body: (p) =>
        `${p.company} shares moved sharply ${p.direction} ${p.percent}% today amid what analysts describe as "unusual activity."

Several social media accounts appeared to anticipate the move, raising questions about potential information leaks.

Regulators have not commented on the situation.`,
      category: "markets",
    },
  ],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateNewsArticle<E extends NewsEventType>(
  eventType: E,
  params: NewsEventParams[E],
): { headline: string; summary: string; body: string; category: NewsCategory } {
  const templates = newsTemplates[eventType];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return {
    headline: template.headline(params),
    summary: template.summary(params),
    body: template.body(params),
    category: template.category,
  };
}

export function getNewsEventTypes(): NewsEventType[] {
  return Object.keys(newsTemplates) as NewsEventType[];
}
