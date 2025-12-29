export async function submitReturnRequest(orderId: string, reason: string, images: string[]) {
  return {
    status: "submitted",
    orderId,
    reason,
    images,
  };
}

export async function getReturnStatus(orderId: string) {
  return {
    orderId,
    status: "processing",
  };
}
