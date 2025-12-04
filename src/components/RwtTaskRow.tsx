import { useState, useRef, useLayoutEffect } from "react";
import { RwtTask, RWT_STATUS_OPTIONS, COLLABORATOR_OPTIONS } from "@/types/standupTask";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Trash2, CalendarIcon } from "lucide-react";
import { MultiSelect } from "./MultiSelect";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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

interface RwtTaskRowProps {
    task: RwtTask;
    onUpdate: (id: string, updates: Partial<RwtTask>) => void;
    onDelete: (id: string) => void;
    columnWidths: Record<string, number>;
    columnOrder: string[];
}

export const RwtTaskRow = ({ task, onUpdate, onDelete, columnWidths, columnOrder }: RwtTaskRowProps) => {
    const featureRef = useRef<HTMLTextAreaElement>(null);
    const remarksRef = useRef<HTMLTextAreaElement>(null);

    useLayoutEffect(() => {
        if (featureRef.current) {
            featureRef.current.style.height = "auto";
            featureRef.current.style.height = `${featureRef.current.scrollHeight}px`;
        }
    }, [task.feature]);

    useLayoutEffect(() => {
        if (remarksRef.current) {
            remarksRef.current.style.height = "auto";
            remarksRef.current.style.height = `${remarksRef.current.scrollHeight}px`;
        }
    }, [task.remarks]);

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

    const getStatusBadgeVariant = (status: string) => {
        return status === "RWT Completed"
            ? "bg-success/15 text-success border-success/20 dark:bg-success/25"
            : "bg-warning/15 text-warning border-warning/20 dark:bg-warning/25";
    };


    // Helper function to render individual cells
    const renderCell = (columnId: string) => {
        switch (columnId) {
            case "feature":
                return (
                    <div key="feature" className="px-4 py-3 border-r border-black/20 shrink-0" style={{ width: columnWidths.feature }}>
                        <textarea
                            ref={featureRef}
                            value={task.feature}
                            onChange={(e) => onUpdate(task.id, { feature: e.target.value })}
                            className="w-full min-h-[36px] px-3 py-2 text-sm rounded-md border-0 bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none overflow-hidden"
                            placeholder="Enter feature name..."
                            rows={1}
                        />
                    </div>
                );
            case "status":
                return (
                    <div key="status" className="px-4 py-3 border-r border-black/20 shrink-0" style={{ width: columnWidths.status }}>
                        <Select
                            value={task.status}
                            onValueChange={(value) => onUpdate(task.id, { status: value as RwtTask["status"] })}
                        >
                            <SelectTrigger className="h-9 border-0 bg-transparent p-0 hover:bg-transparent focus:ring-0 shadow-none data-[placeholder]:text-muted-foreground">
                                <SelectValue asChild>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "font-medium px-2.5 py-0.5 text-xs w-fit whitespace-nowrap",
                                            getStatusBadgeVariant(task.status)
                                        )}
                                    >
                                        {task.status}
                                    </Badge>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {RWT_STATUS_OPTIONS.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "font-medium px-2.5 py-0.5 text-xs w-fit whitespace-nowrap",
                                                getStatusBadgeVariant(status)
                                            )}
                                        >
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
                            placeholder="Select collaborators..."
                        />
                    </div>
                );
            case "startDate":
                return (
                    <div key="startDate" className="px-4 py-3 border-r border-black/20 shrink-0" style={{ width: columnWidths.startDate }}>
                        <DatePickerButton
                            date={task.startDate}
                            onDateChange={(date) => onUpdate(task.id, { startDate: date || null })}
                            placeholder="Start date"
                        />
                    </div>
                );
            case "endDate":
                return (
                    <div key="endDate" className="px-4 py-3 border-r border-black/20 shrink-0" style={{ width: columnWidths.endDate }}>
                        <DatePickerButton
                            date={task.endDate}
                            onDateChange={(date) => onUpdate(task.id, { endDate: date || null })}
                            placeholder="End date"
                        />
                    </div>
                );
            case "remarks":
                return (
                    <div key="remarks" className="px-4 py-3 border-r border-black/20 shrink-0" style={{ width: columnWidths.remarks }}>
                        <textarea
                            ref={remarksRef}
                            value={task.remarks}
                            onChange={(e) => onUpdate(task.id, { remarks: e.target.value })}
                            className="w-full min-h-[36px] px-3 py-2 text-sm rounded-md border-0 bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none overflow-hidden"
                            placeholder="Add remarks..."
                            rows={1}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex hover:bg-muted/50 transition-colors py-1 group">
            <div className="flex text-sm w-full">
                {/* Drag Handle Column */}
                <div className="w-0 px-0 py-0 border-r border-black/20 shrink-0"></div>

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
                                <AlertDialogAction
                                    onClick={() => onDelete(task.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
    );
};
