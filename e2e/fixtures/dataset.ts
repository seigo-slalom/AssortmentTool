// Deterministic Dataverse-shaped rows for `vite --mode e2e` (specs/003-doors-screen/research.md
// R16). Property names match the generated models so the real services and mappers run
// unchanged against the in-memory stub. Nothing here is random.

export const FIXTURE_TODAY = '2026-09-23';

const TIER = 'cr380_tiers';
const SKU = 'cr380_skus';
const RULE = 'cr380_tierrules';
const DOOR = 'cr380_doors';
const EXC = 'cr380_assortmentexceptions';

export type Row = Record<string, unknown>;

const ACTIVE = 0;
const TIER_STATUS_ACTIVE = 860080000;
const SKU_RETAIL = 860080000;
const SKU_SPM = 860080001;
const LEVEL_DOOR = 860080000;
const LEVEL_RETAILER = 860080001;
const ACTION_ADD = 860080000;
const ACTION_REMOVE = 860080001;
const STATUS_ACTIVE = 860080000;
const STATUS_CANCELLED = 860080001;

const pad = (n: number, width: number) => String(n).padStart(width, '0');

export const TIER_NAMES = ['Access', 'Premium', 'Expertise', 'Prestige'] as const;

const tiers: Row[] = TIER_NAMES.map((name, i) => ({
  cr380_tierid: `T-${i + 1}`,
  cr380_tiername: name,
  cr380_rank: i + 1,
  cr380_description: `${name} doors`,
  cr380_tierstatus: TIER_STATUS_ACTIVE,
  statecode: ACTIVE,
}));

const AXES = ['Fragrance', 'Makeup', 'Skincare'] as const;
const FRANCHISES = ['N°5', 'Coco', 'Sublimage'] as const;

const skus: Row[] = Array.from({ length: 60 }, (_, i) => {
  const axis = AXES[i % 3];
  const franchise = FRANCHISES[Math.floor(i / 20)];
  const key = String(100001 + i);
  return {
    cr380_skuid: `S-${pad(i + 1, 3)}`,
    cr380_skukey: key,
    cr380_skuname: `${franchise} ${axis} ${key}`,
    cr380_axis: axis,
    cr380_franchise: franchise,
    cr380_line: `L${(i % 3) + 1}`,
    cr380_skutype: i % 2 === 0 ? SKU_RETAIL : SKU_SPM,
    cr380_barcode: `3145891${key}`,
    cr380_masterproductname: `${franchise} ${axis}`,
    cr380_masterproductbaseline: franchise,
    cr380_masterfranchise: franchise,
    cr380_productmastercategory: axis,
    cr380_productcategory: axis,
    cr380_productsubcategory: `${axis} ${(i % 3) + 1}`,
    cr380_lastseeninsunrise: '2026-09-23T06:15:00Z',
    cr380_isactive: true,
    statecode: ACTIVE,
  };
});

// Tier k (1-based) carries the first 15·k SKUs, so higher tiers are supersets.
const tierRules: Row[] = [];
TIER_NAMES.forEach((_, t) => {
  for (let i = 0; i < 15 * (t + 1); i += 1) {
    tierRules.push({
      cr380_tierruleid: `R-${t + 1}-${pad(i + 1, 3)}`,
      _cr380_tierid_value: `T-${t + 1}`,
      _cr380_sku_value: `S-${pad(i + 1, 3)}`,
      cr380_isenabled: true,
      statecode: ACTIVE,
    });
  }
});

export const DISTRIBUTORS = [
  { name: "Macy's", code: 'MAC' },
  { name: 'Nordstrom', code: 'NOR' },
  { name: 'Saks Fifth Avenue', code: 'SAK' },
  { name: "Bloomingdale's", code: 'BLO' },
  { name: "Dillard's", code: 'DIL' },
  { name: 'Neiman Marcus', code: 'NEI' },
] as const;

const CITIES = ['Atlanta', 'Boston', 'Chicago', 'Dallas', 'Denver', 'Houston', 'Miami', 'Phoenix'];

