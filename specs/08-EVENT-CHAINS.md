# 08 — Event Chains Spec

## Overview

Event chains are the heart of the simulation. Each chain is a sequence of events that unfold over time, producing tweets, news, DMs, and market changes. Chains can branch (different outcomes based on randomness) and overlap (multiple chains running simultaneously).

## Chain: Insider Trading Scheme

**ID**: `insider-trading`
**Duration**: 2–5 minutes
**Frequency**: Medium

### Flow

```
[SEED] insider-trading.setup
  │  Pick a company, insider persona, and prediction (up/down)
  │  Decide if prediction will be correct (60/40)
  │
  ├──→ insider-trading.rumor-dm (delay: 0s)
  │     Send DM: "psst, I heard ${company} is about to ${prediction}"
  │
  ├──→ insider-trading.speculative-tweet (delay: 10-20s)
  │     Insider tweets vaguely about the company
  │     Other personas react: "what does @insider know?"
  │
  ├──→ insider-trading.market-move (delay: 30-60s)
  │     Company price shifts (in predicted direction or opposite)
  │
  └──→ [BRANCH on outcome]
        │
        ├── [CORRECT] insider-trading.outcome-success
        │     News: company announces thing that validates prediction
        │     Insider sends DM: "told you so 😎"
        │     Insider tweets smugly
        │     Multiple personas react: "how did @insider know??"
        │     └──→ insider-trading.arrest (delay: 60-120s, 30% chance)
        │           News: insider arrested for market manipulation
        │           Insider sends DM: "delete our messages"
        │           Personas react: "LMAOOO"
        │
        └── [INCORRECT] insider-trading.outcome-failure
              Price moves opposite direction
              Insider sends DM: "ok so that didn't go as planned 😬"
              Insider tweets: "market is rigged"
              Personas react: mocking
              └──→ insider-trading.panic (delay: 30s)
                    Insider sends DM: "I'm ruined"
                    Insider tweets something desperate
```

### Zod Schemas

```typescript
const InsiderTradingSetupSchema = z.object({
  companyId: z.string(),
  insiderPersonaId: z.string(),
  prediction: z.enum(["up", "down"]),
  willBeCorrect: z.boolean(),
  magnitude: z.number(), // percent change
});

const InsiderTradingRumorSchema = z.object({
  ...InsiderTradingSetupSchema.shape,
  chainId: z.string(),
});
```

---

## Chain: CEO Scandal

**ID**: `ceo-scandal`
**Duration**: 3–8 minutes
**Frequency**: Low-Medium

### Flow

```
[SEED] ceo-scandal.initial-rumor
  │  Pick a company and a ridiculous reason for scandal
  │  Reasons pool: refused to stop juggling in meetings, insisted on
  │    bringing pet iguana to board meetings, caught replacing all
  │    office chairs with exercise balls, tried to rename the company
  │    after their cat, demanded 4-hour fishing lunch breaks, etc.
  │
  ├──→ ceo-scandal.anonymous-tweet (delay: 0s)
  │     Anonymous-looking account tweets: "hearing rumors about ${company} CEO..."
  │
  ├──→ ceo-scandal.speculation-wave (delay: 15-30s)
  │     3-4 personas tweet reactions/speculation
  │     Market: company stock dips slightly
  │
  ├──→ ceo-scandal.press-conference (delay: 45-90s)
  │     News article: CEO addresses allegations
  │     CEO's statement is hilariously tone-deaf
  │     Multiple personas tweet about the press conference
  │
  └──→ [BRANCH]
        │
        ├── [CEO RESIGNS] ceo-scandal.resignation (60% chance)
        │     News: CEO steps down
        │     Stock drops, then recovers over time
        │     Personas celebrate or mourn
        │     New CEO announced (equally absurd name)
        │     └──→ ceo-scandal.new-ceo-policy (delay: 120s)
        │           News: new CEO announces bizarre new policy
        │           Stock moves based on perception
        │
        └── [CEO SURVIVES] ceo-scandal.survived (40% chance)
              News: board backs CEO despite controversy
              Stock slightly up (stability signal)
              Personas: "only in ${sector} would this fly"
```

### Ridiculous Scandal Reasons

```typescript
const SCANDAL_REASONS = [
  { short: "fishing breaks", detail: "demanded 4-hour fishing breaks during earnings season" },
  { short: "iguana policy", detail: "tried to mandate emotional support iguanas for all employees" },
  { short: "chair incident", detail: "replaced all executive chairs with beanbags without board approval" },
  { short: "rename attempt", detail: "attempted to rename the company to 'CoolCorp420' during an investor call" },
  { short: "pirate cosplay", detail: "showed up to the annual shareholder meeting dressed as a pirate" },
  { short: "lunch nap decree", detail: "issued a mandatory post-lunch nap decree and installed company-wide hammocks" },
  { short: "astrology-based decisions", detail: "admitted to making all major business decisions based on daily horoscopes" },
  { short: "office goat", detail: "introduced a 'company goat' that ate the Q3 financial reports" },
  { short: "meeting ban", detail: "banned all meetings and replaced them with carrier pigeon memos" },
  { short: "theme song", detail: "commissioned a 14-minute company theme song and played it at every meeting" },
];
```

---

## Chain: Diplomatic Incident

**ID**: `diplomatic-incident`
**Duration**: 5–15 minutes
**Frequency**: Low

### Flow

