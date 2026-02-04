import { useState } from "react";
import { Mindmap } from "@/types/mindmap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Brain,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MindmapSidebarProps {
  mindmaps: Mindmap[];
  activeMindmapId: string | null;
  onSelectMindmap: (id: string) => void;
  onCreateMindmap: (name: string) => void;
  onDeleteMindmap: (id: string) => void;
  onRenameMindmap: (id: string, name: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const MindmapSidebar = ({
  mindmaps,
  activeMindmapId,
  onSelectMindmap,
  onCreateMindmap,
  onDeleteMindmap,
  onRenameMindmap,
  isCollapsed,
  onToggleCollapse,
}: MindmapSidebarProps) => {
  const [newMindmapName, setNewMindmapName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCreate = () => {
    if (newMindmapName.trim()) {
      onCreateMindmap(newMindmapName.trim());
      setNewMindmapName("");
      setIsCreateDialogOpen(false);
    }
  };

  const startEditing = (mindmap: Mindmap) => {
    setEditingId(mindmap.id);
    setEditName(mindmap.name);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      onRenameMindmap(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const confirmDelete = (id: string) => {
    onDeleteMindmap(id);
    setDeleteConfirmId(null);
  };

  const activeMindmap = mindmaps.find((m) => m.id === activeMindmapId);

  return (
    <div
      className={cn(
        "border-r bg-sidebar flex flex-col h-full transition-all duration-300",
        isCollapsed ? "w-14" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn("p-4 border-b flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-semibold">Mindmaps</span>
          </div>
        )}
        <div className={cn("flex items-center", isCollapsed ? "flex-col gap-2" : "gap-1")}>
          {isCollapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Brain className="h-5 w-5 text-primary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Mindmaps</TooltipContent>
            </Tooltip>
          )}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">New Mindmap</TooltipContent>
            </Tooltip>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Mindmap</DialogTitle>
                <DialogDescription>
                  Enter a name for your new mindmap.
                </DialogDescription>
              </DialogHeader>
              <Input
                value={newMindmapName}
                onChange={(e) => setNewMindmapName(e.target.value)}
                placeholder="Mindmap name..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
                autoFocus
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!newMindmapName.trim()}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Active mindmap selector (mobile/compact) */}
      <div className="p-2 border-b md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="truncate">{activeMindmap?.name || "Select mindmap"}</span>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {mindmaps.map((mindmap) => (
              <DropdownMenuItem
                key={mindmap.id}
                onClick={() => onSelectMindmap(mindmap.id)}
              >
                {mindmap.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Mindmap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mindmap list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {mindmaps.map((mindmap) => (
            <Tooltip key={mindmap.id}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
                    mindmap.id === activeMindmapId
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "hover:bg-sidebar-accent/50",
                    isCollapsed && "justify-center px-2"
                  )}
                  onClick={() => {
                    if (editingId !== mindmap.id) {
                      onSelectMindmap(mindmap.id);
                    }
                  }}
                >
              {editingId === mindmap.id ? (
                <div className="flex-1 flex items-center gap-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-7 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit();
                      if (e.key === "Escape") cancelEdit();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      saveEdit();
                    }}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelEdit();
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <Brain className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 truncate text-sm">{mindmap.name}</span>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(mindmap);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    {mindmaps.length > 1 && (
                      <Dialog
                        open={deleteConfirmId === mindmap.id}
                        onOpenChange={(open) =>
                          setDeleteConfirmId(open ? mindmap.id : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent onClick={(e) => e.stopPropagation()}>
                          <DialogHeader>
                            <DialogTitle>Delete Mindmap</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete "{mindmap.name}"? This
                              action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => confirmDelete(mindmap.id)}
                            >
                              Delete
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      )}
                      </div>
                    </>
                  )}
                </>
              )}
                </div>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">{mindmap.name}</TooltipContent>
              )}
            </Tooltip>
          ))}
        </div>
      </ScrollArea>

      {/* Footer with collapse toggle */}
      <div className="p-2 border-t flex items-center justify-between">
        {!isCollapsed && (
          <span className="text-xs text-muted-foreground px-2">
            {mindmaps.length} mindmap{mindmaps.length !== 1 ? "s" : ""}
          </span>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", isCollapsed && "mx-auto")}
              onClick={onToggleCollapse}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
