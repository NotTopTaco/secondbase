import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import styles from './Tooltip.module.css';

interface TooltipProps {
  visible: boolean;
  x: number;
  y: number;
  children: ReactNode;
}

export function Tooltip({ visible, x, y, children }: TooltipProps) {
  if (!visible) return null;

  return createPortal(
    <div
      className={styles.tooltip}
      style={{ left: x, top: y }}
    >
      {children}
    </div>,
    document.body,
  );
}
