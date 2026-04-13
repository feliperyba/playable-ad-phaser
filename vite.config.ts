import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";

export default defineConfig({
  base: "./",
  plugins: [viteSingleFile({ useRecommendedBuildConfig: true, removeViteModuleLoader: true })],
  build: {
    target: "esnext",
    minify: "terser",
    terserOptions: {
      compress: {
        passes: 3,
        drop_console: false,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
        unsafe: true,
        unsafe_math: true,
        unsafe_symbols: true,
      },
      mangle: {
        toplevel: true,
      },
      format: {
        comments: false,
        ecma: 2020,
      },
    },
    cssMinify: true,
    rollupOptions: {
      output: {
        compact: true,
      },
    },
  },
  resolve: {
    alias: {
      "@config": path.resolve(__dirname, "src/config"),
      "@entities": path.resolve(__dirname, "src/entities"),
      "@systems": path.resolve(__dirname, "src/systems"),
      "@scenes": path.resolve(__dirname, "src/scenes"),
      "@assets": path.resolve(__dirname, "src/assets"),
    },
  },
  server: { port: 8080 },
});
