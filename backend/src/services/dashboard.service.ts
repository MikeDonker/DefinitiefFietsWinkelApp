import { prisma } from "../prisma";

// =============================================================================
// Get Dashboard Stats
// =============================================================================

export async function getDashboardStats() {
  // Run all queries in parallel for performance
  const [
    totalBikes,
    bikesInStock,
    bikesInService,
    bikesSold,
    totalWorkOrders,
    openWorkOrders,
    urgentWorkOrders,
    recentSales,
  ] = await Promise.all([
    // Total bikes count
    prisma.bike.count(),

    // Bikes in stock
    prisma.bike.count({
      where: { status: "IN_STOCK" },
    }),

    // Bikes in service
    prisma.bike.count({
      where: { status: "IN_SERVICE" },
    }),

    // Bikes sold
    prisma.bike.count({
      where: { status: "SOLD" },
    }),

    // Total work orders
    prisma.serviceWorkOrder.count(),

    // Open work orders (OPEN or IN_PROGRESS or WAITING_PARTS)
    prisma.serviceWorkOrder.count({
      where: {
        status: {
          in: ["OPEN", "IN_PROGRESS", "WAITING_PARTS"],
        },
      },
    }),

    // Urgent work orders (priority URGENT and not completed/cancelled)
    prisma.serviceWorkOrder.count({
      where: {
        priority: "URGENT",
        status: {
          notIn: ["COMPLETED", "CANCELLED"],
        },
      },
    }),

    // Recent sales (last 5 sold bikes)
    prisma.bike.findMany({
      where: { status: "SOLD" },
      include: { brand: true, model: true },
      orderBy: { soldAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    totalBikes,
    bikesInStock,
    bikesInService,
    bikesSold,
    totalWorkOrders,
    openWorkOrders,
    urgentWorkOrders,
    recentSales: recentSales.map((bike) => ({
      id: bike.id,
      frameNumber: bike.frameNumber,
      brand: bike.brand.name,
      model: bike.model.name,
      year: bike.year,
      color: bike.color,
      size: bike.size,
      sellingPrice: bike.sellingPrice,
      soldAt: bike.soldAt,
    })),
  };
}
