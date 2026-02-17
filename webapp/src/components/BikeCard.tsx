import { cn } from "@/lib/utils";
import { ChevronRight, ShoppingCart, Loader2 } from "lucide-react";
import { BikeStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import type { Bike } from "@/lib/types";

interface BikeCardProps {
  bike: Bike;
  onClick?: () => void;
  onCheckout?: () => void;
  isCheckingOut?: boolean;
  className?: string;
}

function formatCurrency(amount: number | null) {
  if (amount == null) return "-";
  return `\u20AC ${amount.toFixed(2)}`;
}

export function BikeCard({
  bike,
  onClick,
  onCheckout,
  isCheckingOut,
  className,
}: BikeCardProps) {
  const priceStr = bike.sellingPrice
    ? formatCurrency(bike.sellingPrice)
    : bike.purchasePrice
      ? formatCurrency(bike.purchasePrice)
      : null;

  const detailParts: string[] = [];
  if (bike.year) detailParts.push(String(bike.year));
  if (bike.color) detailParts.push(bike.color);
  if (bike.size) detailParts.push(bike.size);

  const canCheckout = bike.status === "IN_STOCK" || bike.status === "RESERVED";

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-slate-800 rounded-xl p-4 border border-slate-700 relative cursor-pointer",
        "transition-all duration-200 hover:bg-slate-800/80 hover:border-slate-600",
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0 mr-3">
          <h3 className="text-slate-100 text-lg font-bold truncate">
            {bike.brand?.name} {bike.model?.name}
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Frame: {bike.frameNumber}
          </p>
          {detailParts.length > 0 ? (
            <p className="text-gray-400 text-sm mt-1">
              {detailParts.join("  \u2022  ")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <BikeStatusBadge status={bike.status} />
          {priceStr ? (
            <span className="text-blue-400 text-lg font-bold">{priceStr}</span>
          ) : null}
        </div>
      </div>

      {canCheckout && onCheckout ? (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onCheckout();
          }}
          disabled={isCheckingOut}
          className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white"
        >
          {isCheckingOut ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ShoppingCart className="w-4 h-4 mr-2" />
          )}
          {isCheckingOut ? "Bezig..." : "Verkopen"}
        </Button>
      ) : null}

      <ChevronRight className="absolute right-4 top-4 w-4 h-4 text-slate-600" />
    </div>
  );
}

export function BikeCardSkeleton() {
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="h-6 w-40 bg-slate-700 rounded mb-2" />
          <div className="h-4 w-32 bg-slate-700 rounded mb-1" />
          <div className="h-4 w-24 bg-slate-700 rounded" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="h-6 w-20 bg-slate-700 rounded" />
          <div className="h-6 w-16 bg-slate-700 rounded" />
        </div>
      </div>
    </div>
  );
}
