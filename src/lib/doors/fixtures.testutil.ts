import { buildAssortmentData, type AssortmentData, type AssortmentRecords } from '../data';
import type { DoorRow } from './doorRows';

/** Small deterministic dataset for unit tests across lib/doors and the doors features. */
export const TEST_RECORDS: AssortmentRecords = {
  tiers: [
    { id: 'T1', name: 'Access', rank: 1, active: true },
    { id: 'T2', name: 'Premium', rank: 2, active: true },
    { id: 'T3', name: 'Expertise', rank: 3, active: true },
  ],
  skus: [
    {
      id: 'S1',
      key: '100001',
      name: 'N°5 EDP',
      axis: 'Fragrance',
      franchise: 'N°5',
      line: 'L1',
      type: 'retail',
    },
    {
      id: 'S2',
      key: '100002',
      name: 'Coco EDT',
      axis: 'Fragrance',
      franchise: 'Coco',
      line: 'L1',
      type: 'spm',
    },
    {
      id: 'S3',
      key: '100003',
      name: 'Rouge',
      axis: 'Makeup',
      franchise: 'Coco',
      line: 'L2',
      type: 'retail',
    },
    {
      id: 'S4',
      key: '100004',
      name: 'Sublimage',
      axis: 'Skincare',
      franchise: 'Sublimage',
      line: 'L3',
    },
    {
      id: 'S5',
      key: '100005',
      name: 'Chance',
      axis: 'Fragrance',
      franchise: 'Chance',
      line: 'L2',
      type: 'retail',
    },
  ],
  tierRules: [
    { id: 'R1', tierId: 'T1', skuId: 'S1' },
    { id: 'R2', tierId: 'T2', skuId: 'S1' },
    { id: 'R3', tierId: 'T2', skuId: 'S2' },
    { id: 'R4', tierId: 'T2', skuId: 'S3' },
    { id: 'R5', tierId: 'T3', skuId: 'S1' },
    { id: 'R6', tierId: 'T3', skuId: 'S2' },
    { id: 'R7', tierId: 'T3', skuId: 'S5' },
  ],
  doors: [
    {
      id: 'D1',
      name: 'Alpha Store',
      doorKey: 'US1001',
      shipTo: '0040001',
      distributorName: "Macy's",
      distributorNameCode: 'MAC',
      onlineOffline: 'Offline',
      doorType: 'Department store',
      productLine: 'Fragrance',
      salesChannel: 'Wholesale',
      status: 'Open',
      openingDate: '2019-01-01',
      tierId: 'T1',
      modifiedOn: '2026-09-01T10:00:00Z',
      modifiedByName: 'Jane Doe',
    },
    {
      id: 'D2',
      name: 'Bravo Store',
      doorKey: 'US1002',
      shipTo: '0040002',
      distributorName: 'Nordstrom',
      distributorNameCode: 'NOR',
      onlineOffline: 'Online',
      doorType: 'Specialty',
      productLine: 'Makeup',
      salesChannel: 'Wholesale',
      status: 'Pre-Trade',
      openingDate: '2026-09-01',
    },
    {
      id: 'D3',
      name: 'Charlie Store',
      doorKey: 'US1003',
      shipTo: '0040003',
      distributorName: "Macy's",
      distributorNameCode: 'MAC',
      onlineOffline: 'Offline',
      doorType: 'Specialty',
      productLine: 'Fragrance',
      salesChannel: 'Travel retail',
      status: 'Closed',
      tierId: 'T2',
    },
    {
      id: 'D4',
      name: 'Delta Store',
      doorKey: 'US1004',
      shipTo: '0040004',
      distributorName: 'Nordstrom',
      distributorNameCode: 'NOR',
      onlineOffline: 'Offline',
      doorType: 'Department store',
      productLine: 'Fragrance',
      salesChannel: 'Wholesale',
      status: 'Project (MTP)',
      openingDate: '2026-07-01',
      tierId: 'T2',
    },
    { id: 'D5', name: 'Echo Store', doorKey: 'US1005', status: 'Cancelled' },
  ],
  exceptions: [
    { id: 'E1', level: 'door', action: 'add', doorId: 'D1', skuId: 'S2' },
    { id: 'E2', level: 'door', action: 'remove', doorId: 'D4', skuId: 'S2' },
    { id: 'E3', level: 'retailer', action: 'add', distributorNameCode: 'NOR', skuId: 'S5' },
  ],
};

export const TEST_TODAY = new Date(2026, 8, 23);

export function makeData(records: AssortmentRecords = TEST_RECORDS, version = 1): AssortmentData {
  return buildAssortmentData(structuredClone(records), version);
}

export function makeRow(partial: Partial<DoorRow> = {}): DoorRow {
  return {
    id: 'X',
    name: 'X',
    statusCategory: 'open',
    statusTone: 'success',
    isClosed: false,
    exceptionCount: 0,
    searchKey: 'x',
    lastChangedLabel: '—',
    ...partial,
  };
}
