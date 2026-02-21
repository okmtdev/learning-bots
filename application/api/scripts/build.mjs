import * as esbuild from "esbuild";
import { readdirSync } from "fs";
import { join, basename } from "path";

const functionsDir = join(import.meta.dirname, "../src/functions");
const outDir = join(import.meta.dirname, "../dist");

const entryPoints = readdirSync(functionsDir)
  .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
  .map((f) => join(functionsDir, f));

for (const entry of entryPoints) {
  const name = basename(entry, ".ts");
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    platform: "node",
    target: "node20",
    format: "esm",
    outfile: join(outDir, name, "index.mjs"),
    external: [
      "@aws-sdk/client-dynamodb",
      "@aws-sdk/client-s3",
      "@aws-sdk/client-ssm",
      "@aws-sdk/client-cognito-identity-provider",
      "@aws-sdk/lib-dynamodb",
      "@aws-sdk/cloudfront-signer",
    ],
    sourcemap: true,
    minify: true,
    banner: {
      js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
    },
  });
  console.log(`✅ Built: ${name}`);
}

console.log("🎉 All functions built successfully!");
