import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar';
import { DocumentGrid } from '@/components/dashboard/DocumentGrid';

export default function DashboardPage() {
    return (
        <div className='flex w-full flex-1 flex-col'>
            <DashboardNavbar />

            {/* Remove all padding and constraints */}
            <div className='w-full flex-1 overflow-x-hidden overflow-y-auto'>
                <div className='w-full p-6'>
                    {/* Welcome Section */}
                    <div className='mb-8'>
                        <h2 className='mb-2 text-3xl font-bold'>
                            Welcome back!
                        </h2>
                        <p className='text-muted-foreground'>
                            Here are your recent documents. Start a conversation
                            with any of them or upload a new one.
                        </p>
                    </div>

                    {/* Documents Grid */}
                    <DocumentGrid />
                </div>
            </div>
        </div>
    );
}
