import { DiffEditor } from "@monaco-editor/react";
import { type ComponentProps, useCallback, useEffect, useRef } from "react";
import { MonacoErrorBoundary } from "./MonacoErrorBoundary";

type DiffEditorProps = ComponentProps<typeof DiffEditor>;
type DiffEditorInstance = Parameters<NonNullable<DiffEditorProps["onMount"]>>[0];

/**
 * A wrapper around Monaco's DiffEditor that:
 * 1. Wraps it in a MonacoErrorBoundary to prevent React tree crashes
 * 2. Captures the editor ref via onMount for manual disposal
 * 3. Explicitly disposes the editor on unmount so Monaco's DiffEditorWidget
 *    can cleanly detach its models before React removes the DOM
 *
 * This fixes the "TextModel got disposed before DiffEditorWidget model got reset"
 * error that occurs when React unmounts the DiffEditor (e.g. Accept/Reject AI changes).
 *
 * The root cause: when `hasPending` flips to false (because `value === pendingCode`
 * after setCode), React unmounts the DiffEditor synchronously. Monaco's internal
 * TextModel.dispose() fires during DOM teardown, but the DiffEditorWidget hasn't
 * reset its model references yet. By calling editor.dispose() in useEffect cleanup
 * (which runs before DOM removal), we give Monaco the chance to do an orderly shutdown.
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

  // Dispose the editor instance on unmount BEFORE React removes the DOM.
  // This lets DiffEditorWidget detach its model references in the correct order,
  // preventing the "TextModel got disposed before DiffEditorWidget model got reset" error.
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        try {
          // Grab references to the text models before disposing the editor.
          const original = editorRef.current.getModel()?.original;
          const modified = editorRef.current.getModel()?.modified;
          // Dispose the widget FIRST — this resets its internal model references.
          editorRef.current.dispose();
          // Dispose the text models AFTER the widget, so the models' onWillDispose
          // event doesn't fire while the widget still holds references to them.
          original?.dispose();
          modified?.dispose();
        } catch {
          // Swallow — the error suppressor will catch anything that leaks
        }
        editorRef.current = null;
      }
    };
  }, []);

  return (
    <MonacoErrorBoundary>
      <DiffEditor {...props} onMount={handleMount} />
    </MonacoErrorBoundary>
  );
}
