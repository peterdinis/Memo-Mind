import type { Metadata } from "next";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardProvider } from "@/components/providers/dashboard-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TransitionProvider } from "@/components/providers/TransitionProvider";

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
          {/* Sidebar - normálny flow */}
          <div className="shrink-0">
            <DashboardSidebar />
          </div>
          
          {/* Main content */}
          <main className="flex-1 flex flex-col min-h-0 overflow-auto">
            <TransitionProvider>
              {children}
            </TransitionProvider>
          </main>
        </div>
      </SidebarProvider>
    </DashboardProvider>
  );
}