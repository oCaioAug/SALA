import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dictDir = path.join(__dirname, "../src/i18n/dictionaries");
const locales = ["pt", "en", "es", "fr", "ja"];

const PORTUGUESE_RE =
  /[ãõáéíóúçÃÕÁÉÍÓÚÇ]|(\b(não|você|usuário|organização|organizações|convite|convites|erro ao|voltar ao|carregando|enviando|criar|aceitar|adicionar|deletar|permissões|localizações|dispositivos|bem-vindo|tentar novamente|redirecionando)\b)/i;

const ALLOWED_IDENTICAL = new Set([
  "Common.systemName",
  "Auth.login.title",
  "Admin.brand",
  "Admin.nav.billing",
  "Admin.billing.title",
  "Admin.billing.owner",
  "Admin.billing.stats.activeSub",
  "Admin.badges.organization.TRIAL",
  "Admin.badges.subscription.TRIALING",
  "Admin.organizations.statusTrial",
  "Admin.organizations.roleOwner",
  "Admin.organizations.ownerLabel",
  "Admin.organizations.filterTrial",
  "Admin.organizations.ownerPrefix",
  "Admin.organizations.metricTrial",
  "Admin.incidents.noTarget",
  "InicioPage.organization.namedTitle",
  "OrganizationsPage.status.trial",
  "OrganizationsPage.organization.namedTitle",
  "ProfileSetup.fields.cpf",
  "ProfileSetup.placeholders.cpf",
  "ProfileSetup.placeholders.phone",
  "Header.roles.owner",
  "LanguageSwitcher.portuguese",
  "LanguageSwitcher.english",
  "LanguageSwitcher.spanish",
  "LanguageSwitcher.french",
  "LanguageSwitcher.japanese",
  "SettingsPage.items.profile.id",
  "SettingsPage.items.notifications.id",
  "SettingsPage.items.security.id",
  "SettingsPage.items.database.id",
  "SettingsPage.items.appearance.id",
  "Notifications.feedback.testSuccess",
  "Auth.register.fields.cpf",
  "Auth.register.fields.cnpj",
  "Auth.register.placeholders.cpf",
  "Auth.register.placeholders.phone",
  "Auth.register.placeholders.cnpj",
  "Auth.register.placeholders.organizationPhone",
  "Auth.register.step3.fields.cpf",
  "Auth.register.step3.fields.cnpj",
  "CreateOrganizationPage.fields.cnpj",
  "CreateOrganizationPage.placeholders.cnpj",
  "CreateOrganizationPage.placeholders.phone",
  "CreateOrganizationPage.emptyValue",
  "RoomDetail.form.iconPlaceholder",
  "LandingPage.product.rooms.lab1",
  "LandingPage.product.rooms.lab2",
  "LandingPage.product.demos.reservations.requesters.u1",
  "LandingPage.product.demos.reservations.requesters.u2",
  "LandingPage.product.demos.reservations.requesters.u3",
  "LandingPage.product.demos.reservations.requesters.u4",
  "LandingPage.product.demos.calendar.selectedBusy",
  "LandingPage.features.f4.title",
  "Vision.auditTable.statusOk",
  "Invites.emailPlaceholder",
  "CreateOrganizationPage.placeholders.email",
]);

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

function looksUntranslated(key, ptValue, localeValue, locale) {
  if (ALLOWED_IDENTICAL.has(key)) return false;
  if (localeValue !== ptValue) return false;
  if (typeof ptValue !== "string" || ptValue.length === 0) return false;

  if (locale === "es") {
    return /\b(não|você|usuários?|organizações?|redirecionando|bem-vindo|erro ao)\b|ções\b|ção\b|[ãõ]/i.test(
      ptValue
    );
  }

  return PORTUGUESE_RE.test(ptValue);
}

const data = {};
for (const locale of locales) {
  data[locale] = JSON.parse(
    fs.readFileSync(path.join(dictDir, `${locale}.json`), "utf8")
  );
}

const ptKeys = new Set(leafKeys(data.pt));
let failed = false;

console.log("=== Key parity (pt as reference) ===");
for (const locale of ["en", "es", "fr", "ja"]) {
  const keys = new Set(leafKeys(data[locale]));
  const missing = [...ptKeys].filter(k => !keys.has(k));
  const extra = [...keys].filter(k => !ptKeys.has(k));
  if (missing.length || extra.length) {
    failed = true;
    console.error(`\n${locale}:`);
    if (missing.length) {
      console.error(`  missing (${missing.length}):`, missing.slice(0, 15));
    }
    if (extra.length) {
      console.error(`  extra (${extra.length}):`, extra.slice(0, 15));
    }
  } else {
    console.log(`${locale}: OK (${keys.size} keys)`);
  }
}

console.log("\n=== Likely untranslated Portuguese ===");
for (const locale of ["en", "es", "fr", "ja"]) {
  const suspicious = [...ptKeys].filter(k => {
    if (ALLOWED_IDENTICAL.has(k)) return false;
    const ptValue = getByPath(data.pt, k);
    const localeValue = getByPath(data[locale], k);
    return looksUntranslated(k, ptValue, localeValue, locale);
  });
  if (suspicious.length) {
    failed = true;
    console.error(
      `${locale}: ${suspicious.length} suspicious`,
      suspicious.slice(0, 10)
    );
  } else {
    console.log(`${locale}: OK`);
  }
}

console.log("\n=== Empty values ===");
for (const locale of locales) {
  const empty = [...ptKeys].filter(k => {
    const v = getByPath(data[locale], k);
    return v === "" || v === null || v === undefined;
  });
  if (empty.length) {
    console.warn(`${locale}: ${empty.length} empty`, empty);
  }
}

if (failed) process.exit(1);
console.log("\nParidade OK entre todos os locales.");
