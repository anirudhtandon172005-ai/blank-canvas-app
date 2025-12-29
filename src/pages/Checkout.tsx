import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Plus, Check, CreditCard, Banknote, Truck, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import Loader from "@/components/Loader";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { getAddresses, addAddress } from "@/api/auth";
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
  const { user } = useAuth();
  const { cart, loading: cartLoading, cartTotal, emptyCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  // New address form
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

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    async function fetchAddresses() {
      try {
        const data = await getAddresses();
        setAddresses(data);
        const defaultAddr = data.find((a: Address) => a.is_default) || data[0];
        setSelectedAddress(defaultAddr || null);
      } catch (error) {
        console.error("Error fetching addresses:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAddresses();
  }, [user, navigate]);

  const cartItems = cart?.items || [];
  const shippingCost = cartTotal >= 2000 ? 0 : 99;
  const taxAmount = cartTotal * 0.05;
  const totalAmount = cartTotal + shippingCost + taxAmount;

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAddress.full_name || !newAddress.phone || !newAddress.address_line1 || 
        !newAddress.city || !newAddress.state || !newAddress.postal_code) {
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

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast({
        title: "Select address",
        description: "Please select a delivery address",
        variant: "destructive",
      });
      return;
    }

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
      navigate(`/orders/${order.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    } finally {
      setPlacing(false);
    }
  };

  if (!user || cartLoading || loading) {
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
          <Breadcrumbs items={[
            { label: "Home", href: "/" },
            { label: "Cart", href: "/cart" },
            { label: "Checkout" },
          ]} />

          <h1 className="section-title text-3xl mb-8">Checkout</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Delivery Address */}
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

                {addresses.length === 0 && !showAddAddress ? (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-4">No saved addresses</p>
                    <button
                      onClick={() => setShowAddAddress(true)}
                      className="btn-primary"
                    >
                      Add Address
                    </button>
                  </div>
                ) : (
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
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{address.full_name}</span>
                              {address.label && (
                                <span className="text-xs px-2 py-0.5 bg-secondary rounded-full">
                                  {address.label}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {address.address_line1}
                              {address.address_line2 && `, ${address.address_line2}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {address.city}, {address.state} - {address.postal_code}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Phone: {address.phone}
                            </p>
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
                )}

                {/* Add Address Form */}
                {showAddAddress && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    onSubmit={handleAddAddress}
                    className="mt-6 p-4 bg-secondary/30 rounded-xl space-y-4"
                  >
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={newAddress.full_name}
                          onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                          className="input-field"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone *</label>
                        <input
                          type="tel"
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                          className="input-field"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Address Line 1 *</label>
                      <input
                        type="text"
                        value={newAddress.address_line1}
                        onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                        className="input-field"
                        placeholder="House/Flat No, Building Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Address Line 2</label>
                      <input
                        type="text"
                        value={newAddress.address_line2}
                        onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                        className="input-field"
                        placeholder="Street, Locality"
                      />
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">City *</label>
                        <input
                          type="text"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          className="input-field"
                          placeholder="Mumbai"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">State *</label>
                        <input
                          type="text"
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                          className="input-field"
                          placeholder="Maharashtra"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">PIN Code *</label>
                        <input
                          type="text"
                          value={newAddress.postal_code}
                          onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                          className="input-field"
                          placeholder="400001"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Label (Optional)</label>
                      <input
                        type="text"
                        value={newAddress.label}
                        onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                        className="input-field"
                        placeholder="Home, Office, etc."
                      />
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" className="btn-primary">
                        Save Address
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddAddress(false)}
                        className="btn-subtle"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.form>
                )}
              </section>

              {/* Payment Method */}
              <section className="border border-border rounded-xl p-6">
                <h2 className="font-heading text-xl font-semibold flex items-center gap-2 mb-6">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Payment Method
                </h2>

                <div className="space-y-3">
                  <div
                    onClick={() => setPaymentMethod("cod")}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                      paymentMethod === "cod"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === "cod" ? "border-primary" : "border-muted-foreground"
                      }`}>
                        {paymentMethod === "cod" && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </div>
                      <Banknote className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Cash on Delivery</p>
                        <p className="text-sm text-muted-foreground">Pay when you receive</p>
                      </div>
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
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === "online" ? "border-primary" : "border-muted-foreground"
                      }`}>
                        {paymentMethod === "online" && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </div>
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Online Payment</p>
                        <p className="text-sm text-muted-foreground">UPI, Cards, Net Banking</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="border border-border rounded-xl p-6 sticky top-24">
                <h2 className="font-heading text-xl font-semibold mb-6">Order Summary</h2>

                {/* Items Preview */}
                <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
                  {cartItems.map((item: any) => {
                    const price = item.product?.sale_price || item.product?.base_price || 0;
                    return (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-12 h-16 rounded bg-secondary/30 overflow-hidden shrink-0">
                          <img
                            src={item.product?.images?.[0]?.image_url || "/placeholder.svg"}
                            alt={item.product?.name}
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

                <button
                  onClick={handlePlaceOrder}
                  disabled={placing || !selectedAddress}
                  className="w-full mt-6 bg-primary text-primary-foreground py-3.5 rounded-full font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {placing ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    "Place Order"
                  )}
                </button>

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    <span>Free Delivery</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Secure</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
