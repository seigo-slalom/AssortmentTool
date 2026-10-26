import { ScreenScaffold } from '../../components/ScreenScaffold';
import { screenById } from '../../lib/screens';

// Content arrives with the Doors spec; this screen shows the prototype header and a labeled placeholder.
export default function DoorsPage() {
  return <ScreenScaffold screen={screenById('doors')} />;
}
