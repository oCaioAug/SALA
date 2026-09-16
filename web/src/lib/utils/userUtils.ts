/**
 * Gera iniciais do nome do usuário (primeira letra do primeiro e último nome)
 * @param name Nome completo do usuário
 * @returns Iniciais (máximo 2 caracteres)
 */
export function getUserInitials(name: string | null | undefined): string {
  if (!name) return "U";

  const words = name
    .trim()
    .split(" ")
    .filter(word => word.length > 0);

  if (words.length === 0) return "U";
  if (words.length === 1) return words[0][0].toUpperCase();

  // Primeira letra do primeiro nome + primeira letra do último nome
  const firstLetter = words[0][0].toUpperCase();
  const lastLetter = words[words.length - 1][0].toUpperCase();

  return firstLetter + lastLetter;
}

/**
 * Formata o nome do usuário para exibição
 * @param name Nome completo do usuário
 * @returns Nome formatado ou "Usuário" se vazio
 */
export function formatUserName(name: string | null | undefined): string {
  if (!name || name.trim() === "") return "Usuário";
  return name.trim();
}

/**
 * Cor sólida de avatar baseada no nome (sem gradientes)
 * @param name Nome do usuário
 * @returns Classes do Tailwind para fundo sólido
 */
export function getUserGradient(name: string | null | undefined): string {
  if (!name) return "bg-slate-600";

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) & 0xffffffff;
  }

  const solids = [
    "bg-slate-600",
    "bg-slate-700",
    "bg-zinc-600",
    "bg-stone-600",
    "bg-neutral-600",
    "bg-slate-500",
    "bg-zinc-700",
    "bg-stone-700",
  ];

  return solids[Math.abs(hash) % solids.length];
}
