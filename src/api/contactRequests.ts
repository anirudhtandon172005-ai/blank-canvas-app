import { supabase } from "@/integrations/supabase/client";

export interface ContactRequestInput {
  name: string;
  email: string;
  phone?: string;
  reason: string;
  note: string;
}

function trimOrEmpty(value: string | undefined | null) {
  return (value || "").trim();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateInput(input: ContactRequestInput) {
  const name = trimOrEmpty(input.name);
  const email = trimOrEmpty(input.email);
  const phone = trimOrEmpty(input.phone);
  const reason = trimOrEmpty(input.reason);
  const note = trimOrEmpty(input.note);

  if (!name) throw new Error("Name is required");
  if (!email) throw new Error("Email is required");
  if (!reason) throw new Error("Reason is required");
  if (!note) throw new Error("Note is required");

  if (name.length > 100) throw new Error("Name cannot exceed 100 characters");
  if (email.length > 255) throw new Error("Email cannot exceed 255 characters");
  if (phone.length > 30) throw new Error("Phone cannot exceed 30 characters");
  if (reason.length > 100) throw new Error("Reason cannot exceed 100 characters");
  if (note.length > 1000) throw new Error("Note cannot exceed 1000 characters");

  if (!isValidEmail(email)) throw new Error("Please enter a valid email address");

  return {
    name,
    email: email.toLowerCase(),
    phone: phone || null,
    reason,
    note,
  };
}

export async function submitContactRequest(input: ContactRequestInput) {
  const payload = validateInput(input);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("contact_requests").insert({
    user_id: user?.id ?? null,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    reason: payload.reason,
    note: payload.note,
    status: "requested",
    approval_email_status: "pending",
  });

  if (error) {
    throw new Error(error.message || "Failed to submit contact request");
  }

  return true;
}
