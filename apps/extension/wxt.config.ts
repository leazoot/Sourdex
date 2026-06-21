import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// WXT + React + MV3. Minimal permissions only (PRD §8.1):
// - activeTab + scripting: read the current tab's HTML/selection on user action
// - contextMenus: "Save selection to Sourdex"
// - storage: persist the paired local-service token (OQ-A1)
// host_permissions are scoped to the loopback local service, never broad web access.
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Sourdex",
    description:
      "Save once. Find forever. — save pages and selections to your local Sourdex index.",
    permissions: ["activeTab", "scripting", "contextMenus", "storage"],
    host_permissions: ["http://127.0.0.1/*", "http://localhost/*"],
    commands: {
      "save-page": {
        suggested_key: { default: "Ctrl+Shift+S", mac: "Command+Shift+S" },
        description: "Save the current page to Sourdex",
      },
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
