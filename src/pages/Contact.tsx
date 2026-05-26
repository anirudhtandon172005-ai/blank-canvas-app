import { FormEvent, useEffect, useMemo, useState } from "react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { getUserProfile } from "@/api/auth";
import { submitContactRequest } from "@/api/contactRequests";

const REASON_OPTIONS = [
  "Order Help",
  "Return / Refund Help",
  "Product Inquiry",
  "Size / Fitting Help",
  "Payment Issue",
  "Other",
] as const;

interface ContactFormState {
  name: string;
  email: string;
  phone: string;
  reason: string;
  note: string;
}

interface UserProfile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

function sanitizeLength(value: string, max: number) {
  return value.slice(0, max);
}

export default function Contact() {
  const { user, loading: authLoading } = useAuthContext();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ContactFormState>({
    name: "",
    email: "",
    phone: "",
    reason: "",
    note: "",
  });
  const [initialPrefill, setInitialPrefill] = useState<Pick<ContactFormState, "name" | "email" | "phone">>({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (authLoading || !user) return;

    let active = true;

    async function prefillFromUser() {
      const fallbackName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
      const fallbackEmail = user.email || "";
      const fallbackPhone = typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : "";

      let profile: UserProfile | null = null;
      try {
        const profileData = await getUserProfile(user.id);
        profile = profileData as UserProfile;
      } catch {
        profile = null;
      }

      if (!active) return;

      const nextPrefill = {
        name: (profile?.full_name || fallbackName || "").trim(),
        email: (profile?.email || fallbackEmail || "").trim(),
        phone: (profile?.phone || fallbackPhone || "").trim(),
      };

      setInitialPrefill(nextPrefill);
      setForm((prev) => ({
        ...prev,
        name: prev.name || nextPrefill.name,
        email: prev.email || nextPrefill.email,
        phone: prev.phone || nextPrefill.phone,
      }));
    }

    void prefillFromUser();

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  const noteRemaining = useMemo(() => 1000 - form.note.length, [form.note.length]);

  function updateField<K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      await submitContactRequest(form);

      toast({
        title: "Request submitted",
        description: "Thanks for reaching out. Our team will get back to you soon.",
      });

      setForm({
        ...initialPrefill,
        reason: "",
        note: "",
      });
    } catch (error) {
      toast({
        title: "Could not submit request",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="container-main py-8 md:py-12">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Contact" },
            ]}
          />

          <div className="mx-auto max-w-3xl mt-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-2xl md:text-3xl">Contact Us</CardTitle>
                <CardDescription>
                  Share your query and we will help you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Name</Label>
                      <Input
                        id="contact-name"
                        value={form.name}
                        onChange={(event) => updateField("name", sanitizeLength(event.target.value, 100))}
                        placeholder="Your full name"
                        maxLength={100}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={form.email}
                        onChange={(event) => updateField("email", sanitizeLength(event.target.value, 255))}
                        placeholder="you@example.com"
                        maxLength={255}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">Phone (optional)</Label>
                      <Input
                        id="contact-phone"
                        value={form.phone}
                        onChange={(event) => updateField("phone", sanitizeLength(event.target.value, 30))}
                        placeholder="+91 98XXXXXX21"
                        maxLength={30}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact-reason">Reason</Label>
                      <Select value={form.reason} onValueChange={(value) => updateField("reason", value)}>
                        <SelectTrigger id="contact-reason">
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                        <SelectContent>
                          {REASON_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="contact-note">Note</Label>
                      <span className="text-xs text-muted-foreground">{noteRemaining} characters left</span>
                    </div>
                    <Textarea
                      id="contact-note"
                      value={form.note}
                      onChange={(event) => updateField("note", sanitizeLength(event.target.value, 1000))}
                      placeholder="Tell us how we can help..."
                      rows={6}
                      maxLength={1000}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                    {submitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
