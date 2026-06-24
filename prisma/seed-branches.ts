import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

const branches = [
  {
    name: "Polaris Monterrey Carretera Nacional",
    city: "Monterrey",
    state: "Nuevo León",
    address:
      "Carretera Nacional 910, Palmares Residencial, C.P. 64897, Monterrey, Nuevo León",
    phone: "81 2169 3970",
    whatsapp: "81 2169 3970",
    services: "Todo terreno, Polaris, Ventas, Servicio",
    sortOrder: 1,
  },
  {
    name: "Polaris Monterrey Cumbres",
    city: "Monterrey",
    state: "Nuevo León",
    address:
      "Av. Paseo de los Leones 2301, Cumbres Elite 2do Sector, C.P. 64610, Monterrey, Nuevo León",
    phone: "81 8259 2878",
    whatsapp: "81 8259 2878",
    services: "Todo terreno, Polaris, Ventas, Servicio",
    sortOrder: 2,
  },
  {
    name: "Polaris Saltillo",
    city: "Saltillo",
    state: "Coahuila",
    address: "Blvd. Galerías 375, Colonia 16, C.P. 25240, Saltillo, Coahuila",
    phone: "844 316 1280",
    whatsapp: "844 316 1280",
    services: "Todo terreno, Polaris, Ventas, Servicio",
    sortOrder: 3,
  },
  {
    name: "Indian Motorcycle Carretera Nacional",
    city: "Monterrey",
    state: "Nuevo León",
    address:
      "Carretera Nacional 910, Palmares Residencial, C.P. 64897, Monterrey, Nuevo León",
    phone: "81 1099 4546",
    whatsapp: "81 1099 4546",
    services: "Motos, Indian Motorcycle, Ventas, Servicio",
    sortOrder: 4,
  },
  {
    name: "Indian Motorcycle Cumbres",
    city: "Monterrey",
    state: "Nuevo León",
    address:
      "Av. Paseo de los Leones 2301, Cumbres Elite 2do Sector, C.P. 64610, Monterrey, Nuevo León",
    phone: "81 4175 2533",
    whatsapp: "81 4175 2533",
    services: "Motos, Indian Motorcycle, Ventas, Servicio",
    sortOrder: 5,
  },
  {
    name: "Triumph Las Torres",
    city: "Monterrey",
    state: "Nuevo León",
    address:
      "Av. Lázaro Cárdenas 2938, Colonia La República, C.P. 64910, Monterrey, Nuevo León",
    phone: "81 8365 3484",
    whatsapp: "81 8365 3484",
    services: "Motos, Triumph, Ventas, Servicio",
    sortOrder: 6,
  },
  {
    name: "Bikes and Boats Monterey",
    city: "Monterrey",
    state: "Nuevo León",
    address:
      "Carretera Nacional 910, Palmares Residencial, C.P. 64897, Monterrey, Nuevo León",
    phone: "81 2526 6142",
    whatsapp: "81 2526 6142",
    services: "Motos, Todo terreno, Ventas, Servicio",
    sortOrder: 7,
  },
  {
    name: "Bikes and Boats Saltillo",
    city: "Saltillo",
    state: "Coahuila",
    address: "Blvd. Galerías 195 Ote, Villa Olímpica, C.P. 25240, Saltillo, Coahuila",
    phone: "844 416 6988",
    whatsapp: "844 416 6988",
    services: "Motos, Todo terreno, Ventas, Servicio",
    sortOrder: 8,
  },
  {
    name: "Bikes and Boats Playa del Carmen",
    city: "Playa del Carmen",
    state: "Quintana Roo",
    address:
      "Carretera Federal Cancún Lote 1-Zona 1, Centro, C.P. 77710, Playa del Carmen, Quintana Roo",
    phone: "984 267 8524",
    whatsapp: "984 267 8524",
    services: "Motos, Todo terreno, Ventas, Servicio",
    sortOrder: 9,
  },
  {
    name: "Royal Enfield Las Torres",
    city: "Monterrey",
    state: "Nuevo León",
    address:
      "Av. Lázaro Cárdenas 2938, Colonia La República, C.P. 64910, Monterrey, Nuevo León",
    phone: "81 8365 3484",
    whatsapp: "81 8365 3484",
    services: "Motos, Royal Enfield, Ventas, Servicio",
    sortOrder: 10,
  },
  {
    name: "Royal Enfield Cumbres",
    city: "Monterrey",
    state: "Nuevo León",
    address:
      "Av. Paseo de los Leones 2301, Cumbres Elite 2do Sector, C.P. 64610, Monterrey, Nuevo León",
    phone: "81 4175 2533",
    whatsapp: "81 4175 2533",
    services: "Motos, Royal Enfield, Ventas, Servicio",
    sortOrder: 11,
  },
  {
    name: "Moto Plex Cumbres",
    city: "Monterrey",
    state: "Nuevo León",
    address:
      "Av. Paseo de los Leones 2301, Cumbres Elite 2do Sector, C.P. 64610, Monterrey, Nuevo León",
    phone: "81 4175 2533",
    whatsapp: "81 4175 2533",
    services: "Motos, Motoplex, Ventas, Servicio",
    sortOrder: 12,
  },
  {
    name: "Zeekr Monterrey",
    city: "Monterrey",
    state: "Nuevo León",
    address:
      "Carretera Nacional 910, Palmares Residencial, C.P. 64897, Monterrey, Nuevo León",
    phone: "81 3132 5029",
    whatsapp: "81 3132 5029",
    services: "Autos, Zeekr, Ventas, Servicio",
    sortOrder: 13,
  },
  {
    name: "Lynk&Co Monterrey",
    city: "Monterrey",
    state: "Nuevo León",
    address:
      "Carretera Nacional 910, Palmares Residencial, C.P. 64897, Monterrey, Nuevo León",
    phone: "81 3132 5029",
    whatsapp: "81 3132 5029",
    services: "Autos, Lynk & Co, Ventas, Servicio",
    sortOrder: 14,
  },
];

const obsoleteBranchNames = [
  "Grupo Rise Guadalajara",
  "Grupo Rise CDMX",
  "Grupo Rise Monterrey",
  "Zeekr y Lynk&Co Monterrey",
  "Bikes and Boats MTY",
  "Triumph Monterrey",
];

async function main() {
  console.log("Sincronizando sucursales actualizadas...");

  for (const branch of branches) {
    const existingBranch = await prisma.branch.findFirst({
      where: {
        name: branch.name,
      },
    });

    const data = {
      ...branch,
      email: null,
      schedule: null,
      googleMapsUrl: null,
      active: true,
    };

    if (existingBranch) {
      await prisma.branch.update({
        where: {
          id: existingBranch.id,
        },
        data,
      });

      console.log(`Actualizada: ${branch.name}`);
    } else {
      await prisma.branch.create({
        data,
      });

      console.log(`Creada: ${branch.name}`);
    }
  }

  console.log("Desactivando sucursales antiguas de prueba...");

  for (const name of obsoleteBranchNames) {
    const branch = await prisma.branch.findFirst({
      where: {
        name,
      },
    });

    if (branch) {
      await prisma.branch.update({
        where: {
          id: branch.id,
        },
        data: {
          active: false,
        },
      });

      console.log(`Desactivada: ${name}`);
    }
  }

  console.log("Sucursales sincronizadas correctamente.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });