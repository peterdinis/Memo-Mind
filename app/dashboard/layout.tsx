import type { Metadata } from "next";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardProvider } from "@/components/providers/dashboard-provider";
import { SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "Dashboard - MemoMind",
  description: "Manage your documents and chat with AI",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full bg-background">
          <DashboardSidebar />
          <main className="flex-1 flex flex-col overflow-hidden w-full">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </DashboardProvider>
  );
}