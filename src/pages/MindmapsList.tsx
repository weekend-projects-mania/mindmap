import { useNavigate } from "react-router-dom";
import { useMindmapStore } from "@/hooks/useMindmapStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Brain, Plus, MoreHorizontal, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

const MindmapsList = () => {
  const navigate = useNavigate();
  const {
    mindmaps,
    createMindmap,
    deleteMindmap,
    renameMindmap,
    setActiveMindmap,
  } = useMindmapStore();

  const [newMindmapName, setNewMindmapName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCreate = () => {
    if (newMindmapName.trim()) {
      createMindmap(newMindmapName.trim());
      setNewMindmapName("");
      setIsCreateDialogOpen(false);
    }
  };

  const handleOpenMindmap = (id: string) => {
    setActiveMindmap(id);
    navigate(`/mindmap/${id}`);
  };

  const startEditing = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(name);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      renameMindmap(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName("");
  };

  const confirmDelete = (id: string) => {
    deleteMindmap(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">Mindmaps</span>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Mindmap
              </Button>
            </DialogTrigger>
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
      </header>

      {/* Content */}
      <main className="container px-4 md:px-8 py-8">
        {mindmaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Brain className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Mindmaps Yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first mindmap to get started
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Mindmap
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mindmaps.map((mindmap) => (
              <Card
                key={mindmap.id}
                className="group cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleOpenMindmap(mindmap.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    {editingId === mindmap.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-7 text-sm font-semibold"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={saveEdit}
                        autoFocus
                      />
                    ) : (
                      <CardTitle className="text-base leading-tight truncate pr-2">
                        {mindmap.name}
                      </CardTitle>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => startEditing(mindmap.id, mindmap.name, e as unknown as React.MouseEvent)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={(e) => {
                            e.preventDefault();
                            setDeleteConfirmId(mindmap.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Dialog
                      open={deleteConfirmId === mindmap.id}
                      onOpenChange={(open) => setDeleteConfirmId(open ? mindmap.id : null)}
                    >
                      <DialogContent onClick={(e) => e.stopPropagation()}>
                        <DialogHeader>
                          <DialogTitle>Delete Mindmap</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete "{mindmap.name}"? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={() => confirmDelete(mindmap.id)}>
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <CardDescription className="text-xs">
                    {Object.keys(mindmap.nodes).length} nodes
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Brain className="h-3 w-3" />
                    <span>
                      Updated {formatDistanceToNow(new Date(mindmap.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MindmapsList;
