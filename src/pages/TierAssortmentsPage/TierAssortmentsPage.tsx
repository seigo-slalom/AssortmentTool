import { ScreenScaffold } from '../../components/ScreenScaffold';
import { screenById } from '../../lib/screens';

// Content arrives with the Tier assortments spec; this screen shows the prototype header and a labeled placeholder.
export default function TierAssortmentsPage() {
  return <ScreenScaffold screen={screenById('tier-assortments')} />;
}