const dayOffset = (days: number) => {
  const d = new Date(`${FIXTURE_TODAY}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
};

const statusFor = (i: number) => {
  const m = i % 12;
  if (m === 0) return 'Closed';
  if (m === 6) return 'Cancelled';
  if (m === 3) return 'Pre-Trade';
  if (m === 9) return 'Project (MTP)';
  return 'Open';
};

const openingFor = (i: number) => {
  if (i >= 2 && i <= 7) return dayOffset(i * 10);
  if (i === 8) return dayOffset(90);
  if (i === 9) return dayOffset(91);
  if (i === 10) return null;
  return '2019-03-15';
};

const doors: Row[] = Array.from({ length: 120 }, (_, k) => {
  const i = k + 1;
  const dist = DISTRIBUTORS[i % DISTRIBUTORS.length];
  const tierIndex = i % 10 === 1 ? null : (i % 4) + 1;
  return {
    cr380_doorid: `D-${pad(i, 3)}`,
    cr380_doorname: `${dist.name} ${CITIES[i % CITIES.length]} ${pad(i, 3)}`,
    cr380_doorkey: `US${1000 + i}`,
    cr380_sapshipto: `0040${pad(i, 4)}`,
    cr380_sapsoldto: `0030${pad(i % 6, 4)}`,
    cr380_distributorname: dist.name,
    cr380_distributornamecode: dist.code,
    cr380_dooronlineoffline: i % 4 === 0 ? 'Online' : 'Offline',
    cr380_doortype: i % 2 === 0 ? 'Department store' : 'Specialty',
    cr380_productline: AXES[i % 3],
    cr380_saleschannel: i % 5 === 0 ? 'Travel retail' : 'Wholesale',
    cr380_doorstatus: statusFor(i),
    cr380_openingdate: openingFor(i),
    _cr380_tierid_value: tierIndex ? `T-${tierIndex}` : null,
    modifiedon: `2026-09-${pad((i % 20) + 1, 2)}T10:00:00Z`,
    _modifiedby_value: i % 2 === 0 ? 'U-1' : 'U-2',
    '_modifiedby_value@OData.Community.Display.V1.FormattedValue':
      i % 2 === 0 ? 'Jane Doe' : 'Sam Lee',
    statecode: ACTIVE,
  };
});

// Door-level exceptions on doors 2..21 (alternating Add/Remove, three cancelled) plus three
// retailer-level ones.
const exceptions: Row[] = [];
for (let i = 2; i <= 21; i += 1) {
  const add = i % 2 === 0;
  exceptions.push({
    cr380_assortmentexceptionid: `E-${pad(i, 3)}`,
    cr380_exceptionlevel: LEVEL_DOOR,
    cr380_exceptionaction: add ? ACTION_ADD : ACTION_REMOVE,
    cr380_exceptionstatus: i % 7 === 0 ? STATUS_CANCELLED : STATUS_ACTIVE,
    _cr380_doorid_value: `D-${pad(i, 3)}`,
    _cr380_skuid_value: `S-${pad(add ? 59 : 1, 3)}`,
    cr380_reason: add ? 'Retailer agreement' : 'Fixture constraint',
    statecode: ACTIVE,
  });
}
DISTRIBUTORS.slice(0, 3).forEach((d, i) => {
  exceptions.push({
    cr380_assortmentexceptionid: `E-R${i + 1}`,
    cr380_exceptionlevel: LEVEL_RETAILER,
    cr380_exceptionaction: ACTION_ADD,
    cr380_exceptionstatus: STATUS_ACTIVE,
    cr380_distributornamecode: d.code,
    _cr380_skuid_value: `S-${pad(58 - i, 3)}`,
    cr380_reason: 'Retailer agreement',
    statecode: ACTIVE,
  });
});

export function createDataset(): Record<string, Row[]> {
  return structuredClone({
    [TIER]: tiers,
    [SKU]: skus,
    [RULE]: tierRules,
    [DOOR]: doors,
    [EXC]: exceptions,
  });
}

// Expected counts the E2E suites assert, computed independently of the app's logic.
const isClosed = (d: Row) => d.cr380_doorstatus === 'Closed' || d.cr380_doorstatus === 'Cancelled';
const open = doors.filter((d) => !isClosed(d));
const within90 = (d: Row) =>
  typeof d.cr380_openingdate === 'string' &&
  d.cr380_openingdate >= dayOffset(90) &&
  d.cr380_openingdate <= FIXTURE_TODAY;

export const EXPECTED = {
  open: open.length,
  needsTier: open.filter((d) => !d._cr380_tierid_value).length,
  fragranceOnly: open.filter((d) => d.cr380_productline === 'Fragrance').length,
  recent: open.filter(within90).length,
  closed: doors.length - open.length,
  byDistributor: Object.fromEntries(
    DISTRIBUTORS.map((d) => [
      d.name,
      open.filter((x) => x.cr380_distributorname === d.name).length,
    ]),
  ) as Record<string, number>,
} as const;
