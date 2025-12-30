import { supabase } from "@/integrations/supabase/client";

// -------------------------
// SIGNUP
// -------------------------
export async function signup(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || null }, // attaches to auth.user metadata
    },
  });

  if (error) throw error;

  // Create a profile row after signup (because RLS blocks public writes)
  if (data.user) {
    await supabase.from("profiles").insert({
      id: data.user.id,
      email: data.user.email!,
      full_name: fullName || null,
    });
  }

  return data;
}

// -------------------------
// LOGIN (email + password)
// -------------------------
export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// -------------------------
// GOOGLE LOGIN
// -------------------------
export async function loginWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
  return data;
}

// -------------------------
// LOGOUT
// -------------------------
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
}

// -------------------------
// GET USER PROFILE
// -------------------------
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

  if (error) throw error;
  return data;
}

// -------------------------
// UPDATE PROFILE
// -------------------------
export async function updateProfile(
  userId: string,
  updates: { full_name?: string; phone?: string; avatar_url?: string },
) {
  const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().single();

  if (error) throw error;
  return data;
}
