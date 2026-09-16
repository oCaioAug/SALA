import { resolveJwtPreferredOrganizationId } from "@/lib/auth/jwt-preferred-organization";

describe("resolveJwtPreferredOrganizationId", () => {
  it("usa preferOrganizationId no update explícito", () => {
    expect(
      resolveJwtPreferredOrganizationId({
        trigger: "update",
        session: { preferOrganizationId: "org-b" },
        currentOrganizationId: "org-a",
      })
    ).toBe("org-b");
  });

  it("mantém a org do token em refresh normal", () => {
    expect(
      resolveJwtPreferredOrganizationId({
        trigger: undefined,
        session: undefined,
        currentOrganizationId: "org-b",
      })
    ).toBe("org-b");
  });

  it("não descarta a org ativa em update sem preferOrganizationId", () => {
    expect(
      resolveJwtPreferredOrganizationId({
        trigger: "update",
        session: { name: "Maria" },
        currentOrganizationId: "org-b",
      })
    ).toBe("org-b");
  });

  it("permite limpar preferência com null no update", () => {
    expect(
      resolveJwtPreferredOrganizationId({
        trigger: "update",
        session: { preferOrganizationId: null },
        currentOrganizationId: "org-a",
      })
    ).toBeNull();
  });
});
