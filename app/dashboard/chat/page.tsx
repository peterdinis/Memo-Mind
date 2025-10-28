import { DocumentChat } from '@/components/dashboard/chat/ChatWrapper';
import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar';

export default function DashboardChatPage() {
    return (
        <div className='flex w-full flex-1 flex-col'>
            <DashboardNavbar />

            <div className='w-full flex-1 overflow-x-hidden overflow-y-auto'>
                <DocumentChat />
            </div>
        </div>
    );
}
