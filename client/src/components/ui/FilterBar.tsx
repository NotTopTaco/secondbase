import type { ReactNode } from 'react';
import styles from './FilterBar.module.css';

interface FilterBarProps {
  children: ReactNode;
}

export function FilterBar({ children }: FilterBarProps) {
  return <div className={styles.filterBar}>{children}</div>;
}
