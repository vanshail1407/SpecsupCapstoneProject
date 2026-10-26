import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Calendar, Eye, Download, FileText, AlertCircle, Clock } from 'lucide-react';

export default function History() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getMyPrescriptions();
      setPrescriptions(data);
    } catch (err) {
      setError(err.message || 'Failed to load prescription history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
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
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 text-sm font-medium">Loading prescription history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Prescription History
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Chronological log of all recorded eye examinations (Newest to Oldest)
          </p>
        </div>

        {prescriptions.length > 0 && (
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="self-start sm:self-auto inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
          >
            {downloading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Preparing PDF...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 mr-2" />
                Download PDF
              </>
            )}
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && prescriptions.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center max-w-md mx-auto">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">No prescription history available yet.</h3>
          <p className="text-xs text-slate-600 mt-1">
            When you visit our optical shop, our optometrist will add your examination records here.
          </p>
        </div>
      )}

      {/* Chronological Prescriptions List */}
      <div className="space-y-6">
        {prescriptions.map((rx, idx) => (
          <div
            key={rx.id}
            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow"
          >
            {/* Card Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-sky-600" />
                <span className="font-bold text-slate-900 text-sm">{rx.checkup_date}</span>
                {idx === 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 border border-sky-200">
                    Latest Checkup
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-600">Exam #{prescriptions.length - idx}</span>
            </div>

            {/* Eye Measurements Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Right Eye */}
              <div className="bg-sky-50/50 rounded-2xl p-4 border border-sky-100">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-sky-900">
                    Right Eye (OD)
                  </h4>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-xl border border-sky-100">
                    <span className="text-[10px] text-slate-600 font-semibold block">SPH</span>
                    <span className="font-mono font-bold text-slate-900">
                      {rx.right_sph > 0 ? `+${rx.right_sph}` : rx.right_sph}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-sky-100">
                    <span className="text-[10px] text-slate-600 font-semibold block">CYL</span>
                    <span className="font-mono font-bold text-slate-900">
                      {rx.right_cyl > 0 ? `+${rx.right_cyl}` : rx.right_cyl}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-sky-100">
                    <span className="text-[10px] text-slate-600 font-semibold block">Axis</span>
                    <span className="font-mono text-slate-900">{rx.right_axis}°</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-sky-100">
                    <span className="text-[10px] text-slate-600 font-semibold block">PD</span>
                    <span className="font-mono text-slate-900">{rx.right_pd}</span>
                  </div>
                </div>
              </div>

              {/* Left Eye */}
              <div className="bg-teal-50/50 rounded-2xl p-4 border border-teal-100">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-teal-900">
                    Left Eye (OS)
                  </h4>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-xl border border-teal-100">
                    <span className="text-[10px] text-slate-600 font-semibold block">SPH</span>
                    <span className="font-mono font-bold text-slate-900">
                      {rx.left_sph > 0 ? `+${rx.left_sph}` : rx.left_sph}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-teal-100">
                    <span className="text-[10px] text-slate-600 font-semibold block">CYL</span>
                    <span className="font-mono font-bold text-slate-900">
                      {rx.left_cyl > 0 ? `+${rx.left_cyl}` : rx.left_cyl}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-teal-100">
                    <span className="text-[10px] text-slate-600 font-semibold block">Axis</span>
                    <span className="font-mono text-slate-900">{rx.left_axis}°</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-teal-100">
                    <span className="text-[10px] text-slate-600 font-semibold block">PD</span>
                    <span className="font-mono text-slate-900">{rx.left_pd}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Doctor Notes */}
            {rx.notes && (
              <div className="px-6 pb-5 pt-0">
                <div className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="font-semibold text-slate-700 not-italic block mb-0.5">
                    Optometrist Notes:
                  </span>
                  "{rx.notes}"
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
