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
 * Gera cores de gradiente consistentes baseadas no nome do usuário
 * @param name Nome do usuário
 * @returns Classes do Tailwind para gradiente
 */
export function getUserGradient(name: string | null | undefined): string {
  if (!name) return "from-blue-500 to-purple-600";

  // Gera um hash simples do nome para cores consistentes
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) & 0xffffffff;
  }

  const gradients = [
    "from-blue-500 to-purple-600",
    "from-green-500 to-blue-500",
    "from-purple-500 to-pink-500",
    "from-orange-500 to-red-500",
    "from-teal-500 to-cyan-500",
    "from-indigo-500 to-purple-500",
    "from-pink-500 to-rose-500",
    "from-emerald-500 to-teal-500",
  ];

  return gradients[Math.abs(hash) % gradients.length];
}
