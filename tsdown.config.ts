import { defineConfig } from "tsdown";

export default defineConfig({
    dts: true,
    entry: {
        index: "./src/index.ts",
        parser: "./src/parser.ts",
        schema: "./src/schema.ts",
        util: "./src/util.ts",
    },
    format: ["cjs", "esm"],
});
