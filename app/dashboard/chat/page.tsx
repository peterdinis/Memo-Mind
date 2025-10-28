import { DocumentChat } from '@/components/dashboard/chat/ChatWrapper';
import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar';

export default function DashboardChatPage() {
    return (
        <div className='flex h-screen w-full flex-1 flex-col'>
            <DashboardNavbar />

            {/* Remove all padding and constraints */}
            <div className='w-full flex-1 overflow-hidden'>
                <DocumentChat />
            </div>
        </div>
    );
}
