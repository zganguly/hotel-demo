"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopBar } from "@/components/layout/app-top-bar";

type AppShellProps = {
  propertySlug: string;
  propertyName: string;
  businessDate: string;
  breadcrumb: string[];
  children: React.ReactNode;
};

export function AppShell({
  propertySlug,
  propertyName,
  businessDate,
  breadcrumb,
  children,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        propertySlug={propertySlug}
        propertyName={propertyName}
        badges={{ arrivals: 8, roomQueue: 3, maintenance: 2, approvals: 1 }}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="lg:pl-[272px]">
        <AppTopBar
          businessDate={businessDate}
          propertyName={propertyName}
          breadcrumb={breadcrumb}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
