import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { VehicleSearch } from "@/components/home/VehicleSearch";
import { QuickActions } from "@/components/home/QuickActions";
import { FeaturedVehicles } from "@/components/home/FeaturedVehicles";
import { MotorcycleBanner } from "@/components/home/MotorcycleBanner";
import { InfoCards } from "@/components/home/InfoCards";
import { FinalCTA } from "@/components/home/FinalCTA";
import { HomeStats } from "@/components/home/HomeStats";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [vehicles, branches] = await Promise.all([
    prisma.vehicle.findMany({
      where: {
        active: true,
        isFeatured: true,
        branch: {
          active: true,
        },
      },
      include: {
        brand: true,
        branch: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
    }),

    prisma.branch.findMany({
      where: {
        active: true,
      },
    }),
  ]);

  const allActiveVehicles = await prisma.vehicle.findMany({
    where: {
      active: true,
      branch: {
        active: true,
      },
    },
    select: {
      category: true,
    },
  });

  const formattedVehicles = vehicles.map((vehicle) => ({
    id: vehicle.id,
    category: vehicle.category,
    condition: vehicle.condition,
    status: vehicle.status,
    brandName: vehicle.brand.name,
    branchCity: vehicle.branch.city,
    name: vehicle.name,
    model: vehicle.model,
    year: vehicle.year,
    price: vehicle.price,
    type: vehicle.type,
    specs: vehicle.specs
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    mainImage: vehicle.mainImage,
  }));

  const stats = {
    totalVehicles: allActiveVehicles.length,
    autos: allActiveVehicles.filter((vehicle) => vehicle.category === "AUTO")
      .length,
    motos: allActiveVehicles.filter((vehicle) => vehicle.category === "MOTO")
      .length,
    todoTerreno: allActiveVehicles.filter(
      (vehicle) => vehicle.category === "TODOTERRENO"
    ).length,
    branches: branches.length,
  };

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <Header />
      <Hero />

      <section className="relative z-20 -mt-6 md:-mt-10">
        <VehicleSearch />
      </section>

      <HomeStats stats={stats} />
      <QuickActions />
      <FeaturedVehicles vehicles={formattedVehicles} />
      <MotorcycleBanner />
      <InfoCards />
      <FinalCTA />
      <Footer />
    </main>
  );
}