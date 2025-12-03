import { useState } from "react";
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
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RwtTask } from "@/types/standupTask";
import { Button } from "./ui/button";
import { Plus, GripVertical, Download, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { RwtTaskRow } from "./RwtTaskRow";
import { ResizableHeader } from "./ResizableHeader";
import { cn } from "@/lib/utils";

interface RwtTaskTableProps {
    tasks: RwtTask[];
    onUpdateTask: (id: string, updates: Partial<RwtTask>) => void;
    onDelete: (id: string) => void;
    onAddTask: () => void;
    onReorder: (startIndex: number, endIndex: number) => void;
    onExport: () => void;
    showOngoingOnly: boolean;
    onToggleFilter: () => void;
    storageKey: string;
}

const SortableRow = ({
    task,
    onUpdate,
    onDelete,
    columnWidths,
}: {
    task: RwtTask;
    onUpdate: (id: string, updates: Partial<RwtTask>) => void;
    onDelete: (id: string) => void;
    columnWidths: Record<string, number>;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        position: isDragging ? "relative" as const : undefined,
    };

    return (
        <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-50")}>
            <div className="flex items-center">
                <div {...attributes} {...listeners} className="px-2 py-3 cursor-grab hover:text-primary shrink-0 w-8 border-r border-black/20 flex justify-center">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                    <RwtTaskRow task={task} onUpdate={onUpdate} onDelete={onDelete} columnWidths={columnWidths} />
                </div>
            </div>
        </div>
    );
};

export const RwtTaskTable = ({
    tasks,
    onUpdateTask,
    onDelete,
    onAddTask,
    onReorder,
    onExport,
    showOngoingOnly,
    onToggleFilter,
    storageKey,
}: RwtTaskTableProps) => {
    const defaultWidths = {
        feature: 250,
        status: 150,
        collaborators: 200,
        startDate: 150,
        endDate: 150,
        remarks: 250,
        actions: 100,
    };

    const [columnWidths, setColumnWidths] = useState(defaultWidths);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = tasks.findIndex((task) => task.id === active.id);
            const newIndex = tasks.findIndex((task) => task.id === over.id);
            onReorder(oldIndex, newIndex);
        }
    };

    const handleResize = (column: keyof typeof defaultWidths) => (e: React.SyntheticEvent, { size }: { size: { width: number } }) => {
        setColumnWidths((prev) => ({
            ...prev,
            [column]: size.width,
        }));
    };

    const filteredTasks = showOngoingOnly
        ? tasks.filter((task) => task.status !== "RWT Completed")
        : tasks;

    return (
        <Card className="w-full bg-card/50 backdrop-blur-sm border-muted/40 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-primary via-purple to-accent">
                <div className="flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-4">
                        <CardTitle className="text-xl font-bold text-white">Planned RWT</CardTitle>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-white/80">
                                {filteredTasks.length} / {tasks.length} tasks
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={showOngoingOnly ? "secondary" : "outline"}
                            size="sm"
                            onClick={onToggleFilter}
                            className={cn(
                                "gap-2 bg-white/10 text-white hover:bg-white/20 border-white/20",
                                showOngoingOnly && "bg-white/20"
                            )}
                        >
                            <Filter className="h-4 w-4" />
                            {showOngoingOnly ? "Show All" : "Show Pending Only"}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onExport}
                            className="gap-2 bg-white/10 text-white hover:bg-white/20 border-white/20"
                        >
                            <Download className="h-4 w-4" />
                            Export to Excel
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
                            <div className="w-8 px-2 py-3 border-r border-black/20 shrink-0"></div> {/* Drag handle column */}
                            <ResizableHeader title="Features" width={columnWidths.feature} onResize={handleResize("feature")} className="border-r border-black/20" />
                            <ResizableHeader title="Status" width={columnWidths.status} onResize={handleResize("status")} className="border-r border-black/20" />
                            <ResizableHeader title="Collaborators" width={columnWidths.collaborators} onResize={handleResize("collaborators")} className="border-r border-black/20" />
                            <ResizableHeader title="Start Date" width={columnWidths.startDate} onResize={handleResize("startDate")} className="border-r border-black/20" />
                            <ResizableHeader title="End Date" width={columnWidths.endDate} onResize={handleResize("endDate")} className="border-r border-black/20" />
                            <ResizableHeader title="Remark" width={columnWidths.remarks} onResize={handleResize("remarks")} className="border-r border-black/20" />
                            <div className="px-4 py-3 shrink-0" style={{ width: columnWidths.actions }}>Actions</div>
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={filteredTasks.map((t) => t.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="divide-y">
                                    {filteredTasks.map((task) => (
                                        <SortableRow
                                            key={task.id}
                                            task={task}
                                            onUpdate={onUpdateTask}
                                            onDelete={onDelete}
                                            columnWidths={columnWidths}
                                        />
                                    ))}
                                    {filteredTasks.length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground">
                                            No tasks found. Click "Add Task" to create one.
                                        </div>
                                    )}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
