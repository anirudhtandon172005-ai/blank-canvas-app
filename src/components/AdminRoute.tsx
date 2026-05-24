import { ReactNode, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/AuthContext";
import { isCurrentUserAdmin } from "@/api/adminOrders";

interface AdminRouteProps {
  children: ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      if (authLoading) return;

      if (!user) {
        setCheckingAdmin(false);
        setIsAdmin(false);
        return;
      }

      setCheckingAdmin(true);
      setError(null);

      try {
        const allowed = await isCurrentUserAdmin();
        if (!active) return;
        setIsAdmin(allowed);
      } catch (err) {
        if (!active) return;
        setIsAdmin(false);
        setError(err instanceof Error ? err.message : "Access denied");
      } finally {
        if (active) setCheckingAdmin(false);
      }
    }

    checkAccess();

    return () => {
      active = false;
    };
  }, [authLoading, user?.id, user]);

  if (authLoading || checkingAdmin) {
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container-main py-16 flex items-center justify-center">
          <Card className="w-full max-w-md text-center">
            <CardContent className="py-10">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <ShieldAlert className="h-6 w-6 text-destructive" />
              </div>
              <h1 className="font-heading text-2xl font-semibold mb-2">Access Denied</h1>
              <p className="text-muted-foreground mb-6">
                You do not have permission to view this page.
              </p>
              {error && error !== "Access denied" && (
                <p className="text-xs text-muted-foreground mb-6">{error}</p>
              )}
              <Button onClick={() => navigate("/")}>Go Home</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return <>{children}</>;
}
