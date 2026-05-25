import { supabase } from "@/integrations/supabase/client";

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "razorpay" | "cod" | string;

type DbError = { message: string };
type DbResult<T> = { data: T | null; error: DbError | null };
type QueryBuilder<T> = PromiseLike<DbResult<T>> & {
  select: (columns?: string) => QueryBuilder<T>;
  eq: (column: string, value: unknown) => QueryBuilder<T>;
  in: (column: string, values: readonly unknown[]) => QueryBuilder<T>;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder<T>;
  maybeSingle: () => QueryBuilder<T>;
  insert: (values: unknown) => QueryBuilder<T>;
  update: (values: unknown) => QueryBuilder<T>;
};
type UntypedSupabase = {
  from: <T = unknown>(table: string) => QueryBuilder<T>;
};

const db = supabase as unknown as UntypedSupabase;

export interface AdminOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_size: string;
  variant_color: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface AdminPayment {
  id: string;
  order_id: string;
  user_id: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  amount: number;
  currency: string;
  status: string;
  gateway: string | null;
  raw_payload: unknown;
  created_at: string;
  updated_at: string | null;
}

export interface AdminShipment {
  id: string;
  order_id: string;
  provider: string | null;
  shipment_id: string | null;
  awb_code: string | null;
  courier_name: string | null;
  tracking_url: string | null;
  status: string | null;
  estimated_delivery: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  raw_payload: unknown;
  created_at: string;
  updated_at: string | null;
}

export interface AdminOrderHistory {
  id: string;
  order_id: string;
  old_status: OrderStatus | string | null;
  new_status: OrderStatus | string;
  changed_by: string | null;
  changed_by_type: string | null;
  note: string | null;
  created_at: string;
}

