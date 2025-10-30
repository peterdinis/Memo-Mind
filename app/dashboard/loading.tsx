import { Spinner } from '@/components/ui/spinner';
import { FC } from 'react';

const Loading: FC = () => {
    return <Spinner variant={'default'} size={'lg'} />;
};

export default Loading;
