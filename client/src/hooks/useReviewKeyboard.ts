import { useEffect } from 'react';
import { useReviewStore } from '../stores/reviewStore';

export function useReviewKeyboard() {
  const isReviewMode = useReviewStore((s) => s.isReviewMode);
  const reviewPlayIndex = useReviewStore((s) => s.reviewPlayIndex);
  const atBats = useReviewStore((s) => s.atBats);
  const enterReview = useReviewStore((s) => s.enterReview);
  const exitReview = useReviewStore((s) => s.exitReview);
  const isDrawerOpen = useReviewStore((s) => s.isDrawerOpen);
  const closeDrawer = useReviewStore((s) => s.closeDrawer);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture when typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Escape') {
        if (isDrawerOpen) {
          closeDrawer();
        } else if (isReviewMode) {
          exitReview();
        }
        return;
      }

      // Arrow key navigation through at-bats (only when in review mode)
      if (!isReviewMode || atBats.length === 0) return;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const currentIdx = atBats.findIndex((ab) => ab.playIndex === reviewPlayIndex);
        if (currentIdx === -1) return;

        const nextIdx = e.key === 'ArrowLeft'
          ? Math.max(0, currentIdx - 1)
          : Math.min(atBats.length - 1, currentIdx + 1);

        if (nextIdx !== currentIdx) {
          enterReview(atBats[nextIdx].playIndex);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReviewMode, reviewPlayIndex, atBats, enterReview, exitReview, isDrawerOpen, closeDrawer]);
}
