import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMindmapStore } from "@/hooks/useMindmapStore";
import { MindmapCanvas } from "@/components/mindmap/MindmapCanvas";
import { RichEditor } from "@/components/editor/RichEditor";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Brain, PanelLeft, PanelRight, Columns2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

type ViewMode = "canvas" | "both" | "editor";

const MindmapEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [multiSelectedCount, setMultiSelectedCount] = useState(0);
  const {
    mindmaps,
    activeMindmap,
    activeMindmapId,
    selectedNodeId,
    selectedNode,
    selectedFloatingNote,
    setActiveMindmap,
    setSelectedNodeId,
    updateNode,
    addChildNode,
    addSiblingNode,
    deleteNode,
    moveNode,
    toggleCollapse,
    addFloatingNote,
    updateFloatingNote,
    deleteFloatingNote,
  } = useMindmapStore();

  // Set active mindmap when route changes
  useEffect(() => {
    if (id && id !== activeMindmapId) {
      const mindmapExists = mindmaps.some((m) => m.id === id);
      if (mindmapExists) {
        setActiveMindmap(id);
      } else {
        navigate("/");
      }
    }
  }, [id, activeMindmapId, mindmaps, setActiveMindmap, navigate]);

  // Get selected content for editor (either node or floating note)
  const selectedContent = selectedNode || selectedFloatingNote;
  const isFloatingNote = selectedNodeId?.startsWith("floating:");

  const handleEditorContentChange = (content: string) => {
    if (!selectedNodeId || isFloatingNote) return;
    updateNode(selectedNodeId, { content });
  };

  const handleEditorTitleChange = (title: string) => {
    if (!selectedNodeId || isFloatingNote) return;
    updateNode(selectedNodeId, { title });
  };

  const handleStartLinkChange = (startLink: string) => {
    if (!selectedNodeId || isFloatingNote) return;
    updateNode(selectedNodeId, { startLink });
  };

  const renderCanvas = () => (
    <MindmapCanvas
      mindmap={activeMindmap!}
      selectedNodeId={selectedNodeId}
      onSelectNode={setSelectedNodeId}
      onAddChild={addChildNode}
      onAddSibling={addSiblingNode}
      onDeleteNode={deleteNode}
      onUpdateNode={updateNode}
      onToggleCollapse={toggleCollapse}
      onMoveNode={moveNode}
      onAddFloatingNote={addFloatingNote}
      onUpdateFloatingNote={updateFloatingNote}
      onDeleteFloatingNote={deleteFloatingNote}
      onMultiSelectionChange={setMultiSelectedCount}
    />
  );

  const renderEditor = () => {
    // Show message when multiple nodes are selected
    if (multiSelectedCount > 1) {
      return (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          <p>Select one node to edit its content</p>
        </div>
      );
    }
    
    // Show editor when a single node is selected (not a floating note)
    if (selectedNode) {
      return (
        <RichEditor
          key={selectedNodeId}
          content={selectedNode.content}
          onChange={handleEditorContentChange}
          nodeTitle={selectedNode.title}
          onTitleChange={handleEditorTitleChange}
          startLink={selectedNode.startLink}
          onStartLinkChange={handleStartLinkChange}
        />
      );
    }
    
    // Default message when nothing is selected
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>Select a node to edit its content</p>
      </div>
    );
  };

  if (!activeMindmap) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Brain className="h-16 w-16 mx-auto text-muted-foreground/50" />
          <div>
            <h2 className="text-xl font-semibold">Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col overflow-hidden bg-background">
        {/* Top bar with breadcrumb and view mode toggle */}
        <div className="h-12 border-b flex items-center justify-between px-4 bg-background">
          {/* Left side - Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/");
                  }}
                  className="flex items-center gap-2"
                >
                  <Brain className="h-4 w-4" />
                  Mindmaps
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">
                  {activeMindmap.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {mindmaps.map((mindmap) => (
                      <DropdownMenuItem
                        key={mindmap.id}
                        onClick={() => navigate(`/mindmap/${mindmap.id}`)}
                        className={mindmap.id === activeMindmapId ? "bg-accent" : ""}
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        {mindmap.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Right side - View mode toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as ViewMode)}
            className="bg-muted rounded-lg p-1"
          >
            <ToggleGroupItem
              value="editor"
              aria-label="Editor only"
              className="px-4 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md"
            >
              <PanelLeft className="h-4 w-4 mr-2" />
              Document
            </ToggleGroupItem>
            <ToggleGroupItem
              value="both"
              aria-label="Both panels"
              className="px-4 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md"
            >
              <Columns2 className="h-4 w-4 mr-2" />
              Both
            </ToggleGroupItem>
            <ToggleGroupItem
              value="canvas"
              aria-label="Canvas only"
              className="px-4 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md"
            >
              <PanelRight className="h-4 w-4 mr-2" />
              Canvas
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Content area based on view mode */}
        <div className="flex-1 overflow-hidden">
          {viewMode === "both" ? (
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={60} minSize={30}>
                {renderCanvas()}
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={40} minSize={25}>
                {renderEditor()}
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : viewMode === "canvas" ? (
            <div className="h-full">{renderCanvas()}</div>
          ) : (
            <div className="h-full">{renderEditor()}</div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default MindmapEditor;
