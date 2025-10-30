import { createSafeActionClient } from 'next-safe-action';

export const action = createSafeActionClient();

export const authenticatedAction = createSafeActionClient({
    handleServerError(e) {
        console.error('Action error:', e);
        return e.message || 'Something went wrong';
    },
});
