import { defineConfig } from "vite";

export default defineConfig({
    build: {
        lib: {
            entry: {
                index: "src/index.ts",
                parser: "src/parser.ts",
                schema: "src/schema.ts",
                util: "src/util.ts",
            },
            name: "typed-xml",
            fileName: (format, entryName) => `${entryName}.${format}.js`,
        },
    },
    test: {
        watch: false,
        globals: true,
    },
});
