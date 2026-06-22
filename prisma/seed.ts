import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Limpiando base...");

  await prisma.lead.deleteMany();
  await prisma.vehicleImage.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.banner.deleteMany();

  console.log("Creando sucursales...");

  const guadalajara = await prisma.branch.create({
    data: {
      name: "Grupo Rise Guadalajara",
      city: "Guadalajara",
      state: "Jalisco",
      address: "Av. Vallarta 6500, Guadalajara, Jalisco",
      phone: "33 1234 5678",
      whatsapp: "33 0000 0000",
    },
  });

  const cdmx = await prisma.branch.create({
    data: {
      name: "Grupo Rise CDMX",
      city: "Ciudad de México",
      state: "CDMX",
      address: "Insurgentes Sur 1500, Benito Juárez, CDMX",
      phone: "55 1234 5678",
      whatsapp: "55 0000 0000",
    },
  });

  const monterrey = await prisma.branch.create({
    data: {
      name: "Grupo Rise Monterrey",
      city: "Monterrey",
      state: "Nuevo León",
      address: "Av. Constitución 1000, Monterrey, Nuevo León",
      phone: "81 1234 5678",
      whatsapp: "81 0000 0000",
    },
  });

  console.log("Creando marcas...");

  const zeekr = await prisma.brand.create({
    data: { name: "Zeekr", category: "AUTO" },
  });

  const lynkCo = await prisma.brand.create({
    data: { name: "Lynk & Co", category: "AUTO" },
  });

  const indian = await prisma.brand.create({
    data: { name: "Indian", category: "MOTO" },
  });

  const royalEnfield = await prisma.brand.create({
    data: { name: "Royal Enfield", category: "MOTO" },
  });

  const triumph = await prisma.brand.create({
    data: { name: "Triumph", category: "MOTO" },
  });

  const aprilia = await prisma.brand.create({
    data: { name: "Aprilia", category: "MOTO" },
  });

  const motoGuzzi = await prisma.brand.create({
    data: { name: "Moto Guzzi", category: "MOTO" },
  });

  const motoplex = await prisma.brand.create({
    data: { name: "Motoplex", category: "MOTO" },
  });

  const polaris = await prisma.brand.create({
    data: { name: "Polaris", category: "TODOTERRENO" },
  });

  const canAm = await prisma.brand.create({
    data: { name: "Can-Am", category: "TODOTERRENO" },
  });

  console.log("Creando vehículos...");

  await prisma.vehicle.createMany({
    data: [
      {
        category: "AUTO",
        condition: "NUEVO",
        status: "DISPONIBLE",
        brandId: zeekr.id,
        branchId: guadalajara.id,
        name: "Zeekr X 2024",
        model: "X",
        version: "Premium",
        year: 2024,
        price: 799000,
        type: "Eléctrico",
        color: "Azul",
        mileage: 0,
        specs: "Eléctrico, Automático, SUV",
        description:
          "SUV eléctrico premium con diseño moderno, gran tecnología interior y excelente desempeño.",
        features:
          "Pantalla central, Asistencias de manejo, Cámara 360, Carga rápida, Interior premium",
        mainImage:
          "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=1200&auto=format&fit=crop",
        isFeatured: true,
      },
      {
        category: "AUTO",
        condition: "NUEVO",
        status: "DISPONIBLE",
        brandId: lynkCo.id,
        branchId: cdmx.id,
        name: "Lynk & Co 01 2024",
        model: "01",
        version: "Hybrid",
        year: 2024,
        price: 689000,
        type: "Híbrido",
        color: "Negro",
        mileage: 0,
        specs: "Híbrido, Automático, SUV",
        description:
          "SUV híbrida con tecnología avanzada, diseño urbano y excelente equilibrio entre rendimiento y comodidad.",
        features:
          "Motor híbrido, Techo panorámico, Pantalla multimedia, Asistencias ADAS, Cámara de reversa",
        mainImage:
          "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200&auto=format&fit=crop",
        isFeatured: true,
      },
      {
        category: "MOTO",
        condition: "NUEVO",
        status: "DISPONIBLE",
        brandId: indian.id,
        branchId: monterrey.id,
        name: "Indian Scout 2024",
        model: "Scout",
        version: "Standard",
        year: 2024,
        price: 319900,
        type: "Cruiser",
        color: "Negro",
        mileage: 0,
        specs: "1133 cc, Cruiser, ABS",
        description:
          "Motocicleta cruiser con gran presencia, potencia sólida y diseño clásico para disfrutar cada ruta.",
        features:
          "Frenos ABS, Motor V-Twin, Asiento bajo, Diseño cruiser, Iluminación LED",
        mainImage:
          "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=1200&auto=format&fit=crop",
        isFeatured: true,
      },
      {
        category: "MOTO",
        condition: "SEMINUEVO",
        status: "DISPONIBLE",
        brandId: royalEnfield.id,
        branchId: guadalajara.id,
        name: "Royal Enfield Himalayan 2023",
        model: "Himalayan",
        version: "Adventure",
        year: 2023,
        price: 129900,
        type: "Adventure",
        color: "Gris",
        mileage: 7200,
        specs: "411 cc, Adventure, Seminueva",
        description:
          "Moto adventure seminueva, cómoda y resistente, ideal para trayectos urbanos y caminos largos.",
        features:
          "Suspensión larga, Parrilla trasera, Frenos de disco, Postura cómoda, Diseño adventure",
        mainImage:
          "https://images.unsplash.com/photo-1609630875171-b1321377ee65?q=80&w=1200&auto=format&fit=crop",
        isFeatured: true,
      },
      {
        category: "MOTO",
        condition: "NUEVO",
        status: "EN_TRANSITO",
        brandId: triumph.id,
        branchId: cdmx.id,
        name: "Triumph Tiger 900 2024",
        model: "Tiger 900",
        version: "GT",
        year: 2024,
        price: 359900,
        type: "Adventure",
        color: "Blanco",
        mileage: 0,
        specs: "888 cc, Adventure, ABS",
        description:
          "Motocicleta adventure premium con excelente desempeño, tecnología y comodidad para rutas largas.",
        features:
          "Modos de manejo, ABS, Control de tracción, Pantalla TFT, Suspensión avanzada",
        mainImage:
          "https://images.unsplash.com/photo-1558981359-219d6364c9c8?q=80&w=1200&auto=format&fit=crop",
        isFeatured: false,
      },
      {
        category: "MOTO",
        condition: "NUEVO",
        status: "DISPONIBLE",
        brandId: aprilia.id,
        branchId: guadalajara.id,
        name: "Aprilia RS 660 2024",
        model: "RS 660",
        version: "Sport",
        year: 2024,
        price: 289900,
        type: "Deportiva",
        color: "Rojo",
        mileage: 0,
        specs: "660 cc, Deportiva, 6 velocidades",
        description:
          "Moto deportiva ligera, tecnológica y precisa, pensada para quienes buscan desempeño y diseño italiano.",
        features:
          "Quickshifter, ABS, Control de tracción, Modos de manejo, Pantalla TFT",
        mainImage:
          "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=1200&auto=format&fit=crop",
        isFeatured: false,
      },
      {
        category: "MOTO",
        condition: "NUEVO",
        status: "PROXIMAMENTE",
        brandId: motoGuzzi.id,
        branchId: monterrey.id,
        name: "Moto Guzzi V85 TT 2024",
        model: "V85 TT",
        version: "Travel",
        year: 2024,
        price: 299900,
        type: "Touring",
        color: "Verde",
        mileage: 0,
        specs: "853 cc, Touring, ABS",
        description:
          "Moto touring con estilo clásico, comodidad para ruta y tecnología para viajes largos.",
        features:
          "ABS, Control de tracción, Maletas laterales, Parabrisas, Pantalla digital",
        mainImage:
          "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=1200&auto=format&fit=crop",
        isFeatured: false,
      },
      {
        category: "MOTO",
        condition: "NUEVO",
        status: "DISPONIBLE",
        brandId: motoplex.id,
        branchId: cdmx.id,
        name: "Motoplex Urban 300 2024",
        model: "Urban 300",
        version: "City",
        year: 2024,
        price: 94900,
        type: "Urbana",
        color: "Blanco",
        mileage: 0,
        specs: "300 cc, Urbana, ABS",
        description:
          "Moto urbana práctica, ligera y eficiente para movilidad diaria.",
        features:
          "ABS, Iluminación LED, Tablero digital, Bajo consumo, Diseño urbano",
        mainImage:
          "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?q=80&w=1200&auto=format&fit=crop",
        isFeatured: false,
      },
      {
        category: "TODOTERRENO",
        condition: "NUEVO",
        status: "DISPONIBLE",
        brandId: polaris.id,
        branchId: monterrey.id,
        name: "Polaris RZR XP 1000 2024",
        model: "RZR XP 1000",
        version: "Sport",
        year: 2024,
        price: 569900,
        type: "Side by Side",
        color: "Negro",
        mileage: 0,
        specs: "999 cc, 4x4, 2 pasajeros",
        description:
          "Vehículo todo terreno deportivo, diseñado para aventura, potencia y control en caminos exigentes.",
        features:
          "Tracción 4x4, Suspensión deportiva, Jaula de seguridad, Asientos deportivos, Alto despeje",
        mainImage:
          "https://images.unsplash.com/photo-1605540436563-5bca919ae766?q=80&w=1200&auto=format&fit=crop",
        isFeatured: true,
      },
      {
        category: "TODOTERRENO",
        condition: "SEMINUEVO",
        status: "DISPONIBLE",
        brandId: canAm.id,
        branchId: cdmx.id,
        name: "Can-Am Defender HD9 2023",
        model: "Defender HD9",
        version: "Utility",
        year: 2023,
        price: 449900,
        type: "UTV",
        color: "Verde",
        mileage: 3800,
        specs: "976 cc, Trabajo, 4x4",
        description:
          "Todo terreno utilitario ideal para trabajo, campo y recorridos exigentes con gran capacidad de carga.",
        features:
          "Caja de carga, Tracción 4x4, Capacidad utilitaria, Suspensión reforzada, Cabina amplia",
        mainImage:
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
        isFeatured: false,
      },
    ],
  });

  console.log("Seed completado correctamente.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });