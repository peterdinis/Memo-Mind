import { DocumentChat } from "@/components/dashboard/chat/ChatWrapper";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";

export default function DashboardChatPage() {
  return (
    <div className="flex-1 flex flex-col w-full">
      <DashboardNavbar />
      
      {/* Remove all padding and constraints */}
      <div className="flex-1 overflow-y-auto overflow-x-scroll w-full">
        <div className="p-6 w-full">
          <DocumentChat />
        </div>
      </div>
    </div>
  );
}