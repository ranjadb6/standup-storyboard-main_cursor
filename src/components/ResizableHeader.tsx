import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";

interface ResizableHeaderProps {
    title?: string;
    width: number;
    onResize: (e: any, data: any) => void;
    className?: string;
    children?: React.ReactNode;
}

export const ResizableHeader = ({ title, width, onResize, className, children }: ResizableHeaderProps) => {
    return (
        <Resizable
            width={width}
            height={0}
            onResize={onResize}
            axis="x"
            resizeHandles={["e"]}
            className="h-full"
            handle={
                <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 transition-colors z-10"
                />
            }
        >
            <div className={`px-4 py-3 text-sm font-semibold text-foreground relative text-center flex items-center justify-center shrink-0 ${className}`} style={{ width, height: '100%' }}>
                {children || title}
            </div>
        </Resizable>
    );
};
