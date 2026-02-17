import { cn } from "@/lib/utils";
import { WorkOrderCard, WorkOrderCardSkeleton } from "@/components/WorkOrderCard";
import type { ServiceWorkOrder, WorkOrderStatus } from "@/lib/types";

export interface KanbanColumnProps {
  column: { status: WorkOrderStatus; label: string; color: string };
  workOrders: ServiceWorkOrder[];
  onCardClick: (wo: ServiceWorkOrder) => void;
  isLoading?: boolean;
}

export function KanbanColumn({ column, workOrders, onCardClick, isLoading }: KanbanColumnProps) {
  return (
    <div className="flex-1 min-w-[280px] lg:min-w-0">
      {/* Column Header */}
      <div className="flex items-center mb-3 px-1">
        <div className={cn("w-3 h-3 rounded-full mr-2", column.color)} />
        <span className="text-slate-100 text-sm font-bold flex-1">{column.label}</span>
        <span
          className={cn(
            "text-xs font-bold px-2 py-0.5 rounded-full",
            column.color,
            "bg-opacity-20 text-white"
          )}
          style={{ backgroundColor: `var(--tw-${column.color}-500, #3b82f6)20` }}
        >
          {workOrders.length}
        </span>
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {isLoading ? (
          <>
            <WorkOrderCardSkeleton />
            <WorkOrderCardSkeleton />
          </>
        ) : workOrders.length > 0 ? (
          workOrders.map((wo) => (
            <WorkOrderCard
              key={wo.id}
              workOrder={wo}
              onClick={() => onCardClick(wo)}
            />
          ))
        ) : (
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 border-dashed flex items-center justify-center">
            <span className="text-slate-600 text-sm">Geen items</span>
          </div>
        )}
      </div>
    </div>
  );
}
