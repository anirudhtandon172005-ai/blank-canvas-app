import { supabase } from "@/integrations/supabase/client";

export type ContactRequestStatus = "requested" | "approved" | "rejected" | "closed";
export type ApprovalEmailStatus = "pending" | "sent" | "failed";

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
  update: (values: unknown) => QueryBuilder<T>;
};
type UntypedSupabase = {
  from: <T = unknown>(table: string) => QueryBuilder<T>;
};

const db = supabase as unknown as UntypedSupabase;

interface AdminRoleRow {
  id: string;
}

export interface AdminContactRequest {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  reason: string;
  note: string;
  status: ContactRequestStatus;
  approval_email_status: ApprovalEmailStatus;
  admin_note: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
  updated_at: string;
}

interface GetAdminContactRequestsParams {
  limit?: number;
}

export interface ApprovalEmailResult {
  sent: boolean;
  error?: string;
}

export interface ApproveContactRequestResult {
  request: AdminContactRequest;
  email: ApprovalEmailResult;
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

async function fetchContactRequestForUpdate(contactRequestId: string) {
  const { data, error } = await db
    .from<AdminContactRequest>("contact_requests")
    .select("*")
    .eq("id", contactRequestId)
    .maybeSingle();

  if (error) throw new Error(error.message || "Failed to load contact request");
  if (!data) throw new Error("Contact request not found");
  return data;
}

async function updateContactRequest(
  contactRequestId: string,
  values: Partial<AdminContactRequest>,
): Promise<AdminContactRequest> {
  const { data, error } = await db
    .from<AdminContactRequest>("contact_requests")
    .update(values)
    .eq("id", contactRequestId)
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message || "Failed to update request");
  return data;
}

export async function getAdminContactRequests(
  params: GetAdminContactRequestsParams = {},
): Promise<AdminContactRequest[]> {
  await requireAdmin();

  const limit = Math.min(Math.max(params.limit || 50, 1), 100);

  const { data, error } = await db
    .from<AdminContactRequest[]>("contact_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message || "Failed to load contact requests");
  return data || [];
}

export async function getAdminContactRequestDetails(contactRequestId: string): Promise<AdminContactRequest> {
  await requireAdmin();
  return fetchContactRequestForUpdate(contactRequestId);
}

export async function sendContactApprovalEmail(contactRequestId: string): Promise<ApprovalEmailResult> {
  await requireAdmin();

  const { data, error } = await supabase.functions.invoke("send-contact-approval-email", {
    body: { contact_request_id: contactRequestId },
  });

  if (error) {
    return {
      sent: false,
      error: error.message || "Failed to send approval email",
    };
  }

  if (!data?.success) {
    return {
      sent: false,
      error: data?.error || "Failed to send approval email",
    };
  }

  return { sent: true };
}

export async function updateContactRequestAdminNote(contactRequestId: string, adminNote?: string) {
  await requireAdmin();

  const request = await fetchContactRequestForUpdate(contactRequestId);
  const now = new Date().toISOString();

  return updateContactRequest(contactRequestId, {
    admin_note: withExistingAdminNote(request.admin_note, adminNote),
    updated_at: now,
  });
}

export async function approveContactRequest(
  contactRequestId: string,
  adminNote?: string,
): Promise<ApproveContactRequestResult> {
  const user = await requireAdmin();

  const request = await fetchContactRequestForUpdate(contactRequestId);
  if (request.status !== "requested") throw new Error("Invalid status transition");

  const now = new Date().toISOString();
  const updatedRequest = await updateContactRequest(contactRequestId, {
    status: "approved",
    approved_at: now,
    approved_by: user.id,
    admin_note: withExistingAdminNote(request.admin_note, adminNote),
    updated_at: now,
  });

  const email = await sendContactApprovalEmail(contactRequestId);
  return {
    request: updatedRequest,
    email,
  };
}

export async function rejectContactRequest(contactRequestId: string, adminNote?: string) {
  const user = await requireAdmin();

  const request = await fetchContactRequestForUpdate(contactRequestId);
  if (request.status !== "requested") throw new Error("Invalid status transition");

  const now = new Date().toISOString();
  return updateContactRequest(contactRequestId, {
    status: "rejected",
    rejected_at: now,
    rejected_by: user.id,
    admin_note: withExistingAdminNote(request.admin_note, adminNote),
    updated_at: now,
  });
}

export async function closeContactRequest(contactRequestId: string, adminNote?: string) {
  const user = await requireAdmin();

  const request = await fetchContactRequestForUpdate(contactRequestId);
  if (!["approved", "rejected"].includes(request.status)) {
    throw new Error("Invalid status transition");
  }

  const now = new Date().toISOString();
  return updateContactRequest(contactRequestId, {
    status: "closed",
    closed_at: now,
    closed_by: user.id,
    admin_note: withExistingAdminNote(request.admin_note, adminNote),
    updated_at: now,
  });
}
