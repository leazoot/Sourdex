import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Workspace packages are aliased to their source so tests run without a prior build.
const sourdexAliases = {
  "@sourdex/core": fileURLToPath(new URL("./packages/core/src/index.ts", import.meta.url)),
  "@sourdex/db": fileURLToPath(new URL("./packages/db/src/index.ts", import.meta.url)),
  "@sourdex/extractor": fileURLToPath(
    new URL("./packages/extractor/src/index.ts", import.meta.url),
  ),
  "@sourdex/search": fileURLToPath(new URL("./packages/search/src/index.ts", import.meta.url)),
  "@sourdex/exporter": fileURLToPath(new URL("./packages/exporter/src/index.ts", import.meta.url)),
};

const webSrc = fileURLToPath(new URL("./apps/web/src", import.meta.url));

// Two projects: a node project for back-end/packages/extension, and a jsdom project
// for the React web app (which uses the `@/` → src alias and renders components).
export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias: sourdexAliases },
        test: {
          name: "node",
          environment: "node",
          include: [
            "packages/**/src/**/*.test.ts",
            "apps/server/src/**/*.test.ts",
            "apps/extension/{lib,components,entrypoints}/**/*.test.ts",
          ],
          passWithNoTests: true,
        },
      },
      {
        // Transform JSX/TSX via esbuild's automatic runtime (no react plugin needed for tests).
        esbuild: { jsx: "automatic", jsxImportSource: "react" },
        resolve: { alias: { "@": webSrc, ...sourdexAliases } },
        test: {
          name: "web",
          environment: "jsdom",
          include: ["apps/web/src/**/*.test.{ts,tsx}"],
          passWithNoTests: true,
        },
      },
    ],
  },
});
