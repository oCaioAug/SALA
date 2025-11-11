"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
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
    (message: string, title = "Sucesso") => {
      addToast({ type: "success", title, message });
    },
    [addToast]
  );

  const showError = useCallback(
    (message: string, title = "Erro") => {
      addToast({ type: "error", title, message });
    },
    [addToast]
  );

  const showWarning = useCallback(
    (message: string, title = "Atenção") => {
      addToast({ type: "warning", title, message });
    },
    [addToast]
  );

  const showInfo = useCallback(
    (message: string, title = "Informação") => {
      addToast({ type: "info", title, message });
    },
    [addToast]
  );

  return (
    <AppContext.Provider
      value={{
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
