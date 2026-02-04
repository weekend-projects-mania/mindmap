import { useState, useRef, useEffect } from "react";
import { FloatingNote } from "@/types/mindmap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingNoteComponentProps {
  note: FloatingNote;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdateTitle: (title: string) => void;
  onUpdatePosition: (position: { x: number; y: number }) => void;
  scale: number;
}

export const FloatingNoteComponent = ({
  note,
  isSelected,
  onSelect,
  onDelete,
  onUpdateTitle,
  onUpdatePosition,
  scale,
}: FloatingNoteComponentProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditTitle(note.title);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editTitle.trim() && editTitle !== note.title) {
      onUpdateTitle(editTitle.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditTitle(note.title);
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
      ref={nodeRef}
      className={cn(
        "absolute group flex items-center gap-1 px-3 py-2 rounded-lg border-2 bg-accent/50 shadow-sm transition-colors duration-200 min-w-[120px] max-w-[200px]",
        isSelected
          ? "border-primary ring-2 ring-primary/20 shadow-md"
          : "border-dashed border-muted-foreground/30 hover:border-muted-foreground/50",
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
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
    >
      {/* Drag handle */}
      <div className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50">
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>

      {/* Title */}
      {isEditing ? (
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-6 px-1 py-0 text-sm"
          autoFocus
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="text-sm font-medium truncate flex-1">{note.title}</span>
      )}

      {/* Delete button */}
      {isHovered && !isEditing && (
        <div className="flex items-center gap-0.5 ml-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};
