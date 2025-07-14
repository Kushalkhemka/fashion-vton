import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CatalogFilters, FilterKey, FilterOptions, emptyFilters, filterLabels } from "@/lib/catalog";

const colorSwatches: Record<string, string> = {
  Black: "#000000",
  White: "#FFFFFF",
  Grey: "#888888",
  Gray: "#888888",
  Brown: "#8B4513",
  Beige: "#F5F5DC",
  Red: "#D92332",
  Pink: "#F4A7B9",
  Orange: "#F28C28",
  Yellow: "#F2C94C",
  Green: "#2E7D32",
  Blue: "#2563EB",
  Purple: "#7E22CE",
  "Sky Blue": "#87CEEB",
  Navy: "#1E3A8A",
  Lavender: "#C4B5FD",
  Mint: "#AAF0D1",
  Khaki: "#BDB76B",
  Wine: "#722F37",
};

interface CatalogFilterSidebarProps {
  filters: CatalogFilters;
  options: FilterOptions;
  onChange: (filters: CatalogFilters) => void;
}

const filterOrder: FilterKey[] = ["itemType", "color", "look", "sleeveLength", "length", "neckline", "prints"];

export default function CatalogFilterSidebar({ filters, options, onChange }: CatalogFilterSidebarProps) {
  const [openSections, setOpenSections] = useState<Record<FilterKey, boolean>>({
    itemType: true,
    color: true,
    look: false,
    sleeveLength: false,
    length: false,
    neckline: false,
    prints: false,
  });

  const setFilter = (key: FilterKey, value: string) => {
    onChange({ ...filters, [key]: filters[key] === value ? "" : value });
  };

  return (
    <aside className="w-64 p-4 border-r border-border/30 bg-white/95 overflow-y-auto">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold text-lg">Filters</h2>
        <button className="text-sm text-muted-foreground hover:text-foreground" onClick={() => onChange({ ...emptyFilters })}>
          Clear
        </button>
      </div>

      {filterOrder.map((key) => {
        const values = options[key] || [];
        const isOpen = openSections[key];
        return (
          <section key={key} className="mb-3">
            <button
              type="button"
              className="flex w-full items-center justify-between py-1 text-left font-semibold"
              onClick={() => setOpenSections((current) => ({ ...current, [key]: !current[key] }))}
            >
              <span>{filterLabels[key]}</span>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {isOpen && key === "color" && (
              <div className="mt-2 grid grid-cols-5 gap-2">
                {values.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 ${filters.color === value ? "border-orange-500 ring-2 ring-orange-200" : "border-gray-200"}`}
                    style={{ background: colorSwatches[value] || "#eee" }}
                    title={value}
                    onClick={() => setFilter("color", value)}
                  >
                    <span className="sr-only">{value}</span>
                  </button>
                ))}
              </div>
            )}

            {isOpen && key !== "color" && (
              <div className="mt-2 space-y-1">
                {values.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`w-full rounded px-2 py-1 text-left text-sm ${filters[key] === value ? "bg-orange-100 text-orange-700" : "hover:bg-gray-100"}`}
                    onClick={() => setFilter(key, value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </aside>
  );
}
