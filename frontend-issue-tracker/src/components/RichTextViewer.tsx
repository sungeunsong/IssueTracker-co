import React, { useEffect, useRef } from "react";

interface RichTextViewerProps {
  value: string;
}

export const RichTextViewer: React.FC<RichTextViewerProps> = ({ value }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    const EditorConstructor = (window as any).toastui?.Editor;
    if (containerRef.current && EditorConstructor && !viewerRef.current) {
      viewerRef.current = EditorConstructor.factory({
        el: containerRef.current,
        viewer: true,
        initialValue: value || "",
      });
    }
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.setMarkdown(value || "");
    }
  }, [value]);

  return <div ref={containerRef} />;
};
