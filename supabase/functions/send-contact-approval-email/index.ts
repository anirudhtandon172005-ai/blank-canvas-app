import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendContactApprovalEmailRequest {
  contact_request_id: string;
}

interface ContactRequestRow {
  id: string;
  name: string;
  email: string;
  reason: string;
  status: string;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function formatErrorMessage(errorBody: unknown, fallback: string) {
  if (!errorBody || typeof errorBody !== "object") return fallback;
  const maybeMessage = (errorBody as Record<string, unknown>).message;
  if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
  const maybeError = (errorBody as Record<string, unknown>).error;
  if (typeof maybeError === "string" && maybeError.trim()) return maybeError;
  return fallback;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminContactEmail = Deno.env.get("ADMIN_CONTACT_EMAIL");
    const adminContactPhone = Deno.env.get("ADMIN_CONTACT_PHONE");
    const contactEmailFrom = Deno.env.get("CONTACT_EMAIL_FROM");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

    if (!resendApiKey || !adminContactEmail || !adminContactPhone || !contactEmailFrom) {
      return jsonResponse({ error: "Missing required email configuration" }, 500);
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Supabase service credentials not configured" }, 500);
    }

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { data: adminRole, error: roleError } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) return jsonResponse({ error: roleError.message || "Access denied" }, 403);
    if (!adminRole) return jsonResponse({ error: "Forbidden" }, 403);

    const { contact_request_id }: SendContactApprovalEmailRequest = await req.json();

    if (!contact_request_id) {
      return jsonResponse({ error: "contact_request_id is required" }, 400);
    }

    const { data: requestData, error: requestError } = await supabase
      .from("contact_requests")
      .select("id,name,email,reason,status")
      .eq("id", contact_request_id)
      .maybeSingle();

    const request = requestData as ContactRequestRow | null;

    if (requestError) return jsonResponse({ error: requestError.message || "Failed to fetch contact request" }, 500);
    if (!request) return jsonResponse({ error: "Contact request not found" }, 404);
    if (request.status !== "approved") {
      return jsonResponse({ error: "Contact request must be approved before sending email" }, 400);
    }

    const emailPayload = {
      from: contactEmailFrom,
      to: request.email,
      subject: "Your Kala Mandir Contact Request Has Been Approved",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1f1f;">
          <p>Hi ${request.name},</p>
          <p>Your contact request has been approved by the Kala Mandir team.</p>
          <p><strong>Request reason:</strong> ${request.reason}</p>
          <p>You can now reach us directly at:</p>
          <p>
            <strong>Email:</strong> ${adminContactEmail}<br />
            <strong>Phone:</strong> ${adminContactPhone}
          </p>
          <p>Thank you for your patience. We look forward to assisting you.</p>
          <p>Warm regards,<br />Kala Mandir Team</p>
        </div>
      `,
      text: [
        `Hi ${request.name},`,
        "",
        "Your contact request has been approved by the Kala Mandir team.",
        `Request reason: ${request.reason}`,
        "",
        "You can now reach us directly at:",
        `Email: ${adminContactEmail}`,
        `Phone: ${adminContactPhone}`,
        "",
        "Thank you for your patience.",
        "Kala Mandir Team",
      ].join("\n"),
    };

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    if (!resendResponse.ok) {
      const rawError = await resendResponse.text();
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(rawError);
      } catch {
        parsed = { error: rawError };
      }

      const readableError = formatErrorMessage(parsed, "Failed to send approval email");

      await supabase
        .from("contact_requests")
        .update({
          approval_email_status: "failed",
          approval_email_error: readableError,
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      return jsonResponse({ error: readableError }, 502);
    }

    await supabase
      .from("contact_requests")
      .update({
        approval_email_status: "sent",
        approval_email_sent_at: new Date().toISOString(),
        approval_email_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    return jsonResponse({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
