"use client";

import React, { useEffect, useState } from "react";

/**
 * Hook para detectar hidratação completa
 */
export const useIsHydrated = () => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
};

/**
 * Componente que só renderiza após a hidratação estar completa
 */
export const NoSSR: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = null }) => {
  const isHydrated = useIsHydrated();

  if (!isHydrated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Hook para verificação segura de ambiente
 */
export const useEnvironment = () => {
  const [environment, setEnvironment] = useState<"server" | "client">("server");

  useEffect(() => {
    setEnvironment("client");
  }, []);

  return {
    isClient: environment === "client",
    isServer: environment === "server",
    isBrowser: typeof window !== "undefined",
  };
};

/**
 * Wrapper para operações que só devem acontecer no cliente
 */
export const ClientOnlyPortal: React.FC<{
  children: React.ReactNode;
  enabled?: boolean;
}> = ({ children, enabled = true }) => {
  const { isClient } = useEnvironment();

  if (!enabled || !isClient) {
    return null;
  }

  return <>{children}</>;
};

export default NoSSR;
