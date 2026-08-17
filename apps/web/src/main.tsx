import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { SocketProvider } from "./lib/socket-context";
import "./index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(
  <StrictMode>
    <SocketProvider>
      <App />
    </SocketProvider>
  </StrictMode>,
);
