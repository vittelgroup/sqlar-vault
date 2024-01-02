import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  outfile: "dist/index.cjs",
  platform: "node",
  format: "cjs",
  minify: true,
  target: "node18",
  packages: "external",
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
