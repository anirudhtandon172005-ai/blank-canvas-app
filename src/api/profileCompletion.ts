import { normalizeIndianPhone } from "@/api/phoneVerification";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  phone_verified: boolean | null;
  phone_verified_phone: string | null;
}

export type ProfileCompletionStatus = {
  isComplete: boolean;
  missing: string[];
  profile: ProfileRow | null;
  addresses: AddressRow[];
};

function hasText(value: string | null | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

function normalizePhoneForComparison(value: string | null | undefined): string | null {
  if (!hasText(value)) return null;

  const trimmed = value!.trim();
  try {
    return normalizeIndianPhone(trimmed);
  } catch {
    return trimmed.replace(/\s+/g, "");
  }
}

function isValidAddress(address: AddressRow): boolean {
  return (
    hasText(address.full_name) &&
    hasText(address.phone) &&
    hasText(address.address_line1) &&
    hasText(address.city) &&
    hasText(address.state) &&
    hasText(address.postal_code) &&
    hasText(address.country)
  );
}

function addMissingLabel(missing: string[], label: string) {
  if (!missing.includes(label)) {
    missing.push(label);
  }
}

export async function getProfileCompletionStatus(): Promise<ProfileCompletionStatus> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message || "Failed to check profile completion");
  }

  if (!user) {
    return {
      isComplete: false,
      missing: ["Login"],
      profile: null,
      addresses: [],
    };
  }

  const [profileResult, addressResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("addresses").select("*").eq("user_id", user.id),
  ]);

  if (profileResult.error) {
    throw new Error(profileResult.error.message || "Failed to fetch profile");
  }

  if (addressResult.error) {
    throw new Error(addressResult.error.message || "Failed to fetch addresses");
  }

  const profile = (profileResult.data as unknown as ProfileRow | null) ?? null;
  const addresses = addressResult.data ?? [];

  const missing: string[] = [];

  if (!profile || !hasText(profile.full_name)) {
    addMissingLabel(missing, "Full name");
  }

  const storedPhone = normalizePhoneForComparison(profile?.phone);
  const verifiedPhone = normalizePhoneForComparison(profile?.phone_verified_phone);
  const phoneVerified =
    Boolean(profile?.phone_verified) && Boolean(storedPhone) && Boolean(verifiedPhone) && storedPhone === verifiedPhone;

  if (!phoneVerified) {
    addMissingLabel(missing, "Verified phone number");
  }

  const hasValidAddress = addresses.some(isValidAddress);
  if (!hasValidAddress) {
    addMissingLabel(missing, "Delivery address");
  }

  return {
    isComplete: missing.length === 0,
    missing,
    profile,
    addresses,
  };
}

export function buildProfileCompletionMessage(status: ProfileCompletionStatus): string {
  if (status.isComplete) {
    return "Profile is complete.";
  }

  return `Please complete your profile before checkout: ${status.missing.join(", ")}.`;
}
