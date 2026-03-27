import { useMemo } from 'react';
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
import { PanelLayoutContext } from '../../components/ui/Panel';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { PANEL_COMPONENTS } from './panelRegistry';
import styles from './PanelGrid.module.css';

const sideContext = { sortable: true };
const centerContext = { sortable: false };

export function TabPanelGrid() {
  const activeTab = usePanelStore((s) => s.activeTab);
  const tabOrders = usePanelStore((s) => s.tabOrders);
  const pinnedPanelIds = usePanelStore((s) => s.pinnedPanelIds);
  const reorderTabPanels = usePanelStore((s) => s.reorderTabPanels);

  const visibleIds = useMemo(() => {
    const pinned = new Set(pinnedPanelIds);
    return tabOrders[activeTab].filter((id) => !pinned.has(id));
  }, [tabOrders, activeTab, pinnedPanelIds]);

  const leftIds = useMemo(
    () => visibleIds.filter((_, i) => i % 2 === 0),
    [visibleIds],
  );
  const rightIds = useMemo(
    () => visibleIds.filter((_, i) => i % 2 === 1),
    [visibleIds],
  );

  // All sortable IDs for dnd-kit (side panels only)
  const allSortableIds = useMemo(
    () => [...leftIds, ...rightIds],
    [leftIds, rightIds],
  );

  // IDs needed for center column SortableContext (strike zone + pinned)
  const centerIds = useMemo(
    () => ['strikeZone', ...pinnedPanelIds],
    [pinnedPanelIds],
  );

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

    const order = tabOrders[activeTab];
    const oldIndex = order.indexOf(active.id as string);
    const newIndex = order.indexOf(over.id as string);

    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = [...order];
    newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, active.id as string);
    reorderTabPanels(activeTab, newOrder);
  }

  const StrikeZone = PANEL_COMPONENTS.strikeZone;

  return (
    <div className={styles.layout}>
      {/* Left column */}
      <PanelLayoutContext.Provider value={sideContext}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={allSortableIds} strategy={rectSortingStrategy}>
            <div className={styles.sideColumn}>
              {leftIds.map((id) => {
                const Component = PANEL_COMPONENTS[id];
                if (!Component) return null;
                return (
                  <ErrorBoundary key={id}>
                    <Component />
                  </ErrorBoundary>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </PanelLayoutContext.Provider>

      {/* Center column: strike zone + pinned panels */}
      <PanelLayoutContext.Provider value={centerContext}>
        <DndContext>
          <SortableContext items={centerIds} strategy={rectSortingStrategy}>
            <div className={styles.centerColumn}>
              <ErrorBoundary>
                <StrikeZone />
              </ErrorBoundary>
              {pinnedPanelIds.map((id) => {
                const Component = PANEL_COMPONENTS[id];
                if (!Component) return null;
                return (
                  <ErrorBoundary key={id}>
                    <Component />
                  </ErrorBoundary>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </PanelLayoutContext.Provider>

      {/* Right column */}
      <PanelLayoutContext.Provider value={sideContext}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={allSortableIds} strategy={rectSortingStrategy}>
            <div className={styles.sideColumn}>
              {rightIds.map((id) => {
                const Component = PANEL_COMPONENTS[id];
                if (!Component) return null;
                return (
                  <ErrorBoundary key={id}>
                    <Component />
                  </ErrorBoundary>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </PanelLayoutContext.Provider>
    </div>
  );
}
