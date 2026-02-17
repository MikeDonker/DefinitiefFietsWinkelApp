// =============================================================================
// Frontend Types
// Source of truth for status enums: backend/src/types.ts (Zod schemas)
// These types are manually synced with the backend. If you change status values
// in the backend, update them here as well.
// =============================================================================

// ---- Status & Enum Types (synced with backend/src/types.ts) ----

export type BikeStatus = "IN_STOCK" | "IN_SERVICE" | "RESERVED" | "SOLD" | "SCRAPPED";
export type WorkOrderStatus = "OPEN" | "IN_PROGRESS" | "WAITING_PARTS" | "COMPLETED" | "CANCELLED";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

// ---- Reference Data ----

export interface Brand {
  id: string;
  name: string;
}

export interface BikeModel {
  id: string;
  name: string;
  brandId: string;
}

// ---- Bike ----

export interface Bike {
  id: number;
  frameNumber: string;
  brandId: string;
  modelId: string;
  year: number | null;
  color: string | null;
  size: string | null;
  purchasePrice: number | null;
  sellingPrice: number | null;
  status: BikeStatus;
  notes: string | null;
  soldAt: string | null;
  createdAt: string;
  updatedAt: string;
  brand: Brand;
  model: BikeModel;
  inventoryMovements?: InventoryMovement[];
  serviceWorkOrders?: ServiceWorkOrder[];
}

export interface InventoryMovement {
  id: number;
  bikeId: number;
  fromStatus: BikeStatus | null;
  toStatus: BikeStatus;
  reason: string | null;
  performedById: string;
  createdAt: string;
}

// ---- Work Orders ----

export interface ServiceWorkOrder {
  id: number;
  bikeId: number;
  description: string;
  status: WorkOrderStatus;
  priority: Priority;
  assignedToId: string | null;
  createdById: string;
  completedAt: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  bike?: Bike;
  assignedTo?: { id: string; name: string; email: string } | null;
  createdBy?: { id: string; name: string; email: string };
}

// ---- Dashboard ----

export interface DashboardStats {
  totalBikes: number;
  bikesInStock: number;
  bikesInService: number;
  bikesSold: number;
  totalWorkOrders: number;
  openWorkOrders: number;
  urgentWorkOrders: number;
  recentSales: Array<{
    id: number;
    frameNumber: string;
    brand: { name: string };
    model: { name: string };
    sellingPrice: number | null;
    soldAt: string;
  }>;
}

// ---- Form Data (synced with backend create/update schemas) ----

export interface CreateBikeData {
  frameNumber: string;
  brandId: string;
  modelId: string;
  year?: number;
  color?: string;
  size?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  notes?: string;
}

export interface CreateWorkOrderData {
  bikeId: number;
  description: string;
  priority: Priority;
  assignedToId?: string;
  estimatedCost?: number;
  notes?: string;
}

// ---- AI Types ----

export interface AIStatus {
  enabled: boolean;
  features: {
    smartSearch: boolean;
    photoRecognition: boolean;
    invoiceParser: boolean;
    signals: boolean;
  };
}

export interface SmartSearchResponse {
  bikes: Bike[];
  filters: Record<string, unknown>;
  explanation: string;
  total: number;
}

export interface PhotoRecognitionResult {
  brand?: string;
  model?: string;
  color?: string;
  year?: number;
  size?: string;
  type?: string;
  confidence: number;
  notes?: string;
}

export interface InvoiceItem {
  description: string;
  frameNumber?: string;
  brand?: string;
  model?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoiceParseResult {
  items: InvoiceItem[];
  supplier?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  totalAmount?: number;
  notes?: string;
}

export interface AISignal {
  type: "duplicate_frame" | "price_outlier" | "negative_stock";
  severity: "warning" | "critical";
  message: string;
  details: Record<string, unknown>;
}

// ---- User & Session ----

export interface User {
  id: string;
  name: string | null;
  email: string;
  role?: string;
}

export interface Session {
  user: User;
}
