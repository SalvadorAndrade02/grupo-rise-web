"use client";

import { useMemo, useState } from "react";

type VehicleCategoryValue = "AUTO" | "MOTO" | "TODOTERRENO";

type BrandOption = {
  id: number;
  name: string;
  category?: VehicleCategoryValue;
};

type CategoryOption = {
  id: number;
  brandId: number;
  name: string;
  parentId?: number | null;
  parentName?: string | null;
};

type CatalogModelImageOption = {
  url: string;
  type: "IMAGE" | "VIDEO";
  alt?: string | null;
  order?: number | null;
};

type CatalogModelOption = {
  id: number;
  brandId: number;
  categoryId?: number | null;
  name: string;
  categoryType: VehicleCategoryValue;
  year?: number | null;
  priceFrom?: number | null;
  subtitle?: string | null;
  description?: string | null;
  specs?: string | null;
  features?: string | null;
  mainImage?: string | null;
  categoryName?: string | null;
  images?: CatalogModelImageOption[];
};

type BrandCategorySelectsProps = {
  brands: BrandOption[];
  categories: CategoryOption[];
  defaultBrandId?: number | null;
  defaultCategoryId?: number | null;

  mode?: "catalog" | "vehicle";

  catalogModels?: CatalogModelOption[];
  defaultCatalogModelId?: number | null;
  defaultVehicleName?: string | null;
};

function getCategoryLabel(category: VehicleCategoryValue) {
  const labels: Record<VehicleCategoryValue, string> = {
    AUTO: "Auto",
    MOTO: "Moto",
    TODOTERRENO: "Todo terreno",
  };

  return labels[category];
}
function setFormFieldValue(
  name: string,
  value: string | number | null | undefined,
  overwrite = false
) {
  if (value === null || value === undefined || value === "") {
    return;
  }

  const field = document.querySelector<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >(`[name="${name}"]`);

  if (!field) {
    return;
  }

  const currentValue = typeof field.value === "string" ? field.value : "";

  if (!overwrite && currentValue.trim()) {
    return;
  }

  field.value = String(value);

  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
}

