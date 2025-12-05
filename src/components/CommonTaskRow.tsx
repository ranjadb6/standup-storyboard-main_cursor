import { useState } from "react";
import { CommonTask, COMMON_STATUS_OPTIONS, COLLABORATOR_OPTIONS } from "@/types/standupTask";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateChangeDialog } from "./DateChangeDialog";
import { LinkableTextarea } from "./LinkableTextarea";
import { MultiSelect } from "./MultiSelect";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";
import { GripVertical } from "lucide-react";

interface CommonTaskRowProps {
  task: CommonTask;
  onUpdate: (id: string, updates: Partial<CommonTask>) => void;
  onDelete: (id: string) => void;
  columnWidths: Record<string, number>;
  columnOrder: string[];
}

export const CommonTaskRow = ({ task, onUpdate, onDelete, columnWidths, columnOrder }: CommonTaskRowProps) => {


  const [dateChangeDialog, setDateChangeDialog] = useState<{
    isOpen: boolean;
    field: keyof CommonTask | null;
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

  const handleDateChange = (field: keyof CommonTask, date: Date | undefined) => {
    if (!date) {
      onUpdate(task.id, { [field]: null });
      return;
    }

    const currentDate = task[field] as Date | null;
    if (currentDate) {
      setDateChangeDialog({ isOpen: true, field, newDate: date });
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


  const startOfDay = (value: Date) => {
    const copy = new Date(value);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };

  const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

  const isNextWorkingDay = (date: Date | null) => {
    if (!date) return false;
    const today = startOfDay(new Date());
    const nextWorkingDay = () => {
      const next = new Date(today);
      do {
        next.setDate(next.getDate() + 1);
      } while (isWeekend(next));
      return next;
    };
    return startOfDay(date).getTime() === nextWorkingDay().getTime();
  };

  const countWorkingDaysUntil = (from: Date, to: Date) => {
    if (to <= from) return 0;
    const current = new Date(from);
    let days = 0;
    while (current < to) {
      current.setDate(current.getDate() + 1);
      if (!isWeekend(current)) {
        days += 1;
      }
    }
    return days;
  };

  const isRowCritical = (() => {
    if (!task.committedDate) return false;
    if (task.status === "Ready For Release") return false;
    const today = startOfDay(new Date());
    const committed = startOfDay(task.committedDate);
    if (committed <= today) {
      return true;
    }
    const workingDaysDifference = countWorkingDaysUntil(today, committed);
    return workingDaysDifference <= 5;
  })();

  const DatePickerButton = ({
    date,
    onDateChange,
    placeholder = "Pick a date",
    highlight = false,
  }: {
    date: Date | null;
    onDateChange: (date: Date | undefined) => void;
    placeholder?: string;
    highlight?: boolean;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-9",
            !date && "text-muted-foreground",
            highlight && "bg-yellow-100 border-yellow-400 text-yellow-900 hover:bg-yellow-100/80"
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

  // Helper function to render individual cells
  const renderCell = (columnId: string) => {
    switch (columnId) {
      case "adoId":
        return (
          <div key="adoId" className="px-4 py-3 border-r border-black/20 shrink-0" style={{ width: columnWidths.adoId }}>
            <Input
              value={task.adoId}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/\D/g, "").slice(0, 9);
                onUpdate(task.id, { adoId: numericValue });
              }}
              inputMode="numeric"
              maxLength={9}
              className="h-9"
              placeholder="Enter ADO ID"
            />
          </div>
        );
      case "taskName":
        return (
          <div key="taskName" className="px-4 py-3 border-r border-black/20 shrink-0" style={{ width: columnWidths.taskName }}>
            <LinkableTextarea
              value={task.taskName}
              onChange={(value) => onUpdate(task.id, { taskName: value })}
              placeholder="Enter task name..."
            />
          </div>
        );
      case "status":
        return (
          <div key="status" className="px-4 py-3 border-r border-black/20 shrink-0" style={{ width: columnWidths.status }}>
            <Select value={task.status} onValueChange={(value) => onUpdate(task.id, { status: value as CommonTask["status"] })}>
              <SelectTrigger className="h-9 border-0 bg-transparent p-0 hover:bg-transparent focus:ring-0 shadow-none data-[placeholder]:text-muted-foreground">
                <SelectValue asChild>
                  <Badge variant="outline" className={cn("font-medium px-2.5 py-0.5 text-xs w-fit whitespace-nowrap", getStatusBadgeVariant(task.status))}>
                    {task.status}
                  </Badge>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="z-50">
                {COMMON_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    <Badge variant="outline" className={cn("font-medium px-2.5 py-0.5 text-xs w-fit whitespace-nowrap", getStatusBadgeVariant(status))}>
                      {status}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case "collaborators":
        return (
          <div key="collaborators" className="px-4 py-3 border-r border-black/20 shrink-0" style={{ width: columnWidths.collaborators }}>
            <MultiSelect
              options={COLLABORATOR_OPTIONS}
              selected={task.collaborators}
              onChange={(value) => onUpdate(task.id, { collaborators: value })}
            />
          </div>
        );
      case "devStartDate":
        return (
          <div key="devStartDate" className="px-4 py-3 border-r border-black/20 shrink-0" style={{ width: columnWidths.devStartDate }}>
            <DatePickerButton date={task.DevStartDate}
              onDateChange={(date) => handleDateChange("DevStartDate", date)} />
          </div>
        );
      case "devDueDate":
        return (
          <div key="devDueDate" className="px-4 py-3 border-r border-black/20 shrink-0" style={{ width: columnWidths.devDueDate }}>
            <DatePickerButton
              date={task.DevDueDate}
              onDateChange={(date) => handleDateChange("DevDueDate", date)}
              highlight={isNextWorkingDay(task.DevDueDate)}
            />
          </div>
        );
      case "qaStartDate":
        return (
          <div key="qaStartDate" className="px-4 py-3 border-r border-black/20 shrink-0" style={{ width: columnWidths.qaStartDate }}>
            <DatePickerButton
              date={task.QAStartDate}
              onDateChange={(date) => handleDateChange("QAStartDate", date)}
              highlight={isNextWorkingDay(task.QAStartDate)}
            />
          </div>
        );
      case "qaEndDate":
        return (
          <div key="qaEndDate" className="px-4 py-3 border-r border-black/20 shrink-0" style={{ width: columnWidths.qaEndDate }}>
            <DatePickerButton
              date={task.QAEndDate}
              onDateChange={(date) => handleDateChange("QAEndDate", date)}
              highlight={isNextWorkingDay(task.QAEndDate)}
            />
          </div>
        );
      case "remarks":
        return (
          <div key="remarks" className="px-4 py-3 border-r border-black/20 shrink-0" style={{ width: columnWidths.remarks }}>
            <LinkableTextarea
              value={task.remarks}
              onChange={(value) => onUpdate(task.id, { remarks: value })}
              placeholder="Add remarks..."
            />
          </div>
        );
      case "committedDate":
        return (
          <div key="committedDate" className="px-4 py-3 border-r border-black/20 shrink-0" style={{ width: columnWidths.committedDate }}>
            <DatePickerButton date={task.committedDate} onDateChange={handleCommittedDateChange} placeholder="Pick committed date" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex transition-colors py-1 group",
          isRowCritical ? "bg-red-100/70 hover:bg-red-100/70" : "hover:bg-muted/50"
        )}
      >
        <div className="flex text-sm">
          {/* Drag Handle Column */}
          <div className="px-0 py-0 border-r border-black/20 shrink-0" style={{ width: 0 }}>
          </div>

          {/* Dynamic Columns */}
          {columnOrder.map(renderCell)}

          {/* Actions */}
          <div className="px-4 py-3 flex items-center shrink-0" style={{ width: columnWidths.actions }}>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the task.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(task.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
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
    "Not Started": "bg-muted text-muted-foreground border-muted-foreground/20 dark:bg-muted/50",
    "In Solutioning": "bg-info/15 text-info border-info/20 dark:bg-info/25",
    "Solutioned": "bg-success/15 text-success border-success/20 dark:bg-success/25",
    "Dev in Progress": "bg-info/15 text-info border-info/20 dark:bg-info/25",
    "Dev Complete": "bg-success/15 text-success border-success/20 dark:bg-success/25",
    "Handed Over To QA": "bg-purple/15 text-purple border-purple/20 dark:bg-purple/25",
    "QA In Progress": "bg-warning/15 text-warning border-warning/20 dark:bg-warning/25",
    "QA Complete": "bg-success/15 text-success border-success/20 dark:bg-success/25",
    "Ready For Release": "bg-accent/15 text-accent border-accent/20 dark:bg-accent/25",
    "Released To Prod": "bg-success/15 text-success border-success/20 dark:bg-success/25",
    "On Hold": "bg-warning/15 text-warning border-warning/20 dark:bg-warning/25",
    "Waiting for Approval from Product": "bg-orange/15 text-orange border-orange/20 dark:bg-orange/25",
    "Deprioritised": "bg-muted text-muted-foreground border-muted-foreground/20 dark:bg-muted/50",
    "Scrapped": "bg-destructive/15 text-destructive border-destructive/20 dark:bg-destructive/25",
    "Removed": "bg-destructive/15 text-destructive border-destructive/20 dark:bg-destructive/25",
    "Complete": "bg-success/15 text-success border-success/20 dark:bg-success/25",
  };
  return variants[status] || "bg-muted text-muted-foreground border-muted-foreground/20 dark:bg-muted/50";
};
