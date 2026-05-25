import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const ACTIVE_RETURN_STATUSES = ["requested", "approved", "received", "refund_processing"];
const RETURN_WINDOW_DAYS = 7;
const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const PREFERRED_RESOLUTIONS = ["refund", "exchange", "store_credit", "other"] as const;

type DbError = { message: string };
type DbResult<T> = { data: T | null; error: DbError | null };
type QueryBuilder<T> = PromiseLike<DbResult<T>> & {
  select: (columns?: string) => QueryBuilder<T>;
  eq: (column: string, value: unknown) => QueryBuilder<T>;
  in: (column: string, values: readonly unknown[]) => QueryBuilder<T>;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder<T>;
  maybeSingle: () => QueryBuilder<T>;
  single: () => QueryBuilder<T>;
  insert: (values: unknown) => QueryBuilder<T>;
};
type UntypedSupabase = {
  from: <T = unknown>(table: string) => QueryBuilder<T>;
};

const db = supabase as unknown as UntypedSupabase;

export interface ReturnRequest {
  id: string;
  order_id: string;
  user_id: string;
  status: string;
  reason: string;
  description: string;
  preferred_resolution: string;
  admin_note: string | null;
  refund_amount: number | null;
  refund_method: string | null;
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

export interface ReturnRequestItem {
  id: string;
  return_request_id: string;
  order_item_id: string;
  quantity: number;
  reason: string | null;
  condition_note: string | null;
  created_at: string;
}

export interface ReturnRequestImage {
  id: string;
  return_request_id: string;
  user_id: string;
  image_url: string;
  storage_path: string;
  created_at: string;
}

export interface ReturnOrder {
  id: string;
  user_id: string;
  order_number: string;
  status: string;
  delivered_at: string | null;
  total_amount: number;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  created_at: string;
}

export interface ReturnOrderItem {
  id: string;
  order_id: string;
  product_name: string;
  variant_size: string;
  variant_color: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ReturnEligibilityResult {
  eligible: boolean;
  reason?: string;
  order?: ReturnOrder;
  items?: ReturnOrderItem[];
  existingRequest?: ReturnRequest | null;
}

export type PreferredResolution = (typeof PREFERRED_RESOLUTIONS)[number];

export interface CreateReturnRequestInput {
  orderId: string;
  reason: string;
  description: string;
  preferredResolution: PreferredResolution;
  items: Array<{
    orderItemId: string;
    quantity: number;
    reason?: string;
    conditionNote?: string;
  }>;
  images?: File[];
}

export interface CreateReturnRequestResult {
  request: ReturnRequest;
  imageUploadWarning?: string;
}

export interface UserReturnRequest extends ReturnRequest {
  order: Pick<ReturnOrder, "id" | "order_number" | "status"> | null;
}

async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw new Error(error.message);
  return user;
}

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "");
}

function validateImageFiles(files: File[]) {
  if (files.length > MAX_IMAGES) {
    throw new Error(`You can upload up to ${MAX_IMAGES} images`);
  }

  files.forEach((file) => {
    if (!file.type.startsWith("image/")) {
      throw new Error("Invalid image file");
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error("Image too large");
    }
  });
}

function isActiveReturnStatus(status: string | null | undefined) {
  if (!status) return false;
  return ACTIVE_RETURN_STATUSES.includes(status);
}

function isWithinReturnWindow(deliveredAt: string) {
  const deliveredTime = new Date(deliveredAt).getTime();
  const now = Date.now();
  const diffMs = now - deliveredTime;
  const dayMs = 24 * 60 * 60 * 1000;
  return diffMs <= RETURN_WINDOW_DAYS * dayMs;
}

function normalizePreferredResolution(value: string): PreferredResolution {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");

  if (!PREFERRED_RESOLUTIONS.includes(normalized as PreferredResolution)) {
    throw new Error("Invalid preferred resolution");
  }

  return normalized as PreferredResolution;
}

export async function getReturnRequestForOrder(orderId: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await db
    .from<ReturnRequest[]>("return_requests")
    .select("*")
    .eq("order_id", orderId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message || "Failed to load return request");
  return data?.[0] || null;
}

export async function checkReturnEligibility(orderId: string): Promise<ReturnEligibilityResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { eligible: false, reason: "Please log in" };
  }

  const { data: order, error: orderError } = await db
    .from<ReturnOrder>("orders")
    .select(
      "id,user_id,order_number,status,delivered_at,total_amount,shipping_name,shipping_phone,shipping_address,shipping_city,shipping_state,shipping_postal_code,shipping_country,created_at",
    )
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (orderError) throw new Error(orderError.message || "Failed to load order");
  if (!order) {
    return { eligible: false, reason: "Order not found" };
  }

  const { data: items, error: itemsError } = await db
    .from<ReturnOrderItem[]>("order_items")
    .select("id,order_id,product_name,variant_size,variant_color,quantity,unit_price,total_price")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  if (itemsError) throw new Error(itemsError.message || "Failed to load order items");

  const { data: existingRequests, error: requestError } = await db
    .from<ReturnRequest[]>("return_requests")
    .select("*")
    .eq("order_id", order.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (requestError) throw new Error(requestError.message || "Failed to load return requests");

  const latestRequest = existingRequests?.[0] || null;
  const activeRequest = existingRequests?.find((request) => isActiveReturnStatus(request.status)) || null;
  const hasActiveRequest = Boolean(activeRequest);

  if (hasActiveRequest) {
    return {
      eligible: false,
      reason: "Return request already submitted",
      order,
      items: items || [],
      existingRequest: activeRequest,
    };
  }

  if (order.status !== "delivered" || !order.delivered_at) {
    return {
      eligible: false,
      reason: "Return is available only after delivery",
      order,
      items: items || [],
      existingRequest: latestRequest,
    };
  }

  if (!isWithinReturnWindow(order.delivered_at)) {
    return {
      eligible: false,
      reason: "Return window closed. Returns are allowed within 7 days of delivery.",
      order,
      items: items || [],
      existingRequest: latestRequest,
    };
  }

  return {
    eligible: true,
    order,
    items: items || [],
    existingRequest: latestRequest,
  };
}

