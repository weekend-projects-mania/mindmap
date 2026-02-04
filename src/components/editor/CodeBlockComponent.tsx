import { NodeViewContent, NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const languageLabels: Record<string, string> = {
  javascript: "JavaScript",
  js: "JavaScript",
  typescript: "TypeScript",
  ts: "TypeScript",
  python: "Python",
  py: "Python",
  html: "HTML",
  css: "CSS",
  json: "JSON",
  bash: "Bash",
  shell: "Shell",
  sql: "SQL",
  java: "Java",
  cpp: "C++",
  c: "C",
  go: "Go",
  rust: "Rust",
  ruby: "Ruby",
  php: "PHP",
  swift: "Swift",
  kotlin: "Kotlin",
  yaml: "YAML",
  xml: "XML",
  markdown: "Markdown",
  md: "Markdown",
};

export const CodeBlockComponent = ({
  node,
  updateAttributes,
  extension,
}: NodeViewProps) => {
  const [copied, setCopied] = useState(false);
  const language = (node.attrs.language as string) || "plaintext";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(node.textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const lowlight = extension.options.lowlight as { listLanguages: () => string[] };

  return (
    <NodeViewWrapper className="code-block-wrapper">
      <div className="code-block-header">
        <select
          contentEditable={false}
          value={language}
          onChange={(e) => updateAttributes({ language: e.target.value })}
          className="code-block-language-select"
        >
          <option value="">Plain text</option>
          {lowlight.listLanguages().map((lang: string) => (
            <option key={lang} value={lang}>
              {languageLabels[lang] || lang}
            </option>
          ))}
        </select>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
          contentEditable={false}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      <pre>
        <NodeViewContent as={"code" as "div"} className="hljs" />
      </pre>
    </NodeViewWrapper>
  );
};
