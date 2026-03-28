import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CustomClipboardContextMenu } from "./components/CustomClipboardContextMenu";
import { CentinelaToaster } from "./lib/centinelaToast";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        <App />
      </div>
      <CentinelaToaster />
      <CustomClipboardContextMenu />
    </div>
  </React.StrictMode>,
);
