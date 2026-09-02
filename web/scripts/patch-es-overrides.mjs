import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const esPath = path.join(__dirname, "i18n-overrides/es.json");
const es = JSON.parse(fs.readFileSync(esPath, "utf8"));

const patches = {
  "Incidents.time.ago": "hace",
  "CreateOrganizationPage.fields.trial": "Período de prueba",
  "GradeHoraria.subjects.codeLabel": "Código (opcional)",
  "DashboardHome.grid.widgetChartWeekly": "Gráfico: reservas por semana",
  "Sidebar.menuItems.gradeHoraria.label": "Horario",
  "Header.search.groups.pages": "Páginas",
  "Auth.resetPassword.passwordPlaceholder": "Mínimo 8 caracteres",
  "Auth.register.placeholders.password": "Mínimo 8 caracteres",
  "Vision.controls.captureArea": "Área de captura",
};

Object.assign(es, patches);
fs.writeFileSync(esPath, `${JSON.stringify(es, null, 2)}\n`);
console.log(`Patched ${Object.keys(patches).length} ES entries.`);
