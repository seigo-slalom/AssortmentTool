import { ScreenScaffold } from '../../components/ScreenScaffold';
import { screenById } from '../../lib/screens';
import { doorsPath, useLastDoorsSearch } from '../../lib/session';

// Content arrives with the Door detail spec; this screen shows the prototype header and a labeled placeholder.
// The breadcrumb returns to Doors with the filters that were active when the door was opened.
export default function DoorDetailPage() {
  const search = useLastDoorsSearch();
  return (
    <ScreenScaffold
      screen={screenById('door-detail')}
      breadcrumb={[{ label: 'Doors', to: doorsPath(search) }]}
    />
  );
}
