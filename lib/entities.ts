import type { ContentEntity } from "./interfaces/types";

export type ContentSegment =
  | { kind: "text"; text: string }
  | { kind: "entity"; text: string; entity: ContentEntity };

/**
 * Parse content string into segments using the explicit entities list.
 * Matches are case-insensitive, greedy (longer entities matched first).
 * If no entities provided, returns the whole string as a single text segment.
 */
export function parseEntities(
  content: string,
  entities?: ContentEntity[],
): ContentSegment[] {
  if (!entities || entities.length === 0) {
    return [{ kind: "text", text: content }];
  }

  // Deduplicate and sort by length descending for greedy matching
  const sorted = [...entities].sort((a, b) => b.text.length - a.text.length);
  const entityMap = new Map<string, ContentEntity>();
  for (const e of sorted) {
    entityMap.set(e.text.toLowerCase(), e);
  }

  const escaped = sorted.map((e) =>
    e.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");

  const segments: ContentSegment[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(pattern)) {
    const matchStart = match.index!;
    const matchText = match[0];

    if (matchStart > lastIndex) {
      segments.push({ kind: "text", text: content.slice(lastIndex, matchStart) });
    }

    const entity = entityMap.get(matchText.toLowerCase())!;
    segments.push({ kind: "entity", text: matchText, entity });
    lastIndex = matchStart + matchText.length;
  }

  if (lastIndex < content.length) {
    segments.push({ kind: "text", text: content.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ kind: "text", text: content }];
}
