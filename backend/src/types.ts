import { z } from "zod";

// =============================================================================
// Bike Status
// =============================================================================

export const bikeStatusEnum = z.enum([
  "IN_STOCK",
  "IN_SERVICE",
  "RESERVED",
  "SOLD",
  "SCRAPPED",
]);

export type BikeStatus = z.infer<typeof bikeStatusEnum>;

export const VALID_BIKE_STATUSES: BikeStatus[] = bikeStatusEnum.options as unknown as BikeStatus[];

// =============================================================================
// Work Order Status
// =============================================================================

export const workOrderStatusEnum = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "WAITING_PARTS",
  "COMPLETED",
  "CANCELLED",
]);

export type WorkOrderStatus = z.infer<typeof workOrderStatusEnum>;

export const VALID_WORK_ORDER_STATUSES: WorkOrderStatus[] = workOrderStatusEnum.options as unknown as WorkOrderStatus[];

// =============================================================================
// Priority
// =============================================================================

export const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export type Priority = z.infer<typeof priorityEnum>;

export const VALID_PRIORITIES: Priority[] = priorityEnum.options as unknown as Priority[];

// =============================================================================
// Roles
// =============================================================================

export type RoleName = "admin" | "manager" | "medewerker" | "readonly";

export const VALID_ROLES: RoleName[] = [
  "admin",
  "manager",
  "medewerker",
  "readonly",
];

// =============================================================================
// Bike Schemas
// =============================================================================

export const listBikesSchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createBikeSchema = z.object({
  frameNumber: z.string().min(1),
  brandId: z.string().min(1),
  modelId: z.string().min(1),
  year: z.number().int().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  purchasePrice: z.number().min(0, "Prijs mag niet negatief zijn").optional(),
  sellingPrice: z.number().min(0, "Prijs mag niet negatief zijn").optional(),
  notes: z.string().optional(),
});

export const updateBikeSchema = z.object({
  color: z.string().optional(),
  size: z.string().optional(),
  purchasePrice: z.number().min(0, "Prijs mag niet negatief zijn").optional(),
  sellingPrice: z.number().min(0, "Prijs mag niet negatief zijn").optional(),
  notes: z.string().optional(),
  status: bikeStatusEnum.optional(),
});

export const modelsQuerySchema = z.object({
  brandId: z.string().optional(),
});

export type CreateBikeInput = z.infer<typeof createBikeSchema>;
export type UpdateBikeInput = z.infer<typeof updateBikeSchema>;
export type ListBikesParams = z.infer<typeof listBikesSchema>;

// =============================================================================
// Work Order Schemas
// =============================================================================

export const listWorkOrdersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(50),
  status: z.string().optional(),
});

export const createWorkOrderSchema = z.object({
  bikeId: z.number().int(),
  description: z.string().min(1),
  priority: priorityEnum.optional(),
  assignedToId: z.string().optional(),
  estimatedCost: z.number().optional(),
  notes: z.string().optional(),
});

export const updateWorkOrderSchema = z.object({
  description: z.string().min(1).optional(),
  status: workOrderStatusEnum.optional(),
  priority: priorityEnum.optional(),
  assignedToId: z.string().nullable().optional(),
  actualCost: z.number().optional(),
  notes: z.string().optional(),
});

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export type UpdateWorkOrderInput = z.infer<typeof updateWorkOrderSchema>;
export type ListWorkOrdersParams = z.infer<typeof listWorkOrdersSchema>;
