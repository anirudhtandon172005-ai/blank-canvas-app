import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  BadgeIndianRupee,
  CheckCircle2,
  Eye,
  Loader2,
  PackageSearch,
  RefreshCw,
  Search,
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  AdminReturnRequestDetail,
  AdminReturnRequestListItem,
  PreferredResolution,
  RefundMethod,
  ReturnRequestStatus,
  approveReturnRequest,
  closeReturnRequest,
  getAdminReturnRequestDetails,
  getAdminReturnRequests,
  markRefundProcessing,
  markReturnReceived,
  markReturnRefunded,
  rejectReturnRequest,
} from "@/api/adminReturns";
import {
  AdminContactRequest,
  ContactRequestStatus,
  approveContactRequest,
  closeContactRequest,
  getAdminContactRequestDetails,
  getAdminContactRequests,
  rejectContactRequest,
  updateContactRequestAdminNote,
} from "@/api/adminContactRequests";

const STATUS_OPTIONS: Array<ReturnRequestStatus | "all"> = [
  "all",
  "requested",
  "approved",
  "rejected",
  "received",
  "refund_processing",
  "refunded",
  "closed",
  "cancelled",
];

const RESOLUTION_OPTIONS: Array<PreferredResolution | "all"> = ["all", "refund", "exchange", "store_credit", "other"];
const REFUND_METHOD_OPTIONS: RefundMethod[] = [
  "razorpay_dashboard",
  "upi",
  "bank_transfer",
  "qr",
  "cash",
  "store_credit",
  "other",
];

const STATUS_LABELS: Record<ReturnRequestStatus, string> = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  received: "Received",
  refund_processing: "Refund Processing",
  refunded: "Refunded",
  closed: "Closed",
  cancelled: "Cancelled",
};

const STATUS_CLASSES: Record<ReturnRequestStatus, string> = {
  requested: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  received: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  refund_processing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  refunded: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  closed: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  cancelled: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
};

const RESOLUTION_LABELS: Record<PreferredResolution, string> = {
  refund: "Refund",
  exchange: "Exchange",
  store_credit: "Store Credit",
  other: "Other",
};

const REFUND_METHOD_LABELS: Record<RefundMethod, string> = {
  razorpay_dashboard: "Razorpay Dashboard",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  qr: "QR",
  cash: "Cash",
  store_credit: "Store Credit",
  other: "Other",
};

const CONTACT_STATUS_OPTIONS: Array<ContactRequestStatus | "all"> = ["all", "requested", "approved", "rejected", "closed"];

const CONTACT_STATUS_LABELS: Record<ContactRequestStatus, string> = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  closed: "Closed",
};

const CONTACT_STATUS_CLASSES: Record<ContactRequestStatus, string> = {
  requested: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  closed: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
};

function formatDateTime(value?: string | null) {
  if (!value) return "N/A";
  return format(new Date(value), "dd MMM yyyy, hh:mm a");
}

function formatCurrency(value: number | null | undefined) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function shortId(value: string) {
  return value.slice(0, 8).toUpperCase();
}

function getStatusLabel(status: ReturnRequestStatus) {
  return STATUS_LABELS[status] || status;
}

function getResolutionLabel(resolution: PreferredResolution) {
  return RESOLUTION_LABELS[resolution] || resolution;
}

function getRefundMethodLabel(method: RefundMethod) {
  return REFUND_METHOD_LABELS[method] || method;
}

function parseRefundAmount(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Missing refund amount");
  }
  return parsed;
}

