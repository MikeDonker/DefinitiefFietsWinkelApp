import { prisma } from "../prisma";
import { broadcast } from "../websocket";
import {
  VALID_BIKE_STATUSES,
  type BikeStatus,
  type CreateBikeInput,
  type UpdateBikeInput,
  type ListBikesParams,
} from "../types";

// =============================================================================
// Helpers
// =============================================================================

/** Round price to 2 decimal places to avoid float drift. Returns null for null/undefined. */
function normalizePrice(value: number | null | undefined): number | null {
  if (value == null) return null;
  return Math.round(value * 100) / 100;
}

// =============================================================================
// Service Error
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
// List Bikes
// =============================================================================

export async function listBikes(params: ListBikesParams) {
  const { status, search, page, limit } = params;

  const where: Record<string, unknown> = {};

  if (status && VALID_BIKE_STATUSES.includes(status as BikeStatus)) {
    where.status = status;
  }

  if (search) {
    where.frameNumber = { contains: search };
  }

  const [bikes, total] = await Promise.all([
    prisma.bike.findMany({
      where,
      include: { brand: true, model: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.bike.count({ where }),
  ]);

  return { bikes, total };
}

// =============================================================================
// Get Bike
// =============================================================================

export async function getBike(id: number) {
  const bike = await prisma.bike.findUnique({
    where: { id },
    include: {
      brand: true,
      model: true,
      inventoryMovements: {
        orderBy: { createdAt: "desc" },
      },
      serviceWorkOrders: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!bike) {
    throw new ServiceError("Bike not found", "NOT_FOUND", 404);
  }

  return bike;
}

// =============================================================================
// Create Bike
// =============================================================================

export async function createBike(data: CreateBikeInput, userId: string) {
  // Check uniqueness of frame number
  const existing = await prisma.bike.findUnique({
    where: { frameNumber: data.frameNumber },
  });

  if (existing) {
    throw new ServiceError(
      "A bike with this frame number already exists",
      "DUPLICATE_FRAME_NUMBER",
      409
    );
  }

  const bike = await prisma.$transaction(async (tx) => {
    const newBike = await tx.bike.create({
      data: {
        frameNumber: data.frameNumber,
        brandId: data.brandId,
        modelId: data.modelId,
        year: data.year,
        color: data.color,
        size: data.size,
        purchasePrice: normalizePrice(data.purchasePrice),
        sellingPrice: normalizePrice(data.sellingPrice),
        notes: data.notes,
        status: "IN_STOCK",
      },
      include: { brand: true, model: true },
    });

    await tx.inventoryMovement.create({
      data: {
        bikeId: newBike.id,
        fromStatus: null,
        toStatus: "IN_STOCK",
        reason: "Nieuwe fiets toegevoegd",
        performedById: userId,
      },
    });

    return newBike;
  });

  broadcast("bike:created", bike);

  return bike;
}

// =============================================================================
// Update Bike
// =============================================================================

export async function updateBike(
  id: number,
  data: UpdateBikeInput,
  userId: string
) {
  const existingBike = await prisma.bike.findUnique({ where: { id } });

  if (!existingBike) {
    throw new ServiceError("Bike not found", "NOT_FOUND", 404);
  }

  // Business rule: cannot sell a bike that is IN_SERVICE
  if (data.status === "SOLD" && existingBike.status === "IN_SERVICE") {
    throw new ServiceError(
      "Cannot sell a bike that is currently in service",
      "INVALID_STATUS_TRANSITION",
      422
    );
  }

  const updatedBike = await prisma.$transaction(async (tx) => {
    const updateData: Record<string, unknown> = {};

    if (data.color !== undefined) updateData.color = data.color;
    if (data.size !== undefined) updateData.size = data.size;
    if (data.purchasePrice !== undefined)
      updateData.purchasePrice = normalizePrice(data.purchasePrice);
    if (data.sellingPrice !== undefined)
      updateData.sellingPrice = normalizePrice(data.sellingPrice);
    if (data.notes !== undefined) updateData.notes = data.notes;

    if (data.status && data.status !== existingBike.status) {
      updateData.status = data.status;

      if (data.status === "SOLD") {
        updateData.soldAt = new Date();
      }

      await tx.inventoryMovement.create({
        data: {
          bikeId: id,
          fromStatus: existingBike.status,
          toStatus: data.status,
          reason: `Status gewijzigd van ${existingBike.status} naar ${data.status}`,
          performedById: userId,
        },
      });
    }

    return tx.bike.update({
      where: { id },
      data: updateData,
      include: { brand: true, model: true },
    });
  });

  broadcast("bike:updated", updatedBike);

  return updatedBike;
}

// =============================================================================
// Checkout Bike (sell)
// =============================================================================

export async function checkoutBike(id: number, userId: string) {
  const bike = await prisma.bike.findUnique({ where: { id } });

  if (!bike) {
    throw new ServiceError("Bike not found", "NOT_FOUND", 404);
  }

  // Business rule: only IN_STOCK or RESERVED bikes can be checked out
  if (bike.status !== "IN_STOCK" && bike.status !== "RESERVED") {
    throw new ServiceError(
      `Cannot checkout a bike with status ${bike.status}. Only IN_STOCK or RESERVED bikes can be sold.`,
      "INVALID_STATUS_TRANSITION",
      422
    );
  }

  const updatedBike = await prisma.$transaction(async (tx) => {
    await tx.inventoryMovement.create({
      data: {
        bikeId: id,
        fromStatus: bike.status,
        toStatus: "SOLD",
        reason: "Fiets verkocht",
        performedById: userId,
      },
    });

    return tx.bike.update({
      where: { id },
      data: {
        status: "SOLD",
        soldAt: new Date(),
      },
      include: { brand: true, model: true },
    });
  });

  broadcast("bike:checkout", updatedBike);

  return updatedBike;
}

// =============================================================================
// List Brands
// =============================================================================

export async function listBrands() {
  return prisma.brand.findMany({
    orderBy: { name: "asc" },
  });
}

// =============================================================================
// List Models
// =============================================================================

export async function listModels(brandId?: string) {
  const where: Record<string, unknown> = {};
  if (brandId) {
    where.brandId = brandId;
  }

  return prisma.model.findMany({
    where,
    include: { brand: true },
    orderBy: { name: "asc" },
  });
}
