import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ChevronLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAddresses, Address } from "@/hooks/useAddresses";
import Loader from "@/components/Loader";
import { toast } from "@/hooks/use-toast";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Chandigarh", "Puducherry",
];

export default function EditAddress() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuthContext();
  const { addresses, loading, editAddress } = useAddresses();
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    label: "",
    is_default: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!loading && addresses.length > 0 && id && !initialized) {
      const address = addresses.find((a) => a.id === id);
      if (address) {
        setFormData({
          full_name: address.full_name,
          phone: address.phone,
          address_line1: address.address_line1,
          address_line2: address.address_line2 || "",
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: address.country,
          label: address.label || "",
          is_default: address.is_default || false,
        });
        setInitialized(true);
      } else {
        toast({
          title: "Address not found",
          variant: "destructive",
        });
        navigate("/profile/addresses");
      }
    }
  }, [loading, addresses, id, initialized, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (!formData.address_line1.trim()) {
      newErrors.address_line1 = "Address is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state) {
      newErrors.state = "State is required";
    }

    if (!formData.postal_code.trim()) {
      newErrors.postal_code = "PIN code is required";
    } else if (!/^\d{6}$/.test(formData.postal_code)) {
      newErrors.postal_code = "Please enter a valid 6-digit PIN code";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !id) {
      toast({
        title: "Please fix the errors",
        description: "Some fields have validation errors",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const result = await editAddress(id, {
      full_name: formData.full_name.trim(),
      phone: formData.phone.replace(/\s/g, ""),
      address_line1: formData.address_line1.trim(),
      address_line2: formData.address_line2.trim() || undefined,
      city: formData.city.trim(),
      state: formData.state,
      postal_code: formData.postal_code.trim(),
      country: formData.country,
      label: formData.label || undefined,
      is_default: formData.is_default,
    });

    setSaving(false);

    if (result) {
      navigate("/profile/addresses");
    }
  };

  if (authLoading || loading || !initialized) {
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
          className="max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              to="/profile/addresses"
              className="p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-heading font-semibold flex items-center gap-3">
              <MapPin className="w-6 h-6 text-primary" />
              Edit Address
            </h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Address Details</CardTitle>
              <CardDescription>
                Update your address information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name and Phone */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="e.g. Priya Sharma"
                      className={errors.full_name ? "border-destructive" : ""}
                    />
                    {errors.full_name && (
                      <p className="text-xs text-destructive">{errors.full_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && (
                      <p className="text-xs text-destructive">{errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Address Lines */}
                <div className="space-y-2">
                  <Label htmlFor="address_line1">Address Line 1 *</Label>
                  <Input
                    id="address_line1"
                    value={formData.address_line1}
                    onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                    placeholder="House/Flat No., Building Name, Street"
                    className={errors.address_line1 ? "border-destructive" : ""}
                  />
                  {errors.address_line1 && (
                    <p className="text-xs text-destructive">{errors.address_line1}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
                  <Input
                    id="address_line2"
                    value={formData.address_line2}
                    onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                    placeholder="Locality, Landmark"
                  />
                </div>

                {/* City and State */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Mumbai"
                      className={errors.city ? "border-destructive" : ""}
                    />
                    {errors.city && (
                      <p className="text-xs text-destructive">{errors.city}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>State *</Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => setFormData({ ...formData, state: value })}
                    >
                      <SelectTrigger className={errors.state ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.state && (
                      <p className="text-xs text-destructive">{errors.state}</p>
                    )}
                  </div>
                </div>

                {/* Postal Code and Country */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">PIN Code *</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      placeholder="e.g. 400001"
                      maxLength={6}
                      className={errors.postal_code ? "border-destructive" : ""}
                    />
                    {errors.postal_code && (
                      <p className="text-xs text-destructive">{errors.postal_code}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                {/* Label */}
                <div className="space-y-2">
                  <Label>Address Label (Optional)</Label>
                  <div className="flex gap-2">
                    {["Home", "Work", "Other"].map((label) => (
                      <Button
                        key={label}
                        type="button"
                        variant={formData.label === label ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData({ ...formData, label: formData.label === label ? "" : label })}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Default Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_default: checked as boolean })
                    }
                  />
                  <Label htmlFor="is_default" className="font-normal cursor-pointer">
                    Set as default address
                  </Label>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={saving} className="flex-1">
                    {saving ? "Saving..." : "Update Address"}
                  </Button>
                  <Link to="/profile/addresses" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
