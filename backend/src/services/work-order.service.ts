import { prisma } from "../prisma";
import { broadcast } from "../websocket";
import type {
  CreateWorkOrderInput,
  UpdateWorkOrderInput,
  ListWorkOrdersParams,
} from "../types";

// =============================================================================
// Service Error (reuse same pattern)
// =============================================================================

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

// =============================================================================
// List Work Orders
// =============================================================================

export async function listWorkOrders(params: ListWorkOrdersParams) {
  const { page, limit, status } = params;

  const where: Record<string, unknown> = {};
  if (status) {
    where.status = status;
  }

  const [workOrders, total] = await Promise.all([
    prisma.serviceWorkOrder.findMany({
      where,
      include: {
        bike: {
          include: { brand: true, model: true },
        },
        assignedTo: true,
        createdBy: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.serviceWorkOrder.count({ where }),
  ]);

  return { workOrders, total };
}

// =============================================================================
// Get Work Order
// =============================================================================

export async function getWorkOrder(id: number) {
  const workOrder = await prisma.serviceWorkOrder.findUnique({
    where: { id },
    include: {
      bike: {
        include: { brand: true, model: true },
      },
      assignedTo: true,
      createdBy: true,
    },
  });

  if (!workOrder) {
    throw new ServiceError("Work order not found", "NOT_FOUND", 404);
  }

  return workOrder;
}

// =============================================================================
// Create Work Order
// =============================================================================

export async function createWorkOrder(
  data: CreateWorkOrderInput,
  userId: string
) {
  const bike = await prisma.bike.findUnique({
    where: { id: data.bikeId },
  });

  if (!bike) {
    throw new ServiceError("Bike not found", "NOT_FOUND", 404);
  }

  const workOrder = await prisma.$transaction(async (tx) => {
    // If bike is IN_STOCK, move it to IN_SERVICE
    if (bike.status === "IN_STOCK") {
      await tx.bike.update({
        where: { id: bike.id },
        data: { status: "IN_SERVICE" },
      });

      await tx.inventoryMovement.create({
        data: {
          bikeId: bike.id,
          fromStatus: "IN_STOCK",
          toStatus: "IN_SERVICE",
          reason: "Werkorder aangemaakt",
          performedById: userId,
        },
      });
    }

    return tx.serviceWorkOrder.create({
      data: {
        bikeId: data.bikeId,
        description: data.description,
        priority: data.priority ?? "MEDIUM",
        assignedToId: data.assignedToId,
        createdById: userId,
        estimatedCost: data.estimatedCost,
        notes: data.notes,
      },
      include: {
        bike: {
          include: { brand: true, model: true },
        },
        assignedTo: true,
        createdBy: true,
      },
    });
  });

  broadcast("workorder:created", workOrder);

  return workOrder;
}

// =============================================================================
// Update Work Order
// =============================================================================

export async function updateWorkOrder(
  id: number,
  data: UpdateWorkOrderInput,
  userId: string
) {
  const existingOrder = await prisma.serviceWorkOrder.findUnique({
    where: { id },
    include: { bike: true },
  });

  if (!existingOrder) {
    throw new ServiceError("Work order not found", "NOT_FOUND", 404);
  }

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const updateData: Record<string, unknown> = {};

    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.assignedToId !== undefined)
      updateData.assignedToId = data.assignedToId;
    if (data.actualCost !== undefined) updateData.actualCost = data.actualCost;
    if (data.notes !== undefined) updateData.notes = data.notes;

    if (data.status !== undefined) {
      updateData.status = data.status;

      if (data.status === "COMPLETED") {
        updateData.completedAt = new Date();

        // If bike is IN_SERVICE, move it back to IN_STOCK
        if (existingOrder.bike.status === "IN_SERVICE") {
          await tx.bike.update({
            where: { id: existingOrder.bikeId },
            data: { status: "IN_STOCK" },
          });

          await tx.inventoryMovement.create({
            data: {
              bikeId: existingOrder.bikeId,
              fromStatus: "IN_SERVICE",
              toStatus: "IN_STOCK",
              reason: "Werkorder afgerond",
              performedById: userId,
            },
          });
        }
      }
    }

    return tx.serviceWorkOrder.update({
      where: { id },
      data: updateData,
      include: {
        bike: {
          include: { brand: true, model: true },
        },
        assignedTo: true,
        createdBy: true,
      },
    });
  });

  broadcast("workorder:updated", updatedOrder);

  return updatedOrder;
}
