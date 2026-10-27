import { Button, Input, Select } from 'antd';
import { FilterOutlined, SearchOutlined } from '@ant-design/icons';
import {
  hasFilters,
  moreFilterCount,
  type DoorFilterOptions,
  type DoorQuery,
} from '../../lib/doors';
import type { DoorsQueryApi } from './useDoorsQuery';
import styles from './DoorsFilters.module.css';

export interface DoorsFiltersProps extends Omit<DoorsQueryApi, 'query'> {
  query: DoorQuery;
  options: DoorFilterOptions;
}

type SingleKey = 'oo' | 'dt' | 'pl' | 'st';

const MORE: { key: SingleKey; label: string; option: keyof DoorFilterOptions; width: string }[] = [
  { key: 'oo', label: 'Online / offline', option: 'onlineOffline', width: styles.medium },
  { key: 'dt', label: 'Door type', option: 'doorTypes', width: styles.narrow },
  { key: 'pl', label: 'Product line', option: 'productLines', width: styles.wide },
  { key: 'st', label: 'Door status', option: 'statuses', width: styles.default },
];

/** Search, primary filters and "More filters" (prototype Doors filter row; FR-003–FR-005, FR-010). */
export function DoorsFilters({ query, options, update, setMore, clear }: DoorsFiltersProps) {
  const moreCount = moreFilterCount(query);
  const moreLabel = `${query.more ? 'Fewer filters' : 'More filters'}${moreCount ? ` (${moreCount})` : ''}`;

  return (
    <div role="search" aria-label="Filter doors" className={styles.row} data-testid="doors-filters">
      <Input
        className={`${styles.control} ${styles.search}`}
        value={query.q}
        onChange={(e) => update({ q: e.target.value })}
        placeholder="Search door name, Door key or SAP Ship To"
        aria-label="Search door name, Door key or SAP Ship To"
        allowClear
        prefix={<SearchOutlined aria-hidden />}
        data-testid="doors-search"
      />
      <Select
        className={`${styles.control} ${styles.wide}`}
        mode="multiple"
        maxTagCount="responsive"
        allowClear
        placeholder="Distributor name"
        aria-label="Distributor name"
        value={query.dist}
        options={options.distributors}
        onChange={(dist: string[]) => update({ dist })}
        popupMatchSelectWidth={false}
        data-testid="filter-distributor"
      />
      <Select
        className={`${styles.control} ${styles.tier}`}
        mode="multiple"
        maxTagCount="responsive"
        allowClear
        placeholder="Tier"
        aria-label="Tier"
        value={query.tier}
        options={options.tiers}
        onChange={(tier: string[]) => update({ tier })}
        popupMatchSelectWidth={false}
        data-testid="filter-tier"
      />
      <Button
        icon={<FilterOutlined aria-hidden />}
        aria-expanded={query.more}
        onClick={() => setMore(!query.more)}
        data-testid="doors-more-filters"
      >
        {moreLabel}
      </Button>
      {query.more
        ? MORE.map(({ key, label, option, width }) => (
            <Select
              key={key}
              className={`${styles.control} ${width}`}
              allowClear
              placeholder={label}
              aria-label={label}
              value={query[key]}
              options={options[option] as { value: string; label: string }[]}
              onChange={(value?: string) => update({ [key]: value })}
              popupMatchSelectWidth={false}
              data-testid={`filter-${key}`}
            />
          ))
        : null}
      {hasFilters(query) ? (
        <Button type="link" onClick={clear} data-testid="doors-clear-filters">
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
