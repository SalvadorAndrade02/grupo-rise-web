import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { VehicleSearch } from "@/components/home/VehicleSearch";
import { QuickActions } from "@/components/home/QuickActions";
import { FeaturedVehicles } from "@/components/home/FeaturedVehicles";
import { MotorcycleBanner } from "@/components/home/MotorcycleBanner";
import { InfoCards } from "@/components/home/InfoCards";
import { FinalCTA } from "@/components/home/FinalCTA";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <Hero />

      <section className="relative z-20 -mt-6 md:-mt-10">
        <VehicleSearch />
      </section>

      <QuickActions />

      <FeaturedVehicles />

      <MotorcycleBanner />

      <InfoCards />

      <FinalCTA />

      <Footer />
    </main>
  );
}