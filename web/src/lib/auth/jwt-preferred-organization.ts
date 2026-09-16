/**
 * Decide qual organização preferir ao (re)enriquecer o JWT.
 *
 * Em `trigger === "update"` com `preferOrganizationId`, usa a escolha explícita
 * (troca de tenant). Nos demais refreshes, mantém a org já no token — senão
 * `resolvePrimaryOrganization` volta sempre para a primeira membership.
 */
export function resolveJwtPreferredOrganizationId(params: {
  trigger?: string;
  session?: unknown;
  currentOrganizationId?: string | null;
}): string | null | undefined {
  const { trigger, session, currentOrganizationId } = params;

  if (
    trigger === "update" &&
    session &&
    typeof session === "object" &&
    "preferOrganizationId" in session
  ) {
    return (session as { preferOrganizationId?: string | null })
      .preferOrganizationId;
  }

  return currentOrganizationId;
}
