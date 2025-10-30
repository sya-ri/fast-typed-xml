import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        watch: false,
        globals: true,
        include: ["src/**/*.test.ts"],
        coverage: {
            include: ["src/**/*.ts"],
        },
    },
});
