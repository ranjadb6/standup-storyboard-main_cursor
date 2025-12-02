import { useState } from "react";
import { Task } from "@/types/task";
import { TaskRow } from "./TaskRow";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";

interface TaskTableProps {
  tasks: Task[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onAddTask: () => void;
}

export const TaskTable = ({ tasks, onUpdateTask, onAddTask }: TaskTableProps) => {
  const [columnWidths, setColumnWidths] = useState({
    taskName: 200,
    status: 150,
    collaborators: 180,
    devStartDate: 130,
    devDueDate: 130,
    qaStartDate: 130,
    qaEndDate: 130,
    remarks: 250,
    committedDate: 150,
  });

  const handleResize = (column: keyof typeof columnWidths) => (e: any, { size }: any) => {
    setColumnWidths((prev) => ({
      ...prev,
      [column]: size.width,
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-primary via-purple to-accent rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white">Ongoing Dev and QA Tasks</h2>
        <Button onClick={onAddTask} size="sm" className="gap-2 bg-white text-primary hover:bg-white/90">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      <div className="rounded-lg border-2 border-primary/20 bg-card overflow-auto shadow-lg">
        <div className="min-w-max">
          {/* Header */}
          <div className="flex border-b-2 border-primary/20 bg-gradient-to-r from-primary/10 via-purple/10 to-accent/10">
            <ResizableHeader
              title="Task"
              width={columnWidths.taskName}
              onResize={handleResize("taskName")}
            />
            <ResizableHeader
              title="Status"
              width={columnWidths.status}
              onResize={handleResize("status")}
            />
            <ResizableHeader
              title="Collaborators"
              width={columnWidths.collaborators}
              onResize={handleResize("collaborators")}
            />
            <ResizableHeader
              title="Dev Start"
              width={columnWidths.devStartDate}
              onResize={handleResize("devStartDate")}
            />
            <ResizableHeader
              title="Dev Due"
              width={columnWidths.devDueDate}
              onResize={handleResize("devDueDate")}
            />
            <ResizableHeader
              title="QA Start"
              width={columnWidths.qaStartDate}
              onResize={handleResize("qaStartDate")}
            />
            <ResizableHeader
              title="QA End"
              width={columnWidths.qaEndDate}
              onResize={handleResize("qaEndDate")}
            />
            <ResizableHeader
              title="Remarks"
              width={columnWidths.remarks}
              onResize={handleResize("remarks")}
            />
            <div
              className="px-4 py-3 text-sm font-semibold text-foreground"
              style={{ width: columnWidths.committedDate }}
            >
              Committed Date
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onUpdate={onUpdateTask}
                columnWidths={columnWidths}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ResizableHeaderProps {
  title: string;
  width: number;
  onResize: (e: any, data: any) => void;
}

const ResizableHeader = ({ title, width, onResize }: ResizableHeaderProps) => {
  return (
    <Resizable
      width={width}
      height={0}
      onResize={onResize}
      axis="x"
      resizeHandles={["e"]}
      handle={
        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 transition-colors"
          style={{ zIndex: 1 }}
        />
      }
    >
      <div
        className="px-4 py-3 text-sm font-semibold text-foreground relative"
        style={{ width }}
      >
        {title}
      </div>
    </Resizable>
  );
};
