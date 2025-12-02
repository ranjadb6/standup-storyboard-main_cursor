import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface SortableRowProps {
    id: string;
    children: React.ReactNode;
}

export const SortableRow = ({ id, children }: SortableRowProps) => {
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
        position: "relative" as const,
    };

    return (
        <div ref={setNodeRef} style={style} className={isDragging ? "opacity-50" : ""}>
            <div className="flex items-center">
                <div
                    {...attributes}
                    {...listeners}
                    className="px-2 py-4 cursor-grab hover:text-primary text-muted-foreground transition-colors flex items-center justify-center h-full"
                >
                    <GripVertical className="h-4 w-4" />
                </div>
                <div className="flex-1">{children}</div>
            </div>
        </div>
    );
};
