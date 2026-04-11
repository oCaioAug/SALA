"use client";

import { useTranslations } from "next-intl";
import React, { useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Drawer } from "@/components/ui/Drawer";

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
  const tHeader = useTranslations("Header");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setMobileNavOpen(false);
  };

  return (
    <ProtectedRoute>
      <div className="page-container flex min-h-screen">
        {showSidebar && (
          <>
            <Sidebar
              variant="desktop"
              currentPage={currentPage}
              onNavigate={onNavigate}
              isNavigating={isNavigating}
            />
            <Drawer
              side="left"
              isOpen={mobileNavOpen}
              onClose={() => setMobileNavOpen(false)}
              title={tHeader("menuTitle")}
              size="md"
            >
              <Sidebar
                variant="mobile"
                currentPage={currentPage}
                onNavigate={handleNavigate}
                isNavigating={isNavigating}
              />
            </Drawer>
          </>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {showHeader && (
            <Header
              onNotificationClick={onNotificationClick || (() => {})}
              onNotificationItemClick={onNotificationItemClick}
              notificationUpdateTrigger={notificationUpdateTrigger}
              showMobileNavTrigger={showSidebar}
              onMobileNavOpen={() => setMobileNavOpen(true)}
            />
          )}

          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
};
