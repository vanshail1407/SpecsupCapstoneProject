import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Glasses, LogIn, AlertCircle, Shield, User } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(location.state?.message || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await login(email, password);
      // Role-based redirection from one single login page:
      if (user.role === 'admin') {
        navigate('/admin/products');
      } else {
        const from = location.state?.from?.pathname || '/';
        navigate(from === '/login' ? '/' : from);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuick = (e_val, p_val) => {
    setEmail(e_val);
    setPassword(p_val);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        {/* Brand Icon */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Glasses className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome to SpecsUp</h2>
          <p className="text-xs text-slate-600 mt-1">
            Sign in to access your prescriptions, history, and pre-booked frames
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. rahul@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-sm font-semibold transition-all shadow-xs flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials for College Examiner / Viva */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2 text-center">
            Demo Credentials (Click to fill)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillQuick('admin@specsup.com', 'admin123')}
              className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-left transition-colors flex items-center space-x-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <div className="truncate">
                <span className="font-semibold block text-slate-800">Admin</span>
                <span className="text-[10px] text-slate-600">admin@specsup.com</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => fillQuick('rahul@gmail.com', 'password123')}
              className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-200 text-left transition-colors flex items-center space-x-1.5"
            >
              <User className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <div className="truncate">
                <span className="font-semibold block text-slate-800">Customer</span>
                <span className="text-[10px] text-slate-600">rahul@gmail.com</span>
              </div>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          New customer?{' '}
          <Link to="/register" className="font-semibold text-sky-600 hover:text-sky-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
