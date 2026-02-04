import { useState, useEffect, useCallback } from "react";
import {
  Mindmap,
  MindmapNode,
  MindmapStore,
  FloatingNote,
  createNewMindmap,
  createNewNode,
  createFloatingNote,
} from "@/types/mindmap";

const STORAGE_KEY = "mindmap-store";

const getInitialStore = (): MindmapStore => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load mindmap store:", error);
  }

  // Create initial mindmap
  const initialMindmap = createNewMindmap("My First Mindmap");
  return {
    mindmaps: { [initialMindmap.id]: initialMindmap },
    activeMindmapId: initialMindmap.id,
  };
};

export const useMindmapStore = () => {
  const [store, setStore] = useState<MindmapStore>(getInitialStore);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  // Get active mindmap
  const activeMindmap = store.activeMindmapId
    ? store.mindmaps[store.activeMindmapId]
    : null;

  // Set selected node to root when mindmap changes
  useEffect(() => {
    if (activeMindmap && !selectedNodeId) {
      setSelectedNodeId(activeMindmap.rootNodeId);
    }
  }, [activeMindmap, selectedNodeId]);

  const setActiveMindmap = useCallback((mindmapId: string) => {
    setStore((prev) => ({ ...prev, activeMindmapId: mindmapId }));
    const mindmap = store.mindmaps[mindmapId];
    if (mindmap) {
      setSelectedNodeId(mindmap.rootNodeId);
    }
  }, [store.mindmaps]);

  const createMindmap = useCallback((name: string) => {
    const newMindmap = createNewMindmap(name);
    setStore((prev) => ({
      mindmaps: { ...prev.mindmaps, [newMindmap.id]: newMindmap },
      activeMindmapId: newMindmap.id,
    }));
    setSelectedNodeId(newMindmap.rootNodeId);
    return newMindmap;
  }, []);

  const deleteMindmap = useCallback((mindmapId: string) => {
    setStore((prev) => {
      const { [mindmapId]: deleted, ...remaining } = prev.mindmaps;
      const remainingIds = Object.keys(remaining);
      return {
        mindmaps: remaining,
        activeMindmapId:
          prev.activeMindmapId === mindmapId
            ? remainingIds[0] || null
            : prev.activeMindmapId,
      };
    });
  }, []);

  const renameMindmap = useCallback((mindmapId: string, name: string) => {
    setStore((prev) => ({
      ...prev,
      mindmaps: {
        ...prev.mindmaps,
        [mindmapId]: { ...prev.mindmaps[mindmapId], name, updatedAt: Date.now() },
      },
    }));
  }, []);

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<MindmapNode>) => {
      if (!store.activeMindmapId) return;

      setStore((prev) => {
        const mindmap = prev.mindmaps[prev.activeMindmapId!];
        if (!mindmap) return prev;

        return {
          ...prev,
          mindmaps: {
            ...prev.mindmaps,
            [mindmap.id]: {
              ...mindmap,
              updatedAt: Date.now(),
              nodes: {
                ...mindmap.nodes,
                [nodeId]: { ...mindmap.nodes[nodeId], ...updates },
              },
            },
          },
        };
      });
    },
    [store.activeMindmapId]
  );

  const addChildNode = useCallback(
    (parentId: string) => {
      if (!store.activeMindmapId) return null;

      const newNode = createNewNode(parentId);
      setStore((prev) => {
        const mindmap = prev.mindmaps[prev.activeMindmapId!];
        if (!mindmap) return prev;

        const parentNode = mindmap.nodes[parentId];
        return {
          ...prev,
          mindmaps: {
            ...prev.mindmaps,
            [mindmap.id]: {
              ...mindmap,
              updatedAt: Date.now(),
              nodes: {
                ...mindmap.nodes,
                [newNode.id]: newNode,
                [parentId]: {
                  ...parentNode,
                  children: [...parentNode.children, newNode.id],
                  collapsed: false,
                },
              },
            },
          },
        };
      });

      setSelectedNodeId(newNode.id);
      return newNode;
    },
    [store.activeMindmapId]
  );

  const addSiblingNode = useCallback(
    (nodeId: string) => {
      if (!store.activeMindmapId) return null;

      const mindmap = store.mindmaps[store.activeMindmapId];
      if (!mindmap) return null;

      const node = mindmap.nodes[nodeId];
      if (!node || !node.parentId) return null; // Can't add sibling to root

      const parentId = node.parentId;
      const newNode = createNewNode(parentId);

      setStore((prev) => {
        const currentMindmap = prev.mindmaps[prev.activeMindmapId!];
        if (!currentMindmap) return prev;

        const parentNode = currentMindmap.nodes[parentId];
        const siblingIndex = parentNode.children.indexOf(nodeId);
        const newChildren = [...parentNode.children];
        newChildren.splice(siblingIndex + 1, 0, newNode.id);

        return {
          ...prev,
          mindmaps: {
            ...prev.mindmaps,
            [currentMindmap.id]: {
              ...currentMindmap,
              updatedAt: Date.now(),
              nodes: {
                ...currentMindmap.nodes,
                [newNode.id]: newNode,
                [parentId]: {
                  ...parentNode,
                  children: newChildren,
                },
              },
            },
          },
        };
      });

      setSelectedNodeId(newNode.id);
      return newNode;
    },
    [store.activeMindmapId, store.mindmaps]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      if (!store.activeMindmapId) return;

      setStore((prev) => {
        const mindmap = prev.mindmaps[prev.activeMindmapId!];
        if (!mindmap) return prev;

        const node = mindmap.nodes[nodeId];
        if (!node || nodeId === mindmap.rootNodeId) return prev; // Can't delete root

        // Collect all descendant IDs
        const getAllDescendants = (id: string): string[] => {
          const n = mindmap.nodes[id];
          if (!n) return [];
          return [id, ...n.children.flatMap(getAllDescendants)];
        };

        const toDelete = new Set(getAllDescendants(nodeId));
        const newNodes = { ...mindmap.nodes };
        toDelete.forEach((id) => delete newNodes[id]);

        // Remove from parent's children
        if (node.parentId && newNodes[node.parentId]) {
          newNodes[node.parentId] = {
            ...newNodes[node.parentId],
            children: newNodes[node.parentId].children.filter(
              (id) => id !== nodeId
            ),
          };
        }

        return {
          ...prev,
          mindmaps: {
            ...prev.mindmaps,
            [mindmap.id]: {
              ...mindmap,
              updatedAt: Date.now(),
              nodes: newNodes,
            },
          },
        };
      });

      if (selectedNodeId === nodeId && activeMindmap) {
        setSelectedNodeId(activeMindmap.rootNodeId);
      }
    },
    [store.activeMindmapId, selectedNodeId, activeMindmap]
  );

  const moveNode = useCallback(
    (nodeId: string, newParentId: string) => {
      if (!store.activeMindmapId) return;

      setStore((prev) => {
        const mindmap = prev.mindmaps[prev.activeMindmapId!];
        if (!mindmap) return prev;

        const node = mindmap.nodes[nodeId];
        if (!node || nodeId === mindmap.rootNodeId) return prev;
        if (nodeId === newParentId) return prev;

        // Check if newParentId is a descendant of nodeId (prevent circular)
        const isDescendant = (parentId: string, childId: string): boolean => {
          const parent = mindmap.nodes[parentId];
          if (!parent) return false;
          if (parent.children.includes(childId)) return true;
          return parent.children.some((c) => isDescendant(c, childId));
        };

        if (isDescendant(nodeId, newParentId)) return prev;

        const oldParentId = node.parentId;
        const newNodes = { ...mindmap.nodes };

        // Remove from old parent
        if (oldParentId && newNodes[oldParentId]) {
          newNodes[oldParentId] = {
            ...newNodes[oldParentId],
            children: newNodes[oldParentId].children.filter(
              (id) => id !== nodeId
            ),
          };
        }

        // Add to new parent
        newNodes[newParentId] = {
          ...newNodes[newParentId],
          children: [...newNodes[newParentId].children, nodeId],
          collapsed: false,
        };

        // Update node's parent
        newNodes[nodeId] = { ...newNodes[nodeId], parentId: newParentId };

        return {
          ...prev,
          mindmaps: {
            ...prev.mindmaps,
            [mindmap.id]: {
              ...mindmap,
              updatedAt: Date.now(),
              nodes: newNodes,
            },
          },
        };
      });
    },
    [store.activeMindmapId]
  );

  const toggleCollapse = useCallback(
    (nodeId: string) => {
      updateNode(nodeId, {
        collapsed: !activeMindmap?.nodes[nodeId]?.collapsed,
      });
    },
    [updateNode, activeMindmap]
  );

  const addFloatingNote = useCallback(
    (position: { x: number; y: number }) => {
      if (!store.activeMindmapId) return null;

      const newNote = createFloatingNote(position);
      setStore((prev) => {
        const mindmap = prev.mindmaps[prev.activeMindmapId!];
        if (!mindmap) return prev;

        return {
          ...prev,
          mindmaps: {
            ...prev.mindmaps,
            [mindmap.id]: {
              ...mindmap,
              updatedAt: Date.now(),
              floatingNotes: {
                ...mindmap.floatingNotes,
                [newNote.id]: newNote,
              },
            },
          },
        };
      });

      setSelectedNodeId(`floating:${newNote.id}`);
      return newNote;
    },
    [store.activeMindmapId]
  );

  const updateFloatingNote = useCallback(
    (noteId: string, updates: Partial<FloatingNote>) => {
      if (!store.activeMindmapId) return;

      setStore((prev) => {
        const mindmap = prev.mindmaps[prev.activeMindmapId!];
        if (!mindmap || !mindmap.floatingNotes[noteId]) return prev;

        return {
          ...prev,
          mindmaps: {
            ...prev.mindmaps,
            [mindmap.id]: {
              ...mindmap,
              updatedAt: Date.now(),
              floatingNotes: {
                ...mindmap.floatingNotes,
                [noteId]: { ...mindmap.floatingNotes[noteId], ...updates },
              },
            },
          },
        };
      });
    },
    [store.activeMindmapId]
  );

  const deleteFloatingNote = useCallback(
    (noteId: string) => {
      if (!store.activeMindmapId) return;

      setStore((prev) => {
        const mindmap = prev.mindmaps[prev.activeMindmapId!];
        if (!mindmap) return prev;

        const { [noteId]: deleted, ...remaining } = mindmap.floatingNotes;

        return {
          ...prev,
          mindmaps: {
            ...prev.mindmaps,
            [mindmap.id]: {
              ...mindmap,
              updatedAt: Date.now(),
              floatingNotes: remaining,
            },
          },
        };
      });

      if (selectedNodeId === `floating:${noteId}` && activeMindmap) {
        setSelectedNodeId(activeMindmap.rootNodeId);
      }
    },
    [store.activeMindmapId, selectedNodeId, activeMindmap]
  );

  // Get selected content (either node or floating note)
  const getSelectedContent = useCallback(() => {
    if (!activeMindmap || !selectedNodeId) return null;

    if (selectedNodeId.startsWith("floating:")) {
      const noteId = selectedNodeId.replace("floating:", "");
      return activeMindmap.floatingNotes?.[noteId] || null;
    }

    return activeMindmap.nodes[selectedNodeId] || null;
  }, [activeMindmap, selectedNodeId]);

  const selectedNode =
    activeMindmap && selectedNodeId
      ? activeMindmap.nodes[selectedNodeId]
      : null;

  const selectedFloatingNote =
    activeMindmap && selectedNodeId?.startsWith("floating:")
      ? activeMindmap.floatingNotes?.[selectedNodeId.replace("floating:", "")]
      : null;

  return {
    // Store data
    mindmaps: Object.values(store.mindmaps),
    activeMindmap,
    activeMindmapId: store.activeMindmapId,
    selectedNodeId,
    selectedNode,
    selectedFloatingNote,

    // Actions
    setActiveMindmap,
    setSelectedNodeId,
    createMindmap,
    deleteMindmap,
    renameMindmap,
    updateNode,
    addChildNode,
    addSiblingNode,
    deleteNode,
    moveNode,
    toggleCollapse,
    addFloatingNote,
    updateFloatingNote,
    deleteFloatingNote,
  };
};
