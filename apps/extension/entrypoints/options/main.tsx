import { createRoot } from "react-dom/client";
import App from "./App";
import "@/assets/theme.css";

const root = document.getElementById("root");
if (!root) throw new Error("options root element missing");
createRoot(root).render(<App />);
