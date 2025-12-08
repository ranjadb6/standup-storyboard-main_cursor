import { useState, useRef, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.bubble.css";
import { cn } from "@/lib/utils";

interface LinkableTextareaProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
}

export const LinkableTextarea = ({
    value,
    onChange,
    placeholder,
    className,
    minHeight = "36px",
}: LinkableTextareaProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const quillRef = useRef<ReactQuill>(null);

    // Focus quill when entering edit mode
    useEffect(() => {
        if (isEditing && quillRef.current) {
            quillRef.current.focus();
        }
    }, [isEditing]);

    const handleBlur = () => {
        // Small delay to allow click events on toolbar to propagate
        setTimeout(() => {
            setIsEditing(false);
        }, 200);
    };

    const modules = {
        toolbar: [
            ["bold", "italic", "underline", "strike"],
            ["link"],
            ["clean"],
        ],
    };

    const renderContent = (content: string) => {
        if (!content) return <span className="text-muted-foreground">{placeholder}</span>;

        // Check if content contains any HTML tags
        const isHtml = /<[a-z]+\b[^>]*>/i.test(content);

        if (isHtml) {
            return (
                <div
                    className="prose prose-sm max-w-none dark:prose-invert [&>p]:m-0 [&>p]:leading-normal [&>a]:text-primary [&>a]:underline [&>a]:z-10 [&>a]:relative"
                    dangerouslySetInnerHTML={{ __html: content }}
                    onClick={(e) => {
                        // Prevent switching to edit mode if clicking a link
                        if ((e.target as HTMLElement).tagName === 'A') {
                            e.stopPropagation();
                        }
                    }}
                />
            );
        }

        // Fallback for plain text (legacy support)
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = content.split(urlRegex);

        return parts.map((part, index) => {
            if (part.match(urlRegex)) {
                return (
                    <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline z-10 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    if (isEditing) {
        return (
            <div className={cn("relative w-full", className)} onBlur={handleBlur}>
                <ReactQuill
                    ref={quillRef}
                    theme="bubble"
                    value={value}
                    onChange={onChange}
                    modules={modules}
                    className="bg-background border rounded-md focus-within:ring-1 focus-within:ring-ring"
                    placeholder={placeholder}
                />
            </div>
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={cn(
                "w-full px-3 py-2 text-sm rounded-md cursor-text hover:bg-muted/50 transition-colors whitespace-pre-wrap break-words min-h-[36px]",
                !value && "text-muted-foreground",
                className
            )}
            style={{ minHeight }}
        >
            {renderContent(value)}
        </div>
    );
};
