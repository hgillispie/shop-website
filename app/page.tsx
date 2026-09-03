import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Services } from "@/components/sections/Services";
import { FAQ } from "@/components/sections/FAQ";
import { Booking } from "@/components/sections/Booking";
import { StoreFunnel } from "@/components/sections/StoreFunnel";
import { AnalyticsBeacon } from "@/components/AnalyticsBeacon";
import { StructuredData } from "@/components/StructuredData";

export default function Home() {
  return (
    <>
      <AnalyticsBeacon />
      <StructuredData />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <About />
        <Services />
        {/* Objections answered, then the ask, then the secondary offer — the
            store never sits between a visitor and the booking form. */}
        <FAQ />
        <Booking />
        <StoreFunnel />
      </main>
      <Footer />
      <MobileActionBar />
    </>
  );
}
