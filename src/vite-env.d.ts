/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PLATFORM_MODE?: "auto" | "tauri" | "web";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
