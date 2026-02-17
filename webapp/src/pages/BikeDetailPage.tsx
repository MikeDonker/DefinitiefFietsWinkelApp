import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Palette,
  Ruler,
  Hash,
  DollarSign,
  FileText,
  Clock,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useBike, useCheckoutBike } from "@/hooks/use-bikes";
import { Button } from "@/components/ui/button";
import {
  BikeStatusBadge,
  WorkOrderStatusBadge,
  PriorityBadge,
  BIKE_STATUS_LABELS,
  WORK_ORDER_STATUS_LABELS,
} from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import type { BikeStatus } from "@/lib/types";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(amount: number | null) {
  if (amount == null) return "-";
  return `\u20AC ${amount.toFixed(2)}`;
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center py-3 border-b border-slate-700">
      <div className="w-9">{icon}</div>
      <span className="text-gray-400 text-sm w-28">{label}</span>
      <span className="text-slate-100 text-sm font-medium flex-1">{value}</span>
    </div>
  );
}

const statusColors: Record<BikeStatus, string> = {
  IN_STOCK: "text-green-400",
  IN_SERVICE: "text-orange-400",
  RESERVED: "text-yellow-400",
  SOLD: "text-blue-400",
  SCRAPPED: "text-gray-400",
};

export default function BikeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: bike, isLoading, isError, refetch } = useBike(id);
  const checkoutMutation = useCheckoutBike();

  const canCheckout = bike?.status === "IN_STOCK" || bike?.status === "RESERVED";

  const handleCheckout = () => {
    if (bike) {
      checkoutMutation.mutate(bike.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (isError || !bike) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-8">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-red-400 text-xl font-semibold mb-2">Fiets niet gevonden</h2>
        <p className="text-gray-500 text-center mb-6">
          De fiets kon niet worden geladen.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/bikes")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug
          </Button>
          <Button onClick={() => refetch()} variant="default">
            <RefreshCw className="w-4 h-4 mr-2" />
            Opnieuw proberen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          onClick={() => navigate("/bikes")}
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-slate-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-slate-100 text-xl lg:text-2xl font-extrabold">
            {bike.brand?.name} {bike.model?.name}
          </h1>
          <p className="text-gray-500 text-sm">Fiets Details</p>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h2 className="text-slate-100 text-2xl font-extrabold">
              {bike.brand?.name}
            </h2>
            <p className="text-gray-400 text-lg font-medium mt-1">
              {bike.model?.name}
            </p>
          </div>
          <BikeStatusBadge status={bike.status} />
        </div>

        <InfoRow
          icon={<Hash className="w-4 h-4 text-gray-500" />}
          label="Framenummer"
          value={bike.frameNumber}
        />
        <InfoRow
          icon={<Calendar className="w-4 h-4 text-gray-500" />}
          label="Jaar"
          value={bike.year ? String(bike.year) : "-"}
        />
        <InfoRow
          icon={<Palette className="w-4 h-4 text-gray-500" />}
          label="Kleur"
          value={bike.color ?? "-"}
        />
        <InfoRow
          icon={<Ruler className="w-4 h-4 text-gray-500" />}
          label="Maat"
          value={bike.size ?? "-"}
        />
        <InfoRow
          icon={<DollarSign className="w-4 h-4 text-gray-500" />}
          label="Inkoopprijs"
          value={formatCurrency(bike.purchasePrice)}
        />
        <InfoRow
          icon={<DollarSign className="w-4 h-4 text-green-400" />}
          label="Verkoopprijs"
          value={formatCurrency(bike.sellingPrice)}
        />
        {bike.notes ? (
          <InfoRow
            icon={<FileText className="w-4 h-4 text-gray-500" />}
            label="Notities"
            value={bike.notes}
          />
        ) : null}
      </div>

      {/* Checkout Button */}
      {canCheckout ? (
        <div className="mb-4">
          <Button
            onClick={handleCheckout}
            disabled={checkoutMutation.isPending}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-bold"
          >
            {checkoutMutation.isPending ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : null}
            {checkoutMutation.isPending ? "Bezig..." : "Verkopen"}
          </Button>
          {checkoutMutation.isError ? (
            <p className="text-red-400 text-sm text-center mt-2">
              Verkoop mislukt. Probeer het opnieuw.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Inventory History */}
      {bike.inventoryMovements && bike.inventoryMovements.length > 0 ? (
        <div className="mb-4">
          <h3 className="text-slate-100 text-lg font-bold mb-3">Voorraadhistorie</h3>
          <div className="space-y-2">
            {bike.inventoryMovements.map((movement) => (
              <div
                key={movement.id}
                className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center"
              >
                <Clock className="w-4 h-4 text-gray-500 mr-3" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {movement.fromStatus ? (
                      <span className={cn("text-sm font-semibold", statusColors[movement.fromStatus])}>
                        {BIKE_STATUS_LABELS[movement.fromStatus]}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-sm">Nieuw</span>
                    )}
                    <span className="text-slate-600">\u2192</span>
                    <span className={cn("text-sm font-semibold", statusColors[movement.toStatus])}>
                      {BIKE_STATUS_LABELS[movement.toStatus]}
                    </span>
                  </div>
                  {movement.reason ? (
                    <p className="text-gray-400 text-xs mt-1">{movement.reason}</p>
                  ) : null}
                  <p className="text-slate-600 text-xs mt-1">
                    {formatDate(movement.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Work Orders */}
      {bike.serviceWorkOrders && bike.serviceWorkOrders.length > 0 ? (
        <div>
          <h3 className="text-slate-100 text-lg font-bold mb-3">Werkorders</h3>
          <div className="space-y-2">
            {bike.serviceWorkOrders.map((wo) => (
              <div
                key={wo.id}
                className="bg-slate-800 rounded-xl p-4 border border-slate-700"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-slate-100 text-sm font-semibold flex-1 mr-2">
                    {wo.description}
                  </p>
                  <div className="flex gap-1.5">
                    <WorkOrderStatusBadge status={wo.status} />
                    <PriorityBadge priority={wo.priority} />
                  </div>
                </div>
                <p className="text-slate-600 text-xs">
                  {formatDate(wo.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
