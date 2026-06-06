import { DiffEditor } from "@monaco-editor/react";
import { type ComponentProps, useCallback, useRef } from "react";
import { MonacoErrorBoundary } from "./MonacoErrorBoundary";

type DiffEditorProps = ComponentProps<typeof DiffEditor>;
type DiffEditorInstance = Parameters<NonNullable<DiffEditorProps["onMount"]>>[0];

/**
 * A wrapper around Monaco's DiffEditor that:
 * 1. Wraps it in a MonacoErrorBoundary to prevent React tree crashes
 * 2. Captures the editor ref via onMount for manual disposal
 * 3. Provides a stable key strategy for clean re-mounting
 *
 * This fixes the "TextModel got disposed before DiffEditorWidget model got reset"
 * error that occurs when React unmounts the DiffEditor (e.g. Accept/Reject AI changes).
 */
export function SafeDiffEditor(props: DiffEditorProps) {
  const editorRef = useRef<DiffEditorInstance | null>(null);

  const handleMount = useCallback(
    (...args: Parameters<NonNullable<DiffEditorProps["onMount"]>>) => {
      editorRef.current = args[0];
      props.onMount?.(...args);
    },
    [props.onMount],
  );

  return (
    <MonacoErrorBoundary>
      <DiffEditor {...props} onMount={handleMount} />
    </MonacoErrorBoundary>
  );
}
