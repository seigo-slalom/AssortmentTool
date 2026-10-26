import { ScreenScaffold } from '../../components/ScreenScaffold';
import { screenById } from '../../lib/screens';

// Content arrives with the Overview spec; this screen shows the prototype header and a labeled placeholder.
export default function OverviewPage() {
  return <ScreenScaffold screen={screenById('overview')} />;
}
