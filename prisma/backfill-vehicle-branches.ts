import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Creando disponibilidad base por sucursal principal...");

  const vehicles = await prisma.vehicle.findMany({
    include: {
      branchAvailabilities: true,
    },
  });

  for (const vehicle of vehicles) {
    const alreadyExists = vehicle.branchAvailabilities.some(
      (item) => item.branchId === vehicle.branchId
    );

    if (alreadyExists) {
      console.log(`Ya existe disponibilidad: ${vehicle.name}`);
      continue;
    }

    await prisma.vehicleBranch.create({
      data: {
        vehicleId: vehicle.id,
        branchId: vehicle.branchId,
      },
    });

    console.log(`Creada disponibilidad principal: ${vehicle.name}`);
  }

  console.log("Proceso terminado.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });