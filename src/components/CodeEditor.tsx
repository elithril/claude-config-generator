"use client";

import { useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: "json" | "markdown" | "text";
  height?: string;
}

const languageExtensions = {
  json: [json()],
  markdown: [markdown()],
  text: [],
};

const theme = EditorView.theme({
  "&": {
    fontSize: "13px",
    fontFamily: "var(--font-jetbrains), monospace",
  },
  ".cm-content": {
    padding: "12px 0",
  },
  ".cm-line": {
    padding: "0 16px",
  },
  ".cm-gutters": {
    backgroundColor: "#fafafa",
    borderRight: "1px solid #e5e7eb",
    color: "#9ca3af",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#f0f0f0",
  },
  ".cm-activeLine": {
    backgroundColor: "#f8f9fa",
  },
});

export default function CodeEditor({ value, onChange, language, height = "100%" }: CodeEditorProps) {
  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange]
  );

  return (
    <CodeMirror
      value={value}
      height={height}
      extensions={[...languageExtensions[language], theme, EditorView.lineWrapping]}
      onChange={handleChange}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        foldGutter: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: false,
      }}
    />
  );
}
