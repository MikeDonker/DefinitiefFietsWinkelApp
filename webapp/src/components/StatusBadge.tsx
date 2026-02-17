import { cn } from "@/lib/utils";
import type { BikeStatus, WorkOrderStatus, Priority } from "@/lib/types";

// Status labels in Dutch
export const BIKE_STATUS_LABELS: Record<BikeStatus, string> = {
  IN_STOCK: "Op Voorraad",
  IN_SERVICE: "In Service",
  RESERVED: "Gereserveerd",
  SOLD: "Verkocht",
  SCRAPPED: "Afgevoerd",
};

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Behandeling",
  WAITING_PARTS: "Wacht op Onderdelen",
  COMPLETED: "Voltooid",
  CANCELLED: "Geannuleerd",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Laag",
  MEDIUM: "Normaal",
  HIGH: "Hoog",
  URGENT: "Urgent",
};

// Status colors
const bikeStatusStyles: Record<BikeStatus, string> = {
  IN_STOCK: "bg-green-500/20 text-green-400 border-green-500/40",
  IN_SERVICE: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  RESERVED: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  SOLD: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  SCRAPPED: "bg-gray-500/20 text-gray-400 border-gray-500/40",
};

const workOrderStatusStyles: Record<WorkOrderStatus, string> = {
  OPEN: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  IN_PROGRESS: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  WAITING_PARTS: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  COMPLETED: "bg-green-500/20 text-green-400 border-green-500/40",
  CANCELLED: "bg-gray-500/20 text-gray-400 border-gray-500/40",
};

const priorityStyles: Record<Priority, string> = {
  LOW: "bg-gray-500/20 text-gray-400 border-gray-500/40",
  MEDIUM: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  URGENT: "bg-red-500/20 text-red-400 border-red-500/40",
};

interface BikeStatusBadgeProps {
  status: BikeStatus;
  className?: string;
}

export function BikeStatusBadge({ status, className }: BikeStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold",
        bikeStatusStyles[status],
        className
      )}
    >
      {BIKE_STATUS_LABELS[status]}
    </span>
  );
}

interface WorkOrderStatusBadgeProps {
  status: WorkOrderStatus;
  className?: string;
}

export function WorkOrderStatusBadge({ status, className }: WorkOrderStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold",
        workOrderStatusStyles[status],
        className
      )}
    >
      {WORK_ORDER_STATUS_LABELS[status]}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold",
        priorityStyles[priority],
        className
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
