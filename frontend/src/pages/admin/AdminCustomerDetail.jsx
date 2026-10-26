import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import {
  ArrowLeft,
  User,
  Plus,
  Eye,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileText,
  Clock,
  Save,
} from 'lucide-react';

export default function AdminCustomerDetail() {
  const { id } = useParams();

  const [customer, setCustomer] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add Prescription Form
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const todayStr = new Date().toISOString().slice(0, 10);
  const [checkupDate, setCheckupDate] = useState(todayStr);

  // Right Eye
  const [rightSph, setRightSph] = useState('-1.50');
  const [rightCyl, setRightCyl] = useState('-0.50');
  const [rightAxis, setRightAxis] = useState('90');
  const [rightPd, setRightPd] = useState('31.5');

  // Left Eye
  const [leftSph, setLeftSph] = useState('-1.75');
  const [leftCyl, setLeftCyl] = useState('-0.50');
  const [leftAxis, setLeftAxis] = useState('85');
  const [leftPd, setLeftPd] = useState('31.0');

  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [cust, rxList] = await Promise.all([
        api.admin.getCustomer(id),
        api.admin.getCustomerPrescriptions(id),
      ]);
      setCustomer(cust);
      setPrescriptions(rxList);
    } catch (err) {
      setError(err.message || 'Failed to load customer profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAddPrescription = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      checkup_date: checkupDate,
      right_sph: parseFloat(rightSph),
      right_cyl: parseFloat(rightCyl),
      right_axis: parseInt(rightAxis, 10),
      right_pd: parseFloat(rightPd),
      left_sph: parseFloat(leftSph),
      left_cyl: parseFloat(leftCyl),
      left_axis: parseInt(leftAxis, 10),
      left_pd: parseFloat(leftPd),
      notes: notes.trim() || null,
    };

    try {
      await api.admin.addPrescription(id, payload);
      setSuccess('Prescription saved successfully.');
      setShowForm(false);
      setNotes('');
      loadData();
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      setError(err.message || 'Failed to save prescription.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-600">
        Loading customer prescriptions...
      </div>
    );
  }

  if (error && !customer) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-semibold text-rose-600">{error}</p>
        <Link
          to="/admin/customers"
          className="mt-4 inline-flex items-center text-xs text-indigo-600 font-semibold"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top back button & Customer Header */}
      <div>
        <Link
          to="/admin/customers"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Customer List
        </Link>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl shrink-0">
              {customer?.name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{customer?.name}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                <span>{customer?.email}</span>
                <span>•</span>
                <span>{customer?.phone || 'No phone'}</span>
                <span>•</span>
                <span>Registered: {customer?.created_at?.slice(0, 10)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start md:self-auto"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {showForm ? 'Close Prescription Form' : 'Add New Prescription'}
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ADD PRESCRIPTION FORM (Section 19) */}
      {showForm && (
        <div className="bg-white rounded-3xl border-2 border-indigo-200 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-900">Record Eye Checkup Examination</h3>
            <p className="text-xs text-slate-600">
              Enter optical measurements for Right Eye (OD) and Left Eye (OS)
            </p>
          </div>

          <form onSubmit={handleAddPrescription} className="space-y-6">
            {/* Checkup Date */}
            <div className="max-w-xs">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Checkup Date *
              </label>
              <input
                type="date"
                required
                value={checkupDate}
                onChange={(e) => setCheckupDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* RIGHT EYE */}
              <div className="bg-sky-50/50 rounded-2xl p-5 border border-sky-100 space-y-4">
                <div className="flex items-center space-x-2 border-b border-sky-100 pb-2">
                  <div className="w-3 h-3 rounded-full bg-sky-600" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-sky-900">
                    RIGHT EYE (OD)
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      SPH (Diopters) *
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      required
                      placeholder="-2.00"
                      value={rightSph}
                      onChange={(e) => setRightSph(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-300 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      CYL (Diopters) *
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      required
                      placeholder="-0.50"
                      value={rightCyl}
                      onChange={(e) => setRightCyl(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-300 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Axis (0 - 180°) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="180"
                      required
                      placeholder="90"
                      value={rightAxis}
                      onChange={(e) => setRightAxis(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-300 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      PD (mm) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      placeholder="32.0"
                      value={rightPd}
                      onChange={(e) => setRightPd(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-300 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* LEFT EYE */}
              <div className="bg-teal-50/50 rounded-2xl p-5 border border-teal-100 space-y-4">
                <div className="flex items-center space-x-2 border-b border-teal-100 pb-2">
                  <div className="w-3 h-3 rounded-full bg-teal-600" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-teal-900">
                    LEFT EYE (OS)
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      SPH (Diopters) *
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      required
                      placeholder="-2.25"
                      value={leftSph}
                      onChange={(e) => setLeftSph(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-300 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      CYL (Diopters) *
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      required
                      placeholder="-0.75"
                      value={leftCyl}
                      onChange={(e) => setLeftCyl(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-300 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Axis (0 - 180°) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="180"
                      required
                      placeholder="85"
                      value={leftAxis}
                      onChange={(e) => setLeftAxis(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-300 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      PD (mm) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      placeholder="31.0"
                      value={leftPd}
                      onChange={(e) => setLeftPd(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-300 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Optometrist Notes / Clinical Observations
              </label>
              <textarea
                rows={2}
                placeholder="Prescription changes, lens coatings, visual symptoms..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {submitting ? 'Saving Prescription...' : 'Save Prescription'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PRESCRIPTION HISTORY (Section 20: Newest -> Oldest) */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900">
          Prescription History ({prescriptions.length} Records)
        </h3>

        {prescriptions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-600">
            No prescriptions recorded yet. Click "Add New Prescription" to record their first
            checkup.
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((rx, idx) => (
              <div
                key={rx.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-sm text-slate-900">{rx.checkup_date}</span>
                    {idx === 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Latest Examination
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-600">Exam #{prescriptions.length - idx}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="font-bold text-sky-800 block mb-1">Right Eye (OD)</span>
                    <span className="font-mono text-slate-700">
                      SPH: <strong>{rx.right_sph}</strong> | CYL:{' '}
                      <strong>{rx.right_cyl}</strong> | Axis: <strong>{rx.right_axis}°</strong> |
                      PD: <strong>{rx.right_pd} mm</strong>
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="font-bold text-teal-800 block mb-1">Left Eye (OS)</span>
                    <span className="font-mono text-slate-700">
                      SPH: <strong>{rx.left_sph}</strong> | CYL: <strong>{rx.left_cyl}</strong> |
                      Axis: <strong>{rx.left_axis}°</strong> | PD:{' '}
                      <strong>{rx.left_pd} mm</strong>
                    </span>
                  </div>
                </div>

                {rx.notes && (
                  <p className="text-xs text-slate-600 italic border-l-2 border-slate-300 pl-3">
                    "{rx.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
