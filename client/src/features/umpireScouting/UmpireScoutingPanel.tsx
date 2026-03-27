import { useEffect } from 'react';
import { Panel } from '../../components/ui/Panel';
import { Spinner } from '../../components/ui/Spinner';
import { Toggle } from '../../components/ui/Toggle';
import { usePanelStore } from '../../stores/panelStore';
import { useGameStore } from '../../stores/gameStore';
import { useUmpireStore } from '../../stores/umpireStore';
import { fetchUmpireData } from '../../api/analyticsApi';
import { UmpireStats } from './UmpireStats';

const PANEL_ID = 'umpireScouting';

export function UmpireScoutingPanel() {
  const panel = usePanelStore((s) => s.panels.find((p) => p.id === PANEL_ID));
  const toggleCollapse = usePanelStore((s) => s.toggleCollapse);
  const gamePk = useGameStore((s) => s.gamePk);
  const umpireName = useUmpireStore((s) => s.umpireName);
  const stats = useUmpireStore((s) => s.stats);
  const showOverlay = useUmpireStore((s) => s.showOverlay);
  const loading = useUmpireStore((s) => s.loading);
  const setData = useUmpireStore((s) => s.setData);
  const toggleOverlay = useUmpireStore((s) => s.toggleOverlay);
  const clear = useUmpireStore((s) => s.clear);

  useEffect(() => {
    if (!gamePk) {
      clear();
      return;
    }

    let cancelled = false;

    fetchUmpireData(gamePk)
      .then((res) => {
        if (!cancelled) {
          setData({
            umpire: res.umpire,
            zones: res.zones,
            stats: res.stats,
          });
        }
      })
      .catch(() => {
        if (!cancelled) clear();
      });

    return () => {
      cancelled = true;
    };
  }, [gamePk, setData, clear]);

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
      ) : !umpireName ? (
        <div style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
          No umpire data
        </div>
      ) : (
        <>
          <div style={{ padding: 'var(--space-sm) 0', fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>
            {umpireName}
          </div>
          {stats && <UmpireStats stats={stats} />}
          <div style={{ paddingTop: 'var(--space-sm)' }}>
            <Toggle
              checked={showOverlay}
              onChange={() => toggleOverlay()}
              label="Zone overlay"
            />
          </div>
        </>
      )}
    </Panel>
  );
}
