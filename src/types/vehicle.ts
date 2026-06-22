export type VehicleCategory = "auto" | "moto" | "todoterreno";

export type VehicleCondition = "Nuevo" | "Seminuevo";

export type VehicleStatus =
  | "Disponible"
  | "Apartado"
  | "Vendido"
  | "En tránsito"
  | "Próximamente";

export type Vehicle = {
  id: number;
  category: VehicleCategory;
  type: string;
  name: string;
  brand: string;
  model: string;
  version?: string;
  year: number;
  price: number;
  location: string;
  branchAddress: string;
  specs: string[];
  image: string;
  gallery: string[];
  description: string;
  features: string[];
  status: VehicleStatus;
  condition: VehicleCondition;
  color?: string;
  isFeatured?: boolean;
};