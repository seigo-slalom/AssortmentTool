import type { AssortmentData, DoorRecord } from '../data';
import { statusCategory, statusTone, type StatusCategory, type StatusTone } from './status';

/** A door as the Doors grid shows it, built once per data version (data-model.md §2). */
export interface DoorRow extends DoorRecord {
  /** Tier name when the door's tier exists; absent ⇒ "Needs tier". */
  tierName?: string;
  tierRank?: number;
  statusCategory: StatusCategory;
  statusTone: StatusTone;
  isClosed: boolean;
  /** Engine-derived SKU count; only for doors with a tier that are not closed. */
  skuCount?: number;
  /** Active door-level exceptions. */
  exceptionCount: number;
  /** Lower-cased `name|doorKey|shipTo` for search. */
  searchKey: string;
  /** `D Mon YYYY · XX`, or "—". */
  lastChangedLabel: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function initials(name?: string): string {
  return (name ?? '')
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function formatDay(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function lastChangedLabel(modifiedOn?: string, modifiedByName?: string): string {
  const day = formatDay(modifiedOn);
  const who = initials(modifiedByName);
  return day !== '—' && who ? `${day} · ${who}` : day;
}

export function buildDoorRows(data: AssortmentData): DoorRow[] {
  const counts = data.engine.getCounts().byDoor;
  return data.records.doors
    .map((door): DoorRow => {
      const tier = door.tierId ? data.index.tierById.get(door.tierId) : undefined;
      const category = statusCategory(door.status);
      const isClosed = category === 'closed';
      return {
        ...door,
        tierName: tier?.name,
        tierRank: tier?.rank,
        statusCategory: category,
        statusTone: statusTone(category),
        isClosed,
        skuCount: tier && !isClosed ? counts.get(door.id) : undefined,
        exceptionCount: data.index.doorExceptions.get(door.id)?.length ?? 0,
        searchKey: [door.name, door.doorKey, door.shipTo].join('|').toLowerCase(),
        lastChangedLabel: lastChangedLabel(door.modifiedOn, door.modifiedByName),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
