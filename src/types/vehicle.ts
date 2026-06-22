export type VehicleCategory = "auto" | "moto";

export type Vehicle = {
  id: number;
  category: VehicleCategory;
  type: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  location: string;
  branchAddress: string;
  specs: string[];
  image: string;
  gallery: string[];
  description: string;
  features: string[];
  status: "Disponible" | "Apartado" | "Vendido";
  condition: "Nuevo" | "Seminuevo";
  isFeatured?: boolean;
};