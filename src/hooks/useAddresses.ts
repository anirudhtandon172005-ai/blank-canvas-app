import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/api/addresses";
import { toast } from "@/hooks/use-toast";

export interface Address {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  label?: string | null;
  is_default: boolean | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface AddressFormData {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  label?: string;
  is_default?: boolean;
}

export function useAddresses() {
  const { user, loading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getAddresses(user.id);
      setAddresses(data || []);
    } catch (err: any) {
      console.error("Error fetching addresses:", err);
      setError(err.message || "Failed to fetch addresses");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchAddresses();
    }
  }, [authLoading, fetchAddresses]);

  const createAddress = async (data: AddressFormData) => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to login to add addresses",
        variant: "destructive",
      });
      return null;
    }

    try {
      const newAddress = await addAddress({
        ...data,
        user_id: user.id,
        country: data.country || "India",
      });

      await fetchAddresses();

      toast({
        title: "Address added",
        description: "Your address has been saved successfully",
      });

      return newAddress;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to add address",
        variant: "destructive",
      });
      return null;
    }
  };

  const editAddress = async (addressId: string, data: Partial<AddressFormData>) => {
    try {
      const updated = await updateAddress(addressId, data);
      await fetchAddresses();

      toast({
        title: "Address updated",
        description: "Your address has been updated successfully",
      });

      return updated;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update address",
        variant: "destructive",
      });
      return null;
    }
  };

  const removeAddress = async (addressId: string) => {
    try {
      await deleteAddress(addressId);
      await fetchAddresses();

      toast({
        title: "Address deleted",
        description: "Your address has been removed",
      });

      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete address",
        variant: "destructive",
      });
      return false;
    }
  };

  const makeDefault = async (addressId: string) => {
    if (!user) return null;

    try {
      const updated = await setDefaultAddress(addressId, user.id);
      await fetchAddresses();

      toast({
        title: "Default address updated",
        description: "Your default address has been changed",
      });

      return updated;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to set default address",
        variant: "destructive",
      });
      return null;
    }
  };

  const defaultAddress = addresses.find((addr) => addr.is_default) || addresses[0] || null;

  return {
    addresses,
    defaultAddress,
    loading: loading || authLoading,
    error,
    createAddress,
    editAddress,
    removeAddress,
    makeDefault,
    refetch: fetchAddresses,
  };
}
