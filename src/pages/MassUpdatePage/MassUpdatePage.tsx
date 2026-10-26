import { ScreenScaffold } from '../../components/ScreenScaffold';
import { screenById } from '../../lib/screens';

// Content arrives with the Mass update spec; this screen shows the prototype header and a labeled placeholder.
export default function MassUpdatePage() {
  return <ScreenScaffold screen={screenById('mass-update')} />;
}
