import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/**
 * Logs a clear marker when Vite finishes booting, and surfaces boot-time
 * errors with file/line context before the process exits. This makes the
 * dev-server log far easier to triage than a bare ERR_MODULE_NOT_FOUND stack.
 */
function bootLogger(): Plugin {
  return {
    name: "rtt-boot-logger",
    configResolved() {
      const ts = new Date().toISOString();
      // eslint-disable-next-line no-console
      console.log(`[vite] config resolved at ${ts}`);
    },
    buildStart() {
      // eslint-disable-next-line no-console
      console.log(`[vite] booted OK at ${new Date().toISOString()}`);
    },
  };
}

// Surface unhandled boot-time errors with a recognizable prefix so the
// dev-server log shows the actual failure instead of a generic stack.
process.on("uncaughtException", (err) => {
  // eslint-disable-next-line no-console
  console.error("[vite][boot-error]", err?.stack || err);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  // eslint-disable-next-line no-console
  console.error("[vite][boot-rejection]", err);
  process.exit(1);
});

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    bootLogger(),
    react(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
