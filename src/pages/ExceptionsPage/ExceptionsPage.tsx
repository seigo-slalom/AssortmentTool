import { ScreenScaffold } from '../../components/ScreenScaffold';
import { screenById } from '../../lib/screens';

// Content arrives with the Exceptions spec; this screen shows the prototype header and a labeled placeholder.
export default function ExceptionsPage() {
  return <ScreenScaffold screen={screenById('exceptions')} />;
}
