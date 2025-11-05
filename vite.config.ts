import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-htaccess",
      closeBundle() {
        const source = resolve(rootDir, "public/.htaccess");
        const target = resolve(rootDir, "dist/.htaccess");
        if (existsSync(source)) {
          copyFileSync(source, target);
        }
      },
    },
  ],
  envPrefix: ["VITE_", "FIREBASE_"],
});
