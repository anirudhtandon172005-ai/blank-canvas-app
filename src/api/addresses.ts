import { supabase } from "@/integrations/supabase/client";

// Fetch all addresses of a user
export async function getAddresses(userId: string) {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return data;
}

// Add a new address
export async function addAddress(address: {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  user_id: string;
  label?: string | null;
  is_default?: boolean | null;
}) {
  const { data, error } = await supabase
    .from("addresses")
    .insert(address)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update any address field
export async function updateAddress(
  addressId: string,
  updates: Partial<{
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string | null;
    city: string;
    state: string;
    postal_code: string;
    country?: string;
    label?: string | null;
    is_default?: boolean | null;
  }>
) {
  const { data, error } = await supabase
    .from("addresses")
    .update(updates)
    .eq("id", addressId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete address
export async function deleteAddress(addressId: string) {
  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", addressId);

  if (error) throw error;
  return true;
}

// Mark an address as default (and remove previous default)
export async function setDefaultAddress(addressId: string, userId: string) {
  // Remove old default
  await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", userId);

  // Set new default
  const { data, error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", addressId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
