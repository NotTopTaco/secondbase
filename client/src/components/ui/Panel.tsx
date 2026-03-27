import type { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlayerPhoto } from './PlayerPhoto';
import styles from './Panel.module.css';

export interface PanelPlayer {
  id: number;
  name: string;
}

interface PanelProps {
  id: string;
  title: string;
  children: ReactNode;
  collapsed: boolean;
  onToggleCollapse: () => void;
  sortable?: boolean;
  players?: PanelPlayer[];
}

export function Panel({
  id,
  title,
  children,
  collapsed,
  onToggleCollapse,
  sortable = false,
  players,
}: PanelProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !sortable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.panel} ${collapsed ? styles.collapsed : ''}`}
    >
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {sortable && (
            <div className={styles.dragHandle} {...attributes} {...listeners}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="5" cy="3" r="1.5" />
                <circle cx="11" cy="3" r="1.5" />
                <circle cx="5" cy="8" r="1.5" />
                <circle cx="11" cy="8" r="1.5" />
                <circle cx="5" cy="13" r="1.5" />
                <circle cx="11" cy="13" r="1.5" />
              </svg>
            </div>
          )}
          <span className={styles.title}>{title}</span>
          {players && players.length > 0 && (
            <div className={styles.playerTags}>
              {players.map((p) => (
                <div key={p.id} className={styles.playerTag}>
                  <PlayerPhoto playerId={p.id} size={18} />
                  <span className={styles.playerName}>{p.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          className={styles.collapseBtn}
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {collapsed ? '+' : '\u2212'}
        </button>
      </div>
      {!collapsed && <div className={styles.body}>{children}</div>}
    </div>
  );
}
