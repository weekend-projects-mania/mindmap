import { useState } from "react";
import { MindmapNode as NodeType } from "@/types/mindmap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
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
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-6 px-1 py-0 text-sm"
          autoFocus
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
          {!isRoot && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
