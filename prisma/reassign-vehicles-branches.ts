import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

const brandToBranch: Record<string, string> = {
  Zeekr: "Zeekr Monterrey",
  "Lynk & Co": "Lynk&Co Monterrey",
  Indian: "Indian Motorcycle Carretera Nacional",
  "Royal Enfield": "Royal Enfield Las Torres",
  Triumph: "Triumph Las Torres",
  Aprilia: "Moto Plex Cumbres",
  "Moto Guzzi": "Moto Plex Cumbres",
  Motoplex: "Moto Plex Cumbres",
  Polaris: "Polaris Monterrey Carretera Nacional",
  "Can-Am": "Bikes and Boats Monterey",
};

async function main() {
  console.log("Reasignando vehículos a sucursales reales...");

  const vehicles = await prisma.vehicle.findMany({
    include: {
      brand: true,
      branch: true,
    },
  });

  for (const vehicle of vehicles) {
    const targetBranchName = brandToBranch[vehicle.brand.name];

    if (!targetBranchName) {
      console.log(
        `Sin regla de sucursal para marca: ${vehicle.brand.name} / ${vehicle.name}`
      );
      continue;
    }

    const targetBranch = await prisma.branch.findFirst({
      where: {
        name: targetBranchName,
        active: true,
      },
    });

    if (!targetBranch) {
      console.log(
        `No se encontró sucursal destino: ${targetBranchName} para ${vehicle.name}`
      );
      continue;
    }

    if (vehicle.branchId === targetBranch.id) {
      console.log(`Sin cambios: ${vehicle.name}`);
      continue;
    }

    await prisma.vehicle.update({
      where: {
        id: vehicle.id,
      },
      data: {
        branchId: targetBranch.id,
      },
    });

    console.log(
      `Actualizado: ${vehicle.name} | ${vehicle.branch.name} -> ${targetBranch.name}`
    );
  }

  console.log("Reasignación terminada.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });