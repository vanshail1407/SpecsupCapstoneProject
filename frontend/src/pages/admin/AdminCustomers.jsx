import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Users, Eye, Plus, Calendar, Mail, Phone } from 'lucide-react';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getCustomers();
      setCustomers(data);
    } catch (err) {
      setError(err.message || 'Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Registered Customers</h2>
          <p className="text-xs text-slate-600">
            View customer details, eye examination records, and add prescriptions
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
          {customers.length} Registered Customer{customers.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading && (
        <div className="py-16 text-center text-xs text-slate-600">Loading customers...</div>
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
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Registration Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      {c.address && (
                        <div className="text-[11px] text-slate-600 line-clamp-1">{c.address}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 font-mono">{c.email}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {c.phone || <span className="text-slate-600 italic">Not provided</span>}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 font-mono">
                      {c.created_at ? c.created_at.slice(0, 10) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/admin/customers/${c.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        View Prescriptions / Add
                      </Link>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-xs text-slate-600">
                      No registered customers found.
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
