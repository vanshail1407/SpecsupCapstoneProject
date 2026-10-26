import React from 'react';
import { Glasses, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto bg-white border-t border-slate-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center text-white">
              <Glasses className="w-4 h-4" />
            </div>
            <span className="text-base font-bold text-slate-800">
              Specs<span className="text-sky-600">Up</span>
            </span>
            <span className="text-xs text-slate-600 pl-2 border-l border-slate-300">
              Optical Care & Prescription Trend System
            </span>
          </div>

          <p className="text-xs text-slate-600 text-center sm:text-right">
            College Full-Stack Capstone Project • Clinical Trends & In-Shop Inventory
          </p>
        </div>
      </div>
    </footer>
  );
}
