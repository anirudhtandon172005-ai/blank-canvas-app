import { supabase } from "@/integrations/supabase/client";

export type ReturnRequestStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "received"
  | "refund_processing"
  | "refunded"
  | "closed"
  | "cancelled";

export type PreferredResolution = "refund" | "exchange" | "store_credit" | "other";

export type RefundMethod =
  | "razorpay_dashboard"
  | "upi"
  | "bank_transfer"
  | "qr"
  | "cash"
  | "store_credit"
  | "other";

type DbError = { message: string };
type DbResult<T> = { data: T | null; error: DbError | null };
type QueryBuilder<T> = PromiseLike<DbResult<T>> & {
  select: (columns?: string, options?: unknown) => QueryBuilder<T>;
  eq: (column: string, value: unknown) => QueryBuilder<T>;
  in: (column: string, values: readonly unknown[]) => QueryBuilder<T>;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder<T>;
  limit: (count: number) => QueryBuilder<T>;
  maybeSingle: () => QueryBuilder<T>;
  single: () => QueryBuilder<T>;
  insert: (values: unknown) => QueryBuilder<T>;
  update: (values: unknown) => QueryBuilder<T>;
};
type UntypedSupabase = {
  from: <T = unknown>(table: string) => QueryBuilder<T>;
};

const db = supabase as unknown as UntypedSupabase;

interface AdminRoleRow {
  id: string;
}

