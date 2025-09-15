'use client';

import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface PageTransitionProps {
  children: React.ReactNode;
  isLoading: boolean;
  fallback?: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  isLoading, 
  fallback 
}) => {
  const [showContent, setShowContent] = useState(!isLoading);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setIsTransitioning(true);
      setShowContent(false);
    } else {
      // Pequeno delay para transição suave
      const timer = setTimeout(() => {
        setShowContent(true);
        setIsTransitioning(false);
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (isLoading || isTransitioning) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        {fallback || <LoadingSpinner size="lg" text="Carregando..." />}
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {children}
    </div>
  );
};
