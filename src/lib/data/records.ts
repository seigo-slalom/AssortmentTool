import { Cr380_assortmentexceptionsService } from '../../generated/services/Cr380_assortmentexceptionsService';
import { Cr380_doorsService } from '../../generated/services/Cr380_doorsService';
import { Cr380_skusService } from '../../generated/services/Cr380_skusService';
import { Cr380_tierrulesService } from '../../generated/services/Cr380_tierrulesService';
import { Cr380_tiersService } from '../../generated/services/Cr380_tiersService';
import { fetchAllPages } from './fetchAllPages';

// Choice values from the generated models (Cr380_*Model.ts).
export const EXCEPTION_LEVEL_DOOR = 860080000;
export const EXCEPTION_LEVEL_RETAILER = 860080001;
export const EXCEPTION_ACTION_ADD = 860080000;
export const EXCEPTION_ACTION_REMOVE = 860080001;
export const EXCEPTION_STATUS_ACTIVE = 860080000;
export const EXCEPTION_STATUS_CANCELLED = 860080001;
export const SKU_TYPE_RETAIL = 860080000;
export const SKU_TYPE_SPM = 860080001;
export const TIER_STATUS_ACTIVE = 860080000;
export const TIER_STATUS_INACTIVE = 860080001;

export interface DoorRecord {
  id: string;
  name: string;
  doorKey?: string;
  shipTo?: string;
  soldTo?: string;
  distributorName?: string;
  distributorNameCode?: string;
  onlineOffline?: string;
  doorType?: string;
  productLine?: string;
  salesChannel?: string;
  status?: string;
  openingDate?: string;
  tierId?: string;
  modifiedOn?: string;
  modifiedByName?: string;
}

export interface TierRecord {
  id: string;
  name: string;
  rank?: number;
  active: boolean;
  description?: string;
}

export type SkuType = 'retail' | 'spm';

export interface SkuRecord {
  id: string;
  key?: string;
  name?: string;
  axis?: string;
  franchise?: string;
  line?: string;
  type?: SkuType;
  barcode?: string;
  masterProductName?: string;
  masterProductBaseline?: string;
  masterFranchise?: string;
  masterCategory?: string;
  category?: string;
  subcategory?: string;
  lastSeenInSunrise?: string;
}

export interface TierRuleRecord {
  id: string;
  tierId: string;
  skuId: string;
}

export interface ExceptionRecord {
  id: string;
  level?: 'door' | 'retailer';
  action?: 'add' | 'remove';
  doorId?: string;
  skuId?: string;
  distributorNameCode?: string;
  reason?: string;
}

export interface AssortmentRecords {
  doors: DoorRecord[];
  tiers: TierRecord[];
  skus: SkuRecord[];
  tierRules: TierRuleRecord[];
  exceptions: ExceptionRecord[];
}

const ACTIVE = 'statecode eq 0';

export const RECORD_SOURCES = {
  doors: {
    select: [
      'cr380_doorid',
      'cr380_doorname',
      'cr380_doorkey',
      'cr380_sapshipto',
      'cr380_sapsoldto',
      'cr380_distributorname',
      'cr380_distributornamecode',
      'cr380_dooronlineoffline',
      'cr380_doortype',
      'cr380_productline',
      'cr380_saleschannel',
      'cr380_doorstatus',
      'cr380_openingdate',
      '_cr380_tierid_value',
      'modifiedon',
      // `modifiedbyname` is a virtual name attribute Dataverse rejects in $select; the user's
      // name comes back as the formatted-value annotation of the `_modifiedby_value` lookup.
      '_modifiedby_value',
    ],
    filter: ACTIVE,
  },
  tiers: {
    select: [
      'cr380_tierid',
      'cr380_tiername',
      'cr380_rank',
      'cr380_tierstatus',
      'cr380_description',
    ],
    filter: ACTIVE,
  },
  skus: {
    select: [
      'cr380_skuid',
      'cr380_skukey',
      'cr380_skuname',
      'cr380_axis',
      'cr380_franchise',
      'cr380_line',
      'cr380_skutype',
      'cr380_barcode',
      'cr380_masterproductname',
      'cr380_masterproductbaseline',
      'cr380_masterfranchise',
      'cr380_productmastercategory',
      'cr380_productcategory',
      'cr380_productsubcategory',
      'cr380_lastseeninsunrise',
    ],
    filter: `${ACTIVE} and cr380_isactive eq false`,
  },
  tierRules: {
    select: ['cr380_tierruleid', '_cr380_tierid_value', '_cr380_sku_value'],
    filter: `${ACTIVE} and cr380_isenabled eq false`,
  },
  exceptions: {
    select: [
      'cr380_assortmentexceptionid',
      'cr380_exceptionlevel',
      'cr380_exceptionaction',
      '_cr380_doorid_value',
      '_cr380_skuid_value',
      'cr380_distributornamecode',
      'cr380_reason',
    ],
    filter: `${ACTIVE} and cr380_exceptionstatus eq ${EXCEPTION_STATUS_ACTIVE}`,
  },
} as const;

// Dataverse returns null for empty values; records model them as absent.
const present = <T>(value: T | null | undefined): T | undefined =>
  value === null || value === '' ? undefined : value;

const options = (source: { select: readonly string[]; filter: string }) => ({
  select: [...source.select],
  filter: source.filter,
});

