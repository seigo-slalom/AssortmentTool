import { Link } from 'react-router-dom';
import { Typography } from 'antd';
import { ScreenScaffold } from '../../components/ScreenScaffold';
import { screenById } from '../../lib/screens';
import styles from './NotFoundPage.module.css';

/** Any unknown address, including excluded prototype screens, lands here inside the shell. */
export default function NotFoundPage() {
  return (
    <ScreenScaffold screen={screenById('not-found')}>
      <section aria-label="Page not found" className={`cds-state ${styles.state}`}>
        <Typography.Paragraph type="secondary" className={styles.text}>
          This address is not part of the Assortment tool.
        </Typography.Paragraph>
        <Link to="/">Go to Overview</Link>
      </section>
    </ScreenScaffold>
  );
}
