import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Quitando imágenes migradas desde mainImage...");

  const vehicles = await prisma.vehicle.findMany({
    include: {
      images: true,
    },
  });

  let deletedCount = 0;

  for (const vehicle of vehicles) {
    if (!vehicle.mainImage) {
      continue;
    }

    const migratedImages = vehicle.images.filter((image) => {
      const sameAsMainImage = image.url === vehicle.mainImage;
      const isOldExternalImage = !image.url.startsWith("/uploads/vehicles/");

      return sameAsMainImage && isOldExternalImage;
    });

    if (migratedImages.length === 0) {
      continue;
    }

    await prisma.vehicleImage.deleteMany({
      where: {
        id: {
          in: migratedImages.map((image) => image.id),
        },
      },
    });

    deletedCount += migratedImages.length;

    console.log(`Revertido: ${vehicle.name}`);
  }

  console.log(`Listo. Registros eliminados: ${deletedCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });