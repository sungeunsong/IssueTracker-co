import React, { useEffect, useRef, useState } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any>(null);
  const [mode, setMode] = useState<"wysiwyg" | "markdown">("wysiwyg");

  useEffect(() => {
    const EditorConstructor = (window as any).toastui?.Editor;
    if (containerRef.current && EditorConstructor && !editorRef.current) {
      editorRef.current = new EditorConstructor({
        el: containerRef.current,
        height: "300px",
        initialEditType: mode,
        previewStyle: "vertical",
        initialValue: value || "",
      });
      editorRef.current.on("change", () => {
        const md = editorRef.current.getMarkdown();
        onChange(md);
      });
    }
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (editorRef.current && editorRef.current.getMarkdown() !== value) {
      editorRef.current.setMarkdown(value || "");
    }
  }, [value]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.changeMode(mode, true);
    }
  }, [mode]);

  return (
    <div>
      {/* <div className="flex justify-end mb-2">
        <select
          className="border rounded px-2 py-1 text-sm"
          value={mode}
          onChange={(e) => setMode(e.target.value as "wysiwyg" | "markdown")}
        >
          <option value="wysiwyg">텍스트 모드</option>
          <option value="markdown">마크다운</option>
        </select>
      </div> */}
      <div ref={containerRef} />
    </div>
  );
};
