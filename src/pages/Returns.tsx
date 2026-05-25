import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { RotateCcw, Search, Package } from "lucide-react";
import { format } from "date-fns";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/contexts/AuthContext";
import { UserReturnRequest, getUserReturnRequests } from "@/api/returns";
import { toast } from "@/hooks/use-toast";

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

const PREFERRED_RESOLUTION_LABELS: Record<string, string> = {
  refund: "Refund",
  exchange: "Exchange",
  store_credit: "Store Credit",
  other: "Other",
};

function formatStatus(status: string) {
  return STATUS_LABELS[status] || status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPreferredResolution(resolution: string) {
  return (
    PREFERRED_RESOLUTION_LABELS[resolution] ||
    resolution.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function formatDate(dateValue?: string | null) {
  if (!dateValue) return "N/A";
  return format(new Date(dateValue), "dd MMM yyyy, hh:mm a");
}

export default function Returns() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState<UserReturnRequest[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, navigate, user]);

  useEffect(() => {
    let active = true;

    async function loadRequests() {
      if (!user) return;

      try {
        setLoading(true);
        const data = await getUserReturnRequests();
        if (!active) return;
        setRequests(data);
      } catch (error) {
        if (!active) return;
        toast({
          title: "Failed to load return requests",
          description: error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        });
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRequests();

    return () => {
      active = false;
    };
  }, [user]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return requests;

    return requests.filter((request) => {
      const orderNumber = request.order?.order_number || "";
      return (
        request.id.toLowerCase().includes(query) ||
        orderNumber.toLowerCase().includes(query) ||
        request.reason.toLowerCase().includes(query) ||
        request.preferred_resolution.toLowerCase().includes(query)
      );
    });
  }, [requests, searchQuery]);

  if (authLoading || loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container-main py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <RotateCcw className="w-6 h-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-heading font-semibold">My Return Requests</h1>
          </div>

          <div className="max-w-md relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10"
              placeholder="Search by request, order, reason..."
            />
          </div>

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <h2 className="text-xl font-heading font-medium mb-2">No return requests yet.</h2>
                <p className="text-muted-foreground mb-6">
                  Return requests you submit will appear here.
                </p>
                <Button variant="outline" asChild>
                  <Link to="/orders">View Orders</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filtered.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">Request #{request.id.slice(0, 8).toUpperCase()}</p>
                          <Badge className={STATUS_CLASSES[request.status] || ""}>
                            {formatStatus(request.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Order: #{request.order?.order_number || "N/A"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Reason: {request.reason}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Preferred Resolution: {formatPreferredResolution(request.preferred_resolution)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Requested At: {formatDate(request.requested_at || request.created_at)}
                        </p>
                      </div>
                      <div>
                        <Button variant="outline" asChild>
                          <Link to={request.order?.id ? `/order/${request.order.id}` : "/orders"}>
                            View Order
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
