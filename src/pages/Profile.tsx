import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Package, Heart, ChevronRight, LogOut, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAddresses } from "@/hooks/useAddresses";
import { getUserProfile, updateProfile, logout } from "@/api/auth";
import { toast } from "@/hooks/use-toast";
import Loader from "@/components/Loader";
import { Link } from "react-router-dom";
import {
  normalizeIndianPhone,
  sendPhoneVerificationOtp,
  verifyPhoneOtp,
} from "@/api/phoneVerification";
import { getProfileCompletionStatus, type ProfileCompletionStatus } from "@/api/profileCompletion";

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  phone_verified: boolean | null;
  phone_verified_at: string | null;
  phone_verified_phone: string | null;
  phone_verification_status: string | null;
}

function safeNormalizePhone(input: string | null | undefined) {
  if (!input) return null;
  try {
    return normalizeIndianPhone(input);
  } catch {
    return null;
  }
}

function getPhoneErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const normalized = message.toLowerCase();

  if (normalized.includes("already used by another account")) {
    return "This phone number is already used by another account.";
  }

  if (normalized.includes("please log in")) {
    return "Please log in";
  }

  if (
    normalized.includes("too many requests") ||
    normalized.includes("rate limit") ||
    normalized.includes("for security purposes")
  ) {
    return "Too many requests. Please wait before retrying.";
  }

  if (
    normalized.includes("invalid otp") ||
    normalized.includes("token") ||
    normalized.includes("expired")
  ) {
    return "Invalid OTP";
  }

  if (normalized.includes("valid indian phone number")) {
    return "Enter a valid Indian phone number";
  }

  return message || fallback;
}

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuthContext();
  const { defaultAddress, refetch: refetchAddresses } = useAddresses();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [profileCompletionStatus, setProfileCompletionStatus] = useState<ProfileCompletionStatus | null>(null);
  const profilePromptToastShown = useRef(false);
  const showCompleteProfilePrompt = searchParams.get("completeProfile") === "1";

  const [profileForm, setProfileForm] = useState({
    full_name: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      void fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (!showCompleteProfilePrompt) return;

    if (!profilePromptToastShown.current) {
      toast({
        title: "Complete your profile",
        description: "Please complete your profile before checkout.",
        variant: "destructive",
      });
      profilePromptToastShown.current = true;
    }

    let isMounted = true;

    async function fetchCompletionStatus() {
      try {
        const status = await getProfileCompletionStatus();
        if (isMounted) {
          setProfileCompletionStatus(status);
        }
      } catch (error) {
        console.error("Failed to check profile completion on profile page:", error);
        toast({
          title: "Unable to check profile",
          description: "Failed to check profile completion. Please try again.",
          variant: "destructive",
        });
      }
    }

    void fetchCompletionStatus();

    return () => {
      isMounted = false;
    };
  }, [showCompleteProfilePrompt]);

  const storedPhoneNormalized = useMemo(() => safeNormalizePhone(profile?.phone), [profile?.phone]);
  const verifiedPhoneNormalized = useMemo(
    () => safeNormalizePhone(profile?.phone_verified_phone),
    [profile?.phone_verified_phone],
  );
  const phoneInputNormalized = useMemo(() => safeNormalizePhone(phoneInput), [phoneInput]);

  const isPhoneVerified = Boolean(
    profile?.phone_verified &&
      storedPhoneNormalized &&
      verifiedPhoneNormalized &&
      storedPhoneNormalized === verifiedPhoneNormalized,
  );

  const isPhonePending = Boolean(
    !isPhoneVerified && profile?.phone && profile?.phone_verification_status === "pending",
  );

  const phoneChangedAfterVerification = Boolean(
    isPhoneVerified && phoneInputNormalized && storedPhoneNormalized && phoneInputNormalized !== storedPhoneNormalized,
  );

  const fetchProfile = async () => {
    try {
      const profileData = await getUserProfile(user!.id);
      const typedProfile = profileData as UserProfile | null;
      setProfile(typedProfile);
      if (profileData) {
        setProfileForm({
          full_name: profileData.full_name || "",
        });
        setPhoneInput(profileData.phone || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await updateProfile(user!.id, {
        full_name: profileForm.full_name,
      });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      await fetchProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendOtp = async () => {
    setSendingOtp(true);

    try {
      const result = await sendPhoneVerificationOtp(phoneInput);
      setPhoneInput(result.normalizedPhone);
      setOtpInput("");
      setOtpSent(true);
      toast({
        title: "OTP sent",
      });
      await fetchProfile();
    } catch (error) {
      toast({
        title: "Failed to send OTP",
        description: getPhoneErrorMessage(error, "Failed to send OTP"),
        variant: "destructive",
      });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setVerifyingOtp(true);

    try {
      await verifyPhoneOtp(phoneInput, otpInput);
      setOtpInput("");
      setOtpSent(false);
      toast({
        title: "Phone verified",
        description: "Phone verified successfully",
      });
      await fetchProfile();
      await refetchAddresses();
    } catch (error) {
      const message = getPhoneErrorMessage(error, "Failed to verify phone");
      toast({
        title: message === "Invalid OTP" ? "Invalid OTP" : "Failed to verify phone",
        description: message,
        variant: "destructive",
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (authLoading || loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-main py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {showCompleteProfilePrompt && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Please complete your profile before checkout.</AlertTitle>
              <AlertDescription>
                {profileCompletionStatus?.missing?.length
                  ? `Missing: ${profileCompletionStatus.missing.join(", ")}`
                  : "Complete your full name, verified phone number, and delivery address to continue."}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-primary" />
              <h1 className="text-2xl md:text-3xl font-heading font-semibold">My Account</h1>
            </div>
            <Button variant="outline" onClick={handleLogout} className="text-destructive hover:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Link to="/orders">
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-primary" />
                    <span className="font-medium">My Orders</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/wishlist">
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-primary" />
                    <span className="font-medium">My Wishlist</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/profile/addresses">
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="font-medium">Manage Addresses</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/returns">
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-primary" />
                    <span className="font-medium">Returns</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              {/* Profile Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-lg">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{user?.email}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <Button type="submit" disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Phone Verification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Current phone number</p>
                      <p className="font-medium">{profile?.phone || "Not set"}</p>
                    </div>
                    {isPhoneVerified ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Verified
                      </Badge>
                    ) : isPhonePending ? (
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Pending
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                        Not Verified
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    We use this number for delivery, COD, refund updates, and support.
                  </p>

                  {isPhoneVerified && !phoneChangedAfterVerification && (
                    <p className="text-sm text-green-700 dark:text-green-400">
                      Your phone number is verified.
                    </p>
                  )}

                  {phoneChangedAfterVerification && (
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Changing your phone number will require verification again.
                    </p>
                  )}

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div className="space-y-2">
                      <Label htmlFor="phone_verification_input">Phone Number</Label>
                      <Input
                        id="phone_verification_input"
                        value={phoneInput}
                        onChange={(event) => {
                          setPhoneInput(event.target.value);
                          setOtpSent(false);
                          setOtpInput("");
                        }}
                        placeholder="Enter Indian phone number"
                      />
                    </div>
                    <div className="sm:pt-8">
                      <Button onClick={handleSendOtp} disabled={sendingOtp}>
                        {sendingOtp ? "Sending..." : "Send OTP"}
                      </Button>
                    </div>
                  </div>

                  {otpSent && (
                    <div className="space-y-3 border border-border rounded-lg p-4">
                      <div className="space-y-2">
                        <Label htmlFor="otp_input">OTP</Label>
                        <Input
                          id="otp_input"
                          value={otpInput}
                          onChange={(event) =>
                            setOtpInput(event.target.value.replace(/[^\d]/g, "").slice(0, 6))
                          }
                          maxLength={6}
                          placeholder="Enter 6-digit OTP"
                          inputMode="numeric"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={handleVerifyOtp} disabled={verifyingOtp}>
                          {verifyingOtp ? "Verifying..." : "Verify OTP"}
                        </Button>
                        <Button variant="outline" onClick={handleSendOtp} disabled={sendingOtp}>
                          {sendingOtp ? "Resending..." : "Resend OTP"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Default Address Preview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading">Default Address</CardTitle>
                <Link to="/profile/addresses">
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {defaultAddress ? (
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{defaultAddress.full_name}</span>
                      {defaultAddress.label && (
                        <span className="text-xs px-2 py-0.5 bg-secondary rounded-full">
                          {defaultAddress.label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {defaultAddress.address_line1}
                      {defaultAddress.address_line2 && `, ${defaultAddress.address_line2}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {defaultAddress.city}, {defaultAddress.state} - {defaultAddress.postal_code}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <Phone className="w-3 h-3 inline mr-1" />
                      {defaultAddress.phone}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No addresses saved yet</p>
                    <Link to="/profile/addresses/new">
                      <Button>Add Address</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
