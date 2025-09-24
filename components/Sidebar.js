import Link from 'next/link';
import styles from '../styles/Sidebar.module.css';

export default function Sidebar() {
  return (
    <div className={styles.sidebar}>
      <h2>Studio Hawk</h2>
      <nav>
        <ul>
          <li><Link href="/">Dashboard</Link></li>
          <li><Link href="/client-directory">Client Directory</Link></li>
          <li><Link href="/trend-assistant">Trend Assistant</Link></li>
          <li><Link href="/ideation-assistant">Ideation Assistant</Link></li>
          <li><Link href="/headline-assistant">Headline Assistant</Link></li>
          <li><Link href="/pr-writing-assistant">PR Writing Assistant</Link></li>
          <li><Link href="/alerts">Alerts</Link></li>
          <li><Link href="/settings">Settings</Link></li>
        </ul>
      </nav>
    </div>
  );
}