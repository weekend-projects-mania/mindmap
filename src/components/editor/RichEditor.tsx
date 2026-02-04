import { useEditor, EditorContent, Editor } from "@tiptap/react";
import "./editor.css";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Undo,
  Redo,
  Code2,
} from "lucide-react";
import { useEffect, useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface RichEditorProps {
  content: string;
  onChange: (content: string) => void;
  nodeTitle: string;
  onTitleChange: (title: string) => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}

const ToolbarButton = ({ onClick, isActive, disabled, children, title }: ToolbarButtonProps) => (
  <Button
    variant="ghost"
    size="icon"
    className={cn("h-8 w-8", isActive && "bg-accent text-accent-foreground")}
    onClick={onClick}
    disabled={disabled}
    title={title}
  >
    {children}
  </Button>
);

const EditorToolbar = ({ editor }: { editor: Editor }) => {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const setLink = useCallback(() => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
    }
    setShowLinkInput(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const handleLinkClick = () => {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
    } else {
      const previousUrl = editor.getAttributes("link").href;
      setLinkUrl(previousUrl || "");
      setShowLinkInput(true);
    }
  };

  return (
    <div className="border-b bg-muted/30 p-1 flex flex-wrap items-center gap-0.5">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title="Inline Code"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="Blockquote"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive("codeBlock")}
        title="Code Block"
      >
        <Code2 className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
        <Minus className="h-4 w-4" />
      </ToolbarButton>

      <div className="relative">
        <ToolbarButton onClick={handleLinkClick} isActive={editor.isActive("link")} title="Link">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        {showLinkInput && (
          <div className="absolute top-full left-0 mt-1 z-10 bg-popover border rounded-md shadow-md p-2 flex gap-2">
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Enter URL..."
              className="h-8 w-48 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") setLink();
                if (e.key === "Escape") setShowLinkInput(false);
              }}
              autoFocus
            />
            <Button size="sm" onClick={setLink}>
              Add
            </Button>
          </div>
        )}
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
        <Redo className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
};

export const RichEditor = ({ content, onChange, nodeTitle, onTitleChange }: RichEditorProps) => {
  const [title, setTitle] = useState(nodeTitle);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4",
      },
    },
  });

  // Update editor content when node changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Update title when node changes
  useEffect(() => {
    setTitle(nodeTitle);
  }, [nodeTitle]);

  const handleTitleBlur = () => {
    if (title.trim() && title !== nodeTitle) {
      onTitleChange(title.trim());
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Node title */}
      <div className="border-b p-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleTitleBlur();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="text-xl font-semibold border-none shadow-none focus-visible:ring-0 px-0 h-auto"
          placeholder="Node title..."
        />
      </div>

      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor content */}
      <div className="flex-1 overflow-auto flex justify-center">
        <div className="w-full max-w-xl">
          <EditorContent editor={editor} className="h-full" />
        </div>
      </div>
    </div>
  );
};
