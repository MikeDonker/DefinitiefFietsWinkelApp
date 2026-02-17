import { prisma } from "../prisma";

// =============================================================================
// CSV Utility Functions
// =============================================================================

/**
 * Escapes a value for CSV format.
 * Wraps in quotes if contains comma, quote, or newline.
 * Escapes internal quotes by doubling them.
 */
function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // Check if escaping is needed
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    // Escape quotes by doubling them and wrap in quotes
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Formats a date for CSV export (ISO 8601 format).
 */
function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString();
}

// =============================================================================
// Export Bikes CSV
// =============================================================================

export async function exportBikesCSV(): Promise<string> {
  const bikes = await prisma.bike.findMany({
    include: { brand: true, model: true },
    orderBy: { createdAt: "desc" },
  });

  // CSV header
  const header = [
    "ID",
    "Frame Number",
    "Brand",
    "Model",
    "Year",
    "Color",
    "Size",
    "Purchase Price",
    "Selling Price",
    "Status",
    "Sold At",
    "Created At",
  ].join(",");

  // CSV rows
  const rows = bikes.map((bike) =>
    [
      escapeCSV(bike.id),
      escapeCSV(bike.frameNumber),
      escapeCSV(bike.brand.name),
      escapeCSV(bike.model.name),
      escapeCSV(bike.year),
      escapeCSV(bike.color),
      escapeCSV(bike.size),
      escapeCSV(bike.purchasePrice),
      escapeCSV(bike.sellingPrice),
      escapeCSV(bike.status),
      escapeCSV(formatDate(bike.soldAt)),
      escapeCSV(formatDate(bike.createdAt)),
    ].join(",")
  );

  return [header, ...rows].join("\n");
}

// =============================================================================
// Export Work Orders CSV
// =============================================================================

export async function exportWorkOrdersCSV(): Promise<string> {
  const workOrders = await prisma.serviceWorkOrder.findMany({
    include: {
      bike: true,
      assignedTo: true,
      createdBy: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // CSV header
  const header = [
    "ID",
    "Bike Frame Number",
    "Description",
    "Status",
    "Priority",
    "Assigned To",
    "Created By",
    "Estimated Cost",
    "Actual Cost",
    "Created At",
    "Completed At",
  ].join(",");

  // CSV rows
  const rows = workOrders.map((wo) =>
    [
      escapeCSV(wo.id),
      escapeCSV(wo.bike.frameNumber),
      escapeCSV(wo.description),
      escapeCSV(wo.status),
      escapeCSV(wo.priority),
      escapeCSV(wo.assignedTo?.name),
      escapeCSV(wo.createdBy.name),
      escapeCSV(wo.estimatedCost),
      escapeCSV(wo.actualCost),
      escapeCSV(formatDate(wo.createdAt)),
      escapeCSV(formatDate(wo.completedAt)),
    ].join(",")
  );

  return [header, ...rows].join("\n");
}
