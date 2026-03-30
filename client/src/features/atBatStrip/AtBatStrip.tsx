import { useEffect, useRef } from 'react';
import { useReviewStore, type AtBatEntry } from '../../stores/reviewStore';
import { useGameStore } from '../../stores/gameStore';
import styles from './AtBatStrip.module.css';

// ── Result classification ───────────────────────────────────

type ResultCategory = 'hit' | 'hr' | 'k' | 'bb' | 'out' | 'error';

const RESULT_MAP: Record<string, { label: string; category: ResultCategory }> = {
  Single: { label: '1B', category: 'hit' },
  Double: { label: '2B', category: 'hit' },
  Triple: { label: '3B', category: 'hit' },
  'Home Run': { label: 'HR', category: 'hr' },
  Strikeout: { label: 'K', category: 'k' },
  'Strikeout Double Play': { label: 'K', category: 'k' },
  Walk: { label: 'BB', category: 'bb' },
  'Intent Walk': { label: 'IBB', category: 'bb' },
  'Hit By Pitch': { label: 'HBP', category: 'bb' },
  'Field Error': { label: 'E', category: 'error' },
  'Fielders Choice': { label: 'FC', category: 'out' },
  'Fielders Choice Out': { label: 'FC', category: 'out' },
  'Grounded Into DP': { label: 'GDP', category: 'out' },
  'Double Play': { label: 'DP', category: 'out' },
  'Triple Play': { label: 'TP', category: 'out' },
  'Sac Fly': { label: 'SF', category: 'out' },
  'Sac Bunt': { label: 'SAC', category: 'out' },
  'Sac Fly Double Play': { label: 'SF', category: 'out' },
};

function getResultInfo(result: string): { label: string; category: ResultCategory } {
  return RESULT_MAP[result] ?? { label: 'OUT', category: 'out' };
}

const CATEGORY_STYLE: Record<ResultCategory, string> = {
  hit: styles.resultHit,
  hr: styles.resultHR,
  k: styles.resultK,
  bb: styles.resultBB,
  out: styles.resultOut,
  error: styles.resultError,
};

function getLastName(fullName: string): string {
  const parts = fullName.split(' ');
  return parts.length > 1 ? parts[parts.length - 1] : fullName;
}

// ── Components ──────────────────────────────────────────────

function AbCard({ ab, isActive, onClick }: {
  ab: AtBatEntry;
  isActive: boolean;
  onClick: () => void;
}) {
  const { label, category } = getResultInfo(ab.result);
  return (
    <button
      className={`${styles.abCard} ${isActive ? styles.abCardActive : ''}`}
      onClick={onClick}
      type="button"
      title={`${ab.batter.name} — ${ab.result}`}
    >
      <span className={styles.batterName}>{getLastName(ab.batter.name)}</span>
      <span className={`${styles.resultPill} ${CATEGORY_STYLE[category]}`}>{label}</span>
    </button>
  );
}

function InningDivider({ inning, half }: { inning: number; half: string }) {
  const arrow = half === 'top' ? '\u25B2' : '\u25BC';
  return (
    <div className={styles.inningDivider}>
      <span className={styles.inningLabel}>{arrow}{inning}</span>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────

export function AtBatStrip() {
  const atBats = useReviewStore((s) => s.atBats);
  const isReviewMode = useReviewStore((s) => s.isReviewMode);
  const reviewPlayIndex = useReviewStore((s) => s.reviewPlayIndex);
  const enterReview = useReviewStore((s) => s.enterReview);
  const exitReview = useReviewStore((s) => s.exitReview);
  const gamePitchers = useReviewStore((s) => s.gamePitchers);
  const isDrawerOpen = useReviewStore((s) => s.isDrawerOpen);
  const openDrawer = useReviewStore((s) => s.openDrawer);
  const closeDrawer = useReviewStore((s) => s.closeDrawer);
  const status = useGameStore((s) => s.status);

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Auto-scroll to end when new ABs arrive (only in live mode)
  useEffect(() => {
    if (!isReviewMode && atBats.length > prevCountRef.current && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
    prevCountRef.current = atBats.length;
  }, [atBats.length, isReviewMode]);

  // Hide for preview games
  if (status === 'Preview') return null;

  // Build elements with inning dividers
  const elements: React.ReactNode[] = [];
  let lastInningKey = '';

  for (const ab of atBats) {
    const inningKey = `${ab.halfInning}-${ab.inning}`;
    if (inningKey !== lastInningKey) {
      elements.push(
        <InningDivider key={`div-${inningKey}`} inning={ab.inning} half={ab.halfInning} />,
      );
      lastInningKey = inningKey;
    }
    elements.push(
      <AbCard
        key={ab.playIndex}
        ab={ab}
        isActive={isReviewMode && reviewPlayIndex === ab.playIndex}
        onClick={() => enterReview(ab.playIndex)}
      />,
    );
  }

  const pitcherCount = gamePitchers.length;
  const currentPitcher = gamePitchers.find(p => p.isCurrentPitcher);

  return (
    <div className={styles.strip}>
      <div className={styles.scrollArea} ref={scrollRef}>
        {atBats.length === 0 ? (
          <span className={styles.empty}>No at-bats yet</span>
        ) : (
          elements
        )}
      </div>

      <button
        className={`${styles.liveBtn} ${isReviewMode ? styles.liveBtnReview : styles.liveBtnActive}`}
        onClick={() => { if (isReviewMode) exitReview(); }}
        type="button"
        title={isReviewMode ? 'Return to live' : 'Viewing live'}
      >
        <span className={styles.liveDot} />
        {isReviewMode ? 'GO LIVE' : 'LIVE'}
      </button>

      {pitcherCount > 0 && (
        <button
          className={`${styles.pitcherBtn} ${isDrawerOpen ? styles.pitcherBtnOpen : ''}`}
          onClick={() => {
            if (isDrawerOpen) {
              closeDrawer();
            } else {
              openDrawer(currentPitcher?.id ?? gamePitchers[0].id);
            }
          }}
          type="button"
          title="View pitcher history"
        >
          Pitchers
          <span className={styles.pitcherCount}>{pitcherCount}</span>
        </button>
      )}
    </div>
  );
}
