import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Glasses, Users, ShoppingBag, Shield } from 'lucide-react';

export default function AdminLayout() {
  const tabClass = ({ isActive }) =>
    `flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
      isActive
        ? 'border-indigo-600 text-indigo-700 font-semibold bg-indigo-50/50'
        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
    }`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Optical Shop Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Staff Management Portal
          </h1>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="flex space-x-4">
          <NavLink to="/admin/products" className={tabClass}>
            <Glasses className="w-4 h-4" />
            <span>Products & Frames</span>
          </NavLink>
          <NavLink to="/admin/customers" className={tabClass}>
            <Users className="w-4 h-4" />
            <span>Registered Customers</span>
          </NavLink>
          <NavLink to="/admin/reservations" className={tabClass}>
            <ShoppingBag className="w-4 h-4" />
            <span>Customer Reservations</span>
          </NavLink>
        </nav>
      </div>

      {/* Nested Tab View */}
      <Outlet />
    </div>
  );
}
