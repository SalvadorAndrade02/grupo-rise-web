import { Vehicle } from "@/types/vehicle";

export const vehicles: Vehicle[] = [
  {
    id: 1,
    category: "auto",
    type: "SUV",
    name: "SUV Atlas 2024",
    brand: "Volkswagen",
    model: "Atlas",
    year: 2024,
    price: 489000,
    location: "Guadalajara",
    branchAddress: "Av. Vallarta 6500, Guadalajara, Jalisco",
    specs: ["7 pasajeros", "5,400 km", "Automática"],
    image:
      "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1549927681-0b673b8243ab?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=1200&auto=format&fit=crop",
    ],
    description:
      "SUV familiar con excelente espacio interior, desempeño cómodo en ciudad y carretera, ideal para viajes, familia y uso diario.",
    features: [
      "Pantalla táctil",
      "Cámara de reversa",
      "Sensores de estacionamiento",
      "Control crucero",
      "Rines de aluminio",
      "Asientos en piel",
    ],
    status: "Disponible",
    condition: "Seminuevo",
    isFeatured: true,
  },
  {
    id: 2,
    category: "auto",
    type: "Sedán",
    name: "Sedán Jetta 2023",
    brand: "Volkswagen",
    model: "Jetta",
    year: 2023,
    price: 325000,
    location: "CDMX",
    branchAddress: "Insurgentes Sur 1500, Benito Juárez, CDMX",
    specs: ["5 pasajeros", "1.4L", "Automática"],
    image:
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200&auto=format&fit=crop",
    ],
    description:
      "Sedán cómodo, eficiente y elegante, pensado para quienes buscan buen rendimiento, seguridad y diseño moderno.",
    features: [
      "Bluetooth",
      "Aire acondicionado",
      "Control de estabilidad",
      "Frenos ABS",
      "Pantalla multimedia",
      "Volante multifunción",
    ],
    status: "Disponible",
    condition: "Seminuevo",
    isFeatured: true,
  },
  {
    id: 3,
    category: "moto",
    type: "Moto",
    name: "Yamaha MT-07 2024",
    brand: "Yamaha",
    model: "MT-07",
    year: 2024,
    price: 179900,
    location: "Guadalajara",
    branchAddress: "Av. Vallarta 6500, Guadalajara, Jalisco",
    specs: ["689 cc", "ABS", "2 cilindros"],
    image:
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1558981359-219d6364c9c8?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?q=80&w=1200&auto=format&fit=crop",
    ],
    description:
      "Moto naked de gran respuesta, diseño agresivo y manejo ligero. Ideal para ciudad, carretera y conducción deportiva.",
    features: [
      "Frenos ABS",
      "Iluminación LED",
      "Tablero digital",
      "Motor bicilíndrico",
      "Suspensión deportiva",
      "Diseño naked",
    ],
    status: "Disponible",
    condition: "Nuevo",
    isFeatured: true,
  },
  {
    id: 4,
    category: "moto",
    type: "Deportiva",
    name: "Kawasaki Ninja 400 2024",
    brand: "Kawasaki",
    model: "Ninja 400",
    year: 2024,
    price: 134900,
    location: "CDMX",
    branchAddress: "Insurgentes Sur 1500, Benito Juárez, CDMX",
    specs: ["399 cc", "ABS", "6 velocidades"],
    image:
      "https://images.unsplash.com/photo-1609630875171-b1321377ee65?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1609630875171-b1321377ee65?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=1200&auto=format&fit=crop",
    ],
    description:
      "Moto deportiva ligera, potente y precisa, pensada para quienes buscan diseño agresivo, velocidad y control.",
    features: [
      "Frenos ABS",
      "Carrocería deportiva",
      "Tablero digital",
      "6 velocidades",
      "Iluminación LED",
      "Motor bicilíndrico",
    ],
    status: "Disponible",
    condition: "Nuevo",
    isFeatured: true,
  },
];

export function getVehicleById(id: number) {
  return vehicles.find((vehicle) => vehicle.id === id);
}