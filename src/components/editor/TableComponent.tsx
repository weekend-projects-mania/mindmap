import { NodeViewWrapper, NodeViewContent, NodeViewProps } from "@tiptap/react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const TableComponent = ({ editor }: NodeViewProps) => {
  const addColumnAfter = () => {
    editor?.chain().focus().addColumnAfter().run();
  };

  const addRowAfter = () => {
    editor?.chain().focus().addRowAfter().run();
  };

  return (
    <NodeViewWrapper className="table-wrapper group">
      <div className="relative">
        {/* Add column button - appears on right side */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-8 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-muted hover:bg-accent rounded-full"
          onClick={addColumnAfter}
          contentEditable={false}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>

        {/* Add row button - appears at bottom */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-muted hover:bg-accent rounded-full"
          onClick={addRowAfter}
          contentEditable={false}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>

        <NodeViewContent as={"table" as "div"} />
      </div>
    </NodeViewWrapper>
  );
};
