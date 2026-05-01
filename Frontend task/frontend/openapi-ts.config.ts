import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "../openapi.yaml",
  output: {
    path: "src/api/generated",
    format: "prettier",
  },
  plugins: [
    {
      name: "@hey-api/client-fetch",
      runtimeConfigPath: "./src/api/runtime-config.ts",
    },
    "@hey-api/typescript",
    "@hey-api/sdk",
    {
      name: "@tanstack/react-query",
      infiniteQueryOptions: true,
    },
  ],
});
