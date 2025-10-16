import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Ignore changes to build directories
      ignored: ['**/node_modules/**', '**/build/**', '**/dist/**'],
    },
    // Reduce polling frequency to prevent excessive reloads
    hmr: {
      overlay: false,
    },
  },
});
