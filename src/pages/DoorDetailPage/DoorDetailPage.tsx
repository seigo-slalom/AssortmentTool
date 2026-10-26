import { ScreenScaffold } from '../../components/ScreenScaffold';
import { screenById } from '../../lib/screens';

// Content arrives with the Door detail spec; this screen shows the prototype header and a labeled placeholder.
export default function DoorDetailPage() {
  return <ScreenScaffold screen={screenById('door-detail')} />;
}
