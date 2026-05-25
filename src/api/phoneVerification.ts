import { supabase } from "@/integrations/supabase/client";

type DbError = { message: string; code?: string };
type DbResult<T> = { data: T | null; error: DbError | null };
type QueryBuilder<T> = PromiseLike<DbResult<T>> & {
  select: (columns?: string) => QueryBuilder<T>;
  eq: (column: string, value: unknown) => QueryBuilder<T>;
  update: (values: unknown) => QueryBuilder<T>;
};
type UntypedSupabase = {
  from: <T = unknown>(table: string) => QueryBuilder<T>;
};

const db = supabase as unknown as UntypedSupabase;

interface ProfilePhoneLookupRow {
  id: string;
}

function isLikelyRlsError(error: DbError) {
  const code = error.code || "";
  const message = (error.message || "").toLowerCase();
  return (
    code === "42501" ||
    message.includes("permission denied") ||
    message.includes("row-level security") ||
    message.includes("not authorized")
  );
}

function normalizePhoneDigits(input: string) {
  const cleaned = input.trim().replace(/[\s\-()]/g, "");

  if (!cleaned) {
    throw new Error("Enter a valid Indian phone number");
  }

  let digits = cleaned;
  if (digits.startsWith("+")) {
    digits = digits.slice(1);
  }

  if (!/^\d+$/.test(digits)) {
    throw new Error("Enter a valid Indian phone number");
  }

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }

  throw new Error("Enter a valid Indian phone number");
}

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw new Error(error.message);
  if (!user) throw new Error("Please log in");
  return user;
}

export function normalizeIndianPhone(input: string): string {
  const withCountryCode = normalizePhoneDigits(input);
  const local = withCountryCode.slice(2);

  if (!/^[6-9]\d{9}$/.test(local)) {
    throw new Error("Enter a valid Indian phone number");
  }

  return `+91${local}`;
}

export function validateIndianPhone(input: string): boolean {
  return /^\+91[6-9]\d{9}$/.test(input.trim());
}

export async function ensurePhoneNotUsedByAnotherProfile(
  normalizedPhone: string,
  currentUserId: string,
): Promise<void> {
  const [phoneMatch, verifiedMatch] = await Promise.all([
    db.from<ProfilePhoneLookupRow[]>("profiles").select("id").eq("phone", normalizedPhone),
    db
      .from<ProfilePhoneLookupRow[]>("profiles")
      .select("id")
      .eq("phone_verified_phone", normalizedPhone),
  ]);

  const visibleRows: ProfilePhoneLookupRow[] = [];
  const results = [phoneMatch, verifiedMatch];

  for (const result of results) {
    if (result.error) {
      if (isLikelyRlsError(result.error)) {
        continue;
      }
      throw new Error(result.error.message || "Failed to check phone number");
    }

    if (result.data?.length) {
      visibleRows.push(...result.data);
    }
  }

  const duplicate = visibleRows.some((row) => row.id !== currentUserId);
  if (duplicate) {
    throw new Error("This phone number is already used by another account.");
  }
}

export async function markProfilePhonePending(normalizedPhone: string): Promise<void> {
  const user = await getCurrentUser();

  const { error } = await db
    .from("profiles")
    .update({
      phone: normalizedPhone,
      phone_verified: false,
      phone_verified_at: null,
      phone_verified_phone: null,
      phone_verification_status: "pending",
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message || "Failed to update phone verification status");
  }
}

export async function markProfilePhoneVerified(normalizedPhone: string): Promise<void> {
  const user = await getCurrentUser();

  const { error } = await db
    .from("profiles")
    .update({
      phone: normalizedPhone,
      phone_verified: true,
      phone_verified_at: new Date().toISOString(),
      phone_verified_phone: normalizedPhone,
      phone_verification_status: "verified",
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message || "Failed to update phone verification status");
  }
}

export async function syncVerifiedPhoneToAddresses(
  userId: string,
  normalizedPhone: string,
): Promise<void> {
  const { error } = await db
    .from("addresses")
    .update({
      phone: normalizedPhone,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message || "Failed to sync verified phone to saved addresses");
  }
}

export async function sendPhoneVerificationOtp(
  phoneInput: string,
): Promise<{ normalizedPhone: string }> {
  const user = await getCurrentUser();
  const normalizedPhone = normalizeIndianPhone(phoneInput);

  if (!validateIndianPhone(normalizedPhone)) {
    throw new Error("Enter a valid Indian phone number");
  }

  await ensurePhoneNotUsedByAnotherProfile(normalizedPhone, user.id);

  const { error } = await supabase.auth.updateUser({
    phone: normalizedPhone,
  });

  if (error) {
    throw new Error(error.message);
  }

  await markProfilePhonePending(normalizedPhone);

  return { normalizedPhone };
}

export async function verifyPhoneOtp(phoneInput: string, otp: string): Promise<void> {
  const user = await getCurrentUser();

  const normalizedPhone = normalizeIndianPhone(phoneInput);
  if (!validateIndianPhone(normalizedPhone)) {
    throw new Error("Enter a valid Indian phone number");
  }

  const normalizedOtp = otp.trim();
  if (!/^\d{6}$/.test(normalizedOtp)) {
    throw new Error("Invalid OTP");
  }

  const { error } = await supabase.auth.verifyOtp({
    phone: normalizedPhone,
    token: normalizedOtp,
    type: "phone_change",
  });

  if (error) {
    throw new Error(error.message || "Failed to verify phone");
  }

  await markProfilePhoneVerified(normalizedPhone);

  try {
    await syncVerifiedPhoneToAddresses(user.id, normalizedPhone);
  } catch (error) {
    console.error("Address phone sync failed after phone verification:", error);
    throw new Error("Phone verified, but failed to sync saved addresses. Please try again.");
  }
}
