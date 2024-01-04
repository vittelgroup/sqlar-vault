import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  minify: true,
  outDir: "dist",
  target: "node18",
  dts: true,
  format: ["cjs", "esm"],
});
