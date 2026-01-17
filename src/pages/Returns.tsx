import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { RotateCcw, Package, CheckCircle, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthContext } from "@/contexts/AuthContext";
import { getReturnableOrders, submitReturnRequest } from "@/api/returns";
import { getOrderDetails } from "@/api/orders";
import { toast } from "@/hooks/use-toast";
import Loader from "@/components/Loader";
import { format } from "date-fns";
import { Link } from "react-router-dom";

const RETURN_REASONS = [
  "Product not as described",
  "Wrong size",
  "Wrong color",
  "Damaged product",
  "Quality not satisfactory",
  "Changed my mind",
  "Other",
];

export default function Returns() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedOrderId = searchParams.get("orderId");
  
  const { user, loading: authLoading } = useAuthContext();
  const [returnableOrders, setReturnableOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    reason: "",
    comments: "",
    refundMethod: "original" as "original" | "store_credit",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchReturnableOrders();
    }
  }, [user]);

  useEffect(() => {
    if (preselectedOrderId && user) {
      fetchPreselectedOrder();
    }
  }, [preselectedOrderId, user]);

  const fetchReturnableOrders = async () => {
    try {
      const data = await getReturnableOrders(user!.id);
      setReturnableOrders(data);
    } catch (error) {
      console.error("Error fetching returnable orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreselectedOrder = async () => {
    try {
      const order = await getOrderDetails(preselectedOrderId!);
      if (order && order.status === "delivered") {
        setSelectedOrder(order);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
    }
  };

  const handleOrderSelect = (orderId: string) => {
    const order = returnableOrders.find((o) => o.id === orderId);
    setSelectedOrder(order || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrder || !formData.reason) {
      toast({
        title: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    
    try {
      await submitReturnRequest({
        orderId: selectedOrder.id,
        reason: formData.reason,
        comments: formData.comments,
        refundMethod: formData.refundMethod,
      });
      
      setSubmitted(true);
      toast({
        title: "Return request submitted",
        description: "We'll process your request within 2-3 business days",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit return request",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getProductImage = (item: any) => {
    const primaryImage = item.product?.images?.find((img: any) => img.is_primary);
    return primaryImage?.image_url || item.product?.images?.[0]?.image_url || "/placeholder.svg";
  };

  if (authLoading || loading) {
    return <Loader />;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container-main py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center"
          >
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-heading font-semibold mb-2">Return Request Submitted</h1>
            <p className="text-muted-foreground mb-6">
              Your return request for Order #{selectedOrder?.order_number} has been submitted successfully.
              We'll review it and get back to you within 2-3 business days.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/orders">
                <Button variant="outline">View Orders</Button>
              </Link>
              <Link to="/">
                <Button>Continue Shopping</Button>
              </Link>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
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
          <div className="flex items-center gap-3 mb-8">
            <RotateCcw className="w-6 h-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-heading font-semibold">Returns & Refunds</h1>
          </div>

          {returnableOrders.length === 0 && !preselectedOrderId ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h2 className="text-xl font-heading font-medium mb-2">No eligible orders</h2>
                <p className="text-muted-foreground mb-6">
                  You don't have any orders eligible for return. Orders can be returned within 15 days of delivery.
                </p>
                <Link to="/orders">
                  <Button variant="outline">View All Orders</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Return Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Request a Return</CardTitle>
                    <CardDescription>
                      Fill out the form below to initiate a return for your order
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Order Selection */}
                      {!preselectedOrderId && (
                        <div className="space-y-2">
                          <Label>Select Order</Label>
                          <Select onValueChange={handleOrderSelect}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose an order to return" />
                            </SelectTrigger>
                            <SelectContent>
                              {returnableOrders.map((order) => (
                                <SelectItem key={order.id} value={order.id}>
                                  Order #{order.order_number} - ₹{order.total_amount.toLocaleString()}
                                  {" "}({format(new Date(order.created_at), "dd MMM yyyy")})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Selected Order Items */}
                      {selectedOrder && (
                        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium">
                            Order #{selectedOrder.order_number}
                          </p>
                          <div className="space-y-2">
                            {selectedOrder.items?.map((item: any) => (
                              <div key={item.id} className="flex items-center gap-3">
                                <div className="w-12 h-14 bg-muted rounded overflow-hidden">
                                  <img
                                    src={getProductImage(item)}
                                    alt={item.product_name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium line-clamp-1">{item.product_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.variant_size} / {item.variant_color} × {item.quantity}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Return Reason */}
                      <div className="space-y-2">
                        <Label>Reason for Return *</Label>
                        <Select
                          value={formData.reason}
                          onValueChange={(value) => setFormData({ ...formData, reason: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a reason" />
                          </SelectTrigger>
                          <SelectContent>
                            {RETURN_REASONS.map((reason) => (
                              <SelectItem key={reason} value={reason}>
                                {reason}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Additional Comments */}
                      <div className="space-y-2">
                        <Label>Additional Comments (Optional)</Label>
                        <Textarea
                          value={formData.comments}
                          onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                          placeholder="Provide more details about your return request..."
                          rows={4}
                        />
                      </div>

                      {/* Refund Method */}
                      <div className="space-y-3">
                        <Label>Preferred Refund Method</Label>
                        <RadioGroup
                          value={formData.refundMethod}
                          onValueChange={(value: "original" | "store_credit") =>
                            setFormData({ ...formData, refundMethod: value })
                          }
                        >
                          <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                            <RadioGroupItem value="original" id="original" />
                            <Label htmlFor="original" className="flex-1 cursor-pointer">
                              <span className="font-medium">Original Payment Method</span>
                              <p className="text-sm text-muted-foreground">
                                Refund to your original payment method (5-7 business days)
                              </p>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                            <RadioGroupItem value="store_credit" id="store_credit" />
                            <Label htmlFor="store_credit" className="flex-1 cursor-pointer">
                              <span className="font-medium">Store Credit</span>
                              <p className="text-sm text-muted-foreground">
                                Get instant store credit for your next purchase
                              </p>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={!selectedOrder || !formData.reason || submitting}
                      >
                        {submitting ? "Submitting..." : "Submit Return Request"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Return Policy */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">Return Policy</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p>Returns accepted within 15 days of delivery</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p>Items must be unused and in original packaging</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p>Free pickup for all return requests</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p>Refunds processed within 5-7 business days</p>
                    </div>
                    <div className="flex items-start gap-3 pt-4 border-t border-border">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">
                        Custom-made or altered items are not eligible for return
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">Need Help?</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p className="mb-3">
                      If you have any questions about returns, please contact our customer support.
                    </p>
                    <p>Email: support@kalamandir.com</p>
                    <p>Phone: +91 98765 43210</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}