import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Bike as BikeIcon, RefreshCw, AlertTriangle } from "lucide-react";
import { useBikes, useCheckoutBike } from "@/hooks/use-bikes";
import { BikeCard, BikeCardSkeleton } from "@/components/BikeCard";
import { BikeFilters } from "@/components/bikes/BikeFilters";
import type { FilterOption, SortOption } from "@/components/bikes/BikeFilters";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Bike } from "@/lib/types";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4">
        <BikeIcon className="w-10 h-10 text-blue-400" />
      </div>
      <h3 className="text-slate-100 text-lg font-semibold mb-2">
        Geen fietsen gevonden
      </h3>
      <p className="text-gray-400 text-sm text-center">
        Pas je filters aan of voeg een nieuwe fiets toe
      </p>
    </div>
  );
}

function BikesSkeleton() {
  return (
    <div className="space-y-3">
      <BikeCardSkeleton />
      <BikeCardSkeleton />
      <BikeCardSkeleton />
      <BikeCardSkeleton />
    </div>
  );
}

export default function BikesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<FilterOption>("ALL");
  const [activeSort, setActiveSort] = useState<SortOption>("newest");
  const [checkingOutId, setCheckingOutId] = useState<number | null>(null);

  const { data: bikes, isLoading, isError, refetch, isRefetching } = useBikes();
  const checkoutMutation = useCheckoutBike();

  const filteredAndSortedBikes = useMemo(() => {
    let result = (bikes ?? []).filter((bike: Bike) => {
      const matchesFilter = activeFilter === "ALL" || bike.status === activeFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        bike.frameNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bike.brand?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bike.model?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });

    result = [...result].sort((a: Bike, b: Bike) => {
      switch (activeSort) {
        case "price_asc":
          return (a.sellingPrice ?? 0) - (b.sellingPrice ?? 0);
        case "price_desc":
          return (b.sellingPrice ?? 0) - (a.sellingPrice ?? 0);
        case "brand_az":
          return (a.brand?.name ?? "").localeCompare(b.brand?.name ?? "");
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [bikes, activeFilter, searchQuery, activeSort]);

  const handleBikePress = (bikeId: number) => {
    navigate(`/bikes/${bikeId}`);
  };

  const handleCheckout = (bikeId: number) => {
    setCheckingOutId(bikeId);
    checkoutMutation.mutate(bikeId, {
      onSettled: () => setCheckingOutId(null),
    });
  };

  const handleAddBike = () => {
    navigate("/bikes/new");
  };

  if (isError) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-8">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-red-400 text-xl font-semibold mb-2">Fout bij laden</h2>
        <p className="text-gray-500 text-center mb-6">
          Kan fietsen niet laden. Probeer het opnieuw.
        </p>
        <Button onClick={() => refetch()} variant="default">
          <RefreshCw className="w-4 h-4 mr-2" />
          Opnieuw proberen
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-slate-100 text-2xl lg:text-3xl font-extrabold">Fietsen</h1>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => refetch()}
            variant="ghost"
            size="icon"
            disabled={isRefetching}
            className="text-slate-400 hover:text-slate-100"
          >
            <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
          </Button>
          <Button onClick={handleAddBike} className="bg-blue-500 hover:bg-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            Nieuw
          </Button>
        </div>
      </div>

      {/* Filters */}
      <BikeFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        activeSort={activeSort}
        onSortChange={setActiveSort}
      />

      {/* Content */}
      {isLoading ? (
        <BikesSkeleton />
      ) : filteredAndSortedBikes.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {filteredAndSortedBikes.map((bike: Bike) => (
            <BikeCard
              key={bike.id}
              bike={bike}
              onClick={() => handleBikePress(bike.id)}
              onCheckout={() => handleCheckout(bike.id)}
              isCheckingOut={checkingOutId === bike.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
