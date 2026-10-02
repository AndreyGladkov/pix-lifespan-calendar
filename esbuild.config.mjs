import esbuild from "esbuild";
import { builtinModules } from "node:module";
import process from "node:process";

const production = process.argv[2] === "production";

const context = await esbuild.context({
    entryPoints: ["src/main.ts"],
    bundle: true,
    external: [
        "obsidian",
        "electron",
        "@codemirror/*",
        "@lezer/*",
        ...builtinModules,
        ...builtinModules.map((name) => `node:${name}`),
    ],
    format: "cjs",
    target: "es2021",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": JSON.stringify(production ? "production" : "development") },
    logLevel: "info",
    sourcemap: production ? false : "inline",
    treeShaking: true,
    minify: production,
    outfile: "main.js",
});

if (production) {
    await context.rebuild();
    await context.dispose();
} else {
    await context.watch();
}
