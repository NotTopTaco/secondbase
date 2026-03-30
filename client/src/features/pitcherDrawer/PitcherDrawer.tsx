import { useEffect } from 'react';
import { useReviewStore, type GamePitcherEntry } from '../../stores/reviewStore';
import { PlayerPhoto } from '../../components/ui/PlayerPhoto';
import { PitcherGameSummary } from './PitcherGameSummary';
import styles from './PitcherDrawer.module.css';

function PitcherRow({ pitcher, isActive, onClick }: {
  pitcher: GamePitcherEntry;
  isActive: boolean;
  onClick: () => void;
}) {
  const ip = pitcher.inningsStart === pitcher.inningsEnd
    ? `${pitcher.inningsStart}`
    : `${pitcher.inningsStart}–${pitcher.inningsEnd}`;

  return (
    <button
      className={`${styles.pitcherRow} ${isActive ? styles.pitcherRowActive : ''} ${pitcher.isCurrentPitcher ? styles.pitcherRowCurrent : ''}`}
      onClick={onClick}
      type="button"
    >
      <PlayerPhoto playerId={pitcher.id} size={28} />
      <div className={styles.pitcherInfo}>
        <div className={styles.pitcherName}>{pitcher.name}</div>
        <div className={styles.pitcherMeta}>
          <span className={styles.pitcherStat}>{pitcher.pitchCount}P</span>
          <span className={styles.pitcherStat}>IP {ip}</span>
          <span className={styles.pitcherStat}>{pitcher.strikeouts}K</span>
          <span className={styles.pitcherStat}>{pitcher.walks}BB</span>
          <span className={styles.pitcherStat}>{pitcher.hitsAllowed}H</span>
        </div>
      </div>
      {pitcher.isCurrentPitcher && (
        <span className={styles.currentBadge}>Now</span>
      )}
    </button>
  );
}

export function PitcherDrawer() {
  const isOpen = useReviewStore((s) => s.isDrawerOpen);
  const drawerPitcherId = useReviewStore((s) => s.drawerPitcherId);
  const gamePitchers = useReviewStore((s) => s.gamePitchers);
  const openDrawer = useReviewStore((s) => s.openDrawer);
  const closeDrawer = useReviewStore((s) => s.closeDrawer);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, closeDrawer]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={closeDrawer} />
      <div className={styles.drawer}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>Game Pitchers</span>
          <button
            className={styles.closeBtn}
            onClick={closeDrawer}
            type="button"
            aria-label="Close drawer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.pitcherList}>
          {gamePitchers.map((p) => (
            <PitcherRow
              key={p.id}
              pitcher={p}
              isActive={drawerPitcherId === p.id}
              onClick={() => openDrawer(p.id)}
            />
          ))}
        </div>

        {drawerPitcherId && (
          <div className={styles.summaryArea}>
            <PitcherGameSummary />
          </div>
        )}
      </div>
    </div>
  );
}
