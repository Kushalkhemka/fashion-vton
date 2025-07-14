import { apiGet } from "@/config/api";

export type FilterKey =
  | "itemType"
  | "look"
  | "color"
  | "sleeveLength"
  | "length"
  | "neckline"
  | "prints";

export type CatalogFilters = Record<FilterKey, string>;
export type FilterOptions = Record<FilterKey, string[]>;

export interface Product {
  id: number;
  fileName: string;
  name: string;
  price: number;
  modelImages: string[];
  clothImage: string;
  category: string;
  itemType: string;
  color: string;
  look: string;
  sleeveLength: string;
  length: string;
  neckline: string;
  prints: string;
}

export interface CatalogResponse {
  products: Product[];
  filterOptions: FilterOptions;
}

export const emptyFilters: CatalogFilters = {
  itemType: "",
  look: "",
  color: "",
  sleeveLength: "",
  length: "",
  neckline: "",
  prints: "",
};

export const filterLabels: Record<FilterKey, string> = {
  itemType: "Item Type",
  look: "Look",
  color: "Color",
  sleeveLength: "Sleeve Length",
  length: "Length",
  neckline: "Neckline",
  prints: "Prints",
};

export async function fetchCatalog(): Promise<CatalogResponse> {
  return apiGet<CatalogResponse>("/api/catalog");
}

export function productMatchesFilters(product: Product, filters: CatalogFilters): boolean {
  return (Object.keys(filters) as FilterKey[]).every((key) => {
    return !filters[key] || product[key] === filters[key];
  });
}

export function filtersFromSearchParams(searchParams: URLSearchParams): CatalogFilters {
  return (Object.keys(emptyFilters) as FilterKey[]).reduce<CatalogFilters>((acc, key) => {
    acc[key] = searchParams.get(key) || "";
    return acc;
  }, { ...emptyFilters });
}

export function filtersToSearchParams(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();
  (Object.keys(filters) as FilterKey[]).forEach((key) => {
    if (filters[key]) {
      params.set(key, filters[key]);
    }
  });
  return params;
}
