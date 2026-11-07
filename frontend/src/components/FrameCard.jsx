import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Check, AlertCircle, ShoppingBag } from 'lucide-react';

export default function FrameCard({ frame, onBookSuccess }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isOutOfStock = frame.quantity <= 0;

  const handlePreBook = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { message: 'Please log in to pre-book this frame.' } });
      return;
    }

    if (isAdmin) {
      setError('Admin accounts cannot pre-book frames. Please use a customer account.');
      return;
    }

    setBooking(true);
    setError('');
    try {
      await api.prebookFrame(frame.id);
      setSuccess(true);
      if (onBookSuccess) {
        onBookSuccess(frame.id);
      }
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      setError(err.message || 'Failed to pre-book frame.');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="group flex flex-col overflow-hidden bg-white">
      {/* Frame Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        <img
          src={frame.image_url}
          alt={frame.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
          onError={(e) => {
            // Fallback placeholder if image link breaks
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Brand Badge */}
        <div className="absolute left-3 top-3 border border-white/60 bg-white/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-stone-700 backdrop-blur-xs">
          {frame.brand}
        </div>

        {/* Stock Badge */}
        <div className="absolute top-3 right-3">
          {isOutOfStock ? (
            <span className="inline-flex items-center border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-semibold text-rose-700">
              Out of Stock
            </span>
          ) : (
            <span className="inline-flex items-center border border-white/60 bg-white/90 px-2.5 py-1 text-[10px] font-medium text-stone-700">
              Available: {frame.quantity}
            </span>
          )}
        </div>
      </div>

      {/* Frame Content */}
      <div className="flex flex-1 flex-col justify-between pt-4">
        <div>
          <h3 className="line-clamp-1 text-base font-medium text-stone-900">{frame.name}</h3>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-500">{frame.brand}</p>
          {frame.description && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-stone-500">
              {frame.description}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <span className="text-lg font-medium text-stone-900">
              ₹{Number(frame.price).toLocaleString('en-IN')}
            </span>
          </div>

          <div>
            {isOutOfStock ? (
              <button
                disabled
                className="cursor-not-allowed border border-stone-200 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400"
              >
                Out of Stock
              </button>
            ) : success ? (
              <button
                disabled
                className="inline-flex items-center border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-semibold text-emerald-700"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Reserved!
              </button>
            ) : (
              <button
                onClick={handlePreBook}
                disabled={booking}
                className="inline-flex items-center bg-stone-900 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-stone-700 disabled:opacity-50"
              >
                {booking ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                    Booking...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                    Pre-book
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="mt-3 flex items-start space-x-1.5 border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
