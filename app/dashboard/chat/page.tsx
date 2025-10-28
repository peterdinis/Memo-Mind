import { DocumentChat } from "@/components/dashboard/chat/ChatWrapper";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";

export default function DashboardChatPage() {
  return (
    <div className="flex-1 flex flex-col w-full h-screen">
      <DashboardNavbar />
      
      {/* Remove all padding and constraints */}
      <div className="flex-1 overflow-hidden w-full">
        <DocumentChat />
      </div>
    </div>
  );
}