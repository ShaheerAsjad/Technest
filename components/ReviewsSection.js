'use client';

import { useEffect, useState } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';

export default function ReviewsSection({ productId }) {
  const { isSignedIn } = useUser();
  const [data, setData] = useState({ reviews: [], average: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function loadReviews() {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Reviews load error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, comment }),
      });
      const json = await res.json();
      if (res.ok) {
        setComment('');
        setRating(5);
        loadReviews();
      } else {
        setError(json.error || 'Could not submit review.');
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="reviews-section">
      <div className="section-title-wrap">
        <h2 className="section-title">Reviews</h2>
      </div>

      {!loading && (
        <div className="reviews-summary">
          <span className="reviews-summary__score">{data.average > 0 ? data.average.toFixed(1) : '—'}</span>
          <div>
            <div className="reviews-summary__stars">
              {'★'.repeat(Math.round(data.average)) + '☆'.repeat(5 - Math.round(data.average))}
            </div>
            <span className="reviews-summary__count">
              {data.count} {data.count === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        </div>
      )}

      {isSignedIn ? (
        <form className="review-form" onSubmit={handleSubmit}>
          <div className="review-form__rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setRating(n)}
                className={`review-form__star${n <= rating ? ' review-form__star--filled' : ''}`}
                aria-label={`Rate ${n} stars`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            className="form-input form-textarea"
            placeholder="Share your thoughts about this product…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Posting…' : 'Post Review'}
          </button>
        </form>
      ) : (
        <div className="review-form__signin">
          <SignInButton mode="modal">
            <button className="btn btn--secondary">Sign in to leave a review</button>
          </SignInButton>
        </div>
      )}

      <div className="reviews-list">
        {!loading && data.reviews.length === 0 && (
          <p className="empty-state" style={{ padding: 'var(--spacing-3) 0' }}>
            No reviews yet — be the first!
          </p>
        )}

        {data.reviews.map((r) => (
          <div key={r.id} className="review-card">
            <div className="review-card__header">
              <span className="review-card__name">{r.user_name}</span>
              <span className="review-card__stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
            </div>
            {r.comment && <p className="review-card__comment">{r.comment}</p>}
            <span className="review-card__date">
              {new Date(r.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
