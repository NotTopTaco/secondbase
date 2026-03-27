import { useEffect, useRef } from 'react';
import { Panel } from '../../components/ui/Panel';
import { Spinner } from '../../components/ui/Spinner';
import { usePanelStore } from '../../stores/panelStore';
import { useGameStore } from '../../stores/gameStore';
import { usePredictionStore } from '../../stores/predictionStore';
import { fetchNextPitch } from '../../api/analyticsApi';
import { ProbabilityList } from './ProbabilityList';
import { AccuracyBadge } from './AccuracyBadge';

const PANEL_ID = 'nextPitch';

export function NextPitchPanel() {
  const panel = usePanelStore((s) => s.panels.find((p) => p.id === PANEL_ID));
  const toggleCollapse = usePanelStore((s) => s.toggleCollapse);

  const gamePk = useGameStore((s) => s.gamePk);
  const pitcher = useGameStore((s) => s.pitcher);
  const count = useGameStore((s) => s.count);
  const inningHalf = useGameStore((s) => s.inningHalf);
  const pitches = useGameStore((s) => s.pitches);

  const predictions = usePredictionStore((s) => s.predictions);
  const accuracy = usePredictionStore((s) => s.accuracy);
  const loading = usePredictionStore((s) => s.loading);
  const setPredictions = usePredictionStore((s) => s.setPredictions);

  const abortRef = useRef<AbortController | null>(null);

  const batterHand = inningHalf === 'Top' ? 'R' : 'L'; // simplified; real value comes from matchup data
  const lastPitchType = pitches.length > 0 ? pitches[pitches.length - 1].type : undefined;

  useEffect(() => {
    if (!gamePk || !pitcher) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    usePredictionStore.setState({ loading: true });

    fetchNextPitch(gamePk, pitcher.id, batterHand, count.balls, count.strikes, lastPitchType)
      .then((res) => {
        if (!controller.signal.aborted) {
          setPredictions(res.predictions, res.accuracy);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          usePredictionStore.setState({ loading: false });
        }
      });

    return () => controller.abort();
  }, [gamePk, pitcher?.id, batterHand, count.balls, count.strikes, lastPitchType, setPredictions]);

  if (!panel) return null;

  return (
    <Panel
      id={PANEL_ID}
      title={panel.title}
      collapsed={panel.collapsed}
      onToggleCollapse={() => toggleCollapse(PANEL_ID)}
      sortable
    >
      {loading ? (
        <Spinner />
      ) : predictions.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-lg)', fontSize: 14 }}>
          Waiting for matchup data
        </div>
      ) : (
        <>
          <ProbabilityList predictions={predictions} />
          {accuracy.total > 0 && (
            <AccuracyBadge correct={accuracy.correct} total={accuracy.total} pct={accuracy.pct} />
          )}
        </>
      )}
    </Panel>
  );
}
