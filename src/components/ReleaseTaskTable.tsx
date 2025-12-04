import { useState } from "react";
import { ReleaseTask } from "@/types/standupTask";
import { ReleaseTaskRow } from "./ReleaseTaskRow";
import { Button } from "./ui/button";
import { Plus, Download, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ResizableHeader } from "./ResizableHeader";
import { SortableHeader } from "./SortableHeader";
import { horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableRow } from "./SortableRow";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, // Not directly used in the provided snippet, but often part of DND reordering
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface ReleaseTaskTableProps {
  tasks: ReleaseTask[];
  onUpdateTask: (id: string, updates: Partial<ReleaseTask>) => void;
  onDelete: (id: string) => void;
  onAddTask: () => void;
  onExport: () => void;
  showOngoingOnly: boolean;
  onToggleFilter: () => void;
  storageKey: string;
  onReorder?: (startIndex: number, endIndex: number) => void;
}

export const ReleaseTaskTable = ({
  tasks,
  onUpdateTask,
  onDelete,
  onAddTask,
  onExport,
  showOngoingOnly,
  onToggleFilter,
  storageKey,
  onReorder,
}: ReleaseTaskTableProps) => {
  // Define columns (excluding dragHandle and actions which are fixed)
  const dataColumns = [
    { id: "adoId", title: "ADO ID", defaultWidth: 120 },
    { id: "item", title: "Feature", defaultWidth: 200 },
    { id: "status", title: "Status", defaultWidth: 200 },
    { id: "crLink", title: "CR Link", defaultWidth: 180 },
    { id: "jmdbId", title: "JMDB ID", defaultWidth: 150 },
    { id: "services", title: "Services", defaultWidth: 200 },
    { id: "remarks", title: "Remarks", defaultWidth: 250 },
    { id: "committedDate", title: "Committed Date", defaultWidth: 150 },
  ];

  const defaultWidths = {
    ...Object.fromEntries(dataColumns.map(col => [col.id, col.defaultWidth])),
    actions: 100,
  };

  const [columnWidths, setColumnWidths] = useState(() => {
    if (typeof window === "undefined") {
      return defaultWidths;
    }
    try {
      const stored = localStorage.getItem(`column-widths-${storageKey}`);
      if (!stored) return defaultWidths;
      const parsed = JSON.parse(stored);
      return { ...defaultWidths, ...parsed };
    } catch {
      return defaultWidths;
    }
  });

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    if (typeof window === "undefined") {
      return dataColumns.map(col => col.id);
    }
    try {
      const stored = localStorage.getItem(`column-order-${storageKey}`);
      if (!stored) return dataColumns.map(col => col.id);
      return JSON.parse(stored);
    } catch {
      return dataColumns.map(col => col.id);
    }
  });

  const handleResize = (column: keyof typeof columnWidths) => (e: any, { size }: any) => {
    setColumnWidths((prev) => {
      const next = {
        ...prev,
        [column]: size.width,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(`column-widths-${storageKey}`, JSON.stringify(next));
      }
      return next;
    });
  };

  const filteredTasks = showOngoingOnly
    ? tasks.filter((task) => !task.status.includes("Released"))
    : tasks;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleRowDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && onReorder) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);
      onReorder(oldIndex, newIndex);
    }
  };

  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over.id as string);
      const newOrder = arrayMove(columnOrder, oldIndex, newIndex);
      setColumnOrder(newOrder);
      if (typeof window !== "undefined") {
        localStorage.setItem(`column-order-${storageKey}`, JSON.stringify(newOrder));
      }
    }
  };

  return (
    <Card className="w-full bg-card/50 backdrop-blur-sm border-muted/40 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-primary via-purple to-accent">
        <div className="flex justify-between items-center">
          <CardTitle className="text-white">Planned Release</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={onToggleFilter}
              size="sm"
              variant={showOngoingOnly ? "secondary" : "outline"}
              className="gap-2 bg-white/10 text-white hover:bg-white/20 border-white/20"
            >
              <Filter className="h-4 w-4" />
              {showOngoingOnly ? "All" : "Ongoing"}
            </Button>
            <Button
              onClick={onExport}
              size="sm"
              className="gap-2 bg-white/10 text-white hover:bg-white/20 border-white/20"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={onAddTask}
              size="sm"
              className="gap-2 bg-white text-primary hover:bg-white/90"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Header */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleColumnDragEnd}
            >
              <div className="flex border-b bg-muted/30 text-xs font-medium text-muted-foreground">
                <div className="w-8 px-2 py-3 border-r border-black/20 shrink-0"></div>

                <SortableContext
                  items={columnOrder}
                  strategy={horizontalListSortingStrategy}
                >
                  {columnOrder.map((columnId) => {
                    const column = dataColumns.find(col => col.id === columnId);
                    if (!column) return null;
                    return (
                      <SortableHeader
                        key={columnId}
                        id={columnId}
                        title={column.title}
                        width={columnWidths[columnId as keyof typeof columnWidths]}
                        onResize={handleResize(columnId as keyof typeof columnWidths)}
                        className="border-r border-black/20"
                      />
                    );
                  })}
                </SortableContext>

                <div className="px-4 py-3 text-sm font-semibold text-foreground text-center shrink-0" style={{ width: columnWidths.actions }}>
                  Actions
                </div>
              </div>
            </DndContext>

            {/* Task Rows */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleRowDragEnd}
            >
              <SortableContext
                items={filteredTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y divide-muted/20">
                  {filteredTasks.map((task) => (
                    <SortableRow key={task.id} id={task.id}>
                      <ReleaseTaskRow
                        task={task}
                        onUpdate={onUpdateTask}
                        onDelete={onDelete}
                        columnWidths={columnWidths}
                        columnOrder={columnOrder}
                      />
                    </SortableRow>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
