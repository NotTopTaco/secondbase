import { createContext, useContext, type ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlayerPhoto } from './PlayerPhoto';
import { usePanelStore, TAB_ASSIGNMENTS } from '../../stores/panelStore';
import styles from './Panel.module.css';

export const PanelLayoutContext = createContext({ sortable: true });

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
  sortable: _sortableProp = false,
  players,
}: PanelProps) {
  const { sortable: contextSortable } = useContext(PanelLayoutContext);
  const isPinnable = id in TAB_ASSIGNMENTS;
  const isPinned = usePanelStore((s) => s.pinnedPanelIds.includes(id));
  const togglePin = usePanelStore((s) => s.togglePin);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !contextSortable });

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
          {contextSortable && (
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
        <div className={styles.headerRight}>
          {isPinnable && (
            <button
              className={`${styles.pinBtn} ${isPinned ? styles.pinActive : ''}`}
              onClick={() => togglePin(id)}
              aria-label={isPinned ? 'Unpin panel' : 'Pin panel'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3 9h7l-5.5 4 2 9L12 18.5 5.5 24l2-9L2 11h7z" />
              </svg>
            </button>
          )}
          <button
            className={styles.collapseBtn}
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {collapsed ? '+' : '\u2212'}
          </button>
        </div>
      </div>
      {!collapsed && <div className={styles.body}>{children}</div>}
    </div>
  );
}
