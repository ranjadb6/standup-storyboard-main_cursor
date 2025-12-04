import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { ResizableHeader } from "./ResizableHeader";
import { cn } from "@/lib/utils";

interface SortableHeaderProps {
    id: string;
    title: string;
    width: number;
    onResize: (e: any, data: any) => void;
    className?: string;
}

export const SortableHeader = ({
    id,
    title,
    width,
    onResize,
    className,
}: SortableHeaderProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn("relative inline-block", isDragging && "opacity-50")}
        >
            <ResizableHeader
                width={width}
                onResize={onResize}
                className={className}
            >
                <div className="flex items-center gap-1 w-full">
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing hover:text-primary flex-shrink-0"
                    >
                        <GripVertical className="h-3 w-3" />
                    </div>
                    <span className="flex-1 text-center">{title}</span>
                </div>
            </ResizableHeader>
        </div>
    );
};
