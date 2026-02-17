import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { BikeStatus } from "@/lib/types";

type FilterOption = BikeStatus | "ALL";
type SortOption = "price_asc" | "price_desc" | "brand_az" | "newest";

const FILTER_OPTIONS: Array<{ label: string; value: FilterOption }> = [
  { label: "Alle", value: "ALL" },
  { label: "Op Voorraad", value: "IN_STOCK" },
  { label: "In Service", value: "IN_SERVICE" },
  { label: "Gereserveerd", value: "RESERVED" },
  { label: "Verkocht", value: "SOLD" },
  { label: "Afgevoerd", value: "SCRAPPED" },
];

const SORT_OPTIONS: Array<{ label: string; value: SortOption }> = [
  { label: "Prijs \u2191", value: "price_asc" },
  { label: "Prijs \u2193", value: "price_desc" },
  { label: "Merk A-Z", value: "brand_az" },
  { label: "Nieuwste", value: "newest" },
];

export type { FilterOption, SortOption };

interface BikeFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function BikeFilters({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  activeSort,
  onSortChange,
}: BikeFiltersProps) {
  return (
    <>
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Zoek op framenummer, merk..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {FILTER_OPTIONS.map((option) => {
          const isActive = activeFilter === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                isActive
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-slate-800 text-gray-400 border-slate-700 hover:border-slate-600"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Sort Chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SORT_OPTIONS.map((option) => {
          const isActive = activeSort === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onSortChange(option.value)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                isActive
                  ? "bg-green-500 text-white border-green-500"
                  : "bg-slate-800 text-gray-500 border-slate-700 hover:border-slate-600"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
