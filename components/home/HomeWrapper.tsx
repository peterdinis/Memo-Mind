import Navigation from "../shared/Navigation";
import Footer from "../shared/Footer";
import HomeHero from "./HomeHero";

const HomeWrapper: React.FC = () => {

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-background via-secondary to-background">
      <Navigation />
      <HomeHero />
      <Footer />
    </div>
  );
};

export default HomeWrapper