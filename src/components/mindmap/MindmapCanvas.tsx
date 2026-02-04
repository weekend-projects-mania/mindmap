import { useRef, useState, useCallback, useEffect } from "react";
import { Mindmap, MindmapNode, FloatingNote } from "@/types/mindmap";
import { MindmapNodeComponent } from "./MindmapNode";
import { FloatingNoteComponent } from "./FloatingNoteComponent";
import { EdgeLabel } from "./EdgeLabel";
import { cn } from "@/lib/utils";
import { Maximize2 } from "lucide-react";

interface MindmapCanvasProps {
  mindmap: Mindmap;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onAddChild: (parentId: string) => void;
  onAddSibling: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateNode: (nodeId: string, updates: Partial<MindmapNode>) => void;
  onToggleCollapse: (nodeId: string) => void;
  onMoveNode: (nodeId: string, newParentId: string) => void;
  onAddFloatingNote: (position: { x: number; y: number }) => void;
  onUpdateFloatingNote: (noteId: string, updates: Partial<FloatingNote>) => void;
  onDeleteFloatingNote: (noteId: string) => void;
  multiSelectedCount?: number;
  onMultiSelectionChange?: (count: number) => void;
}

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

const NODE_WIDTH = 160;
const NODE_HEIGHT = 44;
const HORIZONTAL_GAP = 40;
const VERTICAL_GAP = 60;
const FLOATING_NOTE_WIDTH = 150;
const FLOATING_NOTE_HEIGHT = 30;

