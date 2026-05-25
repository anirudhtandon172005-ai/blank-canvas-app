import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, ExternalLink, ImageIcon, RotateCcw, Trash2, Upload } from "lucide-react";
import { format } from "date-fns";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  CreateReturnRequestResult,
  PreferredResolution,
  ReturnEligibilityResult,
  ReturnOrderItem,
  checkReturnEligibility,
  createReturnRequest,
} from "@/api/returns";

const REASONS = [
  "Wrong item received",
  "Damaged product",
  "Defective product",
  "Color/design different from expected",
  "Quality issue",
  "Blouse/stitching issue",
  "Other",
];

const RESOLUTION_OPTIONS: Array<{ label: string; value: PreferredResolution }> = [
  { label: "Refund", value: "refund" },
  { label: "Exchange", value: "exchange" },
  { label: "Store Credit", value: "store_credit" },
  { label: "Other", value: "other" },
];

const STATUS_LABELS: Record<string, string> = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  received: "Received",
  refund_processing: "Refund Processing",
  refunded: "Refunded",
  closed: "Closed",
  cancelled: "Cancelled",
};

const STATUS_CLASSES: Record<string, string> = {
  requested: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  received: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  refund_processing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  refunded: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  closed: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  cancelled: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
};

interface LocalImage {
  file: File;
  previewUrl: string;
}

function clampQuantity(value: number, max: number) {
  if (Number.isNaN(value)) return 1;
  if (value < 1) return 1;
  if (value > max) return max;
  return value;
}

