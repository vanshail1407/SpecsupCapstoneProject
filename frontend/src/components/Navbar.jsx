import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  CalendarDays,
  Glasses,
  History,
  Home,
  LogOut,
  LogIn,
  Menu,
  Package,
  ScanEye,
  Shield,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const iconLinkClass = (isActive) =>
    `group inline-flex h-10 items-center justify-center gap-2 px-2.5 text-[10px] font-medium uppercase tracking-[0.12em] transition-colors ${
      isActive ? 'bg-stone-100 text-stone-950' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-950'
    }`;

  const iconLabelClass = (isActive) =>
    `whitespace-nowrap ${isActive ? 'inline-flex' : 'hidden group-hover:inline-flex group-focus-visible:inline-flex'}`;

  const mobileNavLinkClass = ({ isActive }) =>
    `block px-3 py-2 text-sm font-medium ${
      isActive
        ? 'text-stone-950'
        : 'text-stone-500 hover:bg-stone-50 hover:text-stone-950'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        <div className="flex h-[68px] items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center text-stone-900 transition-transform group-hover:scale-105">
              <Glasses className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <div>
              <span className="text-lg font-semibold tracking-[-0.06em] text-stone-900">
                SpecsUp
              </span>
              <span className="mt-[-2px] block text-[8px] font-medium uppercase tracking-[0.22em] text-stone-500">
                Optical studio
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
            <Link
              to="/"
              aria-label="Home"
              title="Home"
              className={iconLinkClass(location.pathname === '/' && !location.hash)}
            >
              <Home className="h-4 w-4 shrink-0" />
              <span className={iconLabelClass(location.pathname === '/' && !location.hash)}>Home</span>
            </Link>
            <Link
              to="/#frames-section"
              aria-label="Collection"
              title="Collection"
              className={iconLinkClass(location.pathname === '/' && location.hash === '#frames-section')}
            >
              <Package className="h-4 w-4 shrink-0" />
              <span className={iconLabelClass(location.pathname === '/' && location.hash === '#frames-section')}>
                Collection
              </span>
            </Link>
            <Link
              to="/#recommendations-section"
              aria-label="Optical care"
              title="Optical care"
              className={iconLinkClass(location.pathname === '/' && location.hash === '#recommendations-section')}
            >
              <ScanEye className="h-4 w-4 shrink-0" />
              <span className={iconLabelClass(location.pathname === '/' && location.hash === '#recommendations-section')}>
                Optical care
              </span>
            </Link>

            {isAuthenticated && !isAdmin && (
              <>
                <NavLink to="/analysis" aria-label="Prescription analysis" title="Prescription analysis" className={({ isActive }) => iconLinkClass(isActive)}>
                  {({ isActive }) => (
                    <>
                      <Activity className="h-4 w-4 shrink-0" />
                      <span className={iconLabelClass(isActive)}>Analysis</span>
                    </>
                  )}
                </NavLink>
                <NavLink to="/history" aria-label="Prescription history" title="Prescription history" className={({ isActive }) => iconLinkClass(isActive)}>
                  {({ isActive }) => (
                    <>
                      <History className="h-4 w-4 shrink-0" />
                      <span className={iconLabelClass(isActive)}>History</span>
                    </>
                  )}
                </NavLink>
                <NavLink to="/profile" aria-label="Profile" title="Profile" className={({ isActive }) => iconLinkClass(isActive)}>
                  {({ isActive }) => (
                    <>
                      <UserRound className="h-4 w-4 shrink-0" />
                      <span className={iconLabelClass(isActive)}>Profile</span>
                    </>
                  )}
                </NavLink>
              </>
            )}

            {isAdmin && (
              <>
                <NavLink to="/admin/products" aria-label="Products" title="Products" className={({ isActive }) => iconLinkClass(isActive)}>
                  {({ isActive }) => (
                    <>
                      <Package className="h-4 w-4 shrink-0" />
                      <span className={iconLabelClass(isActive)}>Products</span>
                    </>
                  )}
                </NavLink>
                <NavLink to="/admin/customers" aria-label="Customers" title="Customers" className={({ isActive }) => iconLinkClass(isActive)}>
                  {({ isActive }) => (
                    <>
                      <UsersRound className="h-4 w-4 shrink-0" />
                      <span className={iconLabelClass(isActive)}>Customers</span>
                    </>
                  )}
                </NavLink>
                <NavLink to="/admin/reservations" aria-label="Reservations" title="Reservations" className={({ isActive }) => iconLinkClass(isActive)}>
                  {({ isActive }) => (
                    <>
                      <CalendarDays className="h-4 w-4 shrink-0" />
                      <span className={iconLabelClass(isActive)}>Reservations</span>
                    </>
                  )}
                </NavLink>
              </>
            )}
          </nav>

          {/* User Status & Auth Buttons */}
          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="flex items-center justify-end space-x-1.5">
                    {isAdmin && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Shield className="w-3 h-3 mr-1" /> Admin
                      </span>
                    )}
                    <span className="text-sm font-medium text-stone-800">{user?.name}</span>
                  </div>
                  <span className="text-xs text-stone-500">{user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center border border-stone-300 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-stone-700 transition-colors hover:bg-stone-100"
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
                  className="inline-flex items-center border border-stone-300 px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-stone-700 transition-colors hover:bg-stone-100"
                >
                  <LogIn className="mr-1.5 h-4 w-4 text-stone-600" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center bg-stone-900 px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white transition-colors hover:bg-stone-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-950"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="space-y-1 border-t border-stone-200 bg-white px-4 pb-4 pt-2 shadow-lg md:hidden">
          <Link
            to="/#frames-section"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            Collection
          </Link>
          <Link
            to="/#recommendations-section"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            Optical care
          </Link>
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
