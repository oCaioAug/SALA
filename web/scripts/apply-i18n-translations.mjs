import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dictDir = path.join(__dirname, "../src/i18n/dictionaries");
const overridesDir = path.join(__dirname, "i18n-overrides");

const ORPHAN_KEYS = [
  "Incidents.details.statusLabel",
  "ImageUpload.uploading",
  "ImageUpload.change",
  "ImageUpload.upload",
  "ImageUpload.removing",
  "UsersPage.user.actions",
  "Admin.plans.fields.reservationsShort",
  "Admin.plans.fields.slugPreview",
];

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

function getByPath(obj, pathStr) {
  return pathStr.split(".").reduce((o, k) => o?.[k], obj);
}

function deleteByPath(obj, pathStr) {
  const parts = pathStr.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur?.[parts[i]]) return;
    cur = cur[parts[i]];
  }
  delete cur[parts[parts.length - 1]];
}

function setByPath(obj, pathStr, value) {
  const parts = pathStr.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur[parts[i]] || typeof cur[parts[i]] !== "object") {
      cur[parts[i]] = {};
    }
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

const pt = JSON.parse(fs.readFileSync(path.join(dictDir, "pt.json"), "utf8"));
const ptKeys = new Set(leafKeys(pt));

for (const locale of ["en", "es", "fr", "ja"]) {
  const filePath = path.join(dictDir, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  for (const key of ORPHAN_KEYS) {
    if (!ptKeys.has(key)) {
      deleteByPath(data, key);
    }
  }

  const overridePath = path.join(overridesDir, `${locale}.json`);
  if (fs.existsSync(overridePath)) {
    const overrides = JSON.parse(fs.readFileSync(overridePath, "utf8"));
    let applied = 0;
    for (const [key, value] of Object.entries(overrides)) {
      if (ptKeys.has(key)) {
        setByPath(data, key, value);
        applied++;
      }
    }
    console.log(`${locale}: applied ${applied} overrides`);
  } else {
    console.warn(`${locale}: no override file found`);
  }

  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

console.log("Orphan keys removed from en/es/fr/ja (when absent in pt).");
