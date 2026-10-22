import { createRoot } from "react-dom/client";
import App from "./App";
import "@fontsource-variable/geist";
import "./index.css";

// Restored original navigation bar, category cards, and product card hover styles - 202606180615
createRoot(document.getElementById("root")!).render(<App />);
