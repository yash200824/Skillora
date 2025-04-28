import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Star } from "lucide-react";

interface ReviewFormProps {
  givenTo: number;
  requirementId: number;
  onComplete?: () => void;
}

export default function ReviewForm({ givenTo, requirementId, onComplete }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/review", {
        given_to: givenTo,
        requirement_id: requirementId,
        rating,
        comment
      });
    },
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "Your review has been submitted successfully",
      });
      setRating(0);
      setComment("");
      if (onComplete) onComplete();
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/reviews", givenTo] });
      queryClient.invalidateQueries({ queryKey: ["/api/ratings", givenTo] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit review",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting",
        variant: "destructive",
      });
      return;
    }
    
    submitReviewMutation.mutate();
  };

  return (
    <Card className="shadow-sm border border-neutral-200">
      <CardContent className="pt-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">Rating</label>
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoverRating || rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-neutral-300"
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-neutral-500">
              {rating > 0 ? `${rating} out of 5 stars` : "Select a rating"}
            </span>
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="comment" className="block text-sm font-medium text-neutral-700 mb-2">
            Your Review
          </label>
          <Textarea
            id="comment"
            placeholder="Share your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />
        </div>
        
        <div className="flex justify-end">
          {onComplete && (
            <Button
              type="button"
              variant="outline"
              className="mr-2"
              onClick={onComplete}
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitReviewMutation.isPending || rating === 0}
          >
            {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
