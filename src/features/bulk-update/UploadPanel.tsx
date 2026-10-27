import { useState } from 'react';
import { Alert, Button, Upload } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { DataGrid } from '../../components/DataGrid';
import { StatusIndicator } from '../../components/StatusIndicator';
import type { AssortmentData } from '../../lib/data';
import { readUpload } from '../../lib/excel';
import { plural } from '../../lib/format';
import { BULK_LIMITS } from './bulkReducer';
import { rowsFromTable } from './rawRows';
import { downloadTemplate, REQUIRED_HEADERS, templateColumns } from './templates';
import type { ChangeType, UploadedFile } from './types';
import styles from './BulkUpdate.module.css';

export interface UploadPanelProps {
  type: ChangeType;
  data: AssortmentData;
  upload?: UploadedFile;
  onUpload: (upload?: UploadedFile) => void;
}

const LIMIT_TEXT: Record<ChangeType, string> = {
  tier: 'one row per door, up to 2,500 rows',
  sku: 'one row per door and SKU, up to 5,000 rows',
};

const TEMPLATE_NOTE: Record<ChangeType, string> = {
  tier: 'One row per door. The .xlsx template has these columns, a dropdown for each allowed value and a Rules tab.',
  sku: 'One row per door and SKU, up to 5,000 rows. The .xlsx template has these columns, dropdowns and a Rules tab.',
};

/** Template download and file upload (FR-039). Nothing is saved until Apply. */
export function UploadPanel({ type, data, upload, onUpload }: UploadPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const columns = templateColumns(type, data).map((c) => ({ ...c, key: c.col }));

  const read = async (file: File) => {
    setReading(true);
    setError(null);
    const result = await readUpload(file, {
      maxRows: BULK_LIMITS[type],
      requiredHeaders: REQUIRED_HEADERS[type],
    });
    setReading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onUpload({ fileName: file.name, rows: rowsFromTable(result.table.rows, type) });
  };

  return (
    <div className={styles.twoColumns}>
      <div className={`${styles.subPanel} ${styles.canvas}`}>
        <span>1 · Download the {type === 'tier' ? 're-tier' : 'SKU exception'} template</span>
        <span className={styles.muted}>{TEMPLATE_NOTE[type]}</span>
        <DataGrid
          rowKey="key"
          zebra={false}
          dataSource={columns}
          columns={[
            { key: 'col', title: 'Column', dataIndex: 'col', width: 'column-template-column' },
            {
              key: 'req',
              title: 'Required',
              width: 'narrow',
              render: (_, c) => (c.required ? 'Required' : 'Optional'),
            },
            { key: 'rule', title: 'Rule', dataIndex: 'rule', truncate: false },
          ]}
          testId="bulk-template-columns"
        />
        <div>
          <Button
            icon={<DownloadOutlined aria-hidden />}
            onClick={() => void downloadTemplate(type, data)}
          >
            Download template
          </Button>
        </div>
      </div>
      <div className={styles.subPanel}>
        <span>2 · Upload the completed file</span>
        {upload ? (
          <>
            <div className={`${styles.row} ${styles.notice}`}>
              <StatusIndicator
                tone="success"
                label={`${upload.fileName} · ${plural(upload.rows.length, 'row', 'rows')} read`}
              />
              <Button type="link" onClick={() => onUpload(undefined)}>
                Replace file
              </Button>
            </div>
            <span className={styles.muted}>
              Every row is checked in the next step. Nothing is saved yet.
            </span>
          </>
        ) : (
          <>
            <Upload.Dragger
              accept=".xlsx,.csv"
              multiple={false}
              showUploadList={false}
              disabled={reading}
              beforeUpload={(file) => {
                void read(file);
                return Upload.LIST_IGNORE;
              }}
              data-testid="bulk-upload"
            >
              <div className={styles.dragger}>
                <span>Drop the file here or click to browse</span>
                <span className={styles.muted}>.xlsx or .csv · {LIMIT_TEXT[type]}</span>
              </div>
            </Upload.Dragger>
            {error ? <Alert type="error" showIcon title={error} /> : null}
          </>
        )}
      </div>
    </div>
  );
}