export default function ReturnRequest() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eligibility, setEligibility] = useState<ReturnEligibilityResult | null>(null);
  const [selectedItemMap, setSelectedItemMap] = useState<Record<string, boolean>>({});
  const [quantityMap, setQuantityMap] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [preferredResolution, setPreferredResolution] = useState<PreferredResolution>("refund");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<LocalImage[]>([]);
  const [result, setResult] = useState<CreateReturnRequestResult | null>(null);
  const imagesRef = useRef<LocalImage[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    let active = true;

    async function loadEligibility() {
      if (!user || !orderId) return;

      try {
        setLoading(true);
        const response = await checkReturnEligibility(orderId);
        if (!active) return;

        setEligibility(response);

        if (response.items?.length) {
          const initialSelected = response.items.reduce<Record<string, boolean>>((acc, item) => {
            acc[item.id] = true;
            return acc;
          }, {});

          const initialQuantities = response.items.reduce<Record<string, number>>((acc, item) => {
            acc[item.id] = item.quantity;
            return acc;
          }, {});

          setSelectedItemMap(initialSelected);
          setQuantityMap(initialQuantities);
        }
      } catch (error) {
        if (!active) return;
        toast({
          title: "Failed to load return details",
          description: error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        });
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEligibility();

    return () => {
      active = false;
    };
  }, [user, orderId]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  const order = eligibility?.order;
  const items = eligibility?.items || [];
  const existingRequest = eligibility?.existingRequest;
  const selectedItems = useMemo(
    () =>
      items
        .filter((item) => selectedItemMap[item.id])
        .map((item) => ({
          orderItemId: item.id,
          quantity: quantityMap[item.id] || item.quantity,
        })),
    [items, quantityMap, selectedItemMap],
  );

  const whatsappUrl = useMemo(() => {
    if (!result?.request || !order) return null;

    const rawNumber = import.meta.env.VITE_SUPPORT_WHATSAPP_NUMBER as string | undefined;
    if (!rawNumber) return null;

    const number = rawNumber.replace(/[^\d]/g, "");
    if (!number) return null;

    const message = [
      "Hello Kala Mandir team, I submitted a return/refund request.",
      `Order: ${order.order_number}`,
      `Return Request ID: ${result.request.id}`,
      `Reason: ${result.request.reason}`,
      "Please help me with the next steps.",
    ].join("\n");

    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }, [order, result?.request]);

  const returnStatusLabel = existingRequest?.status
    ? STATUS_LABELS[existingRequest.status] || existingRequest.status
    : null;

  function onToggleItem(itemId: string, checked: boolean | "indeterminate") {
    setSelectedItemMap((prev) => ({
      ...prev,
      [itemId]: checked === true,
    }));
  }

  function onQuantityChange(item: ReturnOrderItem, value: string) {
    const nextQuantity = clampQuantity(Number.parseInt(value, 10), item.quantity);
    setQuantityMap((prev) => ({
      ...prev,
      [item.id]: nextQuantity,
    }));
  }

  function onAddImages(files: FileList | null) {
    if (!files?.length) return;

    const incoming = Array.from(files);
    if (images.length + incoming.length > 4) {
      toast({
        title: "Invalid image file",
        description: "You can upload up to 4 images",
        variant: "destructive",
      });
      return;
    }

    for (let i = 0; i < incoming.length; i += 1) {
      const file = incoming[i];
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid image file",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: `${file.name} exceeds 5 MB`,
          variant: "destructive",
        });
        return;
      }
    }

    const nextImages = incoming.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...nextImages]);
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const image = prev[index];
      if (image) URL.revokeObjectURL(image.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!order) {
      toast({
        title: "Order not found",
        variant: "destructive",
      });
      return;
    }

    if (!eligibility?.eligible) {
      toast({
        title: "Not eligible",
        description: eligibility?.reason || "This order is not eligible for return",
        variant: "destructive",
      });
      return;
    }

    if (!selectedItems.length) {
      toast({
        title: "Select at least one item",
        variant: "destructive",
      });
      return;
    }

    if (!reason) {
      toast({
        title: "Please select a reason",
        variant: "destructive",
      });
      return;
    }

    if (description.trim().length < 20) {
      toast({
        title: "Description too short",
        description: "Please enter at least 20 characters",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const response = await createReturnRequest({
        orderId: order.id,
        reason,
        description,
        preferredResolution,
        items: selectedItems,
        images: images.map((image) => image.file),
      });

      setResult(response);

      toast({
        title: "Return request submitted",
      });

      if (response.imageUploadWarning) {
        toast({
          title: "Failed to upload image",
          description: response.imageUploadWarning,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to submit request",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loading) {
    return <Loader />;
  }

  if (!orderId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container-main py-16">
          <Card className="max-w-xl mx-auto">
            <CardContent className="py-8 text-center">
              <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
              <p className="font-medium">Order not found</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (result?.request && order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container-main py-12">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-5 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-heading font-semibold mb-2">
                Return request submitted
              </h1>
              <p className="text-muted-foreground mb-2">
                Your return/refund request has been submitted. Our team will review it within 24–48 hours.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Request ID: <span className="font-mono">{result.request.id}</span>
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button asChild>
                  <Link to={`/order/${order.id}`}>View Order</Link>
                </Button>
                {whatsappUrl ? (
                  <Button variant="outline" asChild>
                    <a href={whatsappUrl} target="_blank" rel="noreferrer">
                      Contact on WhatsApp
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">WhatsApp support number is not configured.</p>
                )}
              </div>
            </CardContent>
          </Card>
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
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-8"
        >
          <div className="flex items-center gap-3">
            <RotateCcw className="w-6 h-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-heading font-semibold">Request Return / Refund</h1>
          </div>

          {existingRequest && (
            <Card className="border-primary/40">
              <CardContent className="py-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">Return request already submitted</p>
                    <p className="text-sm text-muted-foreground">Status: {returnStatusLabel}</p>
                  </div>
                  <Badge className={STATUS_CLASSES[existingRequest.status] || ""}>
                    {returnStatusLabel}
                  </Badge>
                </div>
                <div className="mt-4">
                  <Button variant="outline" asChild>
                    <Link to="/returns">View Return Request</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!eligibility?.eligible && !existingRequest && eligibility?.reason && (
            <Card className="border-destructive/40">
              <CardContent className="py-5">
                <p className="font-medium">{eligibility.reason}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Return / Refund Policy</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Returns/refunds are accepted within 7 days of delivery.</p>
              <p>Item must be unused, unwashed, undamaged, and with original packaging/tags.</p>
              <p>Refund approval is subject to inspection.</p>
              <p>No return if blouse piece is cut or stitched.</p>
              <p>Minor color differences due to screen/display may not qualify as a defect.</p>
              <p>Our team may contact you on WhatsApp/phone for verification.</p>
            </CardContent>
          </Card>

          {order && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order Number</p>
                  <p className="font-medium">#{order.order_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Delivered At</p>
                  <p className="font-medium">
                    {order.delivered_at ? format(new Date(order.delivered_at), "dd MMM yyyy, hh:mm a") : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{order.shipping_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-medium">₹{order.total_amount.toLocaleString("en-IN")}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {eligibility?.eligible && !existingRequest && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Return Details</CardTitle>
                <CardDescription>
                  Select items and share the issue details for quick verification.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-3">
                    <Label>Items</Label>
                    {items.map((item) => (
                      <div key={item.id} className="border border-border rounded-lg p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={Boolean(selectedItemMap[item.id])}
                            onCheckedChange={(checked) => onToggleItem(item.id, checked)}
                            id={`item-${item.id}`}
                          />
                          <div className="flex-1">
                            <label htmlFor={`item-${item.id}`} className="font-medium cursor-pointer">
                              {item.product_name}
                            </label>
                            <p className="text-sm text-muted-foreground">
                              Size: {item.variant_size || "-"} | Color: {item.variant_color || "-"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Ordered Qty: {item.quantity} | Unit Price: ₹{item.unit_price.toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>
                        <div className="max-w-[160px]">
                          <Label htmlFor={`qty-${item.id}`} className="text-xs text-muted-foreground">
                            Return Quantity
                          </Label>
                          <Input
                            id={`qty-${item.id}`}
                            type="number"
                            min={1}
                            max={item.quantity}
                            value={quantityMap[item.id] || 1}
                            onChange={(event) => onQuantityChange(item, event.target.value)}
                            disabled={!selectedItemMap[item.id]}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Reason</Label>
                      <Select value={reason} onValueChange={setReason}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                        <SelectContent>
                          {REASONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Preferred Resolution</Label>
                      <Select
                        value={preferredResolution}
                        onValueChange={(value) => setPreferredResolution(value as PreferredResolution)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select resolution" />
                        </SelectTrigger>
                        <SelectContent>
                          {RESOLUTION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Please explain the issue clearly..."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">Minimum 20 characters</p>
                  </div>

                  <div className="space-y-3">
                    <Label>Upload Evidence (up to 4 images, max 5 MB each)</Label>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(event) => {
                            onAddImages(event.target.files);
                            event.currentTarget.value = "";
                          }}
                        />
                        <span className="inline-flex items-center gap-2 h-10 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm font-medium">
                          <Upload className="w-4 h-4" />
                          Add Images
                        </span>
                      </label>
                      <span className="text-xs text-muted-foreground">{images.length}/4 selected</span>
                    </div>

                    {images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {images.map((image, index) => (
                          <div key={`${image.file.name}-${index}`} className="relative border rounded-lg overflow-hidden">
                            <img
                              src={image.previewUrl}
                              alt={image.file.name}
                              className="w-full h-28 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-background/90 p-1 rounded-md border hover:bg-background"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <div className="px-2 py-1 bg-background text-[10px] text-muted-foreground truncate">
                              {image.file.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {images.length === 0 && (
                      <div className="border border-dashed rounded-lg p-6 text-center text-sm text-muted-foreground">
                        <ImageIcon className="w-5 h-5 mx-auto mb-2" />
                        Add images to help verify your request faster.
                      </div>
                    )}
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                    {submitting ? "Submitting..." : "Submit Return Request"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
