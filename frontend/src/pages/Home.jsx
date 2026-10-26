import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import FrameCard from '../components/FrameCard';
import RecommendedFrameCard from '../components/RecommendedFrameCard';
import {
  ArrowDown,
  Glasses,
  Sparkles,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
  Info,
  Calendar,
  AlertCircle,
  LogIn
} from 'lucide-react';

export default function Home() {
  const { user, isAuthenticated, isAdmin } = useAuth();

  // General frames state
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Recommendations state
  const [recData, setRecData] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchFrames = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getFrames();
      setFrames(data);
    } catch (err) {
      setError(err.message || 'Failed to load frames.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    if (!isAuthenticated || isAdmin) {
      setRecData(null);
      return;
    }
    try {
      setRecLoading(true);
      setRecError('');
      const data = await api.getRecommendedFrames();
      setRecData(data);
    } catch (err) {
      setRecError(err.message || 'Failed to load recommendations.');
    } finally {
      setRecLoading(false);
    }
  };

  useEffect(() => {
    fetchFrames();
    fetchRecommendations();
  }, [isAuthenticated, isAdmin]);

  const handleBookSuccess = (frameId) => {
    // Optimistically update stock on both lists
    setFrames((prev) =>
      prev.map((f) => (f.id === frameId ? { ...f, quantity: Math.max(0, f.quantity - 1) } : f))
    );
    setRecData((prev) => {
      if (!prev || !prev.recommendations) return prev;
      return {
        ...prev,
        recommendations: prev.recommendations.map((item) =>
          item.frame.id === frameId
            ? {
                ...item,
                frame: {
                  ...item.frame,
                  quantity: Math.max(0, item.frame.quantity - 1),
                },
              }
            : item
        ),
      };
    });
  };

  const scrollToFrames = () => {
    const el = document.getElementById('frames-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter recommendations based on tab
  const getFilteredRecommendations = () => {
    if (!recData || !recData.recommendations) return [];
    if (activeFilter === 'all') return recData.recommendations;
    return recData.recommendations.filter((item) => item.compatibility === activeFilter);
  };

  const filteredRecs = getFilteredRecommendations();

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/70 via-white to-slate-50 pt-16 pb-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>SpecsUp Optical Shop & Precision Eyecare</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              See Better. <span className="text-sky-600">Track Better.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              Manage your prescriptions, track changes over time, and reserve optically suitable
              frames tailored to your exact lens power and anatomical measurements.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={scrollToFrames}
                className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow group"
              >
                <span>Explore Frames</span>
                <ArrowDown className="w-4 h-4 ml-2 group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Prescription Smart Recommendations Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider mb-1">
              <Eye className="w-4 h-4" />
              <span>Optical Intelligence</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Recommended for Your Prescription
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Curated selection prioritized by edge thickness minimization, pupillary alignment, and frame geometry.
            </p>
          </div>
        </div>

        {/* State 1: Unauthenticated */}
        {!isAuthenticated && (
          <div className="bg-gradient-to-r from-sky-50 via-indigo-50/50 to-white border border-sky-200/80 rounded-3xl p-8 sm:p-10 text-center max-w-3xl mx-auto shadow-xs">
            <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Unlock Prescription-Smart Frame Matching
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto leading-relaxed">
              Log in to your SpecsUp customer account. Our optical engine cross-references your
              latest sphere, cylinder, and anatomical pupillary distance (PD) against frame
              measurements to highlight the best cosmetic and optical fits.
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                to="/login"
                className="inline-flex items-center px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <LogIn className="w-4 h-4 mr-1.5" />
                Log In to View Recommendations
              </Link>
            </div>
          </div>
        )}

        {/* State 2: Admin viewing */}
        {isAuthenticated && isAdmin && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center max-w-2xl mx-auto">
            <Info className="w-5 h-5 text-slate-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">Admin Mode Active</h4>
            <p className="text-xs text-slate-600 mt-1">
              Prescription-based recommendations evaluate individual patient checkup records.
              Log into a customer account or test with sample customer accounts (e.g. rahul@gmail.com)
              to review patient-tailored frame scoring.
            </p>
          </div>
        )}

        {/* State 3: Customer Loading */}
        {isAuthenticated && !isAdmin && recLoading && (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600 text-xs font-medium">
              Calculating optical power match & decentration...
            </p>
          </div>
        )}

        {/* State 4: Customer Error */}
        {isAuthenticated && !isAdmin && !recLoading && recError && (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center max-w-md mx-auto">
            <p className="text-sm font-semibold text-rose-800">{recError}</p>
            <button
              onClick={fetchRecommendations}
              className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* State 5: Customer has No Prescription on File */}
        {isAuthenticated && !isAdmin && !recLoading && recData && recData.status === 'no_prescription' && (
          <div className="bg-white border border-amber-200 rounded-3xl p-8 sm:p-10 text-center max-w-2xl mx-auto shadow-xs">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-200">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Eye Prescription on File</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {recData.message}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Once an eye checkup is added by an optometrist, smart recommendations will automatically
              surface compatible frames here.
            </p>
          </div>
        )}

        {/* State 6: Customer Recommendations Loaded Successfully */}
        {isAuthenticated && !isAdmin && !recLoading && recData && recData.status === 'success' && (
          <div className="space-y-6">
            {/* Prescription Snapshot Header */}
            {recData.patient_summary && (
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-xs shrink-0">
                    Rx
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                      Evaluation Based on Latest Eye Examination
                    </h4>
                    <p className="text-xs text-indigo-800 mt-0.5">
                      Right SE: {recData.patient_summary.spherical_equivalent_od > 0 ? '+' : ''}
                      {recData.patient_summary.spherical_equivalent_od} D • Left SE:{' '}
                      {recData.patient_summary.spherical_equivalent_os > 0 ? '+' : ''}
                      {recData.patient_summary.spherical_equivalent_os} D • Patient PD:{' '}
                      {recData.patient_summary.anatomical_pd} mm
                    </p>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeFilter === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    All ({recData.recommendations.length})
                  </button>
                  <button
                    onClick={() => setActiveFilter('highly_recommended')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeFilter === 'highly_recommended'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Highly Recommended
                  </button>
                  <button
                    onClick={() => setActiveFilter('recommended')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeFilter === 'recommended'
                        ? 'bg-sky-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Recommended
                  </button>
                  <button
                    onClick={() => setActiveFilter('suitable')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeFilter === 'suitable'
                        ? 'bg-amber-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Suitable
                  </button>
                  <button
                    onClick={() => setActiveFilter('caution')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeFilter === 'caution'
                        ? 'bg-rose-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Caution
                  </button>
                </div>
              </div>
            )}

            {/* Recommendations Grid */}
            {filteredRecs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredRecs.map((item) => (
                  <RecommendedFrameCard
                    key={item.frame.id}
                    item={item}
                    onBookSuccess={handleBookSuccess}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
                No frames found under the selected category filter.
              </div>
            )}

            {/* Medical Disclaimer */}
            {recData.disclaimer && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-start space-x-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{recData.disclaimer}</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* General Frames Showcase Section */}
      <section id="frames-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-sky-600 font-semibold text-xs uppercase tracking-wider mb-1">
              <Glasses className="w-4 h-4" />
              <span>Optical Shop Inventory</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">All Available Frames</h2>
            <p className="text-sm text-slate-600 mt-1">
              Explore our full in-store catalog across all sizes and designs
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
            {frames.length} Frame{frames.length !== 1 ? 's' : ''} in store
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600 text-sm font-medium">Loading frames...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center max-w-md mx-auto">
            <p className="text-sm font-semibold text-rose-800">{error}</p>
            <button
              onClick={fetchFrames}
              className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && frames.length === 0 && (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center max-w-lg mx-auto">
            <Glasses className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900">No frames are currently available.</h3>
            <p className="text-xs text-slate-600 mt-1">
              Our optical shop stock is updated regularly. Please check back shortly.
            </p>
          </div>
        )}

        {/* Frames Grid */}
        {!loading && !error && frames.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {frames.map((frame) => (
              <FrameCard key={frame.id} frame={frame} onBookSuccess={handleBookSuccess} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
