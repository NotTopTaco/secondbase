import type { ReactNode } from 'react';
import styles from './TwoColumnLayout.module.css';

interface TwoColumnLayoutProps {
  left: ReactNode;
  right: ReactNode;
  leftTitle?: string;
  rightTitle?: string;
}

export function TwoColumnLayout({
  left,
  right,
  leftTitle,
  rightTitle,
}: TwoColumnLayoutProps) {
  return (
    <div className={styles.grid}>
      <div className={styles.column}>
        {leftTitle && <h4 className={styles.columnTitle}>{leftTitle}</h4>}
        {left}
      </div>
      <div className={styles.column}>
        {rightTitle && <h4 className={styles.columnTitle}>{rightTitle}</h4>}
        {right}
      </div>
    </div>
  );
}
