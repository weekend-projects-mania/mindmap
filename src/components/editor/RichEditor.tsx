import { useEditor, EditorContent, Editor } from "@tiptap/react";
import "./editor.css";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Link as LinkIcon,
  Code2,
  Plus,
  Type,
  ChevronDown,
  ListTree,
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

const FloatingToolbar = ({ editor }: { editor: Editor }) => {
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
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-1.5 flex items-center gap-0.5">
      {/* Insert dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
            <Plus className="h-4 w-4" />
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            Horizontal Rule
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <Code2 className="h-4 w-4 mr-2" />
            Code Block
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote className="h-4 w-4 mr-2" />
            Quote
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Text style dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
            <Type className="h-4 w-4" />
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem 
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "bg-accent" : ""}
          >
            <Bold className="h-4 w-4 mr-2" />
            Bold
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "bg-accent" : ""}
          >
            <Italic className="h-4 w-4 mr-2" />
            Italic
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive("strike") ? "bg-accent" : ""}
          >
            <Strikethrough className="h-4 w-4 mr-2" />
            Strikethrough
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive("heading", { level: 1 }) ? "bg-accent" : ""}
          >
            <Heading1 className="h-4 w-4 mr-2" />
            Heading 1
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive("heading", { level: 2 }) ? "bg-accent" : ""}
          >
            <Heading2 className="h-4 w-4 mr-2" />
            Heading 2
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive("heading", { level: 3 }) ? "bg-accent" : ""}
          >
            <Heading3 className="h-4 w-4 mr-2" />
            Heading 3
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Lists */}
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

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Code */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title="Inline Code"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      {/* Link */}
      <div className="relative">
        <ToolbarButton onClick={handleLinkClick} isActive={editor.isActive("link")} title="Link">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        {showLinkInput && (
          <div className="absolute bottom-full left-0 mb-2 z-10 bg-popover border rounded-md shadow-md p-2 flex gap-2">
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
        class: "prose prose-sm max-w-none focus:outline-none min-h-[200px] p-6 pt-0",
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
    <div className="relative flex flex-col h-full bg-background">
      {/* Editor content area with title */}
      <div className="flex-1 overflow-auto flex justify-center pb-20">
        <div className="w-full max-w-2xl px-6 pt-8">
          {/* Large node title */}
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
            className="text-3xl font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto mb-4"
            placeholder="Node title..."
          />


          {/* Editor content */}
          <EditorContent editor={editor} className="h-full" />
        </div>
      </div>

      {/* Floating toolbar at bottom */}
      <FloatingToolbar editor={editor} />
    </div>
  );
};
