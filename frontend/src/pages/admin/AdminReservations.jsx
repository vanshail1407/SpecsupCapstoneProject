import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ShoppingBag, Calendar, User, Tag } from 'lucide-react';

export default function AdminReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getReservations();
      setReservations(data);
    } catch (err) {
      setError(err.message || 'Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900">In-Shop Frame Reservations</h2>
          <p className="text-xs text-slate-600">
            Pre-booked frames reserved by registered customers for store pickup
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
          {reservations.length} Active Pre-booking{reservations.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading && (
        <div className="py-16 text-center text-xs text-slate-600">Loading reservations...</div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Reserved Frame</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Reservation Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{res.customer_name}</div>
                      <div className="text-xs text-slate-600 font-mono">{res.customer_email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={res.image_url}
                          alt={res.frame_name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=200&q=80';
                          }}
                        />
                        <div>
                          <div className="font-semibold text-slate-900">{res.frame_name}</div>
                          <div className="text-xs text-slate-600">{res.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      ₹{Number(res.price).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 font-mono">
                      {res.reservation_date}
                    </td>
                  </tr>
                ))}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-xs text-slate-600">
                      No frame reservations recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
