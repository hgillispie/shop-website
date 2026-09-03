import { AnalyticsBeacon } from "@/components/AnalyticsBeacon";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { StructuredData } from "@/components/StructuredData";
import { About } from "@/components/sections/About";
import { FAQ } from "@/components/sections/FAQ";
import { Hero } from "@/components/sections/Hero";
import { Services } from "@/components/sections/Services";
import { StoreCallout } from "@/components/sections/StoreCallout";

export default function Home() {
  return (
    <div className="landing-page min-h-screen bg-brand-paper text-brand-ink">
      <AnalyticsBeacon />
      <StructuredData />
      <Navbar branded />
      <main>
        <Hero />
        <Services />
        <About />
        <StoreCallout />
        <FAQ />
      </main>
      <Footer branded />
    </div>
  );
}