export async function uploadReturnImages(returnRequestId: string, files: File[]) {
  if (!files.length) return [];

  validateImageFiles(files);

  const user = await getCurrentUser();
  if (!user) throw new Error("Not logged in");

  const createdRows: ReturnRequestImage[] = [];

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const safeFileName = sanitizeFileName(file.name) || `image-${i + 1}.jpg`;
    const path = `return-requests/${user.id}/${returnRequestId}/${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage.from("return-evidence").upload(path, file, {
      upsert: false,
      contentType: file.type,
    });

    if (uploadError) {
      throw new Error(uploadError.message || "Failed to upload image");
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("return-evidence").getPublicUrl(path);

    const { data: imageRow, error: imageError } = await db
      .from<ReturnRequestImage>("return_request_images")
      .insert({
        return_request_id: returnRequestId,
        user_id: user.id,
        image_url: publicUrl,
        storage_path: path,
      })
      .select("*")
      .single();

    if (imageError) {
      throw new Error(imageError.message || "Failed to save return image");
    }

    if (imageRow) createdRows.push(imageRow);
  }

  return createdRows;
}

export async function createReturnRequest(input: CreateReturnRequestInput): Promise<CreateReturnRequestResult> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not logged in");

  const eligibility = await checkReturnEligibility(input.orderId);

  if (!eligibility.eligible) {
    throw new Error(eligibility.reason || "Not eligible for return");
  }

  if (!input.reason.trim()) {
    throw new Error("Please select a reason");
  }

  if (!input.description.trim() || input.description.trim().length < 20) {
    throw new Error("Description must be at least 20 characters");
  }

  if (!input.items.length) {
    throw new Error("Select at least one item");
  }

  const orderItems = eligibility.items || [];
  const quantityByItemId = new Map(orderItems.map((item) => [item.id, item.quantity]));

  input.items.forEach((item) => {
    const allowedQuantity = quantityByItemId.get(item.orderItemId);
    if (!allowedQuantity) {
      throw new Error("Invalid order item selected");
    }
    if (item.quantity <= 0 || item.quantity > allowedQuantity) {
      throw new Error("Invalid item quantity selected");
    }
  });

  if (input.images?.length) {
    validateImageFiles(input.images);
  }

  const preferredResolution = normalizePreferredResolution(input.preferredResolution);
  const now = new Date().toISOString();

  const { data: request, error: requestError } = await db
    .from<ReturnRequest>("return_requests")
    .insert({
      order_id: input.orderId,
      user_id: user.id,
      status: "requested",
      reason: input.reason,
      description: input.description.trim(),
      preferred_resolution: preferredResolution,
      requested_at: now,
    })
    .select("*")
    .single();

  if (requestError || !request) {
    throw new Error(requestError?.message || "Failed to submit request");
  }

  const itemRows = input.items.map((item) => ({
    return_request_id: request.id,
    order_item_id: item.orderItemId,
    quantity: item.quantity,
    reason: item.reason || input.reason,
    condition_note: item.conditionNote || null,
  }));

  const { error: itemsError } = await db.from("return_request_items").insert(itemRows);
  if (itemsError) {
    throw new Error(itemsError.message || "Failed to save return items");
  }

  let imageUploadWarning: string | undefined;

  if (input.images?.length) {
    try {
      await uploadReturnImages(request.id, input.images);
    } catch (error) {
      imageUploadWarning = error instanceof Error ? error.message : "Failed to upload image";
    }
  }

  return {
    request,
    imageUploadWarning,
  };
}

export async function getUserReturnRequests(): Promise<UserReturnRequest[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please log in");

  const { data: requests, error: requestsError } = await db
    .from<ReturnRequest[]>("return_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (requestsError) throw new Error(requestsError.message || "Failed to load return requests");

  const requestRows = requests || [];
  const orderIds = requestRows.map((request) => request.order_id);

  if (!orderIds.length) return [];

  const { data: orders, error: ordersError } = await db
    .from<Array<Pick<ReturnOrder, "id" | "order_number" | "status">>>("orders")
    .select("id,order_number,status")
    .in("id", orderIds);

  if (ordersError) throw new Error(ordersError.message || "Failed to load orders");

  const orderMap = new Map((orders || []).map((order) => [order.id, order]));

  return requestRows.map((request) => ({
    ...request,
    order: orderMap.get(request.order_id) || null,
  }));
}
