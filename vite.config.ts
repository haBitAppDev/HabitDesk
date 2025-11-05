import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-htaccess",
      closeBundle() {
        const source = resolve(__dirname, "public/.htaccess");
        const target = resolve(__dirname, "dist/.htaccess");
        if (existsSync(source)) {
          copyFileSync(source, target);
        }
      },
    },
  ],
  envPrefix: ["VITE_", "FIREBASE_"],
});
