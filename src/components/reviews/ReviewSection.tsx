import { useQuery } from "@tanstack/react-query";
import { getProductReviews } from "@/api/reviews";
import ReviewCard from "./ReviewCard";
import ReviewForm from "./ReviewForm";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";

interface ReviewSectionProps {
  productId: string;
  productName: string;
}

export default function ReviewSection({ productId, productName }: ReviewSectionProps) {
  const { data: reviews, isLoading, isError } = useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: () => getProductReviews(productId),
    enabled: !!productId,
  });

  return (
    <section className="mt-8 lg:mt-0">
      <h2 className="font-heading text-xl md:text-2xl font-semibold mb-6">Customer Reviews</h2>

      <div className="space-y-6">
        {/* Review Form */}
        <ReviewForm productId={productId} productName={productName} />

        {/* Reviews List */}
        <div>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-border rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="border border-border rounded-xl p-8 text-center">
              <p className="text-muted-foreground">
                Unable to load reviews. Please try again later.
              </p>
            </div>
          ) : reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="border border-border rounded-xl p-8 text-center bg-secondary/30">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                No reviews yet. Be the first to review this product!
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
