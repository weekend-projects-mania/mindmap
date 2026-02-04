import { useState, useEffect, useRef } from "react";
import { MindmapNode as NodeType } from "@/types/mindmap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronRight,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MindmapNodeProps {
  node: NodeType;
  isSelected: boolean;
  isRoot: boolean;
  onSelect: () => void;
  onAddChild: () => void;
  onDelete: () => void;
  onToggleCollapse: () => void;
  onUpdateTitle: (title: string) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  hasChildren: boolean;
}

export const MindmapNodeComponent = ({
  node,
  isSelected,
  isRoot,
  onSelect,
  onAddChild,
  onDelete,
  onToggleCollapse,
  onUpdateTitle,
  onDragStart,
  onDragOver,
  onDrop,
  hasChildren,
}: MindmapNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for typing when selected to enter edit mode
  useEffect(() => {
    if (!isSelected || isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in another input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // Ignore modifier keys, navigation, and special keys
      if (
        e.metaKey || e.ctrlKey || e.altKey ||
        e.key === "Tab" || e.key === "Enter" || e.key === "Escape" ||
        e.key === "Delete" || e.key === "Backspace" ||
        e.key.startsWith("Arrow") || e.key.startsWith("F")
      ) {
        return;
      }

      // Only trigger for printable characters (single character keys)
      if (e.key.length === 1) {
        e.preventDefault();
        setEditTitle(e.key);
        setIsEditing(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSelected, isEditing]);

  // Focus and select input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditTitle(node.title);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editTitle.trim() && editTitle !== node.title) {
      onUpdateTitle(editTitle.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditTitle(node.title);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    onDragOver(e);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    setIsDragOver(false);
    onDrop(e);
  };

  return (
    <div
      className={cn(
        "relative group flex items-center gap-1 px-3 py-2 rounded-lg border-2 bg-card shadow-sm transition-all duration-200 cursor-pointer min-w-[120px] max-w-[200px]",
        isSelected
          ? "border-primary ring-2 ring-primary/20 shadow-md"
          : "border-border hover:border-muted-foreground/30",
        isDragOver && "border-primary/50 bg-primary/5"
      )}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={!isRoot && !isEditing}
      onDragStart={onDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >

      {/* Collapse button */}
      {hasChildren && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 p-0 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
        >
          {node.collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      )}

      {/* Title */}
      {isEditing ? (
        <Input
          ref={inputRef}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-6 px-1 py-0 text-sm"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="text-sm font-medium truncate flex-1">{node.title}</span>
      )}

      {/* Actions */}
      {isHovered && !isEditing && (
        <div className="flex items-center gap-0.5 ml-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild();
            }}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};
