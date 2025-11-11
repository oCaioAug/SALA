"use client";

import { useEffect } from "react";

/**
 * Componente para capturar e debuggar erros específicos em produção
 */
export const ProductionErrorLogger: React.FC = () => {
  useEffect(() => {
    // Capturar erros não tratados
    const handleUnhandledError = (event: ErrorEvent) => {
      const error = event.error;
      
      // Filtrar o erro React #310
      if (error?.message?.includes("Minified React error #310")) {
        console.error("🔍 React Error #310 detectado:", {
          message: error.message,
          stack: error.stack,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        });
        
        // Tentar recarregar uma única vez
        if (!sessionStorage.getItem("error-reload-attempted")) {
          sessionStorage.setItem("error-reload-attempted", "true");
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      }
      
      // Filtrar erro de postMessage
      if (error?.message?.includes("can't access property \"postMessage\"")) {
        console.warn("🔍 PostMessage error ignorado:", error.message);
        // Não fazer nada - erro conhecido de extensões do navegador
        event.preventDefault();
        return true;
      }
    };

    // Capturar promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("🔍 Promise rejection:", {
        reason: event.reason,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      });
    };

    // Adicionar listeners
    window.addEventListener("error", handleUnhandledError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    // Limpar listeners
    return () => {
      window.removeEventListener("error", handleUnhandledError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  // Este componente não renderiza nada
  return null;
};

export default ProductionErrorLogger;