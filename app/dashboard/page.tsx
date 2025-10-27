import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { DocumentGrid } from "@/components/dashboard/DocumentGrid";

export default function DashboardPage() {
  return (
    <div className="flex-1 flex flex-col w-full">
      <DashboardNavbar />
      
      {/* Remove all padding and constraints */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className="p-6 w-full">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
            <p className="text-muted-foreground">
              Here are your recent documents. Start a conversation with any of them or upload a new one.
            </p>
          </div>

          {/* Documents Grid */}
          <DocumentGrid />
        </div>
      </div>
    </div>
  );
}