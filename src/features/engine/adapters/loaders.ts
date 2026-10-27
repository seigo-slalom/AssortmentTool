import { Cr380_assortmentexceptionsService } from '../../../generated/services/Cr380_assortmentexceptionsService';
import { Cr380_doorsService } from '../../../generated/services/Cr380_doorsService';
import { Cr380_skusService } from '../../../generated/services/Cr380_skusService';
import { Cr380_tierrulesService } from '../../../generated/services/Cr380_tierrulesService';
import { Cr380_tiersService } from '../../../generated/services/Cr380_tiersService';
import type {
  EngineDoor,
  EngineException,
  EngineSku,
  EngineTier,
  EngineTierRule,
  ExceptionAction,
  ExceptionLevel,
} from '../core/types';
import { fetchAllPages } from '../../../lib/data/fetchAllPages';

// Choice values from the generated models (Cr380_assortmentexceptionscr380_*).
const EXCEPTION_LEVELS = new Map<number, ExceptionLevel>([
  [860080000, 'door'],
  [860080001, 'retailer'],
]);
const EXCEPTION_ACTIONS = new Map<number, ExceptionAction>([
  [860080000, 'add'],
  [860080001, 'remove'],
]);
const EXCEPTION_STATUS_ACTIVE = 860080000;

const ACTIVE = 'statecode eq 0';

export const SOURCES = {
  doors: {
    select: [
      'cr380_doorid',
      '_cr380_tierid_value',
      'cr380_productline',
      'cr380_distributornamecode',
    ],
    filter: ACTIVE,
  },
  tiers: { select: ['cr380_tierid'], filter: ACTIVE },
  skus: {
    select: ['cr380_skuid', 'cr380_axis'],
    filter: `${ACTIVE} and cr380_isactive eq true`,
  },
  tierRules: {
    select: ['cr380_tierruleid', '_cr380_tierid_value', '_cr380_sku_value'],
    filter: `${ACTIVE} and cr380_isenabled eq true`,
  },
  exceptions: {
    select: [
      'cr380_assortmentexceptionid',
      'cr380_exceptionlevel',
      'cr380_exceptionaction',
      '_cr380_doorid_value',
      '_cr380_skuid_value',
      'cr380_distributornamecode',
    ],
    filter: `${ACTIVE} and cr380_exceptionstatus eq ${EXCEPTION_STATUS_ACTIVE}`,
  },
} as const;

// Dataverse returns null for empty values; the engine models them as absent.
const present = (value: string | null | undefined): string | undefined => value || undefined;

const options = (source: { select: readonly string[]; filter: string }) => ({
  select: [...source.select],
  filter: source.filter,
});

export async function loadDoors(): Promise<EngineDoor[]> {
  const rows = await fetchAllPages(
    'doors',
    (o) => Cr380_doorsService.getAll(o),
    options(SOURCES.doors),
  );
  return rows.map((row) => ({
    id: row.cr380_doorid,
    tierId: present(row._cr380_tierid_value),
    productLine: present(row.cr380_productline),
    distributorNameCode: present(row.cr380_distributornamecode),
  }));
}

export async function loadTiers(): Promise<EngineTier[]> {
  const rows = await fetchAllPages(
    'tiers',
    (o) => Cr380_tiersService.getAll(o),
    options(SOURCES.tiers),
  );
  return rows.map((row) => ({ id: row.cr380_tierid }));
}

export async function loadSkus(): Promise<EngineSku[]> {
  const rows = await fetchAllPages(
    'SKUs',
    (o) => Cr380_skusService.getAll(o),
    options(SOURCES.skus),
  );
  return rows.map((row) => ({ id: row.cr380_skuid, axis: present(row.cr380_axis), active: true }));
}

export async function loadTierRules(): Promise<EngineTierRule[]> {
  const rows = await fetchAllPages(
    'tier rules',
    (o) => Cr380_tierrulesService.getAll(o),
    options(SOURCES.tierRules),
  );
  return rows.map((row) => ({
    id: row.cr380_tierruleid,
    tierId: row._cr380_tierid_value ?? '',
    skuId: row._cr380_sku_value ?? '',
    enabled: true,
  }));
}

export async function loadExceptions(): Promise<EngineException[]> {
  const rows = await fetchAllPages(
    'assortment exceptions',
    (o) => Cr380_assortmentexceptionsService.getAll(o),
    options(SOURCES.exceptions),
  );
  return rows.map((row) => ({
    id: row.cr380_assortmentexceptionid,
    level: EXCEPTION_LEVELS.get(row.cr380_exceptionlevel as number),
    action: EXCEPTION_ACTIONS.get(row.cr380_exceptionaction as number),
    skuId: present(row._cr380_skuid_value),
    doorId: present(row._cr380_doorid_value),
    distributorNameCode: present(row.cr380_distributornamecode),
    active: true,
  }));
}
