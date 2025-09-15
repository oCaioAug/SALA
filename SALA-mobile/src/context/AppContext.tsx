import React, { createContext, useContext, useState, ReactNode } from "react";

interface AppContextType {
  hasSeenWelcome: boolean;
  setHasSeenWelcome: (seen: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  return (
    <AppContext.Provider value={{ hasSeenWelcome, setHasSeenWelcome }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
