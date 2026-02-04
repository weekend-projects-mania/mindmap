import { useState, useRef, useEffect } from "react";
import { FloatingNote } from "@/types/mindmap";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingNoteComponentProps {
  note: FloatingNote;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdateContent: (content: string) => void;
  onUpdatePosition: (position: { x: number; y: number }) => void;
  scale: number;
}

export const FloatingNoteComponent = ({
  note,
  isSelected,
  onSelect,
  onDelete,
  onUpdateContent,
  onUpdatePosition,
  scale,
}: FloatingNoteComponentProps) => {
  const [isEditing, setIsEditing] = useState(!note.content);
  const [editContent, setEditContent] = useState(note.content);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editContent]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editContent.trim() !== note.content) {
      onUpdateContent(editContent.trim());
    }
    // Delete if empty
    if (!editContent.trim()) {
      onDelete();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditContent(note.content);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX / scale - note.position.x,
      y: e.clientY / scale - note.position.y,
    });
    onSelect();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX / scale - dragStart.x;
      const newY = e.clientY / scale - dragStart.y;
      onUpdatePosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart, scale, onUpdatePosition]);

  return (
    <div
      className={cn(
        "absolute group",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      style={{
        left: note.position.x,
        top: note.position.y,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditContent(note.content);
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Delete button */}
      <button
        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full p-0.5 hover:bg-destructive/90"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <X className="h-3 w-3" />
      </button>

      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="Add a comment..."
          className="bg-transparent border-none outline-none resize-none text-sm text-foreground/80 italic min-w-[100px] max-w-[250px] p-1 rounded focus:ring-1 focus:ring-primary/30"
          rows={1}
        />
      ) : (
        <p
          className={cn(
            "text-sm italic text-foreground/70 max-w-[250px] whitespace-pre-wrap p-1 rounded transition-colors",
            isSelected && "bg-primary/10 ring-1 ring-primary/30"
          )}
        >
          {note.content || "Add a comment..."}
        </p>
      )}
    </div>
  );
};
