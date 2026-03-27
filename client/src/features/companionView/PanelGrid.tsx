import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { usePanelStore } from '../../stores/panelStore';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { StrikeZonePanel } from '../strikeZone/StrikeZonePanel';
import { HotZonePanel } from '../hotZone/HotZonePanel';
import { PitcherTendencyPanel } from '../pitcherTendency/PitcherTendencyPanel';
import { BatterVsPitchTypePanel } from '../batterVsPitchType/BatterVsPitchTypePanel';
import { SprayChartPanel } from '../sprayChart/SprayChartPanel';
import { HeadToHeadPanel } from '../headToHead/HeadToHeadPanel';
import { NextPitchPanel } from '../nextPitchProbability/NextPitchPanel';
import { WinProbabilityPanel } from '../winProbability/WinProbabilityPanel';
import { PitcherFatiguePanel } from '../pitcherFatigue/PitcherFatiguePanel';
import { TimeThroughOrderPanel } from '../timeThroughOrder/TimeThroughOrderPanel';
import { UmpireScoutingPanel } from '../umpireScouting/UmpireScoutingPanel';
import { PitchMovementPanel } from '../pitchMovement/PitchMovementPanel';
import { BullpenStatusPanel } from '../bullpenStatus/BullpenStatusPanel';
import { BatterByCountPanel } from '../batterByCount/BatterByCountPanel';
import styles from './PanelGrid.module.css';

const PANEL_COMPONENTS: Record<string, React.FC> = {
  strikeZone: StrikeZonePanel,
  hotZone: HotZonePanel,
  pitcherTendency: PitcherTendencyPanel,
  batterVsPitchType: BatterVsPitchTypePanel,
  sprayChart: SprayChartPanel,
  headToHead: HeadToHeadPanel,
  nextPitch: NextPitchPanel,
  winProbability: WinProbabilityPanel,
  pitcherFatigue: PitcherFatiguePanel,
  timeThroughOrder: TimeThroughOrderPanel,
  umpireScouting: UmpireScoutingPanel,
  pitchMovement: PitchMovementPanel,
  bullpenStatus: BullpenStatusPanel,
  batterByCount: BatterByCountPanel,
};

export function PanelGrid() {
  const panels = usePanelStore((s) => s.panels);
  const reorderPanels = usePanelStore((s) => s.reorderPanels);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = panels.map((p) => p.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);

    if (oldIndex === -1 || newIndex === -1) return;

    const newIds = [...ids];
    newIds.splice(oldIndex, 1);
    newIds.splice(newIndex, 0, active.id as string);
    reorderPanels(newIds);
  }

  const panelIds = panels.map((p) => p.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={panelIds} strategy={rectSortingStrategy}>
        <div className={styles.grid}>
          {panels.map((panel) => {
            const Component = PANEL_COMPONENTS[panel.id];
            if (!Component) return null;
            return (
              <ErrorBoundary key={panel.id}>
                <Component />
              </ErrorBoundary>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
