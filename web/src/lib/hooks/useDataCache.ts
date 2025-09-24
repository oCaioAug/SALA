'use client';

import { useState, useCallback, useRef } from 'react';

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of items to cache
}

const DEFAULT_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100
};

export const useDataCache = <T>(config: Partial<CacheConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [cache, setCache] = useState<Map<string, { data: T; timestamp: number }>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isExpired = useCallback((timestamp: number) => {
    return Date.now() - timestamp > finalConfig.ttl;
  }, [finalConfig.ttl]);

  const get = useCallback((key: string): T | null => {
    const cached = cache.get(key);
    if (!cached) return null;
    
    if (isExpired(cached.timestamp)) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      return null;
    }
    
    return cached.data;
  }, [cache, isExpired]);

  const set = useCallback((key: string, data: T) => {
    setCache(prev => {
      const newCache = new Map(prev);
      
      // Remove expired entries
      for (const [k, v] of newCache.entries()) {
        if (isExpired(v.timestamp)) {
          newCache.delete(k);
        }
      }
      
      // Remove oldest entries if cache is full
      if (newCache.size >= finalConfig.maxSize) {
        const oldestKey = newCache.keys().next().value;
        if (oldestKey) {
          newCache.delete(oldestKey);
        }
      }
      
      newCache.set(key, { data, timestamp: Date.now() });
      return newCache;
    });
  }, [isExpired, finalConfig.maxSize]);

  const fetchWithCache = useCallback(async (
    key: string,
    fetchFn: () => Promise<T>,
    forceRefresh = false
  ): Promise<T> => {
    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cached = get(key);
      if (cached) {
        return cached;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchFn();
      set(key, data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [get, set]);

  const clear = useCallback(() => {
    setCache(new Map());
  }, []);

  const clearExpired = useCallback(() => {
    setCache(prev => {
      const newCache = new Map();
      for (const [key, value] of prev.entries()) {
        if (!isExpired(value.timestamp)) {
          newCache.set(key, value);
        }
      }
      return newCache;
    });
  }, [isExpired]);

  return {
    get,
    set,
    fetchWithCache,
    clear,
    clearExpired,
    isLoading,
    error,
    cacheSize: cache.size
  };
};