interface AdminOrderRow {
  id: string;
  user_id: string | null;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  shipping_cost: number | null;
  tax_amount: number | null;
  discount_amount: number | null;
  total_amount: number;
  shipping_address_id: string | null;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  payment_method: PaymentMethod | null;
  razorpay_order_id: string | null;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

export interface AdminOrder extends AdminOrderRow {
  items: AdminOrderItem[];
  payments: AdminPayment[];
  shipments: AdminShipment[];
  history: AdminOrderHistory[];
  payment: AdminPayment | null;
  shipment: AdminShipment | null;
  item_count: number;
  total_quantity: number;
}

export interface ShipmentFormData {
  provider?: string;
  courier_name: string;
  awb_code: string;
  tracking_url?: string;
  estimated_delivery?: string;
}

function groupByOrderId<T extends { order_id: string }>(rows: T[]) {
  return rows.reduce<Record<string, T[]>>((acc, row) => {
    acc[row.order_id] = acc[row.order_id] || [];
    acc[row.order_id].push(row);
    return acc;
  }, {});
}

function latestByDate<T extends { created_at?: string | null; updated_at?: string | null }>(rows: T[]) {
  return [...rows].sort((a, b) => {
    const first = new Date(a.updated_at || a.created_at || 0).getTime();
    const second = new Date(b.updated_at || b.created_at || 0).getTime();
    return second - first;
  })[0] || null;
}

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw new Error(error.message);
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function isCurrentUserAdmin() {
  const user = await getCurrentUser();

  const { data, error } = await db
    .from<{ id: string }>("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (error) throw new Error(error.message || "Access denied");
  return Boolean(data);
}

async function requireAdmin() {
  const user = await getCurrentUser();

  const { data, error } = await db
    .from<{ id: string }>("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (error) throw new Error(error.message || "Access denied");
  if (!data) throw new Error("Access denied");

  return user;
}

async function fetchOrderForUpdate(orderId: string) {
  const { data, error } = await db
    .from<AdminOrderRow>("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw new Error(error.message || "Failed to load order");
  if (!data) throw new Error("Order not found");
  return data;
}

async function insertHistory(
  orderId: string,
  oldStatus: OrderStatus | string | null,
  newStatus: OrderStatus | string,
  changedBy: string,
  note: string,
) {
  const { error } = await db.from("order_status_history").insert({
    order_id: orderId,
    old_status: oldStatus,
    new_status: newStatus,
    changed_by: changedBy,
    changed_by_type: "admin",
    note,
  });

  if (error) throw new Error(error.message || "Failed to write order history");
}

async function saveShipment(orderId: string, shipmentData: ShipmentFormData, status: string, shippedAt?: string) {
  const payload = {
    order_id: orderId,
    provider: shipmentData.provider?.trim() || "manual",
    courier_name: shipmentData.courier_name.trim(),
    awb_code: shipmentData.awb_code.trim(),
    tracking_url: shipmentData.tracking_url?.trim() || null,
    estimated_delivery: shipmentData.estimated_delivery || null,
    status,
    shipped_at: shippedAt,
    updated_at: new Date().toISOString(),
  };

  const { data: existingRows, error: fetchError } = await db
    .from<AdminShipment[]>("shipments")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  if (fetchError) throw new Error(fetchError.message || "Failed to load shipment");

  const existing = existingRows?.[0];

  if (existing) {
    const { error } = await db.from("shipments").update(payload).eq("id", existing.id);
    if (error) throw new Error(error.message || "Failed to update shipment");
    return;
  }

  const { error } = await db.from("shipments").insert(payload);
  if (error) throw new Error(error.message || "Failed to create shipment");
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  await requireAdmin();

  const { data: orders, error: ordersError } = await db
    .from<AdminOrderRow[]>("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (ordersError) throw new Error(ordersError.message || "Failed to load admin orders");

  const orderRows = orders || [];
  const orderIds = orderRows.map((order) => order.id);

  if (orderIds.length === 0) return [];

  const [
    { data: items, error: itemsError },
    { data: payments, error: paymentsError },
    { data: shipments, error: shipmentsError },
    { data: history, error: historyError },
  ] = await Promise.all([
    db.from<AdminOrderItem[]>("order_items").select("*").in("order_id", orderIds),
    db.from<AdminPayment[]>("payments").select("*").in("order_id", orderIds),
    db.from<AdminShipment[]>("shipments").select("*").in("order_id", orderIds),
    db.from<AdminOrderHistory[]>("order_status_history").select("*").in("order_id", orderIds),
  ]);

  if (itemsError) throw new Error(itemsError.message || "Failed to load order items");
  if (paymentsError) throw new Error(paymentsError.message || "Failed to load payments");
  if (shipmentsError) throw new Error(shipmentsError.message || "Failed to load shipments");
  if (historyError) throw new Error(historyError.message || "Failed to load order history");

  const itemsByOrder = groupByOrderId(items || []);
  const paymentsByOrder = groupByOrderId(payments || []);
  const shipmentsByOrder = groupByOrderId(shipments || []);
  const historyByOrder = groupByOrderId(history || []);

  return orderRows.map((order) => {
    const orderItems = itemsByOrder[order.id] || [];
    const orderPayments = paymentsByOrder[order.id] || [];
    const orderShipments = shipmentsByOrder[order.id] || [];
    const orderHistory = [...(historyByOrder[order.id] || [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return {
      ...order,
      items: orderItems,
      payments: orderPayments,
      shipments: orderShipments,
      history: orderHistory,
      payment: latestByDate(orderPayments),
      shipment: latestByDate(orderShipments),
      item_count: orderItems.length,
      total_quantity: orderItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    };
  });
}

export async function confirmCODOrder(orderId: string) {
  const user = await requireAdmin();
  const order = await fetchOrderForUpdate(orderId);

  if (order.status !== "pending" || order.payment_method !== "cod") {
    throw new Error("Only pending COD orders can be confirmed");
  }

  const now = new Date().toISOString();
  const { error } = await db
    .from("orders")
    .update({
      status: "confirmed",
      confirmed_at: now,
      updated_at: now,
    })
    .eq("id", orderId);

  if (error) throw new Error(error.message || "Failed to confirm COD order");

  await insertHistory(orderId, order.status, "confirmed", user.id, "COD order confirmed by admin");
}

export async function startProcessingOrder(orderId: string) {
  const user = await requireAdmin();
  const order = await fetchOrderForUpdate(orderId);

  if (order.status !== "confirmed") {
    throw new Error("Only confirmed orders can be moved to processing");
  }

  const { error } = await db
    .from("orders")
    .update({
      status: "processing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) throw new Error(error.message || "Failed to move order to processing");

  await insertHistory(orderId, order.status, "processing", user.id, "Order moved to processing");
}

export async function markOrderShipped(orderId: string, shipmentData: ShipmentFormData) {
  const user = await requireAdmin();
  const order = await fetchOrderForUpdate(orderId);

  if (order.status !== "processing" && order.status !== "confirmed") {
    throw new Error("Only confirmed or processing orders can be marked shipped");
  }

  if (!shipmentData.courier_name.trim() || !shipmentData.awb_code.trim()) {
    throw new Error("Courier name and AWB code are required");
  }

  const now = new Date().toISOString();

  await saveShipment(orderId, shipmentData, "in_transit", now);

  const { error } = await db
    .from("orders")
    .update({
      status: "shipped",
      shipped_at: now,
      updated_at: now,
    })
    .eq("id", orderId);

  if (error) throw new Error(error.message || "Failed to mark order shipped");

  await insertHistory(orderId, order.status, "shipped", user.id, "Order marked shipped by admin");
}

export async function markOrderDelivered(orderId: string) {
  const user = await requireAdmin();
  const order = await fetchOrderForUpdate(orderId);

  if (order.status !== "shipped") {
    throw new Error("Only shipped orders can be marked delivered");
  }

  const now = new Date().toISOString();

  const { error: orderError } = await db
    .from("orders")
    .update({
      status: "delivered",
      delivered_at: now,
      updated_at: now,
    })
    .eq("id", orderId);

  if (orderError) throw new Error(orderError.message || "Failed to mark order delivered");

  const { error: shipmentError } = await db
    .from("shipments")
    .update({
      status: "delivered",
      delivered_at: now,
      updated_at: now,
    })
    .eq("order_id", orderId);

  if (shipmentError) throw new Error(shipmentError.message || "Failed to update shipment");

  await insertHistory(orderId, order.status, "delivered", user.id, "Order marked delivered by admin");
}

export async function cancelOrder(orderId: string, note?: string) {
  const user = await requireAdmin();
  const order = await fetchOrderForUpdate(orderId);

  if (!["pending", "confirmed", "processing"].includes(order.status)) {
    throw new Error("Only pending, confirmed, or processing orders can be cancelled");
  }

  const { error } = await db
    .from("orders")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) throw new Error(error.message || "Failed to cancel order");

  await insertHistory(orderId, order.status, "cancelled", user.id, note || "Order cancelled by admin");
}

export async function updateTracking(orderId: string, shipmentData: ShipmentFormData) {
  const user = await requireAdmin();
  const order = await fetchOrderForUpdate(orderId);

  if (order.status !== "shipped") {
    throw new Error("Only shipped orders can have tracking updated");
  }

  if (!shipmentData.courier_name.trim() || !shipmentData.awb_code.trim()) {
    throw new Error("Courier name and AWB code are required");
  }

  await saveShipment(orderId, shipmentData, "in_transit", order.shipped_at || undefined);
  await insertHistory(orderId, "shipped", "shipped", user.id, "Tracking details updated by admin");
}
