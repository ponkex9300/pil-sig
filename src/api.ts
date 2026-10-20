export type Product = {
  id?: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  status: string;
  stock: number;
};

export type Lot = {
  id?: number;
  product: string;
  productCode: string;
  lot: string;
  quantity: string;
  warehouse: string;
  expiry: string;
  expiryNote: string;
  quality: string;
};

export type Movement = {
  id?: number;
  time?: string;
  type: string;
  product: string;
  lot: string;
  quantity: string;
  origin?: string;
  destination?: string;
  responsible?: string;
};
export type PurchaseOrder = { id: number; code: string; supplier: string; item: string; expected_date: string; quantity: number; unit: string; status: string };
export type ProductionOrder = { id: number; code: string; product: string; product_id: number; planned_quantity: number; line: string; schedule: string; status: string };
export type Inspection = { id: number; lot: string; product: string; test: string; sample: string; status: string; notes: string };
export type Dispatch = { id: number; code: string; client: string; route: string; lot: string; product: string; quantity: number; scheduled_at: string; status: string };

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error || "No se pudo completar la solicitud.");
  return body;
}

export const api = {
  products: () => request<Product[]>("/api/products"),
  lots: () => request<Lot[]>("/api/lots"),
  movements: () => request<Movement[]>("/api/movements"),
  createProduct: (product: Omit<Product, "id" | "stock" | "status">) =>
    request<Product>("/api/products", { method: "POST", body: JSON.stringify(product) }),
  createMovement: (movement: { type: string; lotCode: string; quantity: number; origin: string; destination: string; responsible: string }) =>
    request<{ id: number }>("/api/movements", { method: "POST", body: JSON.stringify(movement) }),
  settings: () => request<Record<string, boolean>>("/api/settings"),
  updateSettings: (settings: Record<string, boolean>) =>
    request<Record<string, boolean>>("/api/settings", { method: "PUT", body: JSON.stringify(settings) }),
  purchaseOrders: () => request<PurchaseOrder[]>("/api/purchase-orders"),
  createPurchaseOrder: (value: { supplier: string; item: string; expectedDate: string; quantity: number; unit: string }) =>
    request<PurchaseOrder>("/api/purchase-orders", { method: "POST", body: JSON.stringify(value) }),
  receive: (value: { purchaseOrderId: number; quantity: number; document: string; warehouse: string }) =>
    request<{ id: number }>("/api/receipts", { method: "POST", body: JSON.stringify(value) }),
  productionOrders: () => request<ProductionOrder[]>("/api/production-orders"),
  createProductionOrder: (value: { productCode: string; quantity: number; line: string; schedule: string }) =>
    request<ProductionOrder>("/api/production-orders", { method: "POST", body: JSON.stringify(value) }),
  updateProduction: (id: number, status: string) =>
    request<{ ok: boolean }>(`/api/production-orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  inspections: () => request<Inspection[]>("/api/quality-inspections"),
  createInspection: (value: { lotCode: string; test: string; sample: string; notes: string }) =>
    request<{ id: number }>("/api/quality-inspections", { method: "POST", body: JSON.stringify(value) }),
  updateInspection: (id: number, status: string) =>
    request<{ ok: boolean }>(`/api/quality-inspections/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  dispatches: () => request<Dispatch[]>("/api/dispatches"),
  createDispatch: (value: { client: string; route: string; lotCode: string; quantity: number; scheduledAt: string }) =>
    request<{ id: number }>("/api/dispatches", { method: "POST", body: JSON.stringify(value) }),
  updateDispatch: (id: number) =>
    request<{ ok: boolean }>(`/api/dispatches/${id}`, { method: "PATCH", body: JSON.stringify({ status: "Despachado" }) }),
};
