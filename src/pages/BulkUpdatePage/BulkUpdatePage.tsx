import { useState } from 'react';
import { ScreenRegion } from '../../components/ScreenRegion';
import { ScreenScaffold } from '../../components/ScreenScaffold';
import { BulkUpdateWorkflow } from '../../features/bulk-update';
import { useAssortmentData } from '../../lib/data';
import { screenById } from '../../lib/screens';
import { doorsPath, useLastDoorsSearch } from '../../lib/session';

export default function BulkUpdatePage() {
  const { status, data, refetch } = useAssortmentData();
  const search = useLastDoorsSearch();
  const [done, setDone] = useState(false);

  return (
    <ScreenScaffold
      screen={screenById('bulk-update')}
      breadcrumb={[{ label: 'Doors', to: doorsPath(search) }]}
      description={
        done
          ? 'Update applied. Follow its progress below; you can undo it from here.'
          : 'Change many doors at once. You see every row checked and the impact per door before anything is saved.'
      }
    >
      {status === 'success' && data ? (
        <BulkUpdateWorkflow data={data} onDoneChange={setDone} />
      ) : (
        <ScreenRegion
          label="Bulk Update"
          state={status === 'error' ? 'error' : 'loading'}
          onRetry={refetch}
          description={
            status === 'error' ? 'Doors could not be loaded. Nothing was changed.' : undefined
          }
          testId="bulk-region"
        />
      )}
    </ScreenScaffold>
  );
}
