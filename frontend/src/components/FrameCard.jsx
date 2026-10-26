import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Check, AlertCircle, ShoppingBag, Eye } from 'lucide-react';

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
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col group">
      {/* Frame Image Container */}
      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
        <img
          src={frame.image_url}
          alt={frame.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            // Fallback placeholder if image link breaks
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Brand Badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-semibold text-slate-700 shadow-xs border border-white/40">
          {frame.brand}
        </div>

        {/* Stock Badge */}
        <div className="absolute top-3 right-3">
          {isOutOfStock ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              Out of Stock
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              Available: {frame.quantity}
            </span>
          )}
        </div>
      </div>

      {/* Frame Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-lg text-slate-900 line-clamp-1">{frame.name}</h3>
          <p className="text-xs text-slate-600 font-medium mt-0.5">{frame.brand}</p>
          {frame.description && (
            <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
              {frame.description}
            </p>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold block">
              Price
            </span>
            <span className="text-xl font-bold text-slate-900">
              ₹{Number(frame.price).toLocaleString('en-IN')}
            </span>
          </div>

          <div>
            {isOutOfStock ? (
              <button
                disabled
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold cursor-not-allowed border border-slate-200"
              >
                Out of Stock
              </button>
            ) : success ? (
              <button
                disabled
                className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold inline-flex items-center border border-emerald-200"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Reserved!
              </button>
            ) : (
              <button
                onClick={handlePreBook}
                disabled={booking}
                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs inline-flex items-center disabled:opacity-50"
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
          <div className="mt-3 p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start space-x-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
