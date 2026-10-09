import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    outDir: "build",
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
