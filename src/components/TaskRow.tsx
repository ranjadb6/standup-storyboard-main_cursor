import { useState } from "react";
import { Task, STATUS_OPTIONS, COLLABORATOR_OPTIONS } from "@/types/task";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { CalendarIcon, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateChangeDialog } from "./DateChangeDialog";
import { MultiSelect } from "./MultiSelect";
import { detectUrls } from "@/utils/urlHelpers";

interface TaskRowProps {
  task: Task;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  columnWidths: Record<string, number>;
}

export const TaskRow = ({ task, onUpdate, columnWidths }: TaskRowProps) => {
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [dateChangeDialog, setDateChangeDialog] = useState<{
    isOpen: boolean;
    field: keyof Task | null;
    newDate: Date | null;
  }>({
    isOpen: false,
    field: null,
    newDate: null,
  });

  const handleCommittedDateChange = (date: Date | undefined) => {
    if (!date) {
      onUpdate(task.id, { committedDate: null });
      return;
    }

    const currentDate = task.committedDate;
    if (currentDate) {
      setDateChangeDialog({ isOpen: true, field: "committedDate", newDate: date });
    } else {
      // First time adding committed date - automatically log it
      const currentTimestamp = format(new Date(), "PPP p");
      const newDateFormatted = format(date, "PPP");
      const newRemark = `[${currentTimestamp}] : Committed Date added as ${newDateFormatted}`;

      onUpdate(task.id, {
        committedDate: date,
        remarks: task.remarks ? `${newRemark}\n${task.remarks}` : newRemark,
      });
    }
  };

  const handleDateChange = (field: keyof Task, date: Date | undefined) => {
    if (!date) {
      onUpdate(task.id, { [field]: null });
      return;
    }

    const currentDate = task[field] as Date | null;
    if (currentDate) {
      setDateChangeDialog({
        isOpen: true,
        field,
        newDate: date,
      });
    } else {
      // First time adding a date - automatically log it
      const currentTimestamp = format(new Date(), "PPP p");
      const newDateFormatted = format(date, "PPP");
      const fieldName = field.replace(/([A-Z])/g, " $1").trim();
      const newRemark = `[${currentTimestamp}] : ${fieldName} added as ${newDateFormatted}`;

      onUpdate(task.id, {
        [field]: date,
        remarks: task.remarks ? `${newRemark}\n${task.remarks}` : newRemark,
      });
    }
  };

  const handleConfirmDateChange = (reason: string) => {
    if (dateChangeDialog.field && dateChangeDialog.newDate) {
      const currentTimestamp = format(new Date(), "PPP p");
      const oldDate = task[dateChangeDialog.field] as Date | null;
      const oldDateFormatted = oldDate ? format(oldDate, "PPP") : "N/A";
      const newDateFormatted = format(dateChangeDialog.newDate, "PPP");

      let fieldName = dateChangeDialog.field.replace(/([A-Z])/g, " $1").trim();
      let logMessage = "";

      if (dateChangeDialog.field === "committedDate") {
        logMessage = `[${currentTimestamp}] : Committed date changed from ${oldDateFormatted} to ${newDateFormatted} with Reason : ${reason}`;
      } else {
        logMessage = `[${currentTimestamp}] : ${fieldName} changes from ${oldDateFormatted} to ${newDateFormatted} due to Reason : ${reason}`;
      }

      onUpdate(task.id, {
        [dateChangeDialog.field]: dateChangeDialog.newDate,
        remarks: task.remarks ? `${logMessage}\n${task.remarks}` : logMessage,
      });
    }
    setDateChangeDialog({ isOpen: false, field: null, newDate: null });
  };

  const DatePickerButton = ({
    date,
    onDateChange,
    placeholder = "Pick a date",
  }: {
    date: Date | null;
    onDateChange: (date: Date | undefined) => void;
    placeholder?: string;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-9",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date || undefined}
          onSelect={onDateChange}
          initialFocus
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );

  return (
    <>
      <div className="flex hover:bg-muted/50 transition-colors py-1 group">
        {/* Task Name */}
        <div className="px-4 py-3" style={{ width: columnWidths.taskName }}>
          {isEditingTask ? (
            <Input
              value={task.taskName}
              onChange={(e) => onUpdate(task.id, { taskName: e.target.value })}
              onBlur={() => setIsEditingTask(false)}
              autoFocus
              className="h-9 border-0 focus-visible:ring-1"
              placeholder="Enter task name"
            />
          ) : (
            <div
              onClick={() => setIsEditingTask(true)}
              className="min-h-[36px] px-3 py-2 text-sm cursor-text hover:bg-muted/50 rounded-md transition-colors"
            >
              {task.taskName ? (
                <div className="flex flex-wrap items-center gap-1">
                  {detectUrls(task.taskName).map((part, index) =>
                    part.type === "url" ? (
                      <a
                        key={index}
                        href={part.content}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        {part.content}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span key={index}>{part.content}</span>
                    )
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">Enter task name</span>
              )}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="px-4 py-3" style={{ width: columnWidths.status }}>
          <Select value={task.status} onValueChange={(value) => onUpdate(task.id, { status: value as Task["status"] })}>
            <SelectTrigger className="h-9 border-0 bg-transparent p-0 hover:bg-transparent focus:ring-0 shadow-none data-[placeholder]:text-muted-foreground">
              <SelectValue asChild>
                <Badge variant="outline" className={cn("font-medium px-2.5 py-0.5 text-xs w-fit whitespace-nowrap", getStatusBadgeVariant(task.status))}>
                  {task.status}
                </Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  <Badge variant="outline" className={cn("font-medium px-2.5 py-0.5 text-xs w-fit whitespace-nowrap", getStatusBadgeVariant(status))}>
                    {status}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Collaborators */}
        <div className="px-4 py-3" style={{ width: columnWidths.collaborators }}>
          <MultiSelect
            options={COLLABORATOR_OPTIONS}
            selected={task.collaborators}
            onChange={(value) => onUpdate(task.id, { collaborators: value })}
          />
        </div>

        {/* Dev Start Date */}
        <div className="px-4 py-3" style={{ width: columnWidths.devStartDate }}>
          <DatePickerButton
            date={task.devStartDate}
            onDateChange={(date) => handleDateChange("devStartDate", date)}
          />
        </div>

        {/* Dev Due Date */}
        <div className="px-4 py-3" style={{ width: columnWidths.devDueDate }}>
          <DatePickerButton
            date={task.devDueDate}
            onDateChange={(date) => handleDateChange("devDueDate", date)}
          />
        </div>

        {/* QA Start Date */}
        <div className="px-4 py-3" style={{ width: columnWidths.qaStartDate }}>
          <DatePickerButton
            date={task.qaStartDate}
            onDateChange={(date) => handleDateChange("qaStartDate", date)}
          />
        </div>

        {/* QA End Date */}
        <div className="px-4 py-3" style={{ width: columnWidths.qaEndDate }}>
          <DatePickerButton
            date={task.qaEndDate}
            onDateChange={(date) => handleDateChange("qaEndDate", date)}
          />
        </div>

        {/* Remarks */}
        <div className="px-4 py-3" style={{ width: columnWidths.remarks }}>
          <textarea
            value={task.remarks}
            onChange={(e) => onUpdate(task.id, { remarks: e.target.value })}
            className="w-full min-h-[36px] px-3 py-2 text-sm rounded-md border-0 bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            placeholder="Add remarks..."
            rows={3}
          />
        </div>

        {/* Committed Date */}
        <div className="px-4 py-3" style={{ width: columnWidths.committedDate }}>
          <DatePickerButton date={task.committedDate} onDateChange={handleCommittedDateChange} placeholder="Pick committed date" />
        </div>
      </div>

      <DateChangeDialog
        isOpen={dateChangeDialog.isOpen}
        onClose={() => setDateChangeDialog({ isOpen: false, field: null, newDate: null })}
        onConfirm={handleConfirmDateChange}
      />
    </>
  );
};

const getStatusBadgeVariant = (status: string) => {
  const variants: Record<string, string> = {
    "Not Started": "bg-muted text-muted-foreground border-muted-foreground/20",
    "In Progress": "bg-info/15 text-info border-info/20",
    "In Review": "bg-purple/15 text-purple border-purple/20",
    "Blocked": "bg-destructive/15 text-destructive border-destructive/20",
    "Completed": "bg-success/15 text-success border-success/20",
    "QA Testing": "bg-warning/15 text-warning border-warning/20",
    "Deployed": "bg-accent/15 text-accent border-accent/20",
  };
  return variants[status] || "bg-muted text-muted-foreground border-muted-foreground/20";
};
