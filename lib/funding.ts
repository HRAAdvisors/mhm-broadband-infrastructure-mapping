import { FUNDING_BY_PROJECT, type FundingRecord } from "./funding.generated";

/**
 * A feature's project field is usually a single project name/ID, but BEAD
 * locations touched by more than one award store a "; "-joined list —
 * resolve every id found to its funding record.
 */
export function fundingRecordsFor(projectField: unknown): FundingRecord[] {
  if (typeof projectField !== "string") return [];
  return projectField
    .split(";")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => FUNDING_BY_PROJECT[id])
    .filter((r): r is FundingRecord => Boolean(r));
}

/** Sums funding across every matched project (usually just one). */
export function formatFundingObligated(projectField: unknown): string {
  const records = fundingRecordsFor(projectField);
  if (records.length === 0) return "Not available";
  const total = records.reduce((sum, r) => sum + (r.fundingObligated ?? 0), 0);
  return `$${total.toLocaleString()}`;
}