const LEVELS = new Map<number, ExceptionRecord['level']>([
  [EXCEPTION_LEVEL_DOOR, 'door'],
  [EXCEPTION_LEVEL_RETAILER, 'retailer'],
]);
const ACTIONS = new Map<number, ExceptionRecord['action']>([
  [EXCEPTION_ACTION_ADD, 'add'],
  [EXCEPTION_ACTION_REMOVE, 'remove'],
]);
const SKU_TYPES = new Map<number, SkuType>([
  [SKU_TYPE_RETAIL, 'retail'],
  [SKU_TYPE_SPM, 'spm'],
]);

export async function loadDoorRecords(): Promise<DoorRecord[]> {
  const rows = await fetchAllPages(
    'doors',
    (o) => Cr380_doorsService.getAll(o),
    options(RECORD_SOURCES.doors),
  );
  return rows.map((row) => ({
    id: row.cr380_doorid,
    name: row.cr380_doorname ?? '',
    doorKey: present(row.cr380_doorkey),
    shipTo: present(row.cr380_sapshipto),
    soldTo: present(row.cr380_sapsoldto),
    distributorName: present(row.cr380_distributorname),
    distributorNameCode: present(row.cr380_distributornamecode),
    onlineOffline: present(row.cr380_dooronlineoffline),
    doorType: present(row.cr380_doortype),
    productLine: present(row.cr380_productline),
    salesChannel: present(row.cr380_saleschannel),
    status: present(row.cr380_doorstatus),
    openingDate: present(row.cr380_openingdate),
    tierId: present(row._cr380_tierid_value),
    modifiedOn: present(row.modifiedon),
    modifiedByName: present(
      (row as unknown as Record<string, unknown>)[MODIFIED_BY_NAME] as string | undefined,
    ),
  }));
}

/** OData annotation carrying a lookup's display name. */
export const MODIFIED_BY_NAME = '_modifiedby_value@OData.Community.Display.V1.FormattedValue';

export async function loadTierRecords(): Promise<TierRecord[]> {
  const rows = await fetchAllPages(
    'tiers',
    (o) => Cr380_tiersService.getAll(o),
    options(RECORD_SOURCES.tiers),
  );
  return rows.map((row) => ({
    id: row.cr380_tierid,
    name: row.cr380_tiername ?? '',
    rank: present(row.cr380_rank),
    active: Number(row.cr380_tierstatus) === TIER_STATUS_ACTIVE,
    description: present(row.cr380_description),
  }));
}

export async function loadSkuRecords(): Promise<SkuRecord[]> {
  const rows = await fetchAllPages(
    'SKUs',
    (o) => Cr380_skusService.getAll(o),
    options(RECORD_SOURCES.skus),
  );
  return rows.map((row) => ({
    id: row.cr380_skuid,
    key: present(row.cr380_skukey),
    name: present(row.cr380_skuname),
    axis: present(row.cr380_axis),
    franchise: present(row.cr380_franchise),
    line: present(row.cr380_line),
    type: SKU_TYPES.get(Number(row.cr380_skutype)),
    barcode: present(row.cr380_barcode),
    masterProductName: present(row.cr380_masterproductname),
    masterProductBaseline: present(row.cr380_masterproductbaseline),
    masterFranchise: present(row.cr380_masterfranchise),
    masterCategory: present(row.cr380_productmastercategory),
    category: present(row.cr380_productcategory),
    subcategory: present(row.cr380_productsubcategory),
    lastSeenInSunrise: present(row.cr380_lastseeninsunrise),
  }));
}

export async function loadTierRuleRecords(): Promise<TierRuleRecord[]> {
  const rows = await fetchAllPages(
    'tier rules',
    (o) => Cr380_tierrulesService.getAll(o),
    options(RECORD_SOURCES.tierRules),
  );
  return rows.map((row) => ({
    id: row.cr380_tierruleid,
    tierId: row._cr380_tierid_value ?? '',
    skuId: row._cr380_sku_value ?? '',
  }));
}

export async function loadExceptionRecords(): Promise<ExceptionRecord[]> {
  const rows = await fetchAllPages(
    'assortment exceptions',
    (o) => Cr380_assortmentexceptionsService.getAll(o),
    options(RECORD_SOURCES.exceptions),
  );
  return rows.map(mapExceptionRow);
}

export function mapExceptionRow(row: {
  cr380_assortmentexceptionid: string;
  cr380_exceptionlevel?: unknown;
  cr380_exceptionaction?: unknown;
  _cr380_doorid_value?: string | null;
  _cr380_skuid_value?: string | null;
  cr380_distributornamecode?: string | null;
  cr380_reason?: string | null;
}): ExceptionRecord {
  return {
    id: row.cr380_assortmentexceptionid,
    level: LEVELS.get(Number(row.cr380_exceptionlevel)),
    action: ACTIONS.get(Number(row.cr380_exceptionaction)),
    doorId: present(row._cr380_doorid_value),
    skuId: present(row._cr380_skuid_value),
    distributorNameCode: present(row.cr380_distributornamecode),
    reason: present(row.cr380_reason),
  };
}

// All-or-nothing: the first failing table rejects so no partial data reaches the screens.
export async function loadAssortmentRecords(): Promise<AssortmentRecords> {
  const [doors, tiers, skus, tierRules, exceptions] = await Promise.all([
    loadDoorRecords(),
    loadTierRecords(),
    loadSkuRecords(),
    loadTierRuleRecords(),
    loadExceptionRecords(),
  ]);
  return { doors, tiers, skus, tierRules, exceptions };
}
