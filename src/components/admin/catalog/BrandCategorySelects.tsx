"use client";

import { useMemo, useState } from "react";

type BrandOption = {
  id: number;
  name: string;
};

type CategoryOption = {
  id: number;
  brandId: number;
  name: string;
  parentId?: number | null;
  parentName?: string | null;
};

type BrandCategorySelectsProps = {
  brands: BrandOption[];
  categories: CategoryOption[];
  defaultBrandId?: number | null;
  defaultCategoryId?: number | null;
};

export function BrandCategorySelects({
  brands,
  categories,
  defaultBrandId,
  defaultCategoryId,
}: BrandCategorySelectsProps) {
  const [selectedBrandId, setSelectedBrandId] = useState(defaultBrandId ?? 0);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    defaultCategoryId ?? 0
  );

  const filteredCategories = useMemo(() => {
    if (!selectedBrandId) {
      return [];
    }

    return categories.filter((category) => category.brandId === selectedBrandId);
  }, [categories, selectedBrandId]);

  function handleBrandChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextBrandId = Number(event.target.value);

    setSelectedBrandId(nextBrandId);

    const categoryStillBelongsToBrand = categories.some(
      (category) =>
        category.id === selectedCategoryId && category.brandId === nextBrandId
    );

    if (!categoryStillBelongsToBrand) {
      setSelectedCategoryId(0);
    }
  }

  return (
    <>
      <label>
        <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
          Marca
        </span>

        <select
          name="brandId"
          required
          value={selectedBrandId || ""}
          onChange={handleBrandChange}
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

      <label>
        <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
          Categoría
        </span>

        <select
          name="categoryId"
          value={selectedCategoryId || ""}
          onChange={(event) => setSelectedCategoryId(Number(event.target.value))}
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
    </>
  );
}