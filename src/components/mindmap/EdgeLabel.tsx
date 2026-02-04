import { useState, useRef, useEffect } from "react";

interface EdgeLabelProps {
  nodeId: string;
  label: string;
  x: number;
  y: number;
  onUpdateLabel: (label: string) => void;
}

export const EdgeLabel = ({
  nodeId,
  label,
  x,
  y,
  onUpdateLabel,
}: EdgeLabelProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditLabel(label);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editLabel !== label) {
      onUpdateLabel(editLabel);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditLabel(label);
    }
  };

  if (isEditing) {
    return (
      <foreignObject
        x={x - 50}
        y={y - 10}
        width={100}
        height={20}
      >
        <input
          ref={inputRef}
          value={editLabel}
          onChange={(e) => setEditLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="Label..."
          className="w-full h-full text-xs text-center bg-background border rounded px-1 outline-none focus:ring-1 focus:ring-primary"
          style={{ fontSize: "11px" }}
        />
      </foreignObject>
    );
  }

  return (
    <g 
      onDoubleClick={handleDoubleClick} 
      style={{ cursor: "pointer" }}
      className="select-none"
    >
      {/* Invisible larger hit area */}
      <rect
        x={x - 30}
        y={y - 10}
        width={60}
        height={20}
        fill="transparent"
        style={{ pointerEvents: 'all' }}
      />
      {label ? (
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs fill-muted-foreground select-none"
          style={{ fontSize: "11px", pointerEvents: 'none' }}
        >
          {label}
        </text>
      ) : (
        <rect
          x={x - 4}
          y={y - 4}
          width={8}
          height={8}
          rx={1}
          className="fill-muted-foreground/20 hover:fill-primary/40 transition-colors"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </g>
  );
};
