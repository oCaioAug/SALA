import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pt = JSON.parse(
  fs.readFileSync(path.join(__dirname, "i18n-keys-to-translate.json"), "utf8"),
);
const en = JSON.parse(
  fs.readFileSync(path.join(__dirname, "i18n-overrides/en.json"), "utf8"),
);

function leafKeys(obj, prefix = "") {
  const keys = {};
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(keys, leafKeys(v, p));
    } else {
      keys[p] = v;
    }
  }
  return keys;
}

const esDict = leafKeys(
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../src/i18n/dictionaries/es.json"),
      "utf8",
    ),
  ),
);

/** Spanish translations keyed by dot-path; sourced from EN with ICU placeholders preserved */
const ES = {
  "Admin.audit.description": "Registro de acciones administrativas en la plataforma",
  "Admin.audit.emptyDesc": "No hay registros de auditoría con el filtro actual",
  "Admin.audit.emptyTitle": "No se encontraron registros",
  "Admin.audit.refresh": "Actualizar",
  "Admin.audit.searchPlaceholder": "Filtrar por acción...",
  "Admin.audit.title": "Registro de auditoría",
  "Admin.badges.incident.CANCELLED": "Cancelado",
  "Admin.badges.incident.REPORTED": "Reportado",
  "Admin.badges.incidentPriority.CRITICAL": "Crítica",
  "Admin.badges.incidentPriority.HIGH": "Alta",
  "Admin.badges.organization.TRIAL": "Prueba",
  "Admin.badges.platformRole.SUPER_ADMIN": "Super Admin",
  "Admin.badges.subscription.CANCELLED": "Cancelada",
  "Admin.badges.subscription.TRIALING": "Prueba",
  "Admin.billing.allPlans": "Todos los planes",
  "Admin.billing.allStatuses": "Todos los estados",
  "Admin.billing.changePlan": "Cambiar plan",
  "Admin.billing.closeModal": "Cerrar",
  "Admin.billing.currentPlan": "Plan actual",
  "Admin.billing.description":
    "Gestión centralizada de suscripciones y renovaciones de las organizaciones",
  "Admin.billing.emptyDesc": "No hay suscripciones con los filtros seleccionados",
  "Admin.billing.emptyTitle": "No se encontraron suscripciones",
  "Admin.billing.expiringSoon": "Expira en 7 días",
  "Admin.billing.externalId": "ID externo",
  "Admin.billing.loading": "Cargando...",
  "Admin.billing.manage": "Gestionar",
  "Admin.billing.notFound": "Suscripción no encontrada",
  "Admin.billing.organization": "Organización",
  "Admin.billing.orgsWithoutSubscription":
    "{count} organización(es) sin suscripción registrada",
  "Admin.billing.owner": "Propietario",
  "Admin.billing.periodEnd": "Fin del período / renovación",
  "Admin.billing.periodStart": "Inicio del período",
  "Admin.billing.planFilter": "Plan",
  "Admin.billing.renewsOn": "Renueva el",
  "Admin.billing.saveChanges": "Guardar cambios",
  "Admin.billing.saving": "Guardando...",
  "Admin.billing.searchPlaceholder": "Organización, plan o ID externo...",
  "Admin.billing.searchTitle": "Buscar suscripción",
  "Admin.billing.stats.active": "Activas",
  "Admin.billing.stats.activeSub": "ACTIVE + TRIALING",
  "Admin.billing.stats.attention": "Atención",
  "Admin.billing.stats.attentionSub": "Morosas o por expirar",
  "Admin.billing.stats.cancelled": "Canceladas",
  "Admin.billing.stats.cancelledSub": "Suscripciones cerradas",
  "Admin.billing.stats.total": "Total",
  "Admin.billing.stats.totalSub": "{count} org(s) sin suscripción",
  "Admin.billing.status": "Estado",
  "Admin.billing.statusFilter": "Estado",
  "Admin.billing.tabs.active": "Activas / prueba",
  "Admin.billing.tabs.all": "Todas",
  "Admin.billing.tabs.attention": "Atención",
  "Admin.billing.tabs.cancelled": "Canceladas",
  "Admin.billing.title": "Facturación",
  "Admin.billing.viewOrganizations": "Ver organizaciones",
  "Admin.brand": "SALA Admin",
  "Admin.charts.reservations": "Reservas",
  "Admin.dashboard.activeOrgs": "Organizaciones activas",
  "Admin.dashboard.activeOrgs30d": "Orgs activas (30d)",
  "Admin.dashboard.analyticsDescription": "Analítica global de la plataforma SALA",
  "Admin.dashboard.description": "Vista general de la plataforma",
  "Admin.dashboard.expiringTrials": "Pruebas por expirar",
  "Admin.dashboard.inactiveOrgs": "Organizaciones inactivas",
  "Admin.dashboard.loadDataError": "Error al cargar datos",
  "Admin.dashboard.loadError": "Error al cargar estadísticas",
  "Admin.dashboard.openIncidents": "Incidentes abiertos",
  "Admin.dashboard.openIncidentsSub": "Requieren atención",
  "Admin.dashboard.organizationsActiveSub": "{count} activas",
  "Admin.dashboard.organizationsTotal": "Organizaciones",
  "Admin.dashboard.orgsByPlan": "Organizaciones por plan",
  "Admin.dashboard.orgsCount": "{count} orgs",
  "Admin.dashboard.refreshMetrics": "Actualizar métricas diarias",
  "Admin.dashboard.refreshing": "Actualizando...",
  "Admin.dashboard.reservations30d": "Reservas (30d)",
  "Admin.dashboard.reservations30dSub": "Últimos 30 días",
  "Admin.dashboard.reservationsCount": "{count} reservas",
  "Admin.dashboard.retention": "Retención (30d)",
  "Admin.dashboard.title": "Panel",
  "Admin.dashboard.topOrgs": "Principales organizaciones por reservas",
  "Admin.dashboard.totalRooms": "Salas",
  "Admin.dashboard.totalRoomsSub": "En todas las orgs",
  "Admin.dashboard.totalUsers": "Usuarios",
  "Admin.dashboard.totalUsersSub": "Registrados en la plataforma (todos los roles)",
  "Admin.dashboard.unknownError": "Error desconocido",
  "Admin.dashboard.viewAllOrgs": "Ver todas las organizaciones",
  "Admin.dashboard.weeklyOrgs": "Nuevas organizaciones por semana",
  "Admin.dashboard.weeklyUsers": "Nuevos usuarios por semana",
  "Admin.incidents.allOrganizations": "Todas las organizaciones",
  "Admin.incidents.allPriorities": "Todas las prioridades",
  "Admin.incidents.allStatuses": "Todos los estados",
  "Admin.incidents.closeModal": "Cerrar",
  "Admin.incidents.createdAt": "Creado el",
  "Admin.incidents.description":
    "Vista entre organizaciones de incidentes reportados",
  "Admin.incidents.emptyDesc": "No hay incidentes con los filtros seleccionados",
  "Admin.incidents.emptyTitle": "No se encontraron incidentes",
  "Admin.incidents.history": "Historial de estados",
  "Admin.incidents.loading": "Cargando...",
  "Admin.incidents.noTarget": "—",
  "Admin.incidents.notFound": "Incidente no encontrado",
  "Admin.incidents.organization": "Organización",
  "Admin.incidents.organizationFilter": "Organización",
  "Admin.incidents.priority": "Prioridad",
  "Admin.incidents.priorityFilter": "Prioridad",
  "Admin.incidents.reportedBy": "Reportado por",
  "Admin.incidents.resolutionNotes": "Notas de resolución",
  "Admin.incidents.resolve": "Marcar como resuelto",
  "Admin.incidents.saveChanges": "Guardar cambios",
  "Admin.incidents.saving": "Guardando...",
  "Admin.incidents.searchPlaceholder": "Título, descripción u organización...",
  "Admin.incidents.searchTitle": "Buscar incidente",
  "Admin.incidents.stats.critical": "Críticos abiertos",
  "Admin.incidents.stats.criticalSub": "Prioridad máxima",
  "Admin.incidents.stats.open": "Abiertos",
  "Admin.incidents.stats.openSub": "Requieren seguimiento",
  "Admin.incidents.stats.resolved": "Cerrados",
  "Admin.incidents.stats.resolvedSub": "Resueltos o cancelados",
  "Admin.incidents.stats.total": "Total",
  "Admin.incidents.stats.totalSub": "Todos los incidentes",
  "Admin.incidents.status": "Estado",
  "Admin.incidents.statusFilter": "Estado",
  "Admin.incidents.tabs.open": "Abiertos",
  "Admin.incidents.tabs.resolved": "Resueltos / cancelados",
  "Admin.incidents.target": "Sala / elemento",
  "Admin.incidents.title": "Incidentes",
  "Admin.incidents.viewDetails": "Ver detalles",
  "Admin.nav.audit": "Registro de auditoría",
  "Admin.nav.billing": "Facturación",
  "Admin.nav.dashboard": "Panel",
  "Admin.nav.home": "Inicio",
  "Admin.nav.incidents": "Incidentes",
  "Admin.nav.logout": "Salir",
  "Admin.nav.organizations": "Organizaciones",
  "Admin.nav.plans": "Planes",
  "Admin.nav.users": "Usuarios",
  "Admin.organizations.addMember": "Agregar",
  "Admin.organizations.addMemberPlaceholder": "Agregar miembro por correo",
  "Admin.organizations.backToList": "Volver a organizaciones",
  "Admin.organizations.cancel": "Cancelar",
  "Admin.organizations.changePlan": "Cambiar plan",
  "Admin.organizations.changeStatus": "Cambiar estado",
  "Admin.organizations.create": "Crear organización",
  "Admin.organizations.createdAt": "Creada el",
  "Admin.organizations.creating": "Creando...",
  "Admin.organizations.deleteOrg": "Desactivar organización",
  "Admin.organizations.deleteOrgConfirm":
    "¿Desactivar (eliminación suave) esta organización? Dejará de aparecer en los listados.",
  "Admin.organizations.description": "Gestione los clientes de la plataforma",
  "Admin.organizations.detailTitle": "Organización",
  "Admin.organizations.emptyDesc": "Cree la primera organización para comenzar",
  "Admin.organizations.emptyTitle": "No se encontraron organizaciones",
  "Admin.organizations.fields.email": "Correo de contacto",
  "Admin.organizations.fields.name": "Nombre de la organización",
  "Admin.organizations.fields.ownerEmail": "Correo del propietario",
  "Admin.organizations.fields.ownerName": "Nombre del propietario (opcional)",
  "Admin.organizations.fields.phone": "Teléfono de contacto",
  "Admin.organizations.fields.plan": "Plan",
  "Admin.organizations.fields.slug": "Slug (URL)",
  "Admin.organizations.fields.status": "Estado",
  "Admin.organizations.filterStatus": "Estado",
  "Admin.organizations.filterTrial": "Prueba",
  "Admin.organizations.formTitle": "Datos de la organización",
  "Admin.organizations.metricReservations30d": "Reservas (30d)",
  "Admin.organizations.metricRooms": "Salas",
  "Admin.organizations.metricTotal": "Total",
  "Admin.organizations.metricTrial": "Prueba",
  "Admin.organizations.newDesc": "Registre un nuevo cliente en la plataforma",
  "Admin.organizations.newTitle": "Nueva organización",
  "Admin.organizations.noPlan": "Sin plan",
  "Admin.organizations.noRoomsDesc":
    "Esta organización aún no tiene salas registradas",
  "Admin.organizations.noRoomsTitle": "Sin salas",
  "Admin.organizations.notFound": "Organización no encontrada",
  "Admin.organizations.orgContactEmail": "Correo de la organización",
  "Admin.organizations.orgContactPhone": "Teléfono de la organización",
  "Admin.organizations.ownerLabel": "Propietario",
  "Admin.organizations.ownerPrefix": "Propietario:",
  "Admin.organizations.ownerWithoutPasswordWarning":
    "El propietario fue creado sin contraseña. Pídale que use la recuperación de contraseña para acceder.",
  "Admin.organizations.planSubscription": "Plan y suscripción",
  "Admin.organizations.removeMember": "Eliminar",
  "Admin.organizations.removeMemberConfirm":
    "¿Eliminar este miembro de la organización?",
  "Admin.organizations.renewsOn": "Renueva el",
  "Admin.organizations.roleAdmin": "Admin",
  "Admin.organizations.roleOwner": "Propietario",
  "Admin.organizations.saveProfile": "Guardar datos",
  "Admin.organizations.saveRole": "Guardar",
  "Admin.organizations.savingProfile": "Guardando...",
  "Admin.organizations.statusActive": "Activa",
  "Admin.organizations.statusSuspended": "Suspendida",
  "Admin.organizations.statusTrial": "Prueba",
  "Admin.organizations.tabs.general": "General",
  "Admin.organizations.tabs.members": "Miembros",
  "Admin.organizations.tabs.rooms": "Salas",
  "Admin.organizations.tabs.usage": "Uso y plan",
  "Admin.organizations.title": "Organizaciones",
  "Admin.organizations.transferOwnership": "Transferir propiedad",
  "Admin.organizations.transferOwnershipConfirm":
    "¿Transferir la propiedad a este miembro?",
  "Admin.organizations.unknownError": "Error desconocido",
  "Admin.organizations.usageVsLimits": "Uso vs límites del plan",
  "Admin.plans.actions.save": "Guardar cambios",
  "Admin.plans.card.edit": "Editar",
  "Admin.plans.editTitle": "Editar plan",
  "Admin.plans.errors.updateFailed":
    "No se pudo actualizar el plan. Verifique los datos e intente de nuevo.",
  "Admin.subtitle": "Panel de la plataforma",
  "Admin.users.allRoles": "Todos los roles",
  "Admin.users.closeModal": "Cerrar",
  "Admin.users.deleted": "Eliminado",
  "Admin.users.description":
    "Vista entre organizaciones de todos los usuarios de la plataforma",
  "Admin.users.emptyDesc": "No hay usuarios registrados en la plataforma",
  "Admin.users.emptyTitle": "Sin usuarios",
  "Admin.users.includeDeleted": "Incluir eliminados",
  "Admin.users.memberSince": "Registrado el",
  "Admin.users.noOrganizations": "Sin membresía en ninguna organización",
  "Admin.users.organizations": "Organizaciones",
  "Admin.users.platformRole": "Rol en la plataforma",
  "Admin.users.promoteSuperAdmin": "Promover SUPER_ADMIN",
  "Admin.users.regularUsers": "Usuarios comunes",
  "Admin.users.removeSuperAdmin": "Quitar SUPER_ADMIN",
  "Admin.users.roleFilter": "Rol en la plataforma",
  "Admin.users.searchPlaceholder": "Nombre o correo...",
  "Admin.users.searchTitle": "Buscar usuario",
  "Admin.users.stats.superAdmins": "Super admins",
  "Admin.users.stats.superAdminsSub": "Acceso al panel",
  "Admin.users.stats.total": "Total",
  "Admin.users.stats.totalSub": "Usuarios en la plataforma",
  "Admin.users.stats.withOrg": "Con organización",
  "Admin.users.stats.withOrgSub": "Miembros activos",
  "Admin.users.stats.withoutOrg": "Sin organización",
  "Admin.users.stats.withoutOrgSub": "Sin membresía",
  "Admin.users.superAdmins": "Super admins",
  "Admin.users.title": "Usuarios",
  "Admin.users.viewDetails": "Ver detalles",
};

// Build complete file: ES map first, then es dict if different from pt, fallback to en-based
const es = {};
const missing = [];

for (const k of Object.keys(pt).sort()) {
  if (ES[k]) {
    es[k] = ES[k];
  } else if (esDict[k] && esDict[k] !== pt[k]) {
    es[k] = esDict[k];
  } else {
    missing.push(k);
  }
}

console.log(`ES map: ${Object.keys(ES).length}, built: ${Object.keys(es).length}, missing: ${missing.length}`);
if (missing.length) {
  console.log("Still missing:", missing.slice(0, 20).join(", "), missing.length > 20 ? "..." : "");
}