export default function AdminReturns() {
  const [activeTab, setActiveTab] = useState<"returns" | "contacts">("returns");
  const [requests, setRequests] = useState<AdminReturnRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReturnRequestStatus | "all">("all");
  const [resolutionFilter, setResolutionFilter] = useState<PreferredResolution | "all">("all");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<AdminReturnRequestDetail | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundMethod, setRefundMethod] = useState<RefundMethod | "">("");
  const [contactRequests, setContactRequests] = useState<AdminContactRequest[]>([]);
  const [contactLoading, setContactLoading] = useState(true);
  const [contactRefreshing, setContactRefreshing] = useState(false);
  const [contactDetailsLoading, setContactDetailsLoading] = useState(false);
  const [contactActionLoading, setContactActionLoading] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [contactStatusFilter, setContactStatusFilter] = useState<ContactRequestStatus | "all">("all");
  const [selectedContactRequestId, setSelectedContactRequestId] = useState<string | null>(null);
  const [selectedContactDetails, setSelectedContactDetails] = useState<AdminContactRequest | null>(null);
  const [contactAdminNote, setContactAdminNote] = useState("");

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      const matchesResolution =
        resolutionFilter === "all" || request.preferred_resolution === resolutionFilter;

      if (!query) {
        return matchesStatus && matchesResolution;
      }

      const fields = [
        request.id,
        request.order?.order_number || "",
        request.order?.shipping_name || "",
        request.order?.shipping_phone || "",
        request.reason,
        request.preferred_resolution,
      ];

      const matchesSearch = fields.some((value) => value.toLowerCase().includes(query));
      return matchesStatus && matchesResolution && matchesSearch;
    });
  }, [requests, resolutionFilter, searchQuery, statusFilter]);

  const summary = useMemo(() => {
    const counts: Record<ReturnRequestStatus, number> = {
      requested: 0,
      approved: 0,
      rejected: 0,
      received: 0,
      refund_processing: 0,
      refunded: 0,
      closed: 0,
      cancelled: 0,
    };

    requests.forEach((request) => {
      counts[request.status] = (counts[request.status] || 0) + 1;
    });

    return {
      total: requests.length,
      ...counts,
    };
  }, [requests]);

  const filteredContactRequests = useMemo(() => {
    const query = contactSearchQuery.trim().toLowerCase();

    return contactRequests.filter((request) => {
      const matchesStatus = contactStatusFilter === "all" || request.status === contactStatusFilter;
      if (!query) return matchesStatus;

      const fields = [
        request.id,
        request.name || "",
        request.email || "",
        request.phone || "",
        request.reason || "",
        request.note || "",
      ];

      const matchesSearch = fields.some((value) => value.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [contactRequests, contactSearchQuery, contactStatusFilter]);

  const contactSummary = useMemo(() => {
    const counts: Record<ContactRequestStatus, number> = {
      requested: 0,
      approved: 0,
      rejected: 0,
      closed: 0,
    };

    contactRequests.forEach((request) => {
      counts[request.status] = (counts[request.status] || 0) + 1;
    });

    return {
      total: contactRequests.length,
      ...counts,
    };
  }, [contactRequests]);

  useEffect(() => {
    loadRequests();
    loadContactRequests();
  }, []);

  async function loadRequests(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await getAdminReturnRequests({ limit: 50 });
      setRequests(data);
    } catch (error) {
      toast({
        title: "Failed to load returns",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadContactRequests(isRefresh = false) {
    try {
      if (isRefresh) setContactRefreshing(true);
      else setContactLoading(true);

      const data = await getAdminContactRequests({ limit: 50 });
      setContactRequests(data);
    } catch (error) {
      toast({
        title: "Failed to load contact requests",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setContactLoading(false);
      setContactRefreshing(false);
    }
  }

  async function loadDetails(returnRequestId: string) {
    try {
      setDetailsLoading(true);
      const details = await getAdminReturnRequestDetails(returnRequestId);
      setSelectedDetails(details);
      setAdminNote(details.request.admin_note || "");
      setRefundAmount(
        details.request.refund_amount !== null && details.request.refund_amount !== undefined
          ? String(details.request.refund_amount)
          : "",
      );
      setRefundMethod((details.request.refund_method as RefundMethod | null) || "");
    } catch (error) {
      toast({
        title: "Failed to load return request",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setDetailsLoading(false);
    }
  }

  async function openReview(returnRequestId: string) {
    setSelectedRequestId(returnRequestId);
    await loadDetails(returnRequestId);
  }

  async function openContactReview(contactRequestId: string) {
    setSelectedContactRequestId(contactRequestId);
    try {
      setContactDetailsLoading(true);
      const details = await getAdminContactRequestDetails(contactRequestId);
      setSelectedContactDetails(details);
      setContactAdminNote(details.admin_note || "");
    } catch (error) {
      toast({
        title: "Failed to load contact request",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setContactDetailsLoading(false);
    }
  }

  function closeReviewModal(open: boolean) {
    if (!open) {
      setSelectedRequestId(null);
      setSelectedDetails(null);
      setAdminNote("");
      setRefundAmount("");
      setRefundMethod("");
    }
  }

  function closeContactReviewModal(open: boolean) {
    if (!open) {
      setSelectedContactRequestId(null);
      setSelectedContactDetails(null);
      setContactAdminNote("");
    }
  }

  async function refreshAllAfterAction() {
    await loadRequests(true);
    if (selectedRequestId) {
      await loadDetails(selectedRequestId);
    }
  }

  async function runAction(action: () => Promise<unknown>, successTitle: string) {
    try {
      setActionLoading(true);
      await action();
      toast({ title: successTitle });
      await refreshAllAfterAction();
    } catch (error) {
      toast({
        title: "Failed to update request",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function refreshContactsAfterAction() {
    await loadContactRequests(true);
    if (selectedContactRequestId) {
      const details = await getAdminContactRequestDetails(selectedContactRequestId);
      setSelectedContactDetails(details);
      setContactAdminNote(details.admin_note || "");
    }
  }

  async function runContactAction(action: () => Promise<unknown>, successTitle: string) {
    try {
      setContactActionLoading(true);
      await action();
      toast({ title: successTitle });
      await refreshContactsAfterAction();
    } catch (error) {
      toast({
        title: "Failed to update contact request",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setContactActionLoading(false);
    }
  }

  function renderMainAction() {
    if (!selectedDetails) return null;
    const request = selectedDetails.request;

    if (request.status === "requested") {
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={actionLoading}
            onClick={() =>
              runAction(
                () => approveReturnRequest(request.id, adminNote || undefined),
                "Return request approved",
              )
            }
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Approve
          </Button>
          <Button
            variant="destructive"
            disabled={actionLoading}
            onClick={() =>
              runAction(() => rejectReturnRequest(request.id, adminNote), "Return request rejected")
            }
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Reject
          </Button>
        </div>
      );
    }

    if (request.status === "approved") {
      return (
        <Button
          disabled={actionLoading}
          onClick={() =>
            runAction(
              () => markReturnReceived(request.id, adminNote || undefined),
              "Return marked as received",
            )
          }
        >
          {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Mark Item Received
        </Button>
      );
    }

    if (request.status === "received") {
      return (
        <Button
          disabled={actionLoading}
          onClick={() =>
            runAction(() => {
              const amount = parseRefundAmount(refundAmount);
              if (!refundMethod) throw new Error("Missing refund method");
              return markRefundProcessing(request.id, amount, refundMethod, adminNote || undefined);
            }, "Refund marked as processing")
          }
        >
          {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeIndianRupee className="h-4 w-4" />}
          Mark Refund Processing
        </Button>
      );
    }

    if (request.status === "refund_processing") {
      return (
        <Button
          disabled={actionLoading}
          onClick={() =>
            runAction(() => {
              const amount = parseRefundAmount(refundAmount);
              if (!refundMethod) throw new Error("Missing refund method");
              return markReturnRefunded(request.id, amount, refundMethod, adminNote || undefined);
            }, "Return marked as refunded")
          }
        >
          {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Mark Refunded
        </Button>
      );
    }

    if (request.status === "refunded") {
      return (
        <Button
          disabled={actionLoading}
          onClick={() =>
            runAction(
              () => closeReturnRequest(request.id, adminNote || undefined),
              "Return request closed",
            )
          }
        >
          {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Close Request
        </Button>
      );
    }

    return <p className="text-sm text-muted-foreground">No main action available for this status.</p>;
  }

  function renderContactMainAction() {
    if (!selectedContactDetails) return null;

    if (selectedContactDetails.status === "requested") {
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={contactActionLoading}
            onClick={() =>
              runContactAction(
                () => approveContactRequest(selectedContactDetails.id, contactAdminNote || undefined),
                "Contact request approved",
              )
            }
          >
            {contactActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Approve
          </Button>
          <Button
            variant="destructive"
            disabled={contactActionLoading}
            onClick={() =>
              runContactAction(
                () => rejectContactRequest(selectedContactDetails.id, contactAdminNote || undefined),
                "Contact request rejected",
              )
            }
          >
            {contactActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Reject
          </Button>
        </div>
      );
    }

    if (selectedContactDetails.status === "approved" || selectedContactDetails.status === "rejected") {
      return (
        <Button
          disabled={contactActionLoading}
          onClick={() =>
            runContactAction(
              () => closeContactRequest(selectedContactDetails.id, contactAdminNote || undefined),
              "Contact request closed",
            )
          }
        >
          {contactActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Close
        </Button>
      );
    }

    return <p className="text-sm text-muted-foreground">No main action available for this status.</p>;
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
    { label: "Total Requests", value: summary.total },
    { label: "Requested", value: summary.requested },
    { label: "Approved", value: summary.approved },
    { label: "Rejected", value: summary.rejected },
    { label: "Received", value: summary.received },
    { label: "Refund Processing", value: summary.refund_processing },
    { label: "Refunded", value: summary.refunded },
    { label: "Closed", value: summary.closed },
  ];

  const contactSummaryCards = [
    { label: "Total Requests", value: contactSummary.total },
    { label: "Requested", value: contactSummary.requested },
    { label: "Approved", value: contactSummary.approved },
    { label: "Rejected", value: contactSummary.rejected },
    { label: "Closed", value: contactSummary.closed },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container-main py-8 md:py-12">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-semibold">Admin Returns</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Review and manage customer return/refund requests.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => (activeTab === "returns" ? loadRequests(true) : loadContactRequests(true))}
              disabled={activeTab === "returns" ? refreshing : contactRefreshing}
            >
              <RefreshCw
                className={
                  activeTab === "returns"
                    ? refreshing
                      ? "h-4 w-4 animate-spin"
                      : "h-4 w-4"
                    : contactRefreshing
                      ? "h-4 w-4 animate-spin"
                      : "h-4 w-4"
                }
              />
              Refresh
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "returns" | "contacts")}>
            <TabsList>
              <TabsTrigger value="returns">Returns</TabsTrigger>
              <TabsTrigger value="contacts">Contact Requests</TabsTrigger>
            </TabsList>

            <TabsContent value="returns" className="space-y-6">
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-300">
                This panel tracks manual refunds only. It does not send money automatically.
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryCards.map((card) => (
                  <Card key={card.label}>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{card.label}</p>
                      <p className="mt-1 text-2xl font-semibold">{card.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search request, order, customer, phone, reason..."
                        className="pl-10"
                      />
                    </div>

                    <Select
                      value={statusFilter}
                      onValueChange={(value) => setStatusFilter(value as ReturnRequestStatus | "all")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status === "all" ? "All Statuses" : getStatusLabel(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={resolutionFilter}
                      onValueChange={(value) => setResolutionFilter(value as PreferredResolution | "all")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Preferred resolution" />
                      </SelectTrigger>
                      <SelectContent>
                        {RESOLUTION_OPTIONS.map((resolution) => (
                          <SelectItem key={resolution} value={resolution}>
                            {resolution === "all" ? "All Resolutions" : getResolutionLabel(resolution)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Latest Requests (max 50)</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  {filteredRequests.length === 0 ? (
                    <div className="py-12 text-center">
                      <PackageSearch className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                      <p className="text-muted-foreground">No return requests found for current filters.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Request ID</TableHead>
                            <TableHead>Order Number</TableHead>
                            <TableHead>Customer Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Preferred Resolution</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Requested Date</TableHead>
                            <TableHead>Image Count</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRequests.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">{shortId(request.id)}</TableCell>
                              <TableCell>{request.order?.order_number || "N/A"}</TableCell>
                              <TableCell>{request.order?.shipping_name || "N/A"}</TableCell>
                              <TableCell>{request.order?.shipping_phone || "N/A"}</TableCell>
                              <TableCell>{request.reason}</TableCell>
                              <TableCell>{getResolutionLabel(request.preferred_resolution)}</TableCell>
                              <TableCell>
                                <Badge className={STATUS_CLASSES[request.status] || ""}>
                                  {getStatusLabel(request.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDateTime(request.requested_at || request.created_at)}</TableCell>
                              <TableCell>{request.image_count}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => openReview(request.id)}>
                                  <Eye className="h-4 w-4" />
                                  Review
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-6">
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
                Contact requests are managed manually from this panel. Approval does not trigger email in this phase.
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {contactSummaryCards.map((card) => (
                  <Card key={card.label}>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{card.label}</p>
                      <p className="mt-1 text-2xl font-semibold">{card.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={contactSearchQuery}
                        onChange={(event) => setContactSearchQuery(event.target.value)}
                        placeholder="Search by request, name, email, phone, reason..."
                        className="pl-10"
                      />
                    </div>

                    <Select
                      value={contactStatusFilter}
                      onValueChange={(value) => setContactStatusFilter(value as ContactRequestStatus | "all")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status === "all" ? "All Statuses" : CONTACT_STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Latest Contact Requests (max 50)</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  {contactLoading ? (
                    <div className="py-10 flex items-center justify-center">
                      <div className="flex items-center gap-2 text-muted-foreground" role="status" aria-label="Loading contact requests">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="sr-only">Loading contact requests</span>
                      </div>
                    </div>
                  ) : filteredContactRequests.length === 0 ? (
                    <div className="py-12 text-center">
                      <PackageSearch className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                      <p className="text-muted-foreground">No contact requests found for current filters.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Request ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Email Status</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredContactRequests.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">{shortId(request.id)}</TableCell>
                              <TableCell>{request.name}</TableCell>
                              <TableCell>{request.email}</TableCell>
                              <TableCell>{request.phone || "N/A"}</TableCell>
                              <TableCell>{request.reason}</TableCell>
                              <TableCell>
                                <Badge className={CONTACT_STATUS_CLASSES[request.status] || ""}>
                                  {CONTACT_STATUS_LABELS[request.status] || request.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{request.approval_email_status}</TableCell>
                              <TableCell>{formatDateTime(request.created_at)}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => openContactReview(request.id)}>
                                  <Eye className="h-4 w-4" />
                                  Review
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      <Dialog open={Boolean(selectedRequestId)} onOpenChange={closeReviewModal}>
        <DialogContent className="max-w-6xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Return Request {selectedDetails ? `#${shortId(selectedDetails.request.id)}` : ""}
            </DialogTitle>
            <DialogDescription>Review details and apply status updates.</DialogDescription>
          </DialogHeader>

          {detailsLoading || !selectedDetails ? (
            <div className="py-10 flex items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground" role="status" aria-label="Loading return details">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="sr-only">Loading details</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Request Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground">Request ID</p>
                    <p className="font-medium break-all">{selectedDetails.request.id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge className={STATUS_CLASSES[selectedDetails.request.status] || ""}>
                      {getStatusLabel(selectedDetails.request.status)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reason</p>
                    <p>{selectedDetails.request.reason}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Preferred Resolution</p>
                    <p>{getResolutionLabel(selectedDetails.request.preferred_resolution)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Requested At</p>
                    <p>{formatDateTime(selectedDetails.request.requested_at || selectedDetails.request.created_at)}</p>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-muted-foreground">Customer Description</p>
                    <p className="whitespace-pre-wrap">{selectedDetails.request.description || "N/A"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Customer / Order</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground">Order Number</p>
                    <p className="font-medium">{selectedDetails.order?.order_number || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Customer Name</p>
                    <p>{selectedDetails.order?.shipping_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p>{selectedDetails.order?.shipping_phone || "N/A"}</p>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-muted-foreground">Address</p>
                    <p>
                      {selectedDetails.order
                        ? `${selectedDetails.order.shipping_address}, ${selectedDetails.order.shipping_city}, ${selectedDetails.order.shipping_state} ${selectedDetails.order.shipping_postal_code}, ${selectedDetails.order.shipping_country}`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Method</p>
                    <p>{selectedDetails.order?.payment_method || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Status</p>
                    <p>{selectedDetails.order?.payment_status || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Amount</p>
                    <p className="font-medium">{formatCurrency(selectedDetails.order?.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Delivered At</p>
                    <p>{formatDateTime(selectedDetails.order?.delivered_at)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Refund Guidance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {selectedDetails.order?.payment_method === "razorpay" ? (
                    <div className="rounded-md border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-blue-800 dark:text-blue-300">
                      Online payment detected. Refund should be issued manually from Razorpay Dashboard using the
                      Razorpay payment ID. Do not ask customer for QR/UPI for this order.
                    </div>
                  ) : selectedDetails.order?.payment_method === "cod" ? (
                    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-800 dark:text-amber-300">
                      COD/manual payment detected. Customer refund details may be needed. Contact customer and refund
                      manually via UPI, bank transfer, or QR after inspection.
                    </div>
                  ) : (
                    <div className="rounded-md border border-slate-500/30 bg-slate-500/10 px-4 py-3 text-slate-800 dark:text-slate-300">
                      Manual verification required before refund.
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-muted-foreground">Razorpay Payment ID</p>
                      <p className="font-mono break-all">{selectedDetails.payment?.razorpay_payment_id || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Razorpay Order ID</p>
                      <p className="font-mono break-all">
                        {selectedDetails.payment?.razorpay_order_id ||
                          selectedDetails.order?.razorpay_order_id ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Amount Paid</p>
                      <p className="font-medium">
                        {selectedDetails.payment ? formatCurrency(selectedDetails.payment.amount) : "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Returned Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDetails.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No return items recorded.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Variant</TableHead>
                            <TableHead className="text-right">Ordered Qty</TableHead>
                            <TableHead className="text-right">Return Qty</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Total Price</TableHead>
                            <TableHead>Item Reason</TableHead>
                            <TableHead>Condition Note</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedDetails.items.map((item) => {
                            const orderItem = selectedDetails.orderItems.find((row) => row.id === item.order_item_id);
                            return (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{orderItem?.product_name || "N/A"}</TableCell>
                                <TableCell>
                                  {(orderItem?.variant_size || "N/A") + " / " + (orderItem?.variant_color || "N/A")}
                                </TableCell>
                                <TableCell className="text-right">{orderItem?.quantity ?? "N/A"}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell className="text-right">{formatCurrency(orderItem?.unit_price)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(orderItem?.total_price)}</TableCell>
                                <TableCell>{item.reason || "N/A"}</TableCell>
                                <TableCell>{item.condition_note || "N/A"}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Evidence Images</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDetails.images.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No evidence images uploaded.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {selectedDetails.images.map((image) => (
                        <a
                          key={image.id}
                          href={image.image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="block border rounded-md overflow-hidden hover:opacity-90 transition-opacity"
                        >
                          <img
                            src={image.image_url}
                            alt={`Evidence ${image.id.slice(0, 6)}`}
                            className="h-28 w-full object-cover"
                            loading="lazy"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Admin Action Area</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-3">
                      <Label htmlFor="admin-note">Admin Note</Label>
                      <Textarea
                        id="admin-note"
                        value={adminNote}
                        onChange={(event) => setAdminNote(event.target.value)}
                        placeholder="Internal notes for this request..."
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="refund-amount">Refund Amount</Label>
                      <Input
                        id="refund-amount"
                        type="number"
                        min={0}
                        step="0.01"
                        value={refundAmount}
                        onChange={(event) => setRefundAmount(event.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="refund-method">Refund Method</Label>
                      <Select
                        value={refundMethod || undefined}
                        onValueChange={(value) => setRefundMethod(value as RefundMethod)}
                      >
                        <SelectTrigger id="refund-method">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          {REFUND_METHOD_OPTIONS.map((method) => (
                            <SelectItem key={method} value={method}>
                              {getRefundMethodLabel(method)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-2">{renderMainAction()}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedContactRequestId)} onOpenChange={closeContactReviewModal}>
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Contact Request {selectedContactDetails ? `#${shortId(selectedContactDetails.id)}` : ""}
            </DialogTitle>
            <DialogDescription>Review details and update contact request status.</DialogDescription>
          </DialogHeader>

          {contactDetailsLoading || !selectedContactDetails ? (
            <div className="py-10 flex items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground" role="status" aria-label="Loading contact request details">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="sr-only">Loading contact request details</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Customer Details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedContactDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedContactDetails.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p>{selectedContactDetails.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reason</p>
                    <p>{selectedContactDetails.reason}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge className={CONTACT_STATUS_CLASSES[selectedContactDetails.status] || ""}>
                      {CONTACT_STATUS_LABELS[selectedContactDetails.status] || selectedContactDetails.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Approval Email Status</p>
                    <p>{selectedContactDetails.approval_email_status}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-muted-foreground">Created At</p>
                    <p>{formatDateTime(selectedContactDetails.created_at)}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-muted-foreground">Note</p>
                    <p className="whitespace-pre-wrap">{selectedContactDetails.note}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Admin Action Area</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="contact-admin-note">Admin Note</Label>
                    <Textarea
                      id="contact-admin-note"
                      value={contactAdminNote}
                      onChange={(event) => setContactAdminNote(event.target.value)}
                      placeholder="Internal notes for this contact request..."
                      rows={4}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      disabled={contactActionLoading}
                      onClick={() =>
                        runContactAction(
                          () => updateContactRequestAdminNote(selectedContactDetails.id, contactAdminNote || undefined),
                          "Admin note saved",
                        )
                      }
                    >
                      {contactActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Save Note
                    </Button>
                    {renderContactMainAction()}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
