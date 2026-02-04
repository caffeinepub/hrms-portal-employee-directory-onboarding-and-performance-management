import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSubmitSelfReview, useSubmitManagerReview, useSubmitHRReview } from '../../hooks/useQueries';
import type { Review, EmployeeId } from '../../backend';
import { Separator } from '@/components/ui/separator';

interface ReviewEditorsProps {
  review: Review;
  employeeId: EmployeeId;
  isAdmin: boolean;
}

export default function ReviewEditors({ review, employeeId, isAdmin }: ReviewEditorsProps) {
  const [selfReviewText, setSelfReviewText] = useState(review.selfReview);
  const [managerReviewText, setManagerReviewText] = useState(review.managerReview);
  const [hrReviewText, setHrReviewText] = useState(review.hrReview);

  const submitSelfReview = useSubmitSelfReview();
  const submitManagerReview = useSubmitManagerReview();
  const submitHRReview = useSubmitHRReview();

  const handleSelfReviewSubmit = () => {
    submitSelfReview.mutate({
      employeeId,
      reviewId: review.id,
      selfReviewText,
    });
  };

  const handleManagerReviewSubmit = () => {
    submitManagerReview.mutate({
      employeeId,
      reviewId: review.id,
      managerReviewText,
    });
  };

  const handleHRReviewSubmit = () => {
    submitHRReview.mutate({
      employeeId,
      reviewId: review.id,
      hrReviewText,
    });
  };

  return (
    <div className="space-y-6">
      {/* Self Review */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Self Review</Label>
        {!isAdmin ? (
          <>
            <Textarea
              value={selfReviewText}
              onChange={(e) => setSelfReviewText(e.target.value)}
              placeholder="Enter your self-review..."
              rows={5}
              disabled={review.status === 'completed'}
            />
            {review.status !== 'completed' && (
              <Button
                onClick={handleSelfReviewSubmit}
                disabled={submitSelfReview.isPending || !selfReviewText.trim()}
                size="sm"
              >
                {submitSelfReview.isPending ? 'Submitting...' : 'Submit Self Review'}
              </Button>
            )}
          </>
        ) : (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm whitespace-pre-wrap">{review.selfReview || 'Not submitted yet'}</p>
          </div>
        )}
      </div>

      <Separator />

      {/* Manager Review */}
      {isAdmin && (
        <>
          <div className="space-y-3">
            <Label className="text-base font-semibold">Manager Review</Label>
            <Textarea
              value={managerReviewText}
              onChange={(e) => setManagerReviewText(e.target.value)}
              placeholder="Enter manager review..."
              rows={5}
              disabled={review.status === 'completed'}
            />
            {review.status !== 'completed' && (
              <Button
                onClick={handleManagerReviewSubmit}
                disabled={submitManagerReview.isPending || !managerReviewText.trim()}
                size="sm"
              >
                {submitManagerReview.isPending ? 'Submitting...' : 'Submit Manager Review'}
              </Button>
            )}
          </div>

          <Separator />

          {/* HR Review */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">HR Review</Label>
            <Textarea
              value={hrReviewText}
              onChange={(e) => setHrReviewText(e.target.value)}
              placeholder="Enter HR review..."
              rows={5}
              disabled={review.status === 'completed'}
            />
            {review.status !== 'completed' && (
              <Button
                onClick={handleHRReviewSubmit}
                disabled={submitHRReview.isPending || !hrReviewText.trim()}
                size="sm"
              >
                {submitHRReview.isPending ? 'Submitting...' : 'Submit HR Review & Complete'}
              </Button>
            )}
          </div>
        </>
      )}

      {!isAdmin && review.managerReview && (
        <>
          <div className="space-y-3">
            <Label className="text-base font-semibold">Manager Review</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm whitespace-pre-wrap">{review.managerReview}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
