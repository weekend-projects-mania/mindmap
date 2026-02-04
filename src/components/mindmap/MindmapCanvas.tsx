import { useRef, useState, useCallback, useEffect } from "react";
import { Mindmap, MindmapNode, FloatingNote } from "@/types/mindmap";
import { MindmapNodeComponent } from "./MindmapNode";
import { FloatingNoteComponent } from "./FloatingNoteComponent";
import { cn } from "@/lib/utils";
import { Maximize2 } from "lucide-react";

interface MindmapCanvasProps {
  mindmap: Mindmap;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onAddChild: (parentId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateNode: (nodeId: string, updates: Partial<MindmapNode>) => void;
  onToggleCollapse: (nodeId: string) => void;
  onMoveNode: (nodeId: string, newParentId: string) => void;
  onAddFloatingNote: (position: { x: number; y: number }) => void;
  onUpdateFloatingNote: (noteId: string, updates: Partial<FloatingNote>) => void;
  onDeleteFloatingNote: (noteId: string) => void;
}

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const NODE_WIDTH = 160;
const NODE_HEIGHT = 44;
const HORIZONTAL_GAP = 40;
const VERTICAL_GAP = 60;

export const MindmapCanvas = ({
  mindmap,
  selectedNodeId,
  onSelectNode,
  onAddChild,
  onDeleteNode,
  onUpdateNode,
  onToggleCollapse,
  onMoveNode,
  onAddFloatingNote,
  onUpdateFloatingNote,
  onDeleteFloatingNote,
}: MindmapCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  // Calculate tree layout
  const calculateLayout = useCallback((): Map<string, LayoutNode> => {
    const positions = new Map<string, LayoutNode>();
    const rootNode = mindmap.nodes[mindmap.rootNodeId];
    if (!rootNode) return positions;

    const getSubtreeWidth = (nodeId: string): number => {
      const node = mindmap.nodes[nodeId];
      if (!node || node.collapsed || node.children.length === 0) {
        return NODE_WIDTH;
      }
      const childrenWidth = node.children.reduce(
        (sum, childId) => sum + getSubtreeWidth(childId) + HORIZONTAL_GAP,
        -HORIZONTAL_GAP
      );
      return Math.max(NODE_WIDTH, childrenWidth);
    };

    const layoutNode = (nodeId: string, x: number, y: number) => {
      const node = mindmap.nodes[nodeId];
      if (!node) return;

      const subtreeWidth = getSubtreeWidth(nodeId);
      const nodeX = x + subtreeWidth / 2 - NODE_WIDTH / 2;

      positions.set(nodeId, {
        id: nodeId,
        x: nodeX,
        y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });

      if (!node.collapsed && node.children.length > 0) {
        let childX = x;
        node.children.forEach((childId) => {
          const childWidth = getSubtreeWidth(childId);
          layoutNode(childId, childX, y + NODE_HEIGHT + VERTICAL_GAP);
          childX += childWidth + HORIZONTAL_GAP;
        });
      }
    };

    const totalWidth = getSubtreeWidth(mindmap.rootNodeId);
    layoutNode(mindmap.rootNodeId, -totalWidth / 2, 0);

    return positions;
  }, [mindmap]);

  const layout = calculateLayout();

  // Center on root node on first render
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTransform({
        x: rect.width / 2,
        y: 60,
        scale: 1,
      });
    }
  }, [mindmap.id]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('canvas-background')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  // Click on empty space to deselect
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('canvas-background')) {
      // Deselect floating notes (keep tree node selection for editor)
      if (selectedNodeId?.startsWith("floating:")) {
        onSelectNode(mindmap.rootNodeId);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Double-click to create floating note
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('canvas-background')) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        // Convert screen coordinates to canvas coordinates
        const x = (e.clientX - rect.left - transform.x) / transform.scale;
        const y = (e.clientY - rect.top - transform.y) / transform.scale;
        onAddFloatingNote({ x, y });
      }
    }
  };

  // Zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(transform.scale * delta, 0.25), 2);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      setTransform((prev) => ({
        scale: newScale,
        x: mouseX - (mouseX - prev.x) * (newScale / prev.scale),
        y: mouseY - (mouseY - prev.y) * (newScale / prev.scale),
      }));
    }
  };

  // Drag handlers
  const handleDragStart = (nodeId: string) => (e: React.DragEvent) => {
    setDraggedNodeId(nodeId);
    e.dataTransfer.setData("nodeId", nodeId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (targetNodeId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    const sourceNodeId = e.dataTransfer.getData("nodeId");
    if (sourceNodeId && sourceNodeId !== targetNodeId) {
      onMoveNode(sourceNodeId, targetNodeId);
    }
    setDraggedNodeId(null);
  };

  // Draw connection lines
  const renderConnections = () => {
    const lines: JSX.Element[] = [];

    const drawLines = (nodeId: string) => {
      const node = mindmap.nodes[nodeId];
      const nodeLayout = layout.get(nodeId);
      if (!node || !nodeLayout || node.collapsed) return;

      node.children.forEach((childId) => {
        const childLayout = layout.get(childId);
        if (childLayout) {
          const startX = nodeLayout.x + nodeLayout.width / 2;
          const startY = nodeLayout.y + nodeLayout.height;
          const endX = childLayout.x + childLayout.width / 2;
          const endY = childLayout.y;
          const midY = (startY + endY) / 2;

          lines.push(
            <path
              key={`${nodeId}-${childId}`}
              d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth={2}
              className="transition-all duration-200"
            />
          );
          drawLines(childId);
        }
      });
    };

    drawLines(mindmap.rootNodeId);
    return lines;
  };

  // Render nodes
  const renderNodes = () => {
    const nodes: JSX.Element[] = [];

    const renderNode = (nodeId: string) => {
      const node = mindmap.nodes[nodeId];
      const nodeLayout = layout.get(nodeId);
      if (!node || !nodeLayout) return;

      nodes.push(
        <div
          key={nodeId}
          className="absolute transition-all duration-200"
          style={{
            left: nodeLayout.x,
            top: nodeLayout.y,
            width: nodeLayout.width,
          }}
        >
          <MindmapNodeComponent
            node={node}
            isSelected={selectedNodeId === nodeId}
            isRoot={nodeId === mindmap.rootNodeId}
            onSelect={() => onSelectNode(nodeId)}
            onAddChild={() => onAddChild(nodeId)}
            onDelete={() => onDeleteNode(nodeId)}
            onToggleCollapse={() => onToggleCollapse(nodeId)}
            onUpdateTitle={(title) => onUpdateNode(nodeId, { title })}
            onDragStart={handleDragStart(nodeId)}
            onDragOver={handleDragOver}
            onDrop={handleDrop(nodeId)}
            hasChildren={node.children.length > 0}
          />
        </div>
      );

      if (!node.collapsed) {
        node.children.forEach(renderNode);
      }
    };

    renderNode(mindmap.rootNodeId);
    return nodes;
  };

  // Render floating notes
  const renderFloatingNotes = () => {
    const floatingNotes = mindmap.floatingNotes || {};
    return Object.values(floatingNotes).map((note) => (
      <FloatingNoteComponent
        key={note.id}
        note={note}
        isSelected={selectedNodeId === `floating:${note.id}`}
        onSelect={() => onSelectNode(`floating:${note.id}`)}
        onDelete={() => onDeleteFloatingNote(note.id)}
        onUpdateContent={(content) => onUpdateFloatingNote(note.id, { content })}
        onUpdatePosition={(position) => onUpdateFloatingNote(note.id, { position })}
        scale={transform.scale}
      />
    ));
  };

  // Fit to view - calculate bounds and adjust transform
  const handleFitToView = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const padding = 60;

    // Get all node positions from layout
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    layout.forEach((node) => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });

    // Include floating notes
    const floatingNotes = mindmap.floatingNotes || {};
    Object.values(floatingNotes).forEach((note) => {
      minX = Math.min(minX, note.position.x);
      minY = Math.min(minY, note.position.y);
      maxX = Math.max(maxX, note.position.x + 150); // Approximate width
      maxY = Math.max(maxY, note.position.y + 30); // Approximate height
    });

    if (minX === Infinity) return; // No nodes

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const availableWidth = rect.width - padding * 2;
    const availableHeight = rect.height - padding * 2;

    const scaleX = availableWidth / contentWidth;
    const scaleY = availableHeight / contentHeight;
    const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.25), 2);

    // Center the content
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setTransform({
      scale: newScale,
      x: rect.width / 2 - centerX * newScale,
      y: rect.height / 2 - centerY * newScale,
    });
  }, [layout, mindmap.floatingNotes]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full overflow-hidden bg-muted/30",
        isPanning ? "cursor-grabbing" : "cursor-grab"
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleCanvasClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Background pattern */}
      <div className="canvas-background absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }} />
      
      {/* Transform container */}
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        {/* Connection lines SVG */}
        <svg
          className="absolute pointer-events-none"
          style={{
            left: -2000,
            top: -2000,
            width: 4000,
            height: 4000,
          }}
        >
          <g transform="translate(2000, 2000)">{renderConnections()}</g>
        </svg>

        {/* Nodes */}
        {renderNodes()}

        {/* Floating notes */}
        {renderFloatingNotes()}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1">
        <button
          className="bg-card border rounded-md p-1.5 text-muted-foreground shadow-sm cursor-pointer hover:bg-accent transition-colors"
          onClick={handleFitToView}
          title="Fit to view"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
        <div
          className="bg-card border rounded-md px-2 py-1 text-xs text-muted-foreground shadow-sm cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setTransform((prev) => ({ ...prev, scale: 1 }))}
          title="Click to reset zoom"
        >
          {Math.round(transform.scale * 100)}%
        </div>
      </div>
    </div>
  );
};
