import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Plus, Check, CreditCard, Banknote, Truck, ShieldCheck } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import Loader from "@/components/Loader";
import RazorpayButton, { type VerifiedPaymentResponse } from "@/components/RazorpayButton";
import AuthModal from "@/components/AuthModal";

import { useCart } from "@/hooks/useCart";
import { useAuthContext } from "@/contexts/AuthContext";
import { getAddresses, addAddress } from "@/api/addresses";
import { placeOrder } from "@/api/orders";
import { toast } from "@/hooks/use-toast";

interface Address {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  is_default?: boolean;
  label?: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, isAuthenticated } = useAuthContext();
  const { cart, loading: cartLoading, cartTotal } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  const [newAddress, setNewAddress] = useState({
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    label: "",
  });

  // Show auth modal if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setShowAuthModal(true);
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  // Fetch addresses when authenticated
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchAddresses() {
      try {
        const data = await getAddresses(user!.id);
        setAddresses(data);
        const defaultAddr = data.find((a) => a.is_default) || data[0];
        setSelectedAddress(defaultAddr || null);
      } catch (error) {
        console.error("Error fetching addresses:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAddresses();
  }, [user, authLoading]);

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  const cartItems = cart?.items || [];
  const shippingCost = cartTotal >= 2000 ? 0 : 99;
  const taxAmount = cartTotal * 0.05;
  const totalAmount = cartTotal + shippingCost + taxAmount;

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !newAddress.full_name ||
      !newAddress.phone ||
      !newAddress.address_line1 ||
      !newAddress.city ||
      !newAddress.state ||
      !newAddress.postal_code
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const address = await addAddress({
        ...newAddress,
        user_id: user!.id,
        is_default: addresses.length === 0,
      });

      setAddresses([...addresses, address]);
      setSelectedAddress(address);
      setShowAddAddress(false);

      setNewAddress({
        full_name: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        label: "",
      });

      toast({
        title: "Address added",
        description: "Your address has been saved",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add address",
        variant: "destructive",
      });
    }
  };

  // Helper to create order and redirect
  const createOrderAndRedirect = async (transactionId: string) => {
    if (!selectedAddress) return;

    setPlacing(true);

    try {
      const order = await placeOrder({
        addressId: selectedAddress.id,
        shippingName: selectedAddress.full_name,
        shippingPhone: selectedAddress.phone,
        shippingAddress: `${selectedAddress.address_line1}${selectedAddress.address_line2 ? ", " + selectedAddress.address_line2 : ""}`,
        shippingCity: selectedAddress.city,
        shippingState: selectedAddress.state,
        shippingPostalCode: selectedAddress.postal_code,
      });

      toast({
        title: "Order placed!",
        description: `Your order #${order.order_number} has been confirmed`,
      });

      // Redirect to payment success page
      navigate(`/payment-success?orderId=${order.id}&tx=${transactionId}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to place order";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setPlacing(false);
    }
  };

  // Handle COD payment
  const handleCODPayment = async () => {
    if (!selectedAddress) {
      toast({
        title: "Select address",
        description: "Please select a delivery address",
        variant: "destructive",
      });
      return;
    }

    await createOrderAndRedirect("COD");
  };

  // Handle Razorpay success (after backend verification)
  const handleRazorpaySuccess = async (response: VerifiedPaymentResponse) => {
    if (!selectedAddress) return;

    // Payment is already verified by backend, proceed with order
    const transactionId = response.payment_id;
    await createOrderAndRedirect(transactionId);
  };

  // Handle Razorpay error
  const handleRazorpayError = (error: Error) => {
    toast({
      title: "Payment Failed",
      description: error.message || "Razorpay payment could not be completed",
      variant: "destructive",
    });
  };

  // Loading states
  if (authLoading || cartLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader />
        </div>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="container-main pb-16">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]}
          />

          <h1 className="section-title text-3xl mb-8">Checkout</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* LEFT SIDE */}
            <div className="lg:col-span-2 space-y-8">
              {/* ADDRESS SECTION */}
              <section className="border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading text-xl font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Delivery Address
                  </h2>

                  <button
                    onClick={() => setShowAddAddress(true)}
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Plus className="w-4 h-4" />
                    Add New
                  </button>
                </div>

                {/* Address List */}
                {addresses.length > 0 ? (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <motion.div
                        key={address.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => setSelectedAddress(address)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                          selectedAddress?.id === address.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{address.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {address.address_line1}
                              {address.address_line2 && `, ${address.address_line2}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {address.city}, {address.state} - {address.postal_code}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">Phone: {address.phone}</p>
                          </div>

                          {selectedAddress?.id === address.id && (
                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p>No saved addresses</p>
                )}

                {/* Add Address Form */}
                {showAddAddress && (
                  <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={handleAddAddress}
                    className="mt-6 p-4 bg-secondary/30 rounded-xl space-y-4"
                  >
                    {/* FORM FIELDS */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Full Name"
                        className="input-field"
                        value={newAddress.full_name}
                        onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Phone"
                        className="input-field"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Address Line 1"
                      className="input-field"
                      value={newAddress.address_line1}
                      onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                    />

                    <input
                      type="text"
                      placeholder="Address Line 2"
                      className="input-field"
                      value={newAddress.address_line2}
                      onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                    />

                    <div className="grid md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="City"
                        className="input-field"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="State"
                        className="input-field"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="PIN Code"
                        className="input-field"
                        value={newAddress.postal_code}
                        onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                      />
                    </div>

                    <button className="btn-primary" type="submit">
                      Save Address
                    </button>
                  </motion.form>
                )}
              </section>

              {/* PAYMENT METHOD */}
              <section className="border border-border rounded-xl p-6">
                <h2 className="font-heading text-xl font-semibold mb-6">
                  <CreditCard className="w-5 h-5 text-primary" /> Payment Method
                </h2>

                <div className="space-y-3">
                  <div
                    onClick={() => setPaymentMethod("cod")}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                      paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Banknote className="w-5 h-5 text-muted-foreground" />
                      <p className="font-medium">Cash on Delivery</p>
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentMethod("online")}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                      paymentMethod === "online"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                      <p className="font-medium">Online Payment</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* ORDER SUMMARY */}
            <div className="lg:col-span-1">
              <div className="border border-border rounded-xl p-6 sticky top-24">
                <h2 className="font-heading text-xl font-semibold mb-6">Order Summary</h2>

                <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
                  {cartItems.map((item) => {
                    const price = item.product?.sale_price || item.product?.base_price || 0;
                    return (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-12 h-16 rounded bg-secondary/30 overflow-hidden shrink-0">
                          <img
                            src={item.product?.images?.[0]?.image_url || "/placeholder.svg"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product?.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium">₹{(price * item.quantity).toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3 text-sm border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className={shippingCost === 0 ? "text-green-600" : ""}>
                      {shippingCost === 0 ? "FREE" : `₹${shippingCost}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST (5%)</span>
                    <span>₹{taxAmount.toFixed(0)}</span>
                  </div>

                  <div className="border-t border-border pt-3 mt-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span className="text-primary">₹{totalAmount.toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Action Area */}
                {paymentMethod === "cod" ? (
                  <button
                    onClick={handleCODPayment}
                    disabled={placing || !selectedAddress}
                    className="w-full mt-6 bg-primary text-primary-foreground py-3.5 rounded-full font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {placing ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <>
                        <Banknote className="w-5 h-5" />
                        Place Order (COD)
                      </>
                    )}
                  </button>
                ) : (
                  <div className="mt-6">
                    {placing ? (
                      <div className="w-full py-3.5 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      </div>
                    ) : (
                      <RazorpayButton
                        amount={totalAmount}
                        customerName={selectedAddress?.full_name}
                        customerPhone={selectedAddress?.phone}
                        onSuccess={handleRazorpaySuccess}
                        onError={handleRazorpayError}
                        disabled={!selectedAddress}
                      />
                    )}
                  </div>
                )}

                <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Truck className="w-4 h-4" /> <span>Free Delivery</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> <span>Secure</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
