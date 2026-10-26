import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import TrendChart from '../components/TrendChart';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
  Eye,
  Info,
} from 'lucide-react';

export default function Analysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getPrescriptionAnalysis();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load prescription analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const blob = await api.downloadPrescriptionPdf();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SpecsUp_Prescriptions.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`PDF download failed: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 text-sm font-medium">Analyzing prescription trends...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-center">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-rose-900">{error}</p>
          <button
            onClick={fetchAnalysis}
            className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  const isInsufficient = data?.status === 'insufficient_data';
  const latest = data?.latest_prescription;
  const trend = data?.trend;
  const history = data?.history || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-sky-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Prescription Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Prescription Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Clinical trend analysis, power rate adjustments, and next checkup projection
          </p>
        </div>

        {/* Download PDF Button */}
        {latest && (
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="self-start sm:self-auto inline-flex items-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
          >
            {downloading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download Prescription History PDF
              </>
            )}
          </button>
        )}
      </div>

      {/* SECTION 1 — NEXT RECOMMENDED CHECKUP */}
      <section className="bg-gradient-to-br from-sky-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold tracking-wide">
              <Calendar className="w-3.5 h-3.5 text-sky-200" />
              <span>Recommended Next Checkup</span>
            </div>

            <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              {data?.recommended_checkup_date || 'Schedule Baseline Visit'}
            </div>

            <p className="text-sm text-sky-100 font-medium">
              Based on your previous prescription trends.
            </p>

            {data?.explanation && (
              <p className="text-xs text-sky-200/90 max-w-xl leading-relaxed">
                {data.explanation}
              </p>
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 max-w-xs text-xs text-sky-100 space-y-2">
            <div className="flex items-center space-x-1.5 text-white font-semibold">
              <Info className="w-4 h-4 text-sky-300 shrink-0" />
              <span>Clinical Disclaimer</span>
            </div>
            <p className="text-[11px] leading-relaxed text-sky-100/90">
              {data?.disclaimer}
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2 — PRESCRIPTION TREND ANALYSIS */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Ocular Trend Analysis</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Historical Diopter variation across consecutive eye examinations
            </p>
          </div>

          {!isInsufficient && data?.trend_classification && (
            <div className="self-start sm:self-auto">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                  data.trend_classification === 'Stable'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : data.trend_classification === 'Increasing'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-sky-50 text-sky-700 border-sky-200'
                }`}
              >
                {data.trend_classification === 'Stable' && (
                  <Minus className="w-3.5 h-3.5 mr-1.5" />
                )}
                {data.trend_classification === 'Increasing' && (
                  <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                )}
                {data.trend_classification === 'Decreasing' && (
                  <TrendingDown className="w-3.5 h-3.5 mr-1.5" />
                )}
                Trend: {data.trend_classification}
              </span>
            </div>
          )}
        </div>

        {/* Insufficient Data State */}
        {isInsufficient ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-2">
            <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
            <h3 className="text-sm font-bold text-amber-900">
              More prescription history is required to calculate a meaningful trend.
            </h3>
            <p className="text-xs text-amber-700">
              {data?.message ||
                'At least two separate checkups are required to calculate rate of change and trend trajectory.'}
            </p>
          </div>
        ) : (
          <>
            {/* Metric Rate Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                  Right SPH Rate
                </span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">
                  {trend?.right_sph > 0 ? `+${trend.right_sph}` : trend?.right_sph} D/yr
                </span>
                <span className="text-[11px] text-slate-600 mt-1 block">
                  Annualized spherical change
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                  Left SPH Rate
                </span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">
                  {trend?.left_sph > 0 ? `+${trend.left_sph}` : trend?.left_sph} D/yr
                </span>
                <span className="text-[11px] text-slate-600 mt-1 block">
                  Annualized spherical change
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                  Right CYL Rate
                </span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">
                  {trend?.right_cyl > 0 ? `+${trend.right_cyl}` : trend?.right_cyl} D/yr
                </span>
                <span className="text-[11px] text-slate-600 mt-1 block">
                  Astigmatic shift rate
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                  Left CYL Rate
                </span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">
                  {trend?.left_cyl > 0 ? `+${trend.left_cyl}` : trend?.left_cyl} D/yr
                </span>
                <span className="text-[11px] text-slate-600 mt-1 block">
                  Astigmatic shift rate
                </span>
              </div>
            </div>

            {/* Line Chart */}
            <TrendChart history={history} />
          </>
        )}
      </section>

      {/* SECTION 3 — LATEST PRESCRIPTION */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Latest Prescription</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Most recent optometrist examination details
          </p>
        </div>

        {!latest ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-600 text-sm">
            No prescription history available yet.
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-sky-600" />
                <span className="text-base font-bold text-slate-900">Clinical Parameters</span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-600" />
                <span>
                  Last Checkup:{' '}
                  <strong className="text-slate-900 font-semibold">{latest.checkup_date}</strong>
                </span>
              </div>
            </div>

            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-600">
                    <th className="py-3 px-4 font-bold">Eye Parameter</th>
                    <th className="py-3 px-4 font-bold text-sky-700">Right Eye (OD)</th>
                    <th className="py-3 px-4 font-bold text-teal-700">Left Eye (OS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">SPH (Sphere)</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {latest.right_sph > 0 ? `+${latest.right_sph}` : latest.right_sph} D
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {latest.left_sph > 0 ? `+${latest.left_sph}` : latest.left_sph} D
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">CYL (Cylinder)</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {latest.right_cyl > 0 ? `+${latest.right_cyl}` : latest.right_cyl} D
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {latest.left_cyl > 0 ? `+${latest.left_cyl}` : latest.left_cyl} D
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">Axis</td>
                    <td className="py-3.5 px-4 font-mono text-slate-900">{latest.right_axis}°</td>
                    <td className="py-3.5 px-4 font-mono text-slate-900">{latest.left_axis}°</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      PD (Pupillary Distance)
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-900">{latest.right_pd} mm</td>
                    <td className="py-3.5 px-4 font-mono text-slate-900">{latest.left_pd} mm</td>
                  </tr>
                </tbody>
              </table>

              {latest.notes && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Doctor / Examination Notes
                  </span>
                  <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                    "{latest.notes}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
