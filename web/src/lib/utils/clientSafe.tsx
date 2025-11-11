import React from "react";

/**
 * Utilitários para lidar com Web APIs de forma segura
 * Evita erros de hidratação e problemas em diferentes ambientes
 */

/**
 * Verifica se estamos no lado do cliente
 */
export const isClient = typeof window !== "undefined";

/**
 * Verifica se estamos no lado do servidor
 */
export const isServer = !isClient;

/**
 * localStorage seguro que funciona em qualquer ambiente
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isClient) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`Erro ao acessar localStorage para chave "${key}":`, error);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (!isClient) return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(
        `Erro ao salvar no localStorage para chave "${key}":`,
        error
      );
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    if (!isClient) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(
        `Erro ao remover do localStorage para chave "${key}":`,
        error
      );
      return false;
    }
  },

  clear: (): boolean => {
    if (!isClient) return false;
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn("Erro ao limpar localStorage:", error);
      return false;
    }
  },
};

/**
 * Hook para detectar se o componente foi montado no cliente
 */
export const useMounted = () => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
};

/**
 * Wrapper para componentes que só devem renderizar no cliente
 */
export const ClientOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = null }) => {
  const mounted = useMounted();

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