export function BrandCategorySelects({
  brands,
  categories,
  defaultBrandId,
  defaultCategoryId,
  mode = "catalog",
  catalogModels = [],
  defaultCatalogModelId,
  defaultVehicleName,
}: BrandCategorySelectsProps) {
  const [selectedBrandId, setSelectedBrandId] = useState(
    defaultBrandId ? String(defaultBrandId) : ""
  );

  const [selectedCategoryId, setSelectedCategoryId] = useState(
    defaultCategoryId ? String(defaultCategoryId) : ""
  );

  const [selectedCatalogModelId, setSelectedCatalogModelId] = useState(
    defaultCatalogModelId ? String(defaultCatalogModelId) : ""
  );

  const [vehicleName, setVehicleName] = useState(defaultVehicleName ?? "");

  const selectedBrand = useMemo(() => {
    return brands.find((brand) => String(brand.id) === selectedBrandId) ?? null;
  }, [brands, selectedBrandId]);

  const filteredCategories = useMemo(() => {
    if (!selectedBrandId) {
      return [];
    }

    return categories.filter(
      (category) => String(category.brandId) === selectedBrandId
    );
  }, [categories, selectedBrandId]);

  const filteredCatalogModels = useMemo(() => {
    if (!selectedBrandId) {
      return [];
    }

    return catalogModels.filter((model) => {
      const matchesBrand = String(model.brandId) === selectedBrandId;

      const matchesCategory = selectedCategoryId
        ? String(model.categoryId ?? "") === selectedCategoryId
        : true;

      return matchesBrand && matchesCategory;
    });
  }, [catalogModels, selectedBrandId, selectedCategoryId]);

  const selectedCatalogModel = useMemo(() => {
    return (
      catalogModels.find(
        (model) => String(model.id) === selectedCatalogModelId
      ) ?? null
    );
  }, [catalogModels, selectedCatalogModelId]);

  const selectedVehicleCategory: VehicleCategoryValue =
    selectedCatalogModel?.categoryType ?? selectedBrand?.category ?? "AUTO";

  function handleBrandChange(value: string) {
    setSelectedBrandId(value);
    setSelectedCategoryId("");
    setSelectedCatalogModelId("");

    if (mode === "vehicle") {
      setVehicleName("");
    }
  }

  function handleCategoryChange(value: string) {
    setSelectedCategoryId(value);
    setSelectedCatalogModelId("");

    if (mode === "vehicle") {
      setVehicleName("");
    }
  }

  function handleCatalogModelChange(value: string) {
    setSelectedCatalogModelId(value);

    const model = catalogModels.find((item) => String(item.id) === value);

    if (!model) {
      return;
    }

    setVehicleName(model.name);

    if (model.categoryId) {
      setSelectedCategoryId(String(model.categoryId));
    }

    setFormFieldValue("year", model.year, true);
    setFormFieldValue("price", model.priceFrom, true);
    setFormFieldValue("description", model.description, true);
    setFormFieldValue("specs", model.specs, true);
    setFormFieldValue("features", model.features, true);
    setFormFieldValue("mainImage", model.mainImage, true);
  }

  return (
    <div className="rounded-[2rem] border border-[var(--rise-border)] bg-white p-5 shadow-sm md:p-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--rise-blue)]">
          {mode === "vehicle" ? "Modelo base" : "Clasificación"}
        </p>

        <h2 className="mt-2 text-2xl font-black">
          {mode === "vehicle"
            ? "Selecciona marca y modelo"
            : "Selecciona marca y categoría"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {mode === "vehicle"
            ? "Primero selecciona la marca. Después podrás elegir una categoría y un modelo registrado en el catálogo."
            : "Selecciona la marca y la categoría donde se mostrará este modelo."}
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
            Marca
          </span>

          <select
            name="brandId"
            value={selectedBrandId}
            onChange={(event) => handleBrandChange(event.target.value)}
            required
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
          >
            <option value="">Selecciona una marca</option>

            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
            Categoría
          </span>

          <select
            name="categoryId"
            value={selectedCategoryId}
            onChange={(event) => handleCategoryChange(event.target.value)}
            disabled={!selectedBrandId}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">
              {selectedBrandId
                ? "Selecciona una categoría"
                : "Primero selecciona una marca"}
            </option>

            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.parentName
                  ? `${category.parentName} / ${category.name}`
                  : category.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {mode === "vehicle" && (
        <>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Modelo del catálogo
              </span>

              <select
                value={selectedCatalogModelId}
                onChange={(event) =>
                  handleCatalogModelChange(event.target.value)
                }
                disabled={!selectedBrandId}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {selectedBrandId
                    ? "Selecciona un modelo"
                    : "Primero selecciona una marca"}
                </option>

                {filteredCatalogModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                    {model.categoryName ? ` · ${model.categoryName}` : ""}
                    {model.year ? ` · ${model.year}` : ""}
                  </option>
                ))}
              </select>

              {selectedBrandId && filteredCatalogModels.length === 0 && (
                <p className="mt-2 text-xs font-bold text-amber-600">
                  Esta marca aún no tiene modelos registrados en catálogo. Puedes
                  capturar el nombre manualmente.
                </p>
              )}
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Nombre de la unidad
              </span>

              <input
                name="name"
                value={vehicleName}
                onChange={(event) => setVehicleName(event.target.value)}
                placeholder="Ej. Classic 350, RZR XP, Defender"
                required
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[var(--rise-blue)] focus:bg-white"
              />

              <p className="mt-2 text-xs text-slate-500">
                Este nombre se usará en la ficha pública del vehículo.
              </p>
            </label>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="block text-xs font-black uppercase tracking-wider text-slate-500">
              Tipo detectado
            </span>

            <p className="mt-2 text-lg font-black text-[var(--rise-navy)]">
              {getCategoryLabel(selectedVehicleCategory)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Se toma del modelo seleccionado o de la categoría de la marca.
            </p>
          </div>

          <input
            type="hidden"
            name="model"
            value={selectedCatalogModel?.name ?? vehicleName}
          />

          <input
            type="hidden"
            name="category"
            value={selectedVehicleCategory}
          />

          <input
            type="hidden"
            name="type"
            value={selectedVehicleCategory}
          />

          <input
            type="hidden"
            name="catalogYear"
            value={selectedCatalogModel?.year ?? ""}
          />

          <input
            type="hidden"
            name="catalogPriceFrom"
            value={selectedCatalogModel?.priceFrom ?? ""}
          />

          <input
            type="hidden"
            name="catalogDescription"
            value={selectedCatalogModel?.description ?? ""}
          />

          <input
            type="hidden"
            name="catalogSpecs"
            value={selectedCatalogModel?.specs ?? ""}
          />

          <input
            type="hidden"
            name="catalogFeatures"
            value={selectedCatalogModel?.features ?? ""}
          />

          <input
            type="hidden"
            name="catalogMainImage"
            value={selectedCatalogModel?.mainImage ?? ""}
          />

          <input
            type="hidden"
            name="catalogImages"
            value={JSON.stringify(selectedCatalogModel?.images ?? [])}
          />
        </>
      )}
    </div>
  );
}