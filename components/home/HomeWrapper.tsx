import Navigation from '../shared/Navigation';
import Footer from '../shared/Footer';
import HomeHero from './HomeHero';

const HomeWrapper: React.FC = () => {
    return (
        <div className='from-background via-secondary to-background flex min-h-screen flex-col bg-linear-to-br'>
            <Navigation />
            <HomeHero />
            <Footer />
        </div>
    );
};

export default HomeWrapper;
