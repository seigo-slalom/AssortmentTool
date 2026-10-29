import { isPoolError, runPool } from '../../lib/async/runPool';
import { disableTierRule, enableTierRule, type WriteResult } from '../../lib/data';
import { parseKey, type Membership, type Staged } from '../../lib/tiers';

export interface SaveOutcome {
  saved: string[];
  failed: { key: string; error: string }[];
}

/** Persists staged rule changes (research R2); failed keys stay staged for a retry. */
export async function saveStaged(staged: Staged, m: Membership): Promise<SaveOutcome> {
  const keys = Object.keys(staged);
  const results = await runPool(keys, (key): Promise<WriteResult> => {
    const { skuId, tierId } = parseKey(key);
    if (staged[key]) return enableTierRule(tierId, skuId);
    const ruleId = m.ruleId.get(key);
    return ruleId ? disableTierRule(ruleId) : Promise.resolve({ ok: true, value: undefined });
  });
  const out: SaveOutcome = { saved: [], failed: [] };
  results.forEach((r, i) => {
    if (isPoolError(r)) out.failed.push({ key: keys[i], error: r.message });
    else if (r.ok) out.saved.push(keys[i]);
    else out.failed.push({ key: keys[i], error: r.error });
  });
  return out;
}
