import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Suppress Monaco-editor's harmless "TextModel got disposed before DiffEditorWidget model got reset" error
// which gets caught by Vite's error overlay and triggers an annoying popup in dev mode.
if (typeof window !== "undefined") {
  const isMonacoError = (msg: string | undefined | null) =>
    msg && msg.includes("TextModel got disposed before DiffEditorWidget");

  window.addEventListener("error", (e) => {
    if (isMonacoError(e.message) || isMonacoError(e.error?.message)) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  window.addEventListener("unhandledrejection", (e) => {
    const msg = e.reason?.message || (typeof e.reason === "string" ? e.reason : "");
    if (isMonacoError(msg)) {
      e.preventDefault();
      e.stopPropagation();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
