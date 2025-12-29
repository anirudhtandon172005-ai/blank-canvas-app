import { supabase } from "@/integrations/supabase/client";

export async function signup(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function login(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}

export async function logout() {
  await supabase.auth.signOut();
}
