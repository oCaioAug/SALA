export type NavigationSearchContext = {
  isOrgAdmin: boolean;
  canAccessSalas: boolean;
  canAccessSolicitacoes: boolean;
};

export type NavigationSearchEntry = {
  id: string;
  labelKey: string;
  href: string;
  keywords: string[];
  visible: (ctx: NavigationSearchContext) => boolean;
};

export const NAVIGATION_SEARCH_ENTRIES: NavigationSearchEntry[] = [
  {
    id: "inicio",
    labelKey: "inicio",
    href: "/organizations",
    keywords: ["organizacao", "organização", "trocar", "empresa"],
    visible: () => true,
  },
  {
    id: "dashboard",
    labelKey: "dashboard",
    href: "/dashboard",
    keywords: ["visao", "visão", "geral", "inicio", "início", "home"],
    visible: ctx => ctx.isOrgAdmin,
  },
  {
    id: "explorar",
    labelKey: "explorar",
    href: "/explorar",
    keywords: ["explorar", "disponivel", "disponível", "salas"],
    visible: ctx => !ctx.isOrgAdmin,
  },
  {
    id: "salas",
    labelKey: "salas",
    href: "/salas",
    keywords: ["salas", "espacos", "espaços", "ambientes"],
    visible: ctx => ctx.isOrgAdmin || ctx.canAccessSalas,
  },
  {
    id: "solicitacoes",
    labelKey: "solicitacoes",
    href: "/solicitacoes",
    keywords: ["solicitacoes", "solicitações", "aprovar", "reservas"],
    visible: ctx => ctx.isOrgAdmin || ctx.canAccessSolicitacoes,
  },
  {
    id: "setores",
    labelKey: "setores",
    href: "/setores",
    keywords: ["setores", "departamentos", "equipes"],
    visible: ctx => ctx.isOrgAdmin,
  },
  {
    id: "agendamentos",
    labelKey: "agendamentos",
    href: "/agendamentos",
    keywords: ["agendamentos", "calendario", "calendário", "reservas"],
    visible: ctx => ctx.isOrgAdmin,
  },
  {
    id: "agendamentos-member",
    labelKey: "agendamentosMember",
    href: "/agendamentos",
    keywords: ["agendamentos", "minhas", "reservas"],
    visible: ctx => !ctx.isOrgAdmin,
  },
  {
    id: "incidentes",
    labelKey: "incidentes",
    href: "/incidentes",
    keywords: ["incidentes", "problemas", "manutencao", "manutenção"],
    visible: ctx => ctx.isOrgAdmin,
  },
  {
    id: "incidentes-member",
    labelKey: "incidentesMember",
    href: "/incidentes",
    keywords: ["incidentes", "reportar", "problema"],
    visible: ctx => !ctx.isOrgAdmin,
  },
  {
    id: "grade-horaria",
    labelKey: "gradeHoraria",
    href: "/grade-horaria",
    keywords: ["grade", "horaria", "horária", "horarios", "horários"],
    visible: ctx => ctx.isOrgAdmin,
  },
  {
    id: "vision",
    labelKey: "vision",
    href: "/vision",
    keywords: ["visao", "visão", "computacional", "ia", "camera", "câmera"],
    visible: ctx => ctx.isOrgAdmin,
  },
  {
    id: "users",
    labelKey: "users",
    href: "/users",
    keywords: ["usuarios", "usuários", "membros", "equipe"],
    visible: ctx => ctx.isOrgAdmin,
  },
  {
    id: "profile",
    labelKey: "profile",
    href: "/profile",
    keywords: ["perfil", "conta", "dados", "senha"],
    visible: () => true,
  },
  {
    id: "notificacoes",
    labelKey: "notificacoes",
    href: "/notificacoes",
    keywords: ["notificacoes", "notificações", "alertas", "avisos"],
    visible: () => true,
  },
  {
    id: "configuracoes",
    labelKey: "configuracoes",
    href: "/configuracoes",
    keywords: ["configuracoes", "configurações", "preferencias", "preferências"],
    visible: ctx => ctx.isOrgAdmin,
  },
];

export type NavigationSearchResult = {
  id: string;
  title: string;
  href: string;
  type: "pages";
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function filterNavigationEntries(
  query: string,
  ctx: NavigationSearchContext,
  resolveLabel: (labelKey: string) => string
): NavigationSearchResult[] {
  const normalizedQuery = normalizeText(query.trim());
  if (!normalizedQuery) return [];

  return NAVIGATION_SEARCH_ENTRIES.filter(entry => entry.visible(ctx))
    .map(entry => ({
      id: entry.id,
      title: resolveLabel(entry.labelKey),
      href: entry.href,
      type: "pages" as const,
      _haystack: normalizeText(
        [resolveLabel(entry.labelKey), ...entry.keywords].join(" ")
      ),
    }))
    .filter(entry => entry._haystack.includes(normalizedQuery))
    .map(({ _haystack: _, ...entry }) => entry);
}
