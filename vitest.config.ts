import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "components",
          include: ["src/**/*.test.tsx"],
          environment: "happy-dom",
          setupFiles: ["./vitest.setup.ts"],
          globals: true,
        },
      },
    ],
  },
});
