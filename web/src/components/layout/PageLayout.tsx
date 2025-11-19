"use client";

import React from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface PageLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  isNavigating?: boolean;
  onNotificationClick?: () => void;
  onNotificationItemClick?: (notification: any) => void;
  notificationUpdateTrigger?: number;
  showSidebar?: boolean;
  showHeader?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  currentPage,
  onNavigate,
  isNavigating = false,
  onNotificationClick,
  onNotificationItemClick,
  notificationUpdateTrigger,
  showSidebar = true,
  showHeader = true,
}) => {
  return (
    <ProtectedRoute>
      <div className="page-container flex">
        {showSidebar && (
          <Sidebar
            currentPage={currentPage}
            onNavigate={onNavigate}
            isNavigating={isNavigating}
          />
        )}

        <div className="flex-1 flex flex-col">
          {showHeader && (
            <Header
              onNotificationClick={onNotificationClick || (() => {})}
              onNotificationItemClick={onNotificationItemClick}
              notificationUpdateTrigger={notificationUpdateTrigger}
            />
          )}

          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
};
