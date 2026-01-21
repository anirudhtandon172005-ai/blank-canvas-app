import { format } from "date-fns";
import StarRating from "./StarRating";
import type { ProductReview } from "@/api/reviews";

interface ReviewCardProps {
  review: ProductReview;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  // Priority: profile_full_name from join, never show email
  const displayName = review.profile_full_name || "Verified Customer";

  return (
    <div className="border border-border rounded-xl p-4 md:p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-medium text-foreground">{displayName}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(review.created_at), "MMM d, yyyy")}
          </p>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {review.review_text}
      </p>
    </div>
  );
}
