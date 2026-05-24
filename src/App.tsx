import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "./pages/Home";
import CategoryListing from "./pages/CategoryListing";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import Auth from "./pages/Auth";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import AdminOrders from "./pages/AdminOrders";
import Returns from "./pages/Returns";
import SearchPage from "./pages/SearchPage";
import AddressList from "./pages/addresses/AddressList";
import CreateAddress from "./pages/addresses/CreateAddress";
import EditAddress from "./pages/addresses/EditAddress";
import NotFound from "./pages/NotFound";
import AdminRoute from "./components/AdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/category/:categorySlug" element={<CategoryListing />} />
            <Route path="/product/:productSlug" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/addresses" element={<AddressList />} />
            <Route path="/profile/addresses/new" element={<CreateAddress />} />
            <Route path="/profile/addresses/:id" element={<EditAddress />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/order/:orderId" element={<OrderDetails />} />
            <Route
              path="/admin/orders"
              element={
                <AdminRoute>
                  <AdminOrders />
                </AdminRoute>
              }
            />
            <Route path="/returns" element={<Returns />} />
            <Route path="/search" element={<SearchPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
