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
import { TooltipProvider } from "@/components/ui/tooltip";
import { Brain } from "lucide-react";

const Index = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const {
    mindmaps,
    activeMindmap,
    activeMindmapId,
    selectedNodeId,
    selectedNode,
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
  } = useMindmapStore();

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
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Mindmap canvas */}
            <ResizablePanel defaultSize={60} minSize={30}>
              <MindmapCanvas
                mindmap={activeMindmap}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                onAddChild={addChildNode}
                onDeleteNode={deleteNode}
                onUpdateNode={updateNode}
                onToggleCollapse={toggleCollapse}
                onMoveNode={moveNode}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Editor panel */}
            <ResizablePanel defaultSize={40} minSize={25}>
              {selectedNode ? (
                <RichEditor
                  key={selectedNodeId}
                  content={selectedNode.content}
                  onChange={(content) =>
                    updateNode(selectedNodeId!, { content })
                  }
                  nodeTitle={selectedNode.title}
                  onTitleChange={(title) =>
                    updateNode(selectedNodeId!, { title })
                  }
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p>Select a node to edit its content</p>
                </div>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
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
