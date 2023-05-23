import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./schema.graphql",
  documents: ["./lib/*.test.ts"],
  overwrite: true,
  generates: {
    "./generated-operations.ts": {
      plugins: ["typescript", "typescript-operations", "typed-document-node"],
    },
  },
};
export default config;
