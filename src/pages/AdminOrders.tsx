import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  ExternalLink,
  Eye,
  Filter,
  History,
  IndianRupee,
  Loader2,
  MapPin,
  Package,
  PackageCheck,
  Phone,
  RefreshCw,
  Search,
  Truck,
  UserRound,
  XCircle,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loader from "@/components/Loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  AdminOrder,
  OrderStatus,
  PaymentStatus,
  ShipmentFormData,
  cancelOrder,
  confirmCODOrder,
  getAdminOrders,
  markOrderDelivered,
  markOrderShipped,
  startProcessingOrder,
  updateTracking,
} from "@/api/adminOrders";

const STATUS_OPTIONS: Array<OrderStatus | "all"> = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const PAYMENT_STATUS_OPTIONS: Array<PaymentStatus | "all"> = ["all", "pending", "paid", "failed", "refunded"];
const PAYMENT_METHOD_OPTIONS = ["all", "razorpay", "cod"] as const;

const STATUS_CLASSES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const PAYMENT_CLASSES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
};

const emptyShipmentForm: ShipmentFormData = {
  provider: "manual",
  courier_name: "",
  awb_code: "",
  tracking_url: "",
  estimated_delivery: "",
};

function formatCurrency(value: number | null | undefined) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "N/A";
  return format(new Date(value), "dd MMM yyyy, hh:mm a");
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  return format(new Date(value), "dd MMM yyyy");
}

