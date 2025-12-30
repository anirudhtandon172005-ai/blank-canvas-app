

import { supabase } from "@/integrations/supabase/client";

// -----------------------------
// PLACE ORDER
// -----------------------------
interface PlaceOrderData {
  addressId?: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry?: string;
  notes?: string;
}

export async function placeOrder(orderData: PlaceOrderData) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) throw new Error("User must be logged in");

  // Fetch cart
  const { data: cart }
