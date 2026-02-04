import { NodeViewWrapper, NodeViewContent, NodeViewProps } from "@tiptap/react";
import { Plus, Minus, Rows3, Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";

export const TableComponent = ({ editor }: NodeViewProps) => {
  const addColumnAfter = () => editor?.chain().focus().addColumnAfter().run();
  const addRowAfter = () => editor?.chain().focus().addRowAfter().run();
  const deleteColumn = () => editor?.chain().focus().deleteColumn().run();
  const deleteRow = () => editor?.chain().focus().deleteRow().run();

  return (
    <NodeViewWrapper className="table-wrapper">
      <HoverCard openDelay={100} closeDelay={200}>
        <HoverCardTrigger asChild>
          <div className="table-container">
            <NodeViewContent as={"table" as "div"} />
          </div>
        </HoverCardTrigger>
        <HoverCardContent side="top" align="center" className="w-auto p-2">
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              <Columns3 className="h-3.5 w-3.5 text-muted-foreground mr-1" />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={addColumnAfter}
                title="Add column"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={deleteColumn}
                title="Remove column"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Separator orientation="vertical" className="h-5 mx-1" />
            <div className="flex items-center gap-0.5">
              <Rows3 className="h-3.5 w-3.5 text-muted-foreground mr-1" />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={addRowAfter}
                title="Add row"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={deleteRow}
                title="Remove row"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </NodeViewWrapper>
  );
};