function titleCase(value?: string | null) {
  if (!value) return "N/A";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function paymentMethodLabel(method?: string | null) {
  if (!method) return "N/A";
  return method === "cod" ? "COD" : titleCase(method);
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | "all">("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<(typeof PAYMENT_METHOD_OPTIONS)[number]>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [shipmentDialog, setShipmentDialog] = useState<{ mode: "ship" | "tracking"; orderId: string } | null>(null);
  const [shipmentForm, setShipmentForm] = useState<ShipmentFormData>(emptyShipmentForm);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId],
  );

  const shipmentOrder = useMemo(
    () => orders.find((order) => order.id === shipmentDialog?.orderId) || null,
    [orders, shipmentDialog?.orderId],
  );

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          order.order_number,
          order.shipping_name,
          order.shipping_phone,
          order.shipping_city,
          order.shipping_postal_code,
          ...order.items.map((item) => item.product_name),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));

      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesPaymentStatus =
        paymentStatusFilter === "all" || order.payment_status === paymentStatusFilter;
      const matchesPaymentMethod =
        paymentMethodFilter === "all" || order.payment_method === paymentMethodFilter;

      return matchesSearch && matchesStatus && matchesPaymentStatus && matchesPaymentMethod;
    });
  }, [orders, paymentMethodFilter, paymentStatusFilter, searchQuery, statusFilter]);

  const summary = useMemo(() => {
    const todayKey = format(new Date(), "yyyy-MM-dd");
    const todayRevenue = orders
      .filter((order) => order.payment_status === "paid" && format(new Date(order.created_at), "yyyy-MM-dd") === todayKey)
      .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

    return {
      total: orders.length,
      pending: orders.filter((order) => order.status === "pending").length,
      confirmed: orders.filter((order) => order.status === "confirmed").length,
      processing: orders.filter((order) => order.status === "processing").length,
      shipped: orders.filter((order) => order.status === "shipped").length,
      delivered: orders.filter((order) => order.status === "delivered").length,
      paid: orders.filter((order) => order.payment_status === "paid").length,
      cod: orders.filter((order) => order.payment_method === "cod").length,
      todayRevenue,
    };
  }, [orders]);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await getAdminOrders();
      setOrders(data);
    } catch (error) {
      toast({
        title: "Failed to load admin orders",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function runOrderAction(actionKey: string, action: () => Promise<void>, successTitle: string) {
    try {
      setActionLoading(actionKey);
      await action();
      toast({ title: successTitle });
      await loadOrders(true);
    } catch (error) {
      toast({
        title: "Failed to update order",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  }

  function openShipmentForm(order: AdminOrder, mode: "ship" | "tracking") {
    const shipment = order.shipment;
    setShipmentForm({
      provider: shipment?.provider || "manual",
      courier_name: shipment?.courier_name || "",
      awb_code: shipment?.awb_code || "",
      tracking_url: shipment?.tracking_url || "",
      estimated_delivery: shipment?.estimated_delivery || "",
    });
    setShipmentDialog({ mode, orderId: order.id });
  }

  async function submitShipmentForm() {
    if (!shipmentDialog || !shipmentOrder) return;

    if (!shipmentForm.courier_name.trim() || !shipmentForm.awb_code.trim()) {
      toast({
        title: "Missing shipment details",
        description: "Courier name and AWB code are required",
        variant: "destructive",
      });
      return;
    }

    const actionKey = `${shipmentDialog.mode}-${shipmentDialog.orderId}`;
    const action =
      shipmentDialog.mode === "ship"
        ? () => markOrderShipped(shipmentDialog.orderId, shipmentForm)
        : () => updateTracking(shipmentDialog.orderId, shipmentForm);
    const successTitle = shipmentDialog.mode === "ship" ? "Order marked as shipped" : "Tracking details updated";

    await runOrderAction(actionKey, action, successTitle);
    setShipmentDialog(null);
    setShipmentForm(emptyShipmentForm);
  }

  function handleCancel(order: AdminOrder) {
    const note = window.prompt(
      "Cancellation note (optional). Refund and stock restoration are not automated yet.",
      "",
    );

    if (note === null) return;

    runOrderAction(`cancel-${order.id}`, () => cancelOrder(order.id, note || undefined), "Order cancelled");
  }

  function renderStatusBadge(status: string) {
    return <Badge className={STATUS_CLASSES[status] || ""}>{titleCase(status)}</Badge>;
  }

  function renderPaymentBadge(status: string) {
    return <Badge className={PAYMENT_CLASSES[status] || ""}>{titleCase(status)}</Badge>;
  }

  function renderActions(order: AdminOrder) {
    const disabled = Boolean(actionLoading);
    const loadingFor = (key: string) => actionLoading === `${key}-${order.id}`;
    const spinner = <Loader2 className="h-4 w-4 animate-spin" />;

    if (order.status === "delivered") {
      return (
        <Button size="sm" variant="secondary" disabled>
          <CheckCircle2 className="h-4 w-4" />
          Delivered
        </Button>
      );
    }

    if (order.status === "cancelled") {
      return (
        <Button size="sm" variant="secondary" disabled>
          <XCircle className="h-4 w-4" />
          Cancelled
        </Button>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {order.status === "pending" && order.payment_method === "cod" && (
          <Button
            size="sm"
            disabled={disabled}
            onClick={() =>
              runOrderAction(`confirm-${order.id}`, () => confirmCODOrder(order.id), "COD order confirmed")
            }
          >
            {loadingFor("confirm") ? spinner : <CheckCircle2 className="h-4 w-4" />}
            Confirm COD
          </Button>
        )}

        {order.status === "confirmed" && (
          <Button
            size="sm"
            disabled={disabled}
            onClick={() =>
              runOrderAction(
                `processing-${order.id}`,
                () => startProcessingOrder(order.id),
                "Order moved to processing",
              )
            }
          >
            {loadingFor("processing") ? spinner : <PackageCheck className="h-4 w-4" />}
            Start Processing
          </Button>
        )}

        {order.status === "processing" && (
          <Button size="sm" disabled={disabled} onClick={() => openShipmentForm(order, "ship")}>
            {loadingFor("ship") ? spinner : <Truck className="h-4 w-4" />}
            Mark Shipped
          </Button>
        )}

        {order.status === "shipped" && (
          <>
            <Button
              size="sm"
              disabled={disabled}
              onClick={() =>
                runOrderAction(
                  `deliver-${order.id}`,
                  () => markOrderDelivered(order.id),
                  "Order marked as delivered",
                )
              }
            >
              {loadingFor("deliver") ? spinner : <CheckCircle2 className="h-4 w-4" />}
              Mark Delivered
            </Button>
            <Button size="sm" variant="outline" disabled={disabled} onClick={() => openShipmentForm(order, "tracking")}>
              <Truck className="h-4 w-4" />
              Update Tracking
            </Button>
          </>
        )}

        {["pending", "confirmed", "processing"].includes(order.status) && (
          <Button size="sm" variant="destructive" disabled={disabled} onClick={() => handleCancel(order)}>
            {loadingFor("cancel") ? spinner : <XCircle className="h-4 w-4" />}
            Cancel Order
          </Button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container-main py-16 flex justify-center">
          <Loader />
        </div>
        <Footer />
      </div>
    );
  }

  const summaryCards = [
    { label: "Total Orders", value: summary.total, icon: ClipboardList },
    { label: "Pending", value: summary.pending, icon: AlertTriangle },
    { label: "Confirmed", value: summary.confirmed, icon: CheckCircle2 },
    { label: "Processing", value: summary.processing, icon: PackageCheck },
    { label: "Shipped", value: summary.shipped, icon: Truck },
    { label: "Delivered", value: summary.delivered, icon: Package },
    { label: "Paid Orders", value: summary.paid, icon: CreditCard },
    { label: "COD Orders", value: summary.cod, icon: Package },
    { label: "Today Revenue", value: formatCurrency(summary.todayRevenue), icon: IndianRupee },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container-main py-8 md:py-12">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-semibold">Admin Orders</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage order status, shipment tracking, and history.</p>
            </div>
            <Button variant="outline" onClick={() => loadOrders(true)} disabled={refreshing}>
              <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh
            </Button>
          </div>

          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-300">
            Refund and stock restoration are not automated yet.
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">{card.label}</p>
                        <p className="mt-1 text-xl font-semibold">{card.value}</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_180px_190px_180px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search order, customer, phone, product, city, PIN..."
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | "all")}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === "all" ? "All Statuses" : titleCase(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={paymentStatusFilter}
                  onValueChange={(value) => setPaymentStatusFilter(value as PaymentStatus | "all")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === "all" ? "All Payments" : titleCase(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={paymentMethodFilter}
                  onValueChange={(value) => setPaymentMethodFilter(value as (typeof PAYMENT_METHOD_OPTIONS)[number])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="razorpay">Razorpay</SelectItem>
                    <SelectItem value="cod">COD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
                  <h2 className="font-heading text-xl font-medium mb-2">No orders found</h2>
                  <p className="text-muted-foreground">Try adjusting the search or filters.</p>
                </CardContent>
              </Card>
            ) : (
              filteredOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4 md:p-5">
                    <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr_1fr_auto] xl:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <p className="font-semibold">#{order.order_number}</p>
                          {renderStatusBadge(order.status)}
                          {renderPaymentBadge(order.payment_status)}
                          <Badge variant={order.payment_method === "cod" ? "secondary" : "outline"}>
                            {paymentMethodLabel(order.payment_method)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{formatDateTime(order.created_at)}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {order.item_count} item{order.item_count === 1 ? "" : "s"} / {order.total_quantity} qty
                        </p>
                      </div>

                      <div className="space-y-1 text-sm">
                        <p className="font-medium">{order.shipping_name}</p>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {order.shipping_phone}
                        </p>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {order.shipping_city} - {order.shipping_postal_code}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-primary">{formatCurrency(order.total_amount)}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {order.items.map((item) => item.product_name).join(", ") || "No products"}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 xl:min-w-[260px]">
                        {renderActions(order)}
                        <Button variant="outline" size="sm" onClick={() => setSelectedOrderId(order.id)}>
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />

      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order #{selectedOrder.order_number}</DialogTitle>
                <DialogDescription>
                  Placed on {formatDateTime(selectedOrder.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserRound className="h-4 w-4" />
                      Customer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="font-medium">{selectedOrder.shipping_name}</p>
                    <p className="text-muted-foreground">{selectedOrder.shipping_phone}</p>
                    <p className="text-muted-foreground">{selectedOrder.shipping_address}</p>
                    <p className="text-muted-foreground">
                      {selectedOrder.shipping_city}, {selectedOrder.shipping_state} -{" "}
                      {selectedOrder.shipping_postal_code}
                    </p>
                    <p className="text-muted-foreground">{selectedOrder.shipping_country}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Method</span>
                      <span>{paymentMethodLabel(selectedOrder.payment_method)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Payment Status</span>
                      {renderPaymentBadge(selectedOrder.payment_status)}
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-medium">{formatCurrency(selectedOrder.total_amount)}</span>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground">Razorpay Payment ID</p>
                      <p className="font-mono break-all">{selectedOrder.payment?.razorpay_payment_id || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Razorpay Order ID</p>
                      <p className="font-mono break-all">
                        {selectedOrder.payment?.razorpay_order_id || selectedOrder.razorpay_order_id || "N/A"}
                      </p>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Payment Row Status</span>
                      <span>{selectedOrder.payment?.status || "N/A"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Payment Created</span>
                      <span>{formatDateTime(selectedOrder.payment?.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Variant</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell>
                            {item.variant_size || "N/A"} / {item.variant_color || "N/A"}
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.total_price)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Shipment
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Courier</p>
                    <p>{selectedOrder.shipment?.courier_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">AWB Code</p>
                    <p>{selectedOrder.shipment?.awb_code || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Shipment Status</p>
                    <p>{titleCase(selectedOrder.shipment?.status)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Estimated Delivery</p>
                    <p>{formatDate(selectedOrder.shipment?.estimated_delivery)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Shipped At</p>
                    <p>{formatDateTime(selectedOrder.shipment?.shipped_at || selectedOrder.shipped_at)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Delivered At</p>
                    <p>{formatDateTime(selectedOrder.shipment?.delivered_at || selectedOrder.delivered_at)}</p>
                  </div>
                  {selectedOrder.shipment?.tracking_url && (
                    <div className="sm:col-span-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedOrder.shipment.tracking_url} target="_blank" rel="noreferrer">
                          Open Tracking
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4" />
                    History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedOrder.history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No history entries yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedOrder.history.map((entry) => (
                        <div key={entry.id} className="rounded-lg border border-border p-3 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{entry.old_status || "none"}</Badge>
                            <span className="text-muted-foreground">→</span>
                            <Badge variant="outline">{entry.new_status}</Badge>
                            <span className="text-xs text-muted-foreground">{entry.changed_by_type || "system"}</span>
                          </div>
                          {entry.note && <p className="mt-2 text-muted-foreground">{entry.note}</p>}
                          <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(shipmentDialog)} onOpenChange={(open) => !open && setShipmentDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{shipmentDialog?.mode === "tracking" ? "Update Tracking" : "Mark Shipped"}</DialogTitle>
            <DialogDescription>
              {shipmentOrder ? `Order #${shipmentOrder.order_number}` : "Enter shipment details"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="courier_name">Courier Name</Label>
              <Input
                id="courier_name"
                value={shipmentForm.courier_name}
                onChange={(event) => setShipmentForm((current) => ({ ...current, courier_name: event.target.value }))}
                placeholder="Blue Dart, Delhivery, DTDC..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="awb_code">Tracking Number / AWB</Label>
              <Input
                id="awb_code"
                value={shipmentForm.awb_code}
                onChange={(event) => setShipmentForm((current) => ({ ...current, awb_code: event.target.value }))}
                placeholder="AWB or tracking number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tracking_url">Tracking URL</Label>
              <Input
                id="tracking_url"
                value={shipmentForm.tracking_url || ""}
                onChange={(event) => setShipmentForm((current) => ({ ...current, tracking_url: event.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_delivery">Estimated Delivery</Label>
              <Input
                id="estimated_delivery"
                type="date"
                value={shipmentForm.estimated_delivery || ""}
                onChange={(event) =>
                  setShipmentForm((current) => ({ ...current, estimated_delivery: event.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShipmentDialog(null)}>
              Cancel
            </Button>
            <Button onClick={submitShipmentForm} disabled={Boolean(actionLoading)}>
              {actionLoading?.startsWith(shipmentDialog?.mode || "") && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
