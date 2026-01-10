import ComparisonTable from "./components/ComparisonTable";
import FeaturesGrid from "./components/FeaturesGrid";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import { features, footerNavigation } from "./contentSections";

export default function LandingPage() {
  return (
    <div className="landing-page bg-background text-foreground min-h-screen selection:bg-secondary selection:text-foreground">
      <main className="isolate">
        <Hero />
        <ComparisonTable />
        <FeaturesGrid features={features} />
        {/* Removed FAQ section for cleaner look as requested "remove non related item" */}
      </main>
      <Footer footerNavigation={footerNavigation} />
    </div>
  );
}