export const MindmapCanvas = ({
  mindmap,
  selectedNodeId,
  onSelectNode,
  onAddChild,
  onAddSibling,
  onDeleteNode,
  onUpdateNode,
  onToggleCollapse,
  onMoveNode,
  onAddFloatingNote,
  onUpdateFloatingNote,
  onDeleteFloatingNote,
  onMultiSelectionChange,
}: MindmapCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  
  // Selection box state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const justFinishedSelectingRef = useRef(false);

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

  // Keyboard shortcuts for adding/deleting/navigating nodes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // Only handle when a node is selected (not floating note)
      if (!selectedNodeId || selectedNodeId.startsWith("floating:")) {
        return;
      }

      const currentNode = mindmap.nodes[selectedNodeId];
      if (!currentNode) return;

      if (e.key === "Enter") {
        e.preventDefault();
        onAddSibling(selectedNodeId);
      } else if (e.key === "Tab") {
        e.preventDefault();
        onAddChild(selectedNodeId);
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        // Don't delete the root node
        if (selectedNodeId !== mindmap.rootNodeId) {
          onDeleteNode(selectedNodeId);
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        // Select parent node
        if (currentNode.parentId) {
          onSelectNode(currentNode.parentId);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        // Select middle child (or first if odd number)
        if (currentNode.children.length > 0 && !currentNode.collapsed) {
          const middleIndex = Math.floor(currentNode.children.length / 2);
          onSelectNode(currentNode.children[middleIndex]);
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        // Select left sibling
        if (currentNode.parentId) {
          const parentNode = mindmap.nodes[currentNode.parentId];
          if (parentNode) {
            const currentIndex = parentNode.children.indexOf(selectedNodeId);
            if (currentIndex > 0) {
              onSelectNode(parentNode.children[currentIndex - 1]);
            }
          }
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        // Select right sibling
        if (currentNode.parentId) {
          const parentNode = mindmap.nodes[currentNode.parentId];
          if (parentNode) {
            const currentIndex = parentNode.children.indexOf(selectedNodeId);
            if (currentIndex < parentNode.children.length - 1) {
              onSelectNode(parentNode.children[currentIndex + 1]);
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeId, onAddChild, onAddSibling, onDeleteNode, onSelectNode, mindmap.rootNodeId, mindmap.nodes]);

  // Pan handlers - RIGHT CLICK for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    const isCanvasBackground = e.target === containerRef.current || (e.target as HTMLElement).classList.contains('canvas-background');
    
    if (!isCanvasBackground) return;

    // Right-click for panning
    if (e.button === 2) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
    // Left-click for selection box
    else if (e.button === 0) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const canvasX = (e.clientX - rect.left - transform.x) / transform.scale;
        const canvasY = (e.clientY - rect.top - transform.y) / transform.scale;
        setIsSelecting(true);
        setSelectionBox({
          startX: canvasX,
          startY: canvasY,
          endX: canvasX,
          endY: canvasY,
        });
        // Clear existing selection unless shift is held
        if (!e.shiftKey) {
          setSelectedNodeIds(new Set());
        }
      }
    }
  };

  // Prevent context menu on right-click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Click on empty space to deselect
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Skip if we just finished a selection drag
    if (justFinishedSelectingRef.current) {
      justFinishedSelectingRef.current = false;
      return;
    }
    
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('canvas-background')) {
      // Deselect floating notes (keep tree node selection for editor)
      if (selectedNodeId?.startsWith("floating:")) {
        onSelectNode(mindmap.rootNodeId);
      }
      // Clear multi-selection on click
      setSelectedNodeIds(new Set());
      onMultiSelectionChange?.(0);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
    } else if (isSelecting && selectionBox) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const canvasX = (e.clientX - rect.left - transform.x) / transform.scale;
        const canvasY = (e.clientY - rect.top - transform.y) / transform.scale;
        setSelectionBox((prev) => prev ? { ...prev, endX: canvasX, endY: canvasY } : null);
      }
    }
  };

  const handleMouseUp = () => {
    if (isSelecting && selectionBox) {
      // Calculate which nodes are inside the selection box
      const minX = Math.min(selectionBox.startX, selectionBox.endX);
      const maxX = Math.max(selectionBox.startX, selectionBox.endX);
      const minY = Math.min(selectionBox.startY, selectionBox.endY);
      const maxY = Math.max(selectionBox.startY, selectionBox.endY);

      // Only consider it a real selection if the box has meaningful size
      const boxWidth = Math.abs(selectionBox.endX - selectionBox.startX);
      const boxHeight = Math.abs(selectionBox.endY - selectionBox.startY);
      const isRealSelection = boxWidth > 5 || boxHeight > 5;

      if (isRealSelection) {
        justFinishedSelectingRef.current = true;
        const newSelectedIds = new Set<string>();

        // Check tree nodes
        layout.forEach((nodeLayout, nodeId) => {
          const nodeRight = nodeLayout.x + nodeLayout.width;
          const nodeBottom = nodeLayout.y + nodeLayout.height;
          
          // Check if node intersects with selection box
          if (
            nodeLayout.x < maxX &&
            nodeRight > minX &&
            nodeLayout.y < maxY &&
            nodeBottom > minY
          ) {
            newSelectedIds.add(nodeId);
          }
        });

        // Check floating notes
        const floatingNotes = mindmap.floatingNotes || {};
        Object.values(floatingNotes).forEach((note) => {
          const noteRight = note.position.x + FLOATING_NOTE_WIDTH;
          const noteBottom = note.position.y + FLOATING_NOTE_HEIGHT;
          
          if (
            note.position.x < maxX &&
            noteRight > minX &&
            note.position.y < maxY &&
            noteBottom > minY
          ) {
            newSelectedIds.add(`floating:${note.id}`);
          }
        });

        setSelectedNodeIds(newSelectedIds);
        
        // Notify parent about multi-selection count
        onMultiSelectionChange?.(newSelectedIds.size);
        
        // If only one item selected, also set it as the main selection
        if (newSelectedIds.size === 1) {
          const singleId = Array.from(newSelectedIds)[0];
          onSelectNode(singleId);
        } else if (newSelectedIds.size > 1) {
          // Clear the single selection when multiple are selected
          onSelectNode(null);
        }
      }
    }
    
    setIsPanning(false);
    setIsSelecting(false);
    setSelectionBox(null);
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

  // Draw connection lines with labels
  const renderConnections = () => {
    const elements: JSX.Element[] = [];

    const drawLines = (nodeId: string) => {
      const node = mindmap.nodes[nodeId];
      const nodeLayout = layout.get(nodeId);
      if (!node || !nodeLayout || node.collapsed) return;

      node.children.forEach((childId) => {
        const childNode = mindmap.nodes[childId];
        const childLayout = layout.get(childId);
        if (childLayout && childNode) {
          const startX = nodeLayout.x + nodeLayout.width / 2;
          const startY = nodeLayout.y + nodeLayout.height;
          const endX = childLayout.x + childLayout.width / 2;
          const endY = childLayout.y;
          const midY = (startY + endY) / 2;

          // Connection line
          elements.push(
            <path
              key={`line-${nodeId}-${childId}`}
              d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth={2}
              className="transition-all duration-200"
            />
          );

          // Edge label (positioned at midpoint of the edge)
          const labelX = (startX + endX) / 2;
          const labelY = midY;

          elements.push(
            <EdgeLabel
              key={`label-${childId}`}
              nodeId={childId}
              label={childNode.edgeLabel || ""}
              x={labelX}
              y={labelY}
              onUpdateLabel={(label) => onUpdateNode(childId, { edgeLabel: label })}
            />
          );

          drawLines(childId);
        }
      });
    };

    drawLines(mindmap.rootNodeId);
    return elements;
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
            isSelected={selectedNodeIds.size > 0 ? selectedNodeIds.has(nodeId) : selectedNodeId === nodeId}
            isRoot={nodeId === mindmap.rootNodeId}
            onSelect={() => {
              onSelectNode(nodeId);
              setSelectedNodeIds(new Set());
              onMultiSelectionChange?.(0);
            }}
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
        isSelected={selectedNodeIds.size > 0 ? selectedNodeIds.has(`floating:${note.id}`) : selectedNodeId === `floating:${note.id}`}
        onSelect={() => {
          onSelectNode(`floating:${note.id}`);
          setSelectedNodeIds(new Set());
          onMultiSelectionChange?.(0);
        }}
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

  // Render selection box
  const renderSelectionBox = () => {
    if (!selectionBox || !isSelecting) return null;
    
    const minX = Math.min(selectionBox.startX, selectionBox.endX);
    const minY = Math.min(selectionBox.startY, selectionBox.endY);
    const width = Math.abs(selectionBox.endX - selectionBox.startX);
    const height = Math.abs(selectionBox.endY - selectionBox.startY);
    
    return (
      <div
        className="absolute border-2 border-primary/50 bg-primary/10 pointer-events-none"
        style={{
          left: minX,
          top: minY,
          width,
          height,
        }}
      />
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full overflow-hidden bg-muted/30",
        isPanning ? "cursor-grabbing" : isSelecting ? "cursor-crosshair" : "cursor-default"
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleCanvasClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Background pattern */}
      <div className="canvas-background absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }} />
      
      {/* Transform container */}
      <div
        className={cn("absolute origin-top-left", isSelecting && "select-none")}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        {/* Connection lines and labels SVG */}
        <svg
          className="absolute"
          style={{
            pointerEvents: isSelecting ? 'none' : 'auto',
            left: -2000,
            top: -2000,
            width: 4000,
            height: 4000,
          }}
        >
          <g transform="translate(2000, 2000)">
            {renderConnections()}
          </g>
        </svg>

        {/* Nodes */}
        {renderNodes()}

        {/* Floating notes */}
        {renderFloatingNotes()}

        {/* Selection box */}
        {renderSelectionBox()}
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
