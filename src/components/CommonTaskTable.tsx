import { useState } from "react";
import { CommonTask, COMMON_STATUS_OPTIONS, COLLABORATOR_OPTIONS } from "@/types/standupTask";
import { CommonTaskRow } from "./CommonTaskRow";
import { Button } from "./ui/button";
import { Plus, Download, Filter, Trash2, CalendarIcon, GripVertical } from "lucide-react";
import { ResizableHeader } from "@/components/ResizableHeader";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface CommonTaskTableProps {
  title: string;
  tasks: CommonTask[];
  onUpdateTask: (id: string, updates: Partial<CommonTask>) => void;
  onDelete: (id: string) => void;
  onAddTask: () => void;
  onExport: () => void;
  showOngoingOnly: boolean;
  onToggleFilter: () => void;
  storageKey: string;
  onReorder?: (startIndex: number, endIndex: number) => void;
}

export const CommonTaskTable = ({
  title,
  tasks,
  onUpdateTask,
  onDelete,
  onAddTask,
  onExport,
  showOngoingOnly,
  onToggleFilter,
  storageKey,
  onReorder,
}: CommonTaskTableProps) => {
  const defaultWidths = {
    dragHandle: 0,// 32, // w-8 = 32px
    adoId: 120,
    taskName: 200,
    status: 180,
    collaborators: 180,
    devStartDate: 130,
    devDueDate: 130,
    qaStartDate: 130,
    qaEndDate: 130,
    remarks: 250,
    committedDate: 150,
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
    ? tasks.filter(
      (task) =>
        task.status !== "Complete" &&
        task.status !== "Scrapped" &&
        task.status !== "Removed" &&
        task.status !== "Released To Prod"
    )
    : tasks;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && onReorder) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);
      onReorder(oldIndex, newIndex);
    }
  };

  return (
    <Card className="w-full bg-card/50 backdrop-blur-sm border-muted/40 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-primary via-purple to-accent">
        <div className="flex justify-between items-center">
          <CardTitle className="text-white">{title}</CardTitle>
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
            <div className="flex border-b bg-muted/30 text-xs font-medium text-muted-foreground">
              <ResizableHeader 
                width={columnWidths.dragHandle}
                onResize={handleResize("dragHandle")} 
                className="border-r border-black/20"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" /> 
                
              </ResizableHeader>
             
              <ResizableHeader title="ADO ID" width={columnWidths.adoId} onResize={handleResize("adoId")} className="border-r border-black/20" />
              <ResizableHeader title="Task" width={columnWidths.taskName} onResize={handleResize("taskName")} className="border-r border-black/20" />
              <ResizableHeader title="Status" width={columnWidths.status} onResize={handleResize("status")} className="border-r border-black/20" />
              <ResizableHeader title="Collaborators" width={columnWidths.collaborators} onResize={handleResize("collaborators")} className="border-r border-black/20" />
              <ResizableHeader title="Dev Start" width={columnWidths.devStartDate} onResize={handleResize("devStartDate")} className="border-r border-black/20" />
              <ResizableHeader title="Dev Due" width={columnWidths.devDueDate} onResize={handleResize("devDueDate")} className="border-r border-black/20" />
              <ResizableHeader title="QA Start" width={columnWidths.qaStartDate} onResize={handleResize("qaStartDate")} className="border-r border-black/20" />
              <ResizableHeader title="QA End" width={columnWidths.qaEndDate} onResize={handleResize("qaEndDate")} className="border-r border-black/20" />
              <ResizableHeader title="Remarks" width={columnWidths.remarks} onResize={handleResize("remarks")} className="border-r border-black/20" />
              <ResizableHeader title="Committed Date" width={columnWidths.committedDate} onResize={handleResize("committedDate")} className="border-r border-black/20" />
              <div className="px-4 py-3 text-sm font-semibold text-foreground text-center shrink-0" style={{ width: columnWidths.actions }}>
                Actions
              </div>
            </div>

            {/* Task Rows */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={tasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y divide-muted/20">
                  {tasks.map((task) => (
                    <SortableRow key={task.id} id={task.id}>
                      <CommonTaskRow
                        task={task}
                        onUpdate={onUpdateTask}
                        onDelete={onDelete}
                        columnWidths={columnWidths}
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
