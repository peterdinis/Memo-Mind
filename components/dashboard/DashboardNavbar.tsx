"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRouter, usePathname } from "next/navigation";

export function DashboardNavbar() {
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

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-30">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-9 w-9" />
          
          {breadcrumbItems.length > 0 && (
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbItems.map((item, index) => (
                  <div key={item.name} className="flex items-center">
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {item.isLast ? (
                        <BreadcrumbPage className="text-lg font-semibold">
                          {item.name}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={item.href} className="text-lg">
                          {item.name}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>
      </div>
    </header>
  );
}