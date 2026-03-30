import { useGameStore } from '../stores/gameStore';
import { useReviewStore } from '../stores/reviewStore';

export function useActiveMatchup() {
  const isReviewMode = useReviewStore((s) => s.isReviewMode);
  const reviewBatter = useReviewStore((s) => s.reviewBatter);
  const reviewPitcher = useReviewStore((s) => s.reviewPitcher);
  const liveBatter = useGameStore((s) => s.batter);
  const livePitcher = useGameStore((s) => s.pitcher);

  return {
    batter: isReviewMode ? reviewBatter : liveBatter,
    pitcher: isReviewMode ? reviewPitcher : livePitcher,
    isReviewMode,
  };
}
