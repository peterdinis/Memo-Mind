import ActivityWrapper from "@/components/dashboard/activity/ActivityWrapper";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";

export default function ActivityPage() {
  return (
    <div className="flex-1 flex flex-col w-full">
      <DashboardNavbar />
      
      {/* Remove all padding and constraints */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className="p-6 w-full">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Activites</h2>
            <p className="text-muted-foreground">
              Your latest activities
            </p>
          </div>

          {/* Documents Grid */}
          <ActivityWrapper />
        </div>
      </div>
    </div>
  );
}