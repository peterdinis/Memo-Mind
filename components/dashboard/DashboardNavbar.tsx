"use client";

import { useDashboard } from "@/components/providers/dashboard-provider";
import { Button } from "@/components/ui/button";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Menu, Plus } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export function DashboardNavbar() {
  const { toggleSidebar } = useDashboard();
  const router = useRouter();
  const pathname = usePathname();

  const getBreadcrumbItems = () => {
    const paths = pathname.split('/').filter(path => path);
    if (paths[0] === 'dashboard') paths[0] = 'Dashboard';
    
    return paths.map((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/');
      const isLast = index === paths.length - 1;
      const formattedName = path.charAt(0).toUpperCase() + path.slice(1);
      
      return {
        name: formattedName,
        href: isLast ? undefined : href,
        isLast
      };
    });
  };

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-30">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <Breadcrumb>
            <BreadcrumbList>
              {getBreadcrumbItems().map((item, index) => (
                <div key={item.name} className="flex items-center">
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {item.isLast ? (
                      <BreadcrumbPage>{item.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={item.href}>
                        {item.name}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <Button
          onClick={() => router.push("/dashboard/upload")}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Document
        </Button>
      </div>
    </header>
  );
}