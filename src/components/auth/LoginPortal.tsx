import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Store,
  ShieldCheck,
  UserCheck,
  Lock,
  User,
  Phone,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  EyeOff,
  Globe,
  ArrowRight,
  Info,
  Sun,
  Moon,
} from 'lucide-react';

export const LoginPortal: React.FC = () => {
  const { login, users, settings, language, setLanguage, theme, setTheme, t } = useStore();

  const [activePortal, setActivePortal] = useState<'admin' | 'staff'>('admin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filter staff members to help staff identify their EMP numbers
  const staffMembers = users.filter(u => u.role !== 'super_admin');
  const superAdmin = users.find(u => u.role === 'super_admin');

  const handlePortalSwitch = (portal: 'admin' | 'staff') => {
    setActivePortal(portal);
    setErrorMessage(null);
    if (portal === 'admin') {
      setIdentifier('awilo');
      setPassword('awilo123');
    } else {
      if (staffMembers.length > 0) {
        setIdentifier(staffMembers[0].employeeNumber || '1001');
        setPassword(staffMembers[0].password || '1234');
      } else {
        setIdentifier('');
        setPassword('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage(
        activePortal === 'admin'
          ? (language === 'sw' ? 'Tafadhali ingiza jina la mtumiaji au namba ya simu.' : 'Please enter username or phone number.')
          : (language === 'sw' ? 'Tafadhali ingiza Namba ya Mfanyakazi (tarakimu pekee, mfano: 1001).' : 'Please enter Numeric Employee ID (e.g. 1001).')
      );
      return;
    }

    if (activePortal === 'staff' && !/^\d+$/.test(identifier.trim())) {
      setErrorMessage(
        language === 'sw'
          ? 'Namba ya mfanyakazi lazima iwe ya tarakimu/namba pekee (mfano: 1001).'
          : 'Employee ID must contain numbers only (e.g. 1001).'
      );
      return;
    }

    if (!password.trim()) {
      setErrorMessage(language === 'sw' ? 'Tafadhali ingiza nenosiri lako.' : 'Please enter your password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = login(activePortal, identifier, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message || (language === 'sw' ? 'Taarifa za kuingia si sahihi.' : 'Invalid credentials.'));
      }
    }, 250);
  };

  const fillAdminCredentials = () => {
    setActivePortal('admin');
    setIdentifier('awilo');
    setPassword('awilo123');
    setErrorMessage(null);
  };

  const fillStaffCredentials = (empNo: string, empPass: string) => {
    setActivePortal('staff');
    setIdentifier(empNo);
    setPassword(empPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top right tools: White Mode / Dark Mode & Language */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Dark Mode & White Mode Switcher */}
        <div className="flex items-center bg-slate-900/80 dark:bg-slate-900/90 border border-slate-700/80 p-0.5 rounded-xl shadow-lg backdrop-blur">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              theme === 'light'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="White Mode"
          >
            <Sun className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">White Mode</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              theme === 'dark'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Dark Mode"
          >
            <Moon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Dark Mode</span>
          </button>
        </div>

        <button
          onClick={() => setLanguage(language === 'sw' ? 'en' : 'sw')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 backdrop-blur transition cursor-pointer"
        >
          <Globe className="h-3.5 w-3.5 text-emerald-400" />
          <span>{language === 'sw' ? 'Kiswahili' : 'English'}</span>
        </button>
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/20 mb-1">
            <Store className="h-9 w-9 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            SMART POINT VENTURE
          </h1>
          <p className="text-xs sm:text-sm text-emerald-400 font-medium">
            "{language === 'sw' ? 'Biashara ya Kisasa. Udhibiti Zaidi. Faida Kubwa.' : 'Smart Business. Better Control. Higher Profit.'}"
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
              📍 Kinyerezi – Kifuru – Mwanzo Mgumu, Dar es Salaam
            </span>
          </div>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-sm">
          {/* Portal Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => handlePortalSwitch('admin')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                activePortal === 'admin'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Super Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handlePortalSwitch('staff')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                activePortal === 'staff'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <UserCheck className="h-4 w-4" />
              <span>Wafanyakazi (Staff)</span>
            </button>
          </div>

          {/* Portal Subtitle */}
          <div className="mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              {activePortal === 'admin' ? (
                <>
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Portal ya Mkurugenzi Mkuu (Awilo Suleiman)</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4 text-teal-400" />
                  <span>Portal ya Wafanyakazi & Daftari la Excel</span>
                </>
              )}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {activePortal === 'admin'
                ? 'Ingia kutazama faida, mauzo ya wafanyakazi wote, stoo na ripoti.'
                : 'Ingia kwa Namba ya Mfanyakazi kurekodi mauzo kwenye daftari lako la Excel.'}
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {activePortal === 'admin' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Jina la Mtumiaji au Namba ya Simu:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="awilo au 0654275518"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Namba ya Mfanyakazi (Numeric Employee ID):</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">Tarakimu Pekee</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value.replace(/\D/g, ''))}
                    placeholder="Mfano: 1001"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold tracking-wider text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Namba hii ya kipekee ya tarakimu (mfano: <strong>1001</strong>) inatolewa na Super Admin (Awilo Suleiman).
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nenosiri (Password):
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Ingiza nenosiri lako"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Inathibitisha...</span>
              ) : (
                <>
                  <span>
                    {activePortal === 'admin'
                      ? 'Ingia Kama Super Admin'
                      : 'Ingia Kwenye Daftari Langu la Mauzo'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Helper Credentials Box */}
          <div className="mt-6 pt-5 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
              <Info className="h-3.5 w-3.5 text-emerald-400" />
              <span>Taarifa za Kuingilia kwa Urahisi:</span>
            </div>

            {activePortal === 'admin' ? (
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Mkurugenzi:</span>
                  <span className="font-bold text-white">AWILO SULEIMAN</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Username / Simu:</span>
                  <span className="font-mono text-emerald-400 font-bold">awilo</span> au <span className="font-mono text-emerald-400 font-bold">0654275518</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Nenosiri (Password):</span>
                  <span className="font-mono text-amber-400 font-bold">awilo123</span>
                </div>
                <button
                  type="button"
                  onClick={fillAdminCredentials}
                  className="w-full mt-2 py-1 text-[10px] font-bold rounded-lg bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900/80 border border-emerald-800 transition"
                >
                  Tumia Taarifa za Super Admin moja kwa moja
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {staffMembers.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-[11px] text-amber-300">
                    <p className="font-bold mb-1">Hakuna mfanyakazi aliyesajiliwa bado.</p>
                    <p className="text-[10px] text-amber-200/80">
                      Mkurugenzi Mkuu (Awilo Suleiman) ataingia kwanza kwenye Super Admin Portal na kuwasajili wafanyakazi katika menyu ya <strong>Wafanyakazi</strong>, ambapo kila mmoja atatengenezewa namba yake ya kipekee ya tarakimu (mfano: <strong>1001, 1002</strong>) na nenosiri lake.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-400">
                      Chagua mfanyakazi aliyepo kuingia naye kwa jaribio:
                    </p>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {staffMembers.map(emp => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => fillStaffCredentials(emp.employeeNumber || '1001', emp.password || '1234')}
                          className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-950/70 hover:bg-slate-800/70 border border-slate-800 text-left transition text-[11px]"
                        >
                          <div>
                            <span className="font-bold text-white block">{emp.name}</span>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold">
                              Username (ID): {emp.employeeNumber || '1001'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Nenosiri:</span>
                            <span className="text-[10px] font-mono text-amber-400 font-bold">{emp.password || '1234'}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 space-y-0.5">
          <p>Mawasiliano: 0654275518 / 0657635845</p>
          <p>© {new Date().getFullYear()} Smart Point Venture. Haki zote zimehifadhiwa.</p>
        </div>
      </div>
    </div>
  );
};
