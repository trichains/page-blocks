/**
 * Validates every page document in content/pages against the zod schemas.
 * Runs in CI before the build: `npm run validate-content`.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { ContentError, parseDocument } from "../lib/content/repository";

async function main() {
  const dir = path.resolve(process.argv[2] ?? path.join(process.cwd(), "content", "pages"));
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
  if (files.length === 0) {
    console.error(`No page documents found in ${dir}`);
    process.exit(1);
  }

  let failed = 0;
  for (const name of files) {
    const file = path.join(dir, name);
    try {
      const page = parseDocument(await readFile(file, "utf8"), file, name.replace(/\.json$/, ""));
      console.log(`ok    ${name}  (${page.blocks.length} blocks, ${page.locale})`);
    } catch (error) {
      failed++;
      if (error instanceof ContentError) {
        console.error(`FAIL  ${name}`);
        for (const issue of error.issues) console.error(`      ${issue.path || "(root)"}: ${issue.message}`);
      } else {
        console.error(`FAIL  ${name}: ${(error as Error).message}`);
      }
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} of ${files.length} page document(s) are invalid.`);
    process.exit(1);
  }
  console.log(`\nAll ${files.length} page documents are valid.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
