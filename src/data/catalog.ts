import { VehicleCategory } from "@/types/vehicle";

export const vehicleCategories: {
  id: VehicleCategory;
  label: string;
  brands: string[];
  classifications: string[];
}[] = [
  {
    id: "auto",
    label: "Autos",
    brands: ["Zeekr", "Lynk & Co"],
    classifications: [
      "SUV",
      "Eléctrico",
      "Híbrido",
      "Premium",
      "Familiar",
      "Seminuevo",
    ],
  },
  {
    id: "moto",
    label: "Motos",
    brands: [
      "Indian",
      "Royal Enfield",
      "Motoplex",
      "Triumph",
      "Aprilia",
      "Moto Guzzi",
    ],
    classifications: [
      "Cruiser",
      "Adventure",
      "Naked",
      "Deportiva",
      "Touring",
      "Clásica",
    ],
  },
  {
    id: "todoterreno",
    label: "Todo terreno",
    brands: ["Polaris", "Can-Am"],
    classifications: [
      "ATV",
      "UTV",
      "Side by Side",
      "Trabajo",
      "Deportivo",
      "Recreativo",
    ],
  },
];

export const vehicleConditions = ["Nuevo", "Seminuevo"] as const;

export const vehicleStatuses = [
  "Disponible",
  "Apartado",
  "En tránsito",
  "Próximamente",
] as const;

export const branches = [
  {
    id: 1,
    name: "Grupo Rise Guadalajara",
    city: "Guadalajara",
    state: "Jalisco",
    address: "Av. Vallarta 6500, Guadalajara, Jalisco",
    phone: "33 1234 5678",
    whatsapp: "33 0000 0000",
  },
  {
    id: 2,
    name: "Grupo Rise CDMX",
    city: "Ciudad de México",
    state: "CDMX",
    address: "Insurgentes Sur 1500, Benito Juárez, CDMX",
    phone: "55 1234 5678",
    whatsapp: "55 0000 0000",
  },
  {
    id: 3,
    name: "Grupo Rise Monterrey",
    city: "Monterrey",
    state: "Nuevo León",
    address: "Av. Constitución 1000, Monterrey, Nuevo León",
    phone: "81 1234 5678",
    whatsapp: "81 0000 0000",
  },
];