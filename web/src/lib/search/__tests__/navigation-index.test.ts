import {
  filterNavigationEntries,
  NAVIGATION_SEARCH_ENTRIES,
} from "../navigation-index";

const resolveLabel = (labelKey: string) => `Label:${labelKey}`;

describe("filterNavigationEntries", () => {
  it("returns admin pages for org admin", () => {
    const results = filterNavigationEntries(
      "setor",
      {
        isOrgAdmin: true,
        canAccessSalas: true,
        canAccessSolicitacoes: true,
      },
      resolveLabel
    );

    expect(results.some(item => item.id === "setores")).toBe(true);
    expect(results.some(item => item.id === "users")).toBe(false);
  });

  it("returns member pages for non-admin", () => {
    const results = filterNavigationEntries(
      "agend",
      {
        isOrgAdmin: false,
        canAccessSalas: false,
        canAccessSolicitacoes: false,
      },
      resolveLabel
    );

    expect(results.some(item => item.id === "agendamentos-member")).toBe(true);
    expect(results.some(item => item.id === "setores")).toBe(false);
  });

  it("includes salas for members with room access", () => {
    const results = filterNavigationEntries(
      "sala",
      {
        isOrgAdmin: false,
        canAccessSalas: true,
        canAccessSolicitacoes: false,
      },
      resolveLabel
    );

    expect(results.some(item => item.id === "salas")).toBe(true);
  });

  it("matches keywords without accents", () => {
    const results = filterNavigationEntries(
      "preferencia",
      {
        isOrgAdmin: true,
        canAccessSalas: true,
        canAccessSolicitacoes: true,
      },
      resolveLabel
    );

    expect(results.some(item => item.id === "configuracoes")).toBe(true);
  });

  it("exposes all navigation entries with visibility rules", () => {
    expect(NAVIGATION_SEARCH_ENTRIES.length).toBeGreaterThan(10);
  });
});