export interface AdminReturnRequest {
  id: string;
  order_id: string;
  user_id: string;
  status: ReturnRequestStatus;
  reason: string;
  description: string;
  preferred_resolution: PreferredResolution;
  admin_note: string | null;
  refund_amount: number | null;
  refund_method: RefundMethod | null;
  requested_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  received_at: string | null;
  refund_processing_at: string | null;
  refunded_at: string | null;
  closed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminReturnRequestItem {
  id: string;
  return_request_id: string;
  order_item_id: string;
  quantity: number;
  reason: string | null;
  condition_note: string | null;
  created_at: string;
}

export interface AdminReturnRequestImage {
  id: string;
  return_request_id: string;
  user_id: string;
  image_url: string;
  storage_path: string;
  created_at: string;
}

export interface AdminReturnOrder {
  id: string;
  user_id: string | null;
  order_number: string;
  status: string;
  payment_status: string | null;
  payment_method: string | null;
  razorpay_order_id: string | null;
  total_amount: number;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  delivered_at: string | null;
  created_at: string;
}

export interface AdminReturnOrderItem {
  id: string;
  order_id: string;
  product_name: string;
  variant_size: string;
  variant_color: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface AdminReturnPayment {
  id: string;
  order_id: string;
  user_id: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  amount: number;
  currency: string;
  status: string;
  gateway: string | null;
  created_at: string;
}

export interface AdminReturnRequestListItem {
  id: string;
  order_id: string;
  status: ReturnRequestStatus;
  reason: string;
  preferred_resolution: PreferredResolution;
  requested_at: string | null;
  created_at: string;
  order: Pick<AdminReturnOrder, "id" | "order_number" | "shipping_name" | "shipping_phone"> | null;
  image_count: number;
}

export interface AdminReturnRequestDetail {
  request: AdminReturnRequest;
  order: AdminReturnOrder | null;
  items: AdminReturnRequestItem[];
  orderItems: AdminReturnOrderItem[];
  images: AdminReturnRequestImage[];
  payment: AdminReturnPayment | null;
}

interface GetAdminReturnRequestsParams {
  limit?: number;
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

function cleanAdminNote(note?: string) {
  const trimmed = note?.trim();
  return trimmed ? trimmed : null;
}

function withExistingAdminNote(existing: string | null, note?: string) {
  const incoming = cleanAdminNote(note);
  if (incoming) return incoming;
  return existing;
}

function isValidAmount(value: number) {
  return Number.isFinite(value) && value >= 0;
}

function isValidRefundMethod(value: string): value is RefundMethod {
  return [
    "razorpay_dashboard",
    "upi",
    "bank_transfer",
    "qr",
    "cash",
    "store_credit",
    "other",
  ].includes(value);
}

async function requireAdmin() {
  const user = await getCurrentUser();

  const { data, error } = await db
    .from<AdminRoleRow>("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (error) throw new Error(error.message || "Access denied");
  if (!data) throw new Error("Access denied");

  return user;
}

async function fetchReturnRequestForUpdate(returnRequestId: string) {
  const { data, error } = await db
    .from<AdminReturnRequest>("return_requests")
    .select("*")
    .eq("id", returnRequestId)
    .maybeSingle();

  if (error) throw new Error(error.message || "Failed to load return request");
  if (!data) throw new Error("Return request not found");
  return data;
}

async function updateReturnRequest(
  returnRequestId: string,
  values: Partial<AdminReturnRequest>,
): Promise<AdminReturnRequest> {
  const { data, error } = await db
    .from<AdminReturnRequest>("return_requests")
    .update(values)
    .eq("id", returnRequestId)
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message || "Failed to update request");
  return data;
}

export async function isCurrentUserAdmin() {
  await requireAdmin();
  return true;
}

export async function getAdminReturnRequests(
  params: GetAdminReturnRequestsParams = {},
): Promise<AdminReturnRequestListItem[]> {
  await requireAdmin();

  const limit = Math.min(Math.max(params.limit || 50, 1), 100);
  const { data: requests, error: requestsError } = await db
    .from<AdminReturnRequest[]>("return_requests")
    .select("id,order_id,status,reason,preferred_resolution,requested_at,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (requestsError) throw new Error(requestsError.message || "Failed to load return requests");

  const requestRows = requests || [];
  if (requestRows.length === 0) return [];

  const orderIds = [...new Set(requestRows.map((row) => row.order_id))];
  const requestIds = requestRows.map((row) => row.id);

  const [{ data: orders, error: ordersError }, { data: imageRows, error: imageError }] = await Promise.all([
    db
      .from<Array<Pick<AdminReturnOrder, "id" | "order_number" | "shipping_name" | "shipping_phone">>>("orders")
      .select("id,order_number,shipping_name,shipping_phone")
      .in("id", orderIds),
    db
      .from<Array<Pick<AdminReturnRequestImage, "return_request_id">>>("return_request_images")
      .select("return_request_id")
      .in("return_request_id", requestIds),
  ]);

  if (ordersError) throw new Error(ordersError.message || "Failed to load order details");
  if (imageError) throw new Error(imageError.message || "Failed to load return image metadata");

  const orderMap = new Map((orders || []).map((order) => [order.id, order]));
  const imageCountMap = (imageRows || []).reduce<Record<string, number>>((acc, image) => {
    acc[image.return_request_id] = (acc[image.return_request_id] || 0) + 1;
    return acc;
  }, {});

  return requestRows.map((request) => ({
    id: request.id,
    order_id: request.order_id,
    status: request.status,
    reason: request.reason,
    preferred_resolution: request.preferred_resolution,
    requested_at: request.requested_at,
    created_at: request.created_at,
    order: orderMap.get(request.order_id) || null,
    image_count: imageCountMap[request.id] || 0,
  }));
}

export async function getAdminReturnRequestDetails(returnRequestId: string): Promise<AdminReturnRequestDetail> {
  await requireAdmin();

  const request = await fetchReturnRequestForUpdate(returnRequestId);

  const { data: order, error: orderError } = await db
    .from<AdminReturnOrder>("orders")
    .select(
      "id,user_id,order_number,status,payment_status,payment_method,razorpay_order_id,total_amount,shipping_name,shipping_phone,shipping_address,shipping_city,shipping_state,shipping_postal_code,shipping_country,delivered_at,created_at",
    )
    .eq("id", request.order_id)
    .maybeSingle();

  if (orderError) throw new Error(orderError.message || "Failed to load order");

  const [{ data: items, error: itemsError }, { data: images, error: imagesError }] = await Promise.all([
    db
      .from<AdminReturnRequestItem[]>("return_request_items")
      .select("*")
      .eq("return_request_id", returnRequestId)
      .order("created_at", { ascending: true }),
    db
      .from<AdminReturnRequestImage[]>("return_request_images")
      .select("*")
      .eq("return_request_id", returnRequestId)
      .order("created_at", { ascending: true }),
  ]);

  if (itemsError) throw new Error(itemsError.message || "Failed to load return items");
  if (imagesError) throw new Error(imagesError.message || "Failed to load return images");

  let orderItems: AdminReturnOrderItem[] = [];
  let payment: AdminReturnPayment | null = null;

  if (order) {
    const [{ data: orderItemRows, error: orderItemsError }, { data: paymentRows, error: paymentError }] =
      await Promise.all([
        db
          .from<AdminReturnOrderItem[]>("order_items")
          .select("id,order_id,product_name,variant_size,variant_color,quantity,unit_price,total_price")
          .eq("order_id", order.id)
          .order("created_at", { ascending: true }),
        db
          .from<AdminReturnPayment[]>("payments")
          .select("id,order_id,user_id,razorpay_order_id,razorpay_payment_id,amount,currency,status,gateway,created_at")
          .eq("order_id", order.id)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

    if (orderItemsError) throw new Error(orderItemsError.message || "Failed to load order items");
    if (paymentError) throw new Error(paymentError.message || "Failed to load payment details");

    orderItems = orderItemRows || [];
    payment = paymentRows?.[0] || null;
  }

  return {
    request,
    order: order || null,
    items: items || [],
    orderItems,
    images: images || [],
    payment,
  };
}

export async function approveReturnRequest(returnRequestId: string, adminNote?: string) {
  await requireAdmin();

  const request = await fetchReturnRequestForUpdate(returnRequestId);
  if (request.status !== "requested") throw new Error("Invalid status transition");

  const now = new Date().toISOString();
  return updateReturnRequest(returnRequestId, {
    status: "approved",
    approved_at: now,
    admin_note: withExistingAdminNote(request.admin_note, adminNote),
    updated_at: now,
  });
}

export async function rejectReturnRequest(returnRequestId: string, adminNote: string) {
  await requireAdmin();

  const note = cleanAdminNote(adminNote);
  if (!note) throw new Error("Missing rejection note");

  const request = await fetchReturnRequestForUpdate(returnRequestId);
  if (request.status !== "requested") throw new Error("Invalid status transition");

  const now = new Date().toISOString();
  return updateReturnRequest(returnRequestId, {
    status: "rejected",
    rejected_at: now,
    admin_note: note,
    updated_at: now,
  });
}

export async function markReturnReceived(returnRequestId: string, adminNote?: string) {
  await requireAdmin();

  const request = await fetchReturnRequestForUpdate(returnRequestId);
  if (request.status !== "approved") throw new Error("Invalid status transition");

  const now = new Date().toISOString();
  return updateReturnRequest(returnRequestId, {
    status: "received",
    received_at: now,
    admin_note: withExistingAdminNote(request.admin_note, adminNote),
    updated_at: now,
  });
}

export async function markRefundProcessing(
  returnRequestId: string,
  refundAmount: number,
  refundMethod: RefundMethod,
  adminNote?: string,
) {
  await requireAdmin();

  if (!isValidAmount(refundAmount)) throw new Error("Missing refund amount");
  if (!refundMethod || !isValidRefundMethod(refundMethod)) throw new Error("Missing refund method");

  const request = await fetchReturnRequestForUpdate(returnRequestId);
  if (request.status !== "received") throw new Error("Invalid status transition");

  const now = new Date().toISOString();
  return updateReturnRequest(returnRequestId, {
    status: "refund_processing",
    refund_processing_at: now,
    refund_amount: refundAmount,
    refund_method: refundMethod,
    admin_note: withExistingAdminNote(request.admin_note, adminNote),
    updated_at: now,
  });
}

export async function markReturnRefunded(
  returnRequestId: string,
  refundAmount: number,
  refundMethod: RefundMethod,
  adminNote?: string,
) {
  await requireAdmin();

  if (!isValidAmount(refundAmount)) throw new Error("Missing refund amount");
  if (!refundMethod || !isValidRefundMethod(refundMethod)) throw new Error("Missing refund method");

  const request = await fetchReturnRequestForUpdate(returnRequestId);
  if (request.status !== "refund_processing") throw new Error("Invalid status transition");

  const now = new Date().toISOString();
  return updateReturnRequest(returnRequestId, {
    status: "refunded",
    refunded_at: now,
    refund_amount: refundAmount,
    refund_method: refundMethod,
    admin_note: withExistingAdminNote(request.admin_note, adminNote),
    updated_at: now,
  });
}

export async function closeReturnRequest(returnRequestId: string, adminNote?: string) {
  await requireAdmin();

  const request = await fetchReturnRequestForUpdate(returnRequestId);
  if (!["refunded", "rejected"].includes(request.status)) {
    throw new Error("Invalid status transition");
  }

  const now = new Date().toISOString();
  return updateReturnRequest(returnRequestId, {
    status: "closed",
    closed_at: now,
    admin_note: withExistingAdminNote(request.admin_note, adminNote),
    updated_at: now,
  });
}
