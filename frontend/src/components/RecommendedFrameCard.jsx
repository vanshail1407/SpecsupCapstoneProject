import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Check, ShoppingBag, CheckCircle2, AlertTriangle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function RecommendedFrameCard({ item, onBookSuccess }) {
  const { frame, score, compatibility, compatibility_label, reasons, warnings, optical_metrics } = item;
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const isOutOfStock = frame.quantity <= 0;

  const handlePreBook = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { message: 'Please log in to pre-book this frame.' } });
      return;
    }

    if (isAdmin) {
      setError('Admin accounts cannot pre-book frames.');
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

  const getBadgeStyle = (comp) => {
    switch (comp) {
      case 'highly_recommended':
        return 'bg-emerald-500 text-white shadow-emerald-500/20';
      case 'recommended':
        return 'bg-sky-500 text-white shadow-sky-500/20';
      case 'suitable':
        return 'bg-amber-500 text-white shadow-amber-500/20';
      case 'caution':
        return 'bg-rose-500 text-white shadow-rose-500/20';
      default:
        return 'bg-slate-500 text-white shadow-slate-500/20';
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
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Compatibility Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide shadow-xs ${getBadgeStyle(
              compatibility
            )}`}
          >
            {compatibility === 'highly_recommended' && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
            {compatibility === 'caution' && <AlertTriangle className="w-3.5 h-3.5 mr-1" />}
            {compatibility === 'not_assessed' && <HelpCircle className="w-3.5 h-3.5 mr-1" />}
            {compatibility_label}
          </span>
        </div>

        {/* Match Score Badge */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 shadow-xs border border-white/60">
          {score !== null ? `${Math.round(score)} / 100` : 'Unassessed'}
        </div>
      </div>

      {/* Frame Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-lg text-slate-900 line-clamp-1">{frame.name}</h3>
              <p className="text-xs text-slate-500 font-medium">{frame.brand}</p>
            </div>
            {frame.lens_width_mm && frame.bridge_width_mm && (
              <span className="text-[11px] font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                {frame.lens_width_mm}-{frame.bridge_width_mm}-{frame.lens_height_mm || '-'} mm
              </span>
            )}
          </div>

          {/* Reasons & Optical Fit Highlights */}
          <div className="mt-3 space-y-1.5">
            {reasons && reasons.slice(0, 2).map((reason, idx) => (
              <div key={idx} className="flex items-start text-xs text-slate-700 space-x-1.5">
                <span className="text-emerald-500 font-bold shrink-0">✓</span>
                <span className="leading-snug">{reason}</span>
              </div>
            ))}

            {warnings && warnings.slice(0, 1).map((warning, idx) => (
              <div key={idx} className="flex items-start text-xs text-amber-700 space-x-1.5">
                <span className="text-amber-500 font-bold shrink-0">⚠</span>
                <span className="leading-snug">{warning}</span>
              </div>
            ))}
          </div>

          {/* Detailed metrics accordion toggle */}
          {optical_metrics && (
            <div className="mt-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-[11px] text-sky-600 hover:text-sky-800 font-medium inline-flex items-center"
              >
                <span>{showDetails ? 'Hide Optical Details' : 'View Optical Decentration & Fit'}</span>
                {showDetails ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
              </button>

              {showDetails && (
                <div className="mt-2 p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-1 font-mono border border-slate-200">
                  <div>Frame PD: <span className="font-semibold text-slate-800">{optical_metrics.frame_pd} mm</span></div>
                  <div>Patient PD: <span className="font-semibold text-slate-800">{optical_metrics.patient_pd} mm</span></div>
                  <div>Decentration: <span className="font-semibold text-slate-800">{optical_metrics.decentration_mm} mm</span></div>
                  <div>Shape & Material: <span className="font-sans font-medium text-slate-800">{frame.frame_shape || 'Standard'} • {frame.frame_material || 'Standard'}</span></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Price and Pre-book button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
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
                className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-semibold cursor-not-allowed border border-slate-200"
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
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs inline-flex items-center disabled:opacity-50"
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

        {error && <p className="text-[11px] text-rose-600 font-medium text-right">{error}</p>}
      </div>
    </div>
  );
}
