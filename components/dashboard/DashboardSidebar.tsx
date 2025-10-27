"use client";

import { useDashboard } from "@/components/providers/dashboard-provider";
import { 
  BookOpen, 
  Plus, 
  FileText, 
  Settings, 
  ChevronLeft,
  Home,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const menuItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: FileText, label: "Documents", href: "/dashboard/documents" },
  { icon: Plus, label: "New Document", href: "/dashboard/upload" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function DashboardSidebar() {
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useDashboard();
  const router = useRouter();
  const pathname = usePathname();

  const SidebarContent = () => (
    <div className="h-full bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className={cn(
          "flex items-center gap-3 transition-opacity duration-200",
          isSidebarOpen ? "opacity-100" : "opacity-0 lg:opacity-100"
        )}>
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-lg whitespace-nowrap">MemoMind</span>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8 hidden lg:flex"
              >
                <ChevronLeft className={cn(
                  "h-4 w-4 transition-transform duration-300",
                  !isSidebarOpen && "rotate-180"
                )} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isSidebarOpen ? "Collapse" : "Expand"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <TooltipProvider key={item.href}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 transition-all duration-200",
                        !isSidebarOpen && "lg:justify-center lg:px-2"
                      )}
                      onClick={() => {
                        router.push(item.href);
                        closeSidebar();
                      }}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className={cn(
                        "whitespace-nowrap transition-all duration-200",
                        isSidebarOpen ? "opacity-100" : "opacity-0 lg:opacity-0"
                      )}>
                        {item.label}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  {!isSidebarOpen && (
                    <TooltipContent side="right">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className={cn(
        "p-4 border-t border-border transition-all duration-200",
        !isSidebarOpen && "lg:p-2"
      )}>
        <div className={cn(
          "flex items-center gap-3 transition-opacity duration-200",
          isSidebarOpen ? "opacity-100" : "opacity-0 lg:opacity-0"
        )}>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/20 text-primary">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">User Name</p>
            <p className="text-xs text-muted-foreground truncate">user@email.com</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={closeSidebar}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex h-screen transition-all duration-300 ease-in-out sticky top-0",
          isSidebarOpen ? "w-64" : "w-16"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}