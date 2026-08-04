import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Services } from "@/components/sections/Services";
import { FAQ } from "@/components/sections/FAQ";
import { Booking } from "@/components/sections/Booking";
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
        <FAQ />
        <Booking />
      </main>
      <Footer />
    </>
  );
}
