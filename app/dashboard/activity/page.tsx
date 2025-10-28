import ActivityWrapper from '@/components/dashboard/activity/ActivityWrapper';
import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar';

export default function ActivityPage() {
    return (
        <div className='flex w-full flex-1 flex-col'>
            <DashboardNavbar />

            {/* Remove all padding and constraints */}
            <div className='w-full flex-1 overflow-x-hidden overflow-y-auto'>
                <div className='w-full p-6'>
                    {/* Welcome Section */}
                    <div className='mb-8'>
                        <h2 className='mb-2 text-3xl font-bold'>Activites</h2>
                        <p className='text-muted-foreground'>
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
