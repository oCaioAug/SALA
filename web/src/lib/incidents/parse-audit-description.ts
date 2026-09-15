export type AuditDiscrepancy = {
  name: string;
  expected: number;
  detected: number;
};

export type ParsedIncidentDescription = {
  intro: string;
  items: AuditDiscrepancy[];
  outro: string;
  auditedAt: string | null;
};

const ITEM_RE =
  /-\s*(.+?):\s*Esperado\s+(\d+)\s*unidade\(s\),\s*detectado apenas\s+(\d+)\s*unidade\(s\)\.?/gi;

const AUDITED_AT_RE =
  /realizada em\s+(.+?)\s+detectou que/i;

/** Parses SALA-BOT inventory audit descriptions into structured rows. */
export function parseIncidentDescription(
  description: string
): ParsedIncidentDescription | null {
  const matches: {
    index: number;
    length: number;
    item: AuditDiscrepancy;
  }[] = [];

  for (const match of description.matchAll(ITEM_RE)) {
    if (match.index === undefined) continue;
    matches.push({
      index: match.index,
      length: match[0].length,
      item: {
        name: match[1].trim(),
        expected: Number(match[2]),
        detected: Number(match[3]),
      },
    });
  }

  if (matches.length === 0) return null;

  const first = matches[0];
  const last = matches[matches.length - 1];
  const intro = description.slice(0, first.index).trim();
  const outro = description.slice(last.index + last.length).trim();
  const auditedAt = intro.match(AUDITED_AT_RE)?.[1]?.trim() ?? null;

  return {
    intro,
    items: matches.map(m => m.item),
    outro,
    auditedAt,
  };
}

export function formatAuditDescriptionPreview(
  description: string,
  maxItems = 3
): string | null {
  const parsed = parseIncidentDescription(description);
  if (!parsed) return null;

  const names = parsed.items.slice(0, maxItems).map(i => i.name);
  const extra = parsed.items.length - names.length;
  const list = names.join(", ") + (extra > 0 ? ` +${extra}` : "");
  return list;
}
