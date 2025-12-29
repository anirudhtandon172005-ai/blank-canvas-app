import { supabase } from "@/integrations/supabase/client";

// Signup
export async function signup(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

// Login
export async function login(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

// Google login
export async function loginWithGoogle() {
  return supabase.auth.signInWithOAuth({ provider: "google" });
}

// Get profile
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

  if (error) throw error;
  return data;
}

// Update profile
export async function updateProfile(userId: string, updates: any) {
  const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().single();

  if (error) throw error;
  return data;
}