```
[SEED] diplomatic-incident.trigger
  │  Pick two countries, a ridiculous cause, and affected sectors
  │  Causes: cheese tariff dispute, ambassador's cat scratched a painting,
  │    national bird debate, timezone disagreement, etc.
  │
  ├──→ diplomatic-incident.breaking-news (delay: 0s)
  │     News: "Tensions rise between X and Y over Z"
  │     Breaking news persona tweets
  │     Affected sectors start moving
  │
  ├──→ diplomatic-incident.reaction-wave (delay: 15-30s)
  │     Multiple personas tweet takes
  │     Analysts weigh in on market impact
  │     An insider sends a DM about which sectors to watch
  │
  ├──→ diplomatic-incident.escalation (delay: 60-120s)
  │     News: situation escalates (ambassador recalled, sanctions threatened)
  │     Affected sectors move more
  │     Personas panic-tweet
  │
  └──→ [BRANCH]
        ├── [RESOLUTION] (70%)
        │     News: countries reach absurd compromise
        │     Markets recover
        │     Personas: "well that was dramatic"
        │
        └── [PROLONGED] (30%)
              Becomes ongoing background event
              Sector status changes (volatile/bear)
              Periodic follow-up news for several minutes
              Eventually resolves
```

---

## Chain: Market Manipulation Pump & Dump

**ID**: `pump-and-dump`
**Duration**: 2–4 minutes
**Frequency**: Medium-Low

### Flow

```
[SEED] pump-and-dump.setup
  │  Pick a small company and a manipulator persona
  │
  ├──→ pump-and-dump.insider-dm (delay: 0s)
  │     Manipulator sends DM: "I'm about to pump ${ticker}. Get in now."
  │
  ├──→ pump-and-dump.hype-tweets (delay: 10-20s)
  │     Manipulator tweets: "${ticker} is the next big thing!!!"
  │     1-2 other personas jump on the hype
  │     Stock starts rising
  │
  ├──→ pump-and-dump.peak (delay: 40-60s)
  │     Stock peaks (5-15% up)
  │     More personas FOMO in
  │     Manipulator sends DM: "almost time to dump 😈"
  │
  └──→ pump-and-dump.dump (delay: 10-20s after peak)
        Stock crashes back down
        News: "regulators investigating unusual trading in ${ticker}"
        Manipulator sends DM: "I'm out. Hope you sold too"
        Bag-holder personas tweet in despair
```

---

## Chain: Sector Shift (Long-running)

**ID**: `sector-shift`
**Duration**: 10–30 minutes
**Frequency**: Low

### Flow

```
[SEED] sector-shift.catalyst
  │  Pick a sector and a direction (bull→bear or bear→bull)
  │  Pick a macro cause: new regulation, resource discovery,
  │    technological breakthrough, natural disaster, etc.
  │
  ├──→ sector-shift.early-signal (delay: 0s)
  │     Subtle news article about the catalyst
  │     Quiet Quant sends DM: "watching ${sector} closely"
  │     Sector status changes to "volatile"
  │
  ├──→ sector-shift.confirmation (delay: 60-120s)
  │     More definitive news article
  │     Analyst personas start tweeting about the shift
  │     Sector starts trending in the new direction
  │
  ├──→ sector-shift.full-swing (delay: 120-300s)
  │     Sector status changes to bull/bear
  │     Multiple news articles about companies in the sector
  │     Wave of persona tweets
  │     DM personas send tips on plays
  │
  └──→ sector-shift.new-normal (delay: 300-600s)
        Sector stabilizes at new level
        Status → "stable"
        Retrospective news articles
        Analysts claim they predicted it all along
```

---

## Chain: Product Launch

**ID**: `product-launch`
**Duration**: 2–4 minutes
**Frequency**: Medium

### Flow

```
[SEED] product-launch.announcement
  │  Pick a company and a ridiculous product
  │  Products: fish-scented cologne, AI-powered spoon, blockchain umbrella,
  │    organic military-grade sunscreen, luxury cargo shorts, etc.
  │
  ├──→ product-launch.tweet-reveal (delay: 0s)
  │     Official company tweets announcement
  │     News article about the launch
  │
  ├──→ product-launch.reaction-wave (delay: 10-20s)
  │     Mix of excited and mocking tweets
  │     Meme reactions
  │
  └──→ [BRANCH on reception]
        ├── [HIT] company base value +5-10%
        │     Follow-up news: "product sells out in hours"
        │     Positive tweets
        │
        └── [FLOP] company base value -3-7%
              Follow-up news: "product mocked on social media"
              Brutal persona tweets
```

---

## Chain: Random Noise Events (Short)

These are simple single-tweet or single-news events that add texture without starting chains:

- `noise.random-persona-tweet` — a persona tweets something topical but unrelated to any chain
- `noise.market-commentary` — analyst tweets generic market observation
- `noise.sector-sentiment` — news article with sector outlook
- `noise.meme-tweet` — shitposter posts market meme
- `noise.dm-chitchat` — insider sends casual DM unrelated to any tip

These fire frequently between chain events to keep the feed lively.

---

## Concurrent Chain Management

Multiple chains can run simultaneously. The workflow handles this by:

1. Each chain gets a unique `chainId` stored in Redis: `sim:active_chains`
2. Events tag their outputs (tweets, news, DMs) with `eventChainId`
3. Maximum concurrent chains: 3-4 (to avoid chaos overload)
4. If max reached, new seed events are cooldown-blocked until a chain completes
5. Noise events always fire regardless of chain count
