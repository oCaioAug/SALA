"use client";

import { useTranslations } from "next-intl";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import { useToast } from "@/components/ui/Toast";

interface AppContextType {
  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Search and filters
  searchTerm: string;
  setSearchTerm: (term: string) => void;

  // Modals
  isCreateRoomModalOpen: boolean;
  setCreateRoomModalOpen: (open: boolean) => void;

  // Data cache
  roomsCache: any[];
  setRoomsCache: (rooms: any[]) => void;
  itemsCache: any[];
  setItemsCache: (items: any[]) => void;
  lastFetchTime: number;
  setLastFetchTime: (time: number) => void;

  // Notifications
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const tCommon = useTranslations("Common");
  const tCommonRef = useRef(tCommon);
  tCommonRef.current = tCommon;

  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [roomsCache, setRoomsCache] = useState<any[]>([]);
  const [itemsCache, setItemsCache] = useState<any[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const { addToast } = useToast();

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const showSuccess = useCallback(
    (message: string, title?: string) => {
      addToast({ type: "success", title: title || tCommonRef.current("success"), message });
    },
    [addToast]
  );

  const showError = useCallback(
    (message: string, title?: string) => {
      addToast({ type: "error", title: title || tCommonRef.current("error"), message });
    },
    [addToast]
  );

  const showWarning = useCallback(
    (message: string, title?: string) => {
      addToast({ type: "warning", title: title || tCommonRef.current("warning"), message });
    },
    [addToast]
  );

  const showInfo = useCallback(
    (message: string, title?: string) => {
      addToast({ type: "info", title: title || tCommonRef.current("info"), message });
    },
    [addToast]
  );

  const contextValue = useMemo(
    () => ({
      isLoading,
      setLoading,
      searchTerm,
      setSearchTerm,
      isCreateRoomModalOpen,
      setCreateRoomModalOpen: setIsCreateRoomModalOpen,
      roomsCache,
      setRoomsCache,
      itemsCache,
      setItemsCache,
      lastFetchTime,
      setLastFetchTime,
      showSuccess,
      showError,
      showWarning,
      showInfo,
    }),
    [
      isLoading,
      setLoading,
      searchTerm,
      isCreateRoomModalOpen,
      roomsCache,
      itemsCache,
      lastFetchTime,
      showSuccess,
      showError,
      showWarning,
      showInfo,
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
