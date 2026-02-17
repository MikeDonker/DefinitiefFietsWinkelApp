import { cn } from "@/lib/utils";
import { User, Calendar, AlertTriangle } from "lucide-react";
import { PriorityBadge, PRIORITY_LABELS } from "@/components/StatusBadge";
import type { ServiceWorkOrder, WorkOrderStatus } from "@/lib/types";

interface WorkOrderCardProps {
  workOrder: ServiceWorkOrder;
  onClick?: () => void;
  columnColor?: string;
  className?: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("nl-NL", { day: "2-digit", month: "short" });
}

const columnColors: Record<WorkOrderStatus, string> = {
  OPEN: "border-l-blue-500",
  IN_PROGRESS: "border-l-orange-500",
  WAITING_PARTS: "border-l-yellow-500",
  COMPLETED: "border-l-green-500",
  CANCELLED: "border-l-gray-500",
};

export function WorkOrderCard({
  workOrder,
  onClick,
  className,
}: WorkOrderCardProps) {
  const bikeName = workOrder.bike
    ? `${workOrder.bike.brand?.name ?? ""} ${workOrder.bike.model?.name ?? ""}`.trim()
    : `Fiets #${workOrder.bikeId}`;

  const isHighPriority = workOrder.priority === "URGENT" || workOrder.priority === "HIGH";

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-slate-800 rounded-xl p-4 border border-slate-700 cursor-pointer",
        "border-l-[3px] transition-all duration-200",
        "hover:bg-slate-800/80 hover:border-slate-600",
        columnColors[workOrder.status],
        className
      )}
    >
      {/* Priority Badge */}
      {isHighPriority ? (
        <div className="absolute top-2 right-2">
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold",
              workOrder.priority === "URGENT"
                ? "bg-red-500/20 text-red-400"
                : "bg-orange-500/20 text-orange-400"
            )}
          >
            {workOrder.priority === "URGENT" ? (
              <AlertTriangle className="w-2.5 h-2.5" />
            ) : null}
            {PRIORITY_LABELS[workOrder.priority]}
          </div>
        </div>
      ) : null}

      {/* Bike Name */}
      <p className="text-blue-400 text-xs font-semibold mb-1 pr-16">{bikeName}</p>

      {/* Description */}
      <p className="text-slate-100 text-sm font-medium line-clamp-2">
        {workOrder.description}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-3 mt-3">
        {workOrder.assignedTo ? (
          <div className="flex items-center gap-1 text-gray-400">
            <User className="w-3 h-3" />
            <span className="text-xs truncate max-w-[80px]">
              {workOrder.assignedTo.name}
            </span>
          </div>
        ) : null}
        <div className="flex items-center gap-1 text-gray-500">
          <Calendar className="w-3 h-3" />
          <span className="text-xs">{formatDate(workOrder.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

export function WorkOrderCardSkeleton() {
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 animate-pulse">
      <div className="h-3 w-20 bg-slate-700 rounded mb-2" />
      <div className="h-4 w-full bg-slate-700 rounded mb-1" />
      <div className="h-4 w-3/4 bg-slate-700 rounded mb-3" />
      <div className="flex gap-3">
        <div className="h-3 w-16 bg-slate-700 rounded" />
        <div className="h-3 w-12 bg-slate-700 rounded" />
      </div>
    </div>
  );
}
