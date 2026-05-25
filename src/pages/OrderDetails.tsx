import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, Truck, CheckCircle, XCircle, Clock, MapPin, ArrowLeft, RotateCcw } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuthContext } from "@/contexts/AuthContext";
import { getOrderDetails } from "@/api/orders";
import { ReturnEligibilityResult, checkReturnEligibility } from "@/api/returns";
import { toast } from "@/hooks/use-toast";
import Loader from "@/components/Loader";
import { format } from "date-fns";

const STATUS_STEPS = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function OrderDetails() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const [order, setOrder] = useState<any>(null);
  const [returnEligibility, setReturnEligibility] = useState<ReturnEligibilityResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && orderId) {
      fetchOrderDetails();
    }
  }, [user, orderId]);

  const fetchOrderDetails = async () => {
    try {
      const data = await getOrderDetails(orderId!);
      if (!data) {
        toast({
          title: "Order not found",
          variant: "destructive",
        });
        navigate("/orders");
        return;
      }
      setOrder(data);
      try {
        const eligibility = await checkReturnEligibility(data.id);
        setReturnEligibility(eligibility);
      } catch (eligibilityError) {
        console.error("Error checking return eligibility:", eligibilityError);
        setReturnEligibility(null);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (status: string) => {
    return STATUS_STEPS.findIndex((s) => s.key === status);
  };

  const getProductImage = (item: any) => {
    const rawImages = item?.product?.product_images ?? item?.product?.images ?? [];
    const productImages = Array.isArray(rawImages) ? rawImages : [];
    const validImages = productImages.filter(
      (img: any) => typeof img?.image_url === "string" && img.image_url.trim().length > 0,
    );

    const variantImage = item?.variant_id
      ? validImages.find((img: any) => img?.variant_id && img.variant_id === item.variant_id)
      : undefined;
    if (variantImage?.image_url) return variantImage.image_url;

    const primaryImage = validImages.find((img: any) => img?.is_primary === true);
    if (primaryImage?.image_url) return primaryImage.image_url;

    const firstSortedImage = [...validImages].sort(
      (a: any, b: any) => (a?.sort_order ?? Number.MAX_SAFE_INTEGER) - (b?.sort_order ?? Number.MAX_SAFE_INTEGER),
    )[0];
    return firstSortedImage?.image_url || "/placeholder.svg";
  };

  if (authLoading || loading) {
    return <Loader />;
  }

  if (!order) {
    return null;
  }

  const currentStatusIndex = getStatusIndex(order.status);
  const isCancelled = order.status === "cancelled";
  const existingRequest = returnEligibility?.existingRequest;
  const returnStatusLabel = existingRequest?.status
    ? existingRequest.status.replace(/_/g, " ").replace(/\b\w/g, (letter: string) => letter.toUpperCase())
    : null;
  const showReturnWindowClosed =
    order.status === "delivered" &&
    returnEligibility?.reason === "Return window closed. Returns are allowed within 7 days of delivery.";
  const canRequestReturn = Boolean(returnEligibility?.eligible && order.status === "delivered");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-main py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <Link to="/orders" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Orders
              </Link>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-heading font-semibold">
                  Order #{order.order_number}
                </h1>
                <Badge className={STATUS_COLORS[order.status] || ""}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                Placed on {format(new Date(order.created_at), "dd MMMM yyyy, hh:mm a")}
              </p>
            </div>
          </div>

          {/* Order Status Timeline */}
          {!isCancelled && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="flex justify-between">
                    {STATUS_STEPS.map((step, index) => {
                      const isCompleted = index <= currentStatusIndex;
                      const isCurrent = index === currentStatusIndex;
                      const StepIcon = step.icon;

                      return (
                        <div
                          key={step.key}
                          className="flex flex-col items-center flex-1 relative"
                        >
                          {index < STATUS_STEPS.length - 1 && (
                            <div
                              className={`absolute top-5 left-1/2 w-full h-0.5 ${
                                index < currentStatusIndex ? "bg-primary" : "bg-muted"
                              }`}
                            />
                          )}
                          <div
                            className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                              isCompleted
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            } ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}`}
                          >
                            <StepIcon className="w-5 h-5" />
                          </div>
                          <span
                            className={`mt-2 text-xs text-center ${
                              isCompleted ? "text-foreground font-medium" : "text-muted-foreground"
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cancelled Status */}
          {isCancelled && (
            <Card className="mb-8 border-destructive/50">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-medium text-destructive">Order Cancelled</h3>
                  <p className="text-sm text-muted-foreground">
                    {order.notes?.includes("RETURN REQUEST")
                      ? "Return request has been submitted"
                      : "This order has been cancelled"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Items */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg">
                    Order Items ({order.items?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex gap-4">
                      <Link to={`/product/${item.product?.slug || ""}`}>
                        <div className="w-20 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={getProductImage(item)}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </Link>
                      <div className="flex-1">
                        <Link to={`/product/${item.product?.slug || ""}`}>
                          <h4 className="font-medium hover:text-primary transition-colors">
                            {item.product_name}
                          </h4>
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">
                          Size: {item.variant_size} | Color: {item.variant_color}
                        </p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="font-medium mt-2">₹{item.total_price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary & Shipping */}
            <div className="space-y-6">
              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{order.shipping_name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{order.shipping_address}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
                  </p>
                  <p className="text-sm text-muted-foreground">{order.shipping_country}</p>
                  <p className="text-sm text-muted-foreground mt-2">{order.shipping_phone}</p>
                </CardContent>
              </Card>

              {/* Payment Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{order.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{order.shipping_cost === 0 ? "Free" : `₹${order.shipping_cost}`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (GST)</span>
                    <span>₹{order.tax_amount?.toLocaleString()}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-₹{order.discount_amount.toLocaleString()}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>₹{order.total_amount.toLocaleString()}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment Status</span>
                      <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
                        {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Return / Refund */}
              {order.status === "delivered" && returnEligibility && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">Return / Refund</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {existingRequest ? (
                      <>
                        <p className="font-medium">Return request submitted</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          <Badge variant="secondary">{returnStatusLabel}</Badge>
                        </div>
                        <Button variant="outline" asChild>
                          <Link to="/returns">View Return Request</Link>
                        </Button>
                      </>
                    ) : showReturnWindowClosed ? (
                      <p className="text-sm text-muted-foreground">
                        Return window closed. Returns are allowed within 7 days of delivery.
                      </p>
                    ) : canRequestReturn ? (
                      <Button variant="outline" asChild>
                        <Link to={`/return-request/${order.id}`}>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Request Return / Refund
                        </Link>
                      </Button>
                    ) : returnEligibility.reason ? (
                      <p className="text-sm text-muted-foreground">{returnEligibility.reason}</p>
                    ) : null}
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {order.notes && !order.notes.includes("RETURN REQUEST") && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">Order Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{order.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
