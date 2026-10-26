import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { User, Phone, MapPin, Calendar, ShoppingBag, CheckCircle, AlertCircle, Save } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [dob, setDob] = useState(user?.dob || '');
  const [address, setAddress] = useState(user?.address || '');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [reservations, setReservations] = useState([]);
  const [loadingRes, setLoadingRes] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setDob(user.dob || '');
      setAddress(user.address || '');
    }

    async function fetchReservations() {
      try {
        setLoadingRes(true);
        const data = await api.getMyReservations();
        setReservations(data);
      } catch (err) {
        console.error('Error fetching reservations:', err);
      } finally {
        setLoadingRes(false);
      }
    }

    fetchReservations();
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const updated = await api.updateProfile({
        name,
        phone,
        dob,
        address,
      });
      updateUser(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      setSaveError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Customer Profile</h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Manage your contact details and view your in-shop optical frame reservations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Editable Profile Information */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center space-x-2.5 mb-6 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
              <p className="text-xs text-slate-600">Update your account information</p>
            </div>
          </div>

          {saveSuccess && (
            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {saveError && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Address
              </label>
              <textarea
                rows={3}
                placeholder="House / Apartment, Street, City, State, Pincode"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-6 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs inline-flex items-center disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Account Summary Card */}
        <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 space-y-4 h-fit">
          <h3 className="font-bold text-sm text-slate-900">Account Summary</h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span className="text-slate-600">Role</span>
              <span className="font-semibold text-slate-800 capitalize">{user?.role}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span className="text-slate-600">Member Since</span>
              <span className="font-mono text-slate-800">
                {user?.created_at ? user.created_at.slice(0, 10) : 'Active'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span className="text-slate-600">Reserved Frames</span>
              <span className="font-semibold text-sky-700">{reservations.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: MY RESERVATIONS */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <ShoppingBag className="w-5 h-5 text-sky-600" />
          <h2 className="text-xl font-bold text-slate-900">My Reservations</h2>
        </div>

        {loadingRes && (
          <div className="p-8 text-center text-xs text-slate-600">Loading your reservations...</div>
        )}

        {!loadingRes && reservations.length === 0 && (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-10 text-center max-w-md mx-auto">
            <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-900">You haven't pre-booked any frames yet.</h3>
            <p className="text-xs text-slate-600 mt-1">
              Explore available frames on the Home page and pre-book your favorite frame.
            </p>
          </div>
        )}

        {!loadingRes && reservations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reservations.map((res) => (
              <div
                key={res.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center space-x-4"
              >
                <img
                  src={res.image_url}
                  alt={res.frame_name}
                  className="w-20 h-20 rounded-xl object-cover bg-slate-100 shrink-0"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=300&q=80';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 truncate">{res.frame_name}</h4>
                  <p className="text-xs text-slate-600">{res.brand}</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    ₹{Number(res.price).toLocaleString('en-IN')}
                  </p>
                  <div className="mt-2 text-[11px] text-slate-600 font-medium">
                    Reserved on: <span className="text-slate-700">{res.reservation_date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
