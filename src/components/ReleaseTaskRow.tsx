import { useState, useRef, useLayoutEffect } from "react";
import { ReleaseTask, RELEASE_STATUS_OPTIONS, SERVICE_OPTIONS } from "@/types/standupTask";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Trash2, CalendarIcon } from "lucide-react";
import { MultiSelect } from "./MultiSelect";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateChangeDialog } from "./DateChangeDialog";
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

interface ReleaseTaskRowProps {
  task: ReleaseTask;
  onUpdate: (id: string, updates: Partial<ReleaseTask>) => void;
  onDelete: (id: string) => void;
  columnWidths: Record<string, number>;
}

const ServicesMultiSelect = ({
  options,
  initialSelected,
  onCommit,
}: {
  options: string[];
  initialSelected: string[];
  onCommit: (value: string[]) => void;
}) => {
  const [selected, setSelected] = useState(initialSelected);

  // Sync with prop if it changes externally (and not just because we committed)
  // This is a bit tricky, but for now let's assume initialSelected is the source of truth
  // when the dropdown is closed.
  // Actually, we can just reset local state when the dropdown opens/closes if needed,
  // or just keep them in sync.
  if (JSON.stringify(initialSelected) !== JSON.stringify(selected)) {
    // This might cause infinite loops if not careful.
    // Better approach: use key to reset component or useEffect.
  }

  return (
    <MultiSelect
      options={options}
      selected={selected}
      onChange={setSelected}
      placeholder="Not Started"
      onOpenChange={(open) => {
        if (!open) {
          // Commit on close
          if (JSON.stringify(selected) !== JSON.stringify(initialSelected)) {
            onCommit(selected);
          }
        } else {
          // Reset to prop value on open to ensure freshness
          setSelected(initialSelected);
        }
      }}
    />
  );
};

