import { useState } from "react";
import { useMindmapStore } from "@/hooks/useMindmapStore";
import { MindmapSidebar } from "@/components/mindmap/MindmapSidebar";
import { MindmapCanvas } from "@/components/mindmap/MindmapCanvas";
import { RichEditor } from "@/components/editor/RichEditor";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Brain, PanelLeft, PanelRight, Columns2 } from "lucide-react";

type ViewMode = "canvas" | "both" | "editor";

const Index = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("both");

  const {
    mindmaps,
    activeMindmap,
    activeMindmapId,
    selectedNodeId,
    selectedNode,
    selectedFloatingNote,
    setActiveMindmap,
    setSelectedNodeId,
    createMindmap,
    deleteMindmap,
    renameMindmap,
    updateNode,
    addChildNode,
    deleteNode,
    moveNode,
    toggleCollapse,
    addFloatingNote,
    updateFloatingNote,
    deleteFloatingNote,
  } = useMindmapStore();

  // Get selected content for editor (either node or floating note)
  const selectedContent = selectedNode || selectedFloatingNote;
  const isFloatingNote = selectedNodeId?.startsWith("floating:");

  // Only use regular nodes for the editor (not floating notes)
  const handleEditorContentChange = (content: string) => {
    if (!selectedNodeId || isFloatingNote) return;
    updateNode(selectedNodeId, { content });
  };

  const handleEditorTitleChange = (title: string) => {
    if (!selectedNodeId || isFloatingNote) return;
    updateNode(selectedNodeId, { title });
  };

  const renderCanvas = () => (
    <MindmapCanvas
      mindmap={activeMindmap!}
      selectedNodeId={selectedNodeId}
      onSelectNode={setSelectedNodeId}
      onAddChild={addChildNode}
      onDeleteNode={deleteNode}
      onUpdateNode={updateNode}
      onToggleCollapse={toggleCollapse}
      onMoveNode={moveNode}
      onAddFloatingNote={addFloatingNote}
      onUpdateFloatingNote={updateFloatingNote}
      onDeleteFloatingNote={deleteFloatingNote}
    />
  );

  const renderEditor = () => (
    selectedNode ? (
      <RichEditor
        key={selectedNodeId}
        content={selectedNode.content}
        onChange={handleEditorContentChange}
        nodeTitle={selectedNode.title}
        onTitleChange={handleEditorTitleChange}
      />
    ) : (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>Select a node to edit its content</p>
      </div>
    )
  );

  return (
    <TooltipProvider>
      <div className="h-screen flex overflow-hidden bg-background">
        {/* Sidebar */}
        <MindmapSidebar
          mindmaps={mindmaps}
          activeMindmapId={activeMindmapId}
          onSelectMindmap={setActiveMindmap}
          onCreateMindmap={createMindmap}
          onDeleteMindmap={deleteMindmap}
          onRenameMindmap={renameMindmap}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeMindmap ? (
            <>
              {/* Top bar with view mode toggle */}
              <div className="h-12 border-b flex items-center justify-center px-4 bg-background">
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Brain className="h-16 w-16 mx-auto text-muted-foreground/50" />
                <div>
                  <h2 className="text-xl font-semibold">No Mindmap Selected</h2>
                  <p className="text-muted-foreground">
                    Create or select a mindmap to get started
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Index;
