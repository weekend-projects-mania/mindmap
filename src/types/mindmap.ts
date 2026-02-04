export interface MindmapNode {
  id: string;
  title: string;
  content: string; // HTML content from tiptap
  parentId: string | null;
  children: string[]; // Array of child node IDs
  collapsed: boolean;
  position?: { x: number; y: number }; // For manual positioning if needed
  edgeLabel?: string; // Label on the edge connecting this node to its parent
  startLink?: string; // Optional URL link for the node
}

export interface FloatingNote {
  id: string;
  title: string;
  content: string;
  position: { x: number; y: number };
}

export interface Mindmap {
  id: string;
  name: string;
  rootNodeId: string;
  nodes: Record<string, MindmapNode>;
  floatingNotes: Record<string, FloatingNote>;
  createdAt: number;
  updatedAt: number;
}

export interface MindmapStore {
  mindmaps: Record<string, Mindmap>;
  activeMindmapId: string | null;
}

export const createNewNode = (
  parentId: string | null,
  title: string = "New Node"
): MindmapNode => ({
  id: crypto.randomUUID(),
  title,
  content: "",
  parentId,
  children: [],
  collapsed: false,
});

export const createFloatingNote = (
  position: { x: number; y: number },
  title: string = "New Note"
): FloatingNote => ({
  id: crypto.randomUUID(),
  title,
  content: "",
  position,
});

export const createNewMindmap = (name: string = "Untitled Mindmap"): Mindmap => {
  const rootNode = createNewNode(null, "Main Topic");
  return {
    id: crypto.randomUUID(),
    name,
    rootNodeId: rootNode.id,
    nodes: { [rootNode.id]: rootNode },
    floatingNotes: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};
