import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dictDir = path.join(__dirname, "../src/i18n/dictionaries");

function leafKeys(obj, prefix = "") {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...leafKeys(v, p));
    } else {
      keys.push(p);
    }
  }
  return keys;
}

const pt = JSON.parse(fs.readFileSync(path.join(dictDir, "pt.json"), "utf8"));
const ptKeys = new Set(leafKeys(pt));
let failed = false;

for (const locale of ["en", "es", "fr", "ja"]) {
  const data = JSON.parse(
    fs.readFileSync(path.join(dictDir, `${locale}.json`), "utf8")
  );
  const keys = new Set(leafKeys(data));
  const missing = [...ptKeys].filter(k => !keys.has(k));
  if (missing.length) {
    failed = true;
    console.error(`\n${locale}:`);
    console.error(`  missing (${missing.length}):`, missing.slice(0, 15));
  } else {
    console.log(`${locale}: OK (${keys.size} keys)`);
  }
}

if (failed) process.exit(1);
console.log("\nParidade OK entre pt e demais locales.");
