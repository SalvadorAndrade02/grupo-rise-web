import { Bike, Building2, Car, Gauge } from "lucide-react";
import { Container } from "@/components/ui/Container";

type HomeStatsProps = {
  stats: {
    totalVehicles: number;
    autos: number;
    motos: number;
    todoTerreno: number;
    branches: number;
  };
};

export function HomeStats({ stats }: HomeStatsProps) {
  const items = [
    {
      label: "Unidades activas",
      value: stats.totalVehicles,
      icon: Car,
    },
    {
      label: "Motos",
      value: stats.motos,
      icon: Bike,
    },
    {
      label: "Todo terreno",
      value: stats.todoTerreno,
      icon: Gauge,
    },
    {
      label: "Sucursales",
      value: stats.branches,
      icon: Building2,
    },
  ];

  return (
    <section className="py-8">
      <Container>
        <div className="grid gap-4 md:grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-3xl border border-[var(--rise-border)] bg-white p-6 shadow-sm"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--rise-blue-soft)] text-[var(--rise-blue)]">
                  <Icon size={24} />
                </div>

                <p className="mt-5 text-3xl font-black text-[var(--rise-navy)]">
                  {item.value}
                </p>

                <p className="mt-1 text-sm font-bold text-slate-500">
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}