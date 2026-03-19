import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
const base = process.env.VITE_BASE_PATH || "/";

// Plugin to copy localization files from src to public
function copyLocales() {
  return {
    name: "copy-locales",
    buildStart() {
      const srcDir = resolve(__dirname, "src/locales");
      const destDir = resolve(__dirname, "public/locales");

      // Ensure public/locales exists
      mkdirSync(destDir, { recursive: true });

      // Copy all .ftl files
      const locales = [
        "fi.ftl",
        "se.ftl",
        "sma.ftl",
        "smj.ftl",
        "sms.ftl",
        "smn.ftl",
        "nb.ftl",
        "nn.ftl",
        "sv.ftl",
      ];

      locales.forEach((file) => {
        const src = resolve(srcDir, file);
        const dest = resolve(destDir, file);
        copyFileSync(src, dest);
        console.log(`📝 Copied ${file} to public/locales/`);
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), copyLocales()],
  base,

  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
