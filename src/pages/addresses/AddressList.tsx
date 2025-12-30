import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Plus, Pencil, Trash2, ChevronLeft, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useAddresses } from "@/hooks/useAddresses";
import Loader from "@/components/Loader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AddressList() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { addresses, loading, removeAddress, makeDefault } = useAddresses();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
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
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              to="/profile"
              className="p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-heading font-semibold flex items-center gap-3">
                <MapPin className="w-6 h-6 text-primary" />
                Saved Addresses
              </h1>
            </div>
            <Link to="/profile/addresses/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </Button>
            </Link>
          </div>

          {/* Addresses List */}
          {addresses.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <MapPin className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h2 className="text-xl font-heading font-medium mb-2">No addresses saved</h2>
                <p className="text-muted-foreground mb-6">
                  Add your first address to make checkout faster
                </p>
                <Link to="/profile/addresses/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Address
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {addresses.map((address, index) => (
                <motion.div
                  key={address.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`relative ${address.is_default ? "border-primary" : ""}`}>
                    {address.is_default && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                        <Check className="w-3 h-3" />
                        Default
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-heading flex items-center gap-2">
                        {address.full_name}
                        {address.label && (
                          <span className="text-xs font-normal px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">
                            {address.label}
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground space-y-1 mb-4">
                        <p>{address.address_line1}</p>
                        {address.address_line2 && <p>{address.address_line2}</p>}
                        <p>
                          {address.city}, {address.state} - {address.postal_code}
                        </p>
                        <p>{address.country}</p>
                        <p className="pt-1">Phone: {address.phone}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link to={`/profile/addresses/${address.id}`}>
                          <Button variant="outline" size="sm">
                            <Pencil className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </Link>

                        {!address.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => makeDefault(address.id)}
                          >
                            Set as Default
                          </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Address</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this address? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeAddress(address.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
