import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Glasses, User, LogOut, LogIn, Menu, X, Shield, Activity, History, FileText } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-sky-50 text-sky-700 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-md text-base font-medium ${
      isActive
        ? 'bg-sky-50 text-sky-700 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-sm group-hover:shadow transition-shadow">
              <Glasses className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-sky-700 transition-colors">
                Specs<span className="text-sky-600">Up</span>
              </span>
              <span className="block text-[10px] uppercase tracking-wider font-semibold text-slate-600 -mt-1">
                Optical Care
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>

            {isAuthenticated && !isAdmin && (
              <>
                <NavLink to="/analysis" className={navLinkClass}>
                  Prescription Analysis
                </NavLink>
                <NavLink to="/history" className={navLinkClass}>
                  Prescription History
                </NavLink>
                <NavLink to="/profile" className={navLinkClass}>
                  Profile
                </NavLink>
              </>
            )}

            {isAdmin && (
              <>
                <NavLink to="/admin/products" className={navLinkClass}>
                  Products
                </NavLink>
                <NavLink to="/admin/customers" className={navLinkClass}>
                  Customers
                </NavLink>
                <NavLink to="/admin/reservations" className={navLinkClass}>
                  Reservations
                </NavLink>
              </>
            )}
          </nav>

          {/* User Status & Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="flex items-center justify-end space-x-1.5">
                    {isAdmin && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Shield className="w-3 h-3 mr-1" /> Admin
                      </span>
                    )}
                    <span className="text-sm font-semibold text-slate-800">{user?.name}</span>
                  </div>
                  <span className="text-xs text-slate-600">{user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="inline-flex items-center px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <LogIn className="w-4 h-4 mr-1.5 text-slate-600" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          <NavLink
            to="/"
            end
            onClick={() => setMobileMenuOpen(false)}
            className={mobileNavLinkClass}
          >
            Home
          </NavLink>

          {isAuthenticated && !isAdmin && (
            <>
              <NavLink
                to="/analysis"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                Prescription Analysis
              </NavLink>
              <NavLink
                to="/history"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                Prescription History
              </NavLink>
              <NavLink
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                Profile
              </NavLink>
            </>
          )}

          {isAdmin && (
            <>
              <NavLink
                to="/admin/products"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                Products
              </NavLink>
              <NavLink
                to="/admin/customers"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                Customers
              </NavLink>
              <NavLink
                to="/admin/reservations"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                Reservations
              </NavLink>
            </>
          )}

          <div className="pt-3 border-t border-slate-200 mt-2">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-slate-800">
                  {user?.name} {isAdmin && '(Admin)'}
                </div>
                <div className="text-xs text-slate-600">{user?.email}</div>
                <button
                  onClick={handleLogout}
                  className="w-full mt-2 inline-flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-slate-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex justify-center items-center px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex justify-center items-center px-3 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
