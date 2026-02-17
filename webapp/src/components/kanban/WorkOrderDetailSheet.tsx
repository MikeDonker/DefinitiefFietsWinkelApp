import { Loader2 } from "lucide-react";
import { PRIORITY_LABELS } from "@/components/StatusBadge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ServiceWorkOrder, WorkOrderStatus } from "@/lib/types";

const COLUMNS: Array<{ status: WorkOrderStatus; label: string; color: string }> = [
  { status: "OPEN", label: "Open", color: "bg-blue-500" },
  { status: "IN_PROGRESS", label: "In Behandeling", color: "bg-orange-500" },
  { status: "WAITING_PARTS", label: "Wacht op Onderdelen", color: "bg-yellow-500" },
  { status: "COMPLETED", label: "Voltooid", color: "bg-green-500" },
];

export interface WorkOrderDetailSheetProps {
  workOrder: ServiceWorkOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (status: WorkOrderStatus) => void;
  isUpdating: boolean;
}

export function WorkOrderDetailSheet({
  workOrder,
  open,
  onOpenChange,
  onStatusChange,
  isUpdating,
}: WorkOrderDetailSheetProps) {
  if (!workOrder) return null;

  const bikeName = workOrder.bike
    ? `${workOrder.bike.brand?.name ?? ""} ${workOrder.bike.model?.name ?? ""}`.trim()
    : `Fiets #${workOrder.bikeId}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-slate-900 border-slate-800 w-full sm:max-w-md">
        <SheetHeader>
          <SheetDescription className="text-blue-400 text-sm font-semibold">
            {bikeName}
          </SheetDescription>
          <SheetTitle className="text-slate-100 text-xl font-bold">
            Werkorder #{workOrder.id}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
          {/* Description */}
          <div className="mb-5">
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Beschrijving</p>
            <p className="text-slate-100 text-sm leading-relaxed">{workOrder.description}</p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
              <p className="text-gray-500 text-xs mb-1">Prioriteit</p>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    workOrder.priority === "URGENT" && "bg-red-400",
                    workOrder.priority === "HIGH" && "bg-orange-400",
                    workOrder.priority === "MEDIUM" && "bg-blue-400",
                    workOrder.priority === "LOW" && "bg-gray-400"
                  )}
                />
                <span className="text-slate-100 text-sm font-semibold">
                  {PRIORITY_LABELS[workOrder.priority]}
                </span>
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
              <p className="text-gray-500 text-xs mb-1">Toegewezen aan</p>
              <p className="text-slate-100 text-sm font-medium">
                {workOrder.assignedTo?.name ?? "-"}
              </p>
            </div>
          </div>

          {/* Notes */}
          {workOrder.notes ? (
            <div className="mb-5">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Notities</p>
              <p className="text-gray-400 text-sm leading-relaxed">{workOrder.notes}</p>
            </div>
          ) : null}

          {/* Status Change */}
          <div className="mb-5">
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-3">Status wijzigen</p>
            <div className="flex flex-wrap gap-2">
              {COLUMNS.map((col) => {
                const isActive = workOrder.status === col.status;
                return (
                  <button
                    key={col.status}
                    onClick={() => !isActive && onStatusChange(col.status)}
                    disabled={isActive || isUpdating}
                    className={cn(
                      "px-4 py-2.5 rounded-lg text-sm font-semibold border transition-all",
                      isActive
                        ? cn(col.color, "text-white border-transparent")
                        : "bg-slate-800 text-gray-400 border-slate-700 hover:border-slate-600",
                      isUpdating && !isActive && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {col.label}
                  </button>
                );
              })}
            </div>
          </div>

          {isUpdating ? (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              <span className="text-gray-400 text-sm">Bijwerken...</span>
            </div>
          ) : null}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
