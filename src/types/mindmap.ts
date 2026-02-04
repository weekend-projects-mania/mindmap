export interface MindmapNode {
  id: string;
  title: string;
  content: string; // HTML content from tiptap
  parentId: string | null;
  children: string[]; // Array of child node IDs
  collapsed: boolean;
  position?: { x: number; y: number }; // For manual positioning if needed
}

export interface Mindmap {
  id: string;
  name: string;
  rootNodeId: string;
  nodes: Record<string, MindmapNode>;
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

export const createNewMindmap = (name: string = "Untitled Mindmap"): Mindmap => {
  const rootNode = createNewNode(null, "Main Topic");
  return {
    id: crypto.randomUUID(),
    name,
    rootNodeId: rootNode.id,
    nodes: { [rootNode.id]: rootNode },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};
