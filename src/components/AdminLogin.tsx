/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SchoolProfile } from '../types';
import { Lock, User, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';

interface AdminLoginProps {
  schoolProfile: SchoolProfile;
  onLoginSuccess: () => void;
}

export default function AdminLogin({ schoolProfile, onLoginSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const storedUsername = localStorage.getItem('admin_username') || 'MUSTHOLIH';
    const storedPassword = localStorage.getItem('admin_password') || 'Miftahulhuda97@';

    // Simulate small latency for realistic premium interface feel
    setTimeout(() => {
      if (username.trim() === storedUsername.trim() && password === storedPassword) {
        onLoginSuccess();
      } else {
        setError('Nama Admin atau Password salah. Harap periksa kembali.');
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative select-none" id="admin-login-viewport">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-60"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex flex-col items-center">
          {/* Logo container */}
          <div className="w-20 h-20 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-md overflow-hidden p-2.5">
            {schoolProfile.logoImage ? (
              <img
                src={schoolProfile.logoImage}
                alt="Logo Madrasah"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center text-white font-extrabold text-3xl">
                {schoolProfile.schoolName ? schoolProfile.schoolName.charAt(0) : 'M'}
              </div>
            )}
          </div>

          <h2 className="mt-5 text-center text-xs font-black tracking-widest text-indigo-600 uppercase">
            {schoolProfile.foundationName || 'KEMENTERIAN AGAMA REPUBLIK INDONESIA'}
          </h2>
          <h1 className="mt-1.5 text-center text-xl font-black text-slate-800 tracking-tight uppercase px-4">
            {schoolProfile.schoolName || 'MIFTAHUL HUDA'}
          </h1>
          <p className="mt-1 text-center text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
            Sistem Absensi Kepegawaian &amp; Guru
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-xl space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              Autentikasi Administrator
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Harap masuk dengan akun admin Anda untuk mengelola data absensi.</p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2 animate-shake" id="login-error-alert">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} id="login-form">
            <div>
              <label htmlFor="admin-username" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Nama Admin
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  id="admin-username"
                  name="username"
                  type="text"
                  required
                  autoComplete="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-lg text-xs font-bold transition outline-none text-slate-700"
                  placeholder="Ketik nama admin..."
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Password Admin
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-lg text-xs font-mono font-bold transition outline-none text-slate-700"
                  placeholder="Ketik password admin..."
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  id="btn-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-lg transition uppercase tracking-wider cursor-pointer shadow-md flex items-center justify-center gap-2"
                id="btn-login-submit"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    Masuk ke Dashboard
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer info showing security parameters */}
        <div className="mt-8 text-center text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
          SISTEM ABSENSI MANDIRI &bull; MIFTAHUL HUDA
        </div>
      </div>
    </div>
  );
}
