/**
 * Post-codegen fix for lib/api-zod/src/index.ts
 *
 * Orval (mode:"split") appends `export * from './generated/api'` and
 * `export * from './generated/types'` to the workspace index file after every
 * run.  Because RequestUploadUrlBody / RequestUploadUrlResponse exist in BOTH
 * generated files, exporting both with `export *` creates an ambiguous
 * re-export TypeScript error (TS2308).
 *
 * This script reads the generated types file to discover every exported name,
 * then rewrites the index so that:
 *   • `generated/api`   is re-exported with `export *` (Zod schemas + any
 *                       names that only live there)
 *   • `generated/types` is re-exported with `export type { … }` for every
 *                       name that is NOT already in generated/api, preventing
 *                       the ambiguity.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");

const apiFile   = resolve(root, "lib/api-zod/src/generated/api.ts");
const typesFile = resolve(root, "lib/api-zod/src/generated/types/index.ts");
const indexFile = resolve(root, "lib/api-zod/src/index.ts");

// ── helpers ──────────────────────────────────────────────────────────────────

function extractExportedNames(src) {
  const names = new Set();
  // export const / export function / export type / export interface / export class
  for (const [, name] of src.matchAll(
    /^export\s+(?:const|function|type|interface|class|enum|abstract class)\s+(\w+)/gm,
  )) {
    names.add(name);
  }
  // export { Foo, Bar }
  for (const [, block] of src.matchAll(/^export\s*\{([^}]+)\}/gm)) {
    for (const raw of block.split(",")) {
      const name = raw.replace(/\s+as\s+\w+/, "").trim();
      if (name) names.add(name);
    }
  }
  return names;
}

// ── main ─────────────────────────────────────────────────────────────────────

const apiSrc   = readFileSync(apiFile,   "utf8");
const typesSrc = readFileSync(typesFile, "utf8");

const apiNames   = extractExportedNames(apiSrc);
const typesNames = extractExportedNames(typesSrc);

// Names that are ONLY in types (safe to selective-re-export without conflict)
const onlyInTypes = [...typesNames].filter((n) => !apiNames.has(n));
// Names that are in BOTH files — must use `export type` to avoid TS2308
const inBoth = [...typesNames].filter((n) => apiNames.has(n));

const selectiveTypes = [...onlyInTypes, ...inBoth].sort();

const newIndex = [
  "// Zod validation schemas — primary exports (used for server-side request validation)",
  'export * from "./generated/api";',
  "// TypeScript interfaces — selective re-export to avoid naming conflict with Zod schemas above",
  "export type {",
  ...selectiveTypes.map((n) => `  ${n},`),
  '} from "./generated/types";',
  "",
].join("\n");

writeFileSync(indexFile, newIndex);
console.log(
  `fix-zod-index: wrote ${selectiveTypes.length} selective type exports to lib/api-zod/src/index.ts`,
);
