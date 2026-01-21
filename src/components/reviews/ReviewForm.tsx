import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createReview, getUserProfileName } from "@/api/reviews";
import { useAuthContext } from "@/contexts/AuthContext";
import StarRating from "./StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ReviewFormProps {
  productId: string;
  productName: string;
}

export default function ReviewForm({ productId, productName }: ReviewFormProps) {
  const { user, isAuthenticated } = useAuthContext();
  const queryClient = useQueryClient();
  
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [profileName, setProfileName] = useState<string>("Verified Customer");

  // Fetch profile name when user is available
  useEffect(() => {
    async function fetchProfileName() {
      if (user?.id) {
        const name = await getUserProfileName(user.id);
        setProfileName(name);
      }
    }
    fetchProfileName();
  }, [user?.id]);

  const mutation = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
      setRating(0);
      setReviewText("");
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="border border-border rounded-xl p-6 text-center bg-secondary/30">
        <p className="text-muted-foreground">
          Please{" "}
          <a href="/login" className="text-primary hover:underline font-medium">
            log in
          </a>{" "}
          to write a review.
        </p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }

    if (!reviewText.trim()) {
      toast({
        title: "Review required",
        description: "Please write a review",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      product_id: productId,
      product_name: productName,
      user_id: user!.id,
      user_name: profileName,
      rating,
      review_text: reviewText.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-xl p-5 md:p-6">
      <h4 className="font-medium mb-4">Write a Review</h4>
      
      <div className="mb-4">
        <label className="block text-sm text-muted-foreground mb-2">
          Your Rating
        </label>
        <StarRating
          rating={rating}
          size="lg"
          interactive
          onRatingChange={setRating}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="review-text" className="block text-sm text-muted-foreground mb-2">
          Your Review
        </label>
        <Textarea
          id="review-text"
          placeholder="Share your experience with this product..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={4}
          className="resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={mutation.isPending}
        className="w-full md:w-auto"
      >
        {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Submit Review
      </Button>
    </form>
  );
}