export const ReleaseTaskRow = ({ task, onUpdate, onDelete, columnWidths }: ReleaseTaskRowProps) => {
  const itemRef = useRef<HTMLTextAreaElement>(null);
  const remarksRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (itemRef.current) {
      itemRef.current.style.height = "auto";
      itemRef.current.style.height = `${itemRef.current.scrollHeight}px`;
    }
  }, [task.item]);

  useLayoutEffect(() => {
    if (remarksRef.current) {
      remarksRef.current.style.height = "auto";
      remarksRef.current.style.height = `${remarksRef.current.scrollHeight}px`;
    }
  }, [task.remarks]);

  const [isEditingAdoId, setIsEditingAdoId] = useState(false);
  const [isEditingCrLink, setIsEditingCrLink] = useState(false);
  const [isEditingJmdbId, setIsEditingJmdbId] = useState(false);

  // Local state for inputs
  const [localAdoId, setLocalAdoId] = useState(task.adoId);
  const [localCrLink, setLocalCrLink] = useState(task.crLink);
  const [localJmdbId, setLocalJmdbId] = useState(task.jmdbId);

  // Sync local state when task prop changes (unless editing)
  if (!isEditingAdoId && localAdoId !== task.adoId) setLocalAdoId(task.adoId);
  if (!isEditingCrLink && localCrLink !== task.crLink) setLocalCrLink(task.crLink);
  if (!isEditingJmdbId && localJmdbId !== task.jmdbId) setLocalJmdbId(task.jmdbId);

  const [dateChangeDialog, setDateChangeDialog] = useState<{
    isOpen: boolean;
    field: keyof ReleaseTask | null;
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

  const handleConfirmDateChange = (reason: string) => {
    if (dateChangeDialog.field && dateChangeDialog.newDate) {
      const currentTimestamp = format(new Date(), "PPP p");
      const oldDate = task[dateChangeDialog.field] as Date | null;
      const oldDateFormatted = oldDate ? format(oldDate, "PPP") : "N/A";
      const newDateFormatted = format(dateChangeDialog.newDate, "PPP");
      const logMessage = `[${currentTimestamp}] : Committed date changed from ${oldDateFormatted} to ${newDateFormatted} with Reason : ${reason}`;

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
        <div className="flex text-sm w-full">
          {/* set to zero by manas Drag Handle Column */}
          <div className="w-0 px-0 py-0 border-r border-black/20 shrink-0"></div>

          {/* ADO ID */}
          <div className="px-4 py-3 border-r border-black/20 shrink-0" style={{ width: columnWidths.adoId }}>
            {isEditingAdoId ? (
              <Input
                value={localAdoId}
                onChange={(e) => setLocalAdoId(e.target.value)}
                onBlur={() => {
                  setIsEditingAdoId(false);
                  if (localAdoId !== task.adoId) {
                    onUpdate(task.id, { adoId: localAdoId });
                  }
                }}
                autoFocus
                className="h-9 border-0 focus-visible:ring-1"
                placeholder="ADO ID"
              />
            ) : (
              <div
                onClick={() => setIsEditingAdoId(true)}
                className="min-h-[36px] px-3 py-2 text-sm cursor-text hover:bg-muted/50 rounded-md transition-colors"
              >
                {task.adoId || <span className="text-muted-foreground">ADO ID</span>}
              </div>
            )}
          </div>

          {/* Feature / Item */}
          <div className="px-4 py-3 border-r border-black/20 shrink-0" style={{ width: columnWidths.item }}>
            <textarea
              ref={itemRef}
              value={task.item}
              onChange={(e) => onUpdate(task.id, { item: e.target.value })}
              className="w-full min-h-[36px] px-3 py-2 text-sm rounded-md border-0 bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none overflow-hidden"
              placeholder="Enter feature name..."
              rows={1}
            />
          </div>

          {/* Status (Multi-select) */}
          <div className="px-4 py-3 shrink-0" style={{ width: columnWidths.status }}>
            <MultiSelect
              options={RELEASE_STATUS_OPTIONS}
              selected={task.status}
              onChange={(value) => onUpdate(task.id, { status: value as ReleaseTask["status"] })}
              placeholder="Not Started"
              getBadgeClassName={getStatusBadgeClassName}
            />
          </div>

          {/* CR Link */}
          <div className="px-4 py-3 border-r border-black/20 shrink-0" style={{ width: columnWidths.crLink }}>
            {isEditingCrLink ? (
              <Input
                value={localCrLink}
                onChange={(e) => setLocalCrLink(e.target.value)}
                onBlur={() => {
                  setIsEditingCrLink(false);
                  if (localCrLink !== task.crLink) {
                    onUpdate(task.id, { crLink: localCrLink });
                  }
                }}
                autoFocus
                className="h-9 border-0 focus-visible:ring-1"
                placeholder="Enter CR link"
              />
            ) : (
              <div
                onClick={() => setIsEditingCrLink(true)}
                className="min-h-[36px] px-3 py-2 text-sm cursor-text hover:bg-muted/50 rounded-md transition-colors break-all"
              >
                {task.crLink ? (
                  <a
                    href={task.crLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-primary hover:underline z-10"
                  >
                    {task.crLink}
                  </a>
                ) : (
                  <span className="text-muted-foreground">Enter CR link</span>
                )}
              </div>
            )}
          </div>

          {/* JMDB ID */}
          <div className="px-4 py-3 border-r border-black/20 shrink-0" style={{ width: columnWidths.jmdbId }}>
            {isEditingJmdbId ? (
              <Input
                value={localJmdbId}
                onChange={(e) => setLocalJmdbId(e.target.value)}
                onBlur={() => {
                  setIsEditingJmdbId(false);
                  if (localJmdbId !== task.jmdbId) {
                    onUpdate(task.id, { jmdbId: localJmdbId });
                  }
                }}
                autoFocus
                className="h-9 border-0 focus-visible:ring-1"
                placeholder="Enter JMDB ID"
              />
            ) : (
              <div
                onClick={() => setIsEditingJmdbId(true)}
                className="min-h-[36px] px-3 py-2 text-sm cursor-text hover:bg-muted/50 rounded-md transition-colors"
              >
                {task.jmdbId || <span className="text-muted-foreground">Enter JMDB ID</span>}
              </div>
            )}
          </div>

          {/* Services (Multi-select) */}
          <div className="px-4 py-3 shrink-0" style={{ width: columnWidths.services }}>
            <ServicesMultiSelect
              options={SERVICE_OPTIONS}
              initialSelected={task.services}
              onCommit={(value) => onUpdate(task.id, { services: value })}
            />
          </div>

          {/* Remarks */}
          <div className="px-4 py-3 border-r border-black/20 shrink-0" style={{ width: columnWidths.remarks }}>
            <textarea
              ref={remarksRef}
              value={task.remarks}
              onChange={(e) => onUpdate(task.id, { remarks: e.target.value })}
              className="w-full min-h-[36px] px-3 py-2 text-sm rounded-md border-0 bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none overflow-hidden"
              placeholder="Add remarks..."
              rows={1}
            />
          </div>

          {/* Committed Date */}
          <div className="px-4 py-3 border-r border-black/20 shrink-0" style={{ width: columnWidths.committedDate }}>
            <DatePickerButton date={task.committedDate} onDateChange={handleCommittedDateChange} placeholder="Pick committed date" />
          </div>

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

const getStatusBadgeClassName = (status: string) => {
  const variants: Record<string, string> = {
    "Not Started": "bg-muted text-muted-foreground border-muted-foreground/20 dark:bg-muted/50",
    "Dev In Progress": "bg-info/15 text-info border-info/20 dark:bg-info/25",
    "Dev Complete": "bg-success/15 text-success border-success/20 dark:bg-success/25",
    "QA In Progress": "bg-warning/15 text-warning border-warning/20 dark:bg-warning/25",
    "QA Complete": "bg-success/15 text-success border-success/20 dark:bg-success/25",
    "Ready For Release": "bg-accent/15 text-accent border-accent/20 dark:bg-accent/25",
    "Released To Prod": "bg-success/15 text-success border-success/20 dark:bg-success/25",
    "On Hold": "bg-warning/15 text-warning border-warning/20 dark:bg-warning/25",
    "Deprioritised": "bg-muted text-muted-foreground border-muted-foreground/20 dark:bg-muted/50",
    "Scrapped": "bg-destructive/15 text-destructive border-destructive/20 dark:bg-destructive/25",
  };
  return variants[status] || "bg-muted text-muted-foreground border-muted-foreground/20 dark:bg-muted/50";
};
