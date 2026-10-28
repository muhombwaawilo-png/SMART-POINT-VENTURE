import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { User, UserRole, UserStatus } from '../../types';
import {
  UserCog,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Phone,
  DollarSign,
  TrendingUp,
  Receipt,
  X,
  Lock,
  Trash2,
  Key,
  Copy,
  Check,
  Info,
  Sparkles,
  RefreshCw,
  Hash,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const Employees: React.FC = () => {
  const {
    users,
    sales,
    closings,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    generateNumericEmployeeId,
    isEmployeeNumberUnique,
    currentUser,
    formatTZS,
    language,
    t,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [status, setStatus] = useState<UserStatus>('active');
  const [idGenMode, setIdGenMode] = useState<'sequential' | 'random'>('sequential');
  const [formError, setFormError] = useState<string | null>(null);

  // Employee Performance Stats computed from real sales & closings
  const performanceMap = useMemo(() => {
    const map: Record<
      string,
      {
        totalSales: number;
        txCount: number;
        avgTicket: number;
        cashShortages: number;
      }
    > = {};

    users.forEach(u => {
      const empSales = sales.filter(s => s.employeeId === u.id && s.status === 'completed');
      const totalSales = empSales.reduce((sum, s) => sum + s.totalAmount, 0);
      const txCount = empSales.length;
      const avgTicket = txCount > 0 ? Math.round(totalSales / txCount) : 0;

      const empClosings = closings.filter(c => c.employeeId === u.id && c.difference < 0);
      const cashShortages = empClosings.reduce((sum, c) => sum + Math.abs(c.difference), 0);

      map[u.id] = { totalSales, txCount, avgTicket, cashShortages };
    });

    return map;
  }, [users, sales, closings]);

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      u.role.includes(q) ||
      (u.employeeNumber && u.employeeNumber.includes(q))
    );
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setName('');
    const newId = generateNumericEmployeeId('sequential');
    setEmployeeNumber(newId);
    setPassword('1234');
    setPhone('');
    setRole('cashier');
    setStatus('active');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setEmployeeNumber(u.employeeNumber || '');
    setPassword(u.password || u.pin || '1234');
    setPhone(u.phone);
    setRole(u.role);
    setStatus(u.status);
    setFormError(null);
    setShowAddModal(true);
  };

  // Generate a new unique numeric ID on button click
  const handleGenerateNewId = (mode: 'sequential' | 'random') => {
    setIdGenMode(mode);
    const newId = generateNumericEmployeeId(mode);
    setEmployeeNumber(newId);
    setFormError(null);
  };

  // Real-time ID validity calculation
  const isIdValid = useMemo(() => {
    const clean = employeeNumber.trim();
    if (!clean) return { valid: false, message: 'Namba ya mfanyakazi inahitajika.' };
    if (!/^\d+$/.test(clean)) return { valid: false, message: 'Lazima iwe ya tarakimu/namba pekee (0-9).' };
    if (!isEmployeeNumberUnique(clean, editingUser?.id)) {
      return { valid: false, message: `Namba [${clean}] tayari inatumiwa na mfanyakazi mwingine.` };
    }
    return { valid: true, message: `Namba ya kipekee [${clean}] inapatikana.` };
  }, [employeeNumber, editingUser, isEmployeeNumberUnique]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Tafadhali ingiza jina kamili la mfanyakazi.');
      return;
    }

    const cleanId = employeeNumber.trim();
    if (!cleanId || !/^\d+$/.test(cleanId)) {
      setFormError('Namba ya mfanyakazi lazima iwe namba/tarakimu pekee (mfano: 1001).');
      return;
    }

    if (!isEmployeeNumberUnique(cleanId, editingUser?.id)) {
      setFormError(`Namba ya mfanyakazi "${cleanId}" tayari inatumiwa. Tafadhali tengeneza namba nyingine.`);
      return;
    }

    if (editingUser) {
      updateEmployee(editingUser.id, {
        name: name.trim(),
        username: cleanId, // numeric employee ID is strictly the login username
        employeeNumber: cleanId,
        password: password.trim() || '1234',
        pin: password.trim() || '1234',
        phone: phone.trim(),
        role,
        status,
      });
    } else {
      addEmployee({
        name: name.trim(),
        username: cleanId, // numeric employee ID is strictly the login username
        employeeNumber: cleanId,
        password: password.trim() || '1234',
        pin: password.trim() || '1234',
        phone: phone.trim() || '0700000000',
        role,
        status: 'active',
        avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=100&fit=crop&q=80`,
      });
    }

    setShowAddModal(false);
    setEditingUser(null);
  };

  // Toggle user status
  const handleToggleStatus = (u: User) => {
    if (u.id === currentUser.id) {
      alert('Huwezi kusimamisha akaunti yako mwenyewe unayotumia sasa!');
      return;
    }
    const newStatus: UserStatus = u.status === 'active' ? 'suspended' : 'active';
    updateEmployee(u.id, { status: newStatus });
  };

  // Delete employee
  const handleDelete = (u: User) => {
    if (u.role === 'super_admin') {
      alert('Akaunti ya Super Admin (Mkurugenzi Mkuu) haiwezi kufutwa!');
      return;
    }
    if (window.confirm(`Una uhakika unataka kumfuta mfanyakazi "${u.name}" (ID: ${u.employeeNumber}) kabisa kwenye mfumo?`)) {
      deleteEmployee(u.id);
    }
  };

  const copyCredentials = (u: User) => {
    const text = `SMART POINT VENTURE - Taarifa za Kuingia:\nJina: ${u.name}\nNamba ya Mfanyakazi / Username ya Kuingilia: ${u.employeeNumber}\nNenosiri (Password): ${u.password || '1234'}\nWadhifa: ${u.role === 'cashier' ? 'Muuza Duka (Cashier)' : 'Meneja (Manager)'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(u.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const staffCount = users.filter(u => u.role !== 'super_admin').length;

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Usimamizi wa Wafanyakazi & Namba za Kipekee za Utambulisho</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-bold">
              {staffCount} Wafanyakazi
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Super Admin (Awilo Suleiman) hutengeneza Namba ya Mfanyakazi ya tarakimu pekee (Numeric ID kama <strong>1001, 1002</strong>) inayotumika kama jina la mtumiaji (username) wakati wa kuingia kwenye mfumo.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Sajili Mfanyakazi Mpya</span>
        </button>
      </div>

      {/* Info notice about clean state */}
      {staffCount === 0 && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
          <Info className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
            <p className="font-bold">Akaunti pekee iliyopo sasa ni ya Super Admin (AWILO SULEIMAN - ID: 1000).</p>
            <p className="text-emerald-800/90 dark:text-emerald-300/90">
              Ili kumpa mfanyakazi wa duka akaunti yake, bofya kitufe cha <strong>"Sajili Mfanyakazi Mpya"</strong>. Mfumo utakutengenezea namba ya kipekee ya tarakimu (mfano: <strong>1001</strong>) itakayokuwa username yake ya kuingilia kwenye Staff Portal na daftari la Excel.
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tafuta kwa jina, Namba ya Utambulisho ya tarakimu (mfano: 1001), simu au wadhifa..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Employees Grid with Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredUsers.map(u => {
          const perf = performanceMap[u.id] || { totalSales: 0, txCount: 0, avgTicket: 0, cashShortages: 0 };
          const isOwner = u.role === 'super_admin';

          return (
            <div
              key={u.id}
              className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border shadow-sm space-y-4 ${
                isOwner
                  ? 'border-emerald-500/50 dark:border-emerald-500/40 bg-emerald-50/10'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop&q=80'}
                    alt={u.name}
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-emerald-500/30"
                  />
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{u.name}</span>
                      {isOwner && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          MKURUGENZI MKUU
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="capitalize font-medium">{t[u.role]}</span>
                      <span>•</span>
                      <span className="font-mono">{u.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.status === 'active'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {u.status === 'active' ? 'ANAFANYA KAZI' : 'AMESIMAMISHWA'}
                  </span>

                  <span className="font-mono font-extrabold text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">
                    ID: {u.employeeNumber || '1001'}
                  </span>
                </div>
              </div>

              {/* Login Credentials Box with numeric ID clearly highlighted */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Key className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Taarifa za Kuingia (Login Credentials):</span>
                  </span>
                  <button
                    onClick={() => copyCredentials(u)}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {copiedId === u.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedId === u.id ? 'Imenakiliwa!' : 'Nakili Taarifa'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700/60">
                    <span className="text-slate-400 block text-[10px] font-sans font-semibold">
                      {isOwner ? 'Username / Simu:' : 'Username (Numeric ID):'}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm tracking-wide">
                      {isOwner ? u.username : u.employeeNumber}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700/60">
                    <span className="text-slate-400 block text-[10px] font-sans font-semibold">
                      Nenosiri (Password):
                    </span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 text-sm tracking-wide">
                      {u.password || u.pin || '1234'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Jumla ya Mauzo</span>
                  <span className="font-black font-mono text-slate-900 dark:text-white text-sm">
                    {formatTZS(perf.totalSales)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Miamala</span>
                  <span className="font-black font-mono text-slate-900 dark:text-white text-sm">
                    {perf.txCount}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Wastani / Muamala</span>
                  <span className="font-black font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatTZS(perf.avgTicket)}
                  </span>
                </div>
              </div>

              {/* Cash Shortage History Alert */}
              {perf.cashShortages > 0 && (
                <div className="text-[11px] text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg font-medium flex items-center justify-between">
                  <span>Historia ya Upungufu wa Droo:</span>
                  <span className="font-bold font-mono">-{formatTZS(perf.cashShortages)}</span>
                </div>
              )}

              {/* Actions */}
              {!isOwner && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleDelete(u)}
                    className="p-1.5 text-xs font-semibold text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-1 transition cursor-pointer"
                    title="Futa mfanyakazi huyu"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="text-[11px]">Futa Mfanyakazi</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        u.status === 'active'
                          ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                      }`}
                    >
                      {u.status === 'active' ? 'Simamisha' : 'Wezesha'}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      Hariri Taarifa
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Employee Modal with Numeric ID Generator */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Hash className="h-4 w-4 text-emerald-500" />
                  <span>{editingUser ? 'Hariri Mfanyakazi & Namba ya Utambulisho' : 'Sajili Mfanyakazi Mpya & Tengeneza Namba ya Kazi'}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Super Admin anazalisha namba ya kipekee ya tarakimu itakayotumika kama Username ya mfanyakazi.
                </p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Jina Kamili:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Mfano: Asha Hamisi au Juma Bakari"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              {/* Numeric Employee ID Generator & Unique Identifier Control */}
              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 dark:text-white block flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Namba ya Mfanyakazi (Numeric Employee ID - Username):</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                    Tarakimu Pekee
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={employeeNumber}
                    onChange={e => setEmployeeNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Mfano: 1001"
                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-black text-sm text-slate-900 dark:text-white tracking-wider"
                  />

                  {/* Generator Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleGenerateNewId('sequential')}
                      className="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-sm cursor-pointer"
                      title="Tengeneza namba inayofuata kwa mfululizo (k.m. 1001, 1002)"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Inayofuata</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGenerateNewId('random')}
                      className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] flex items-center gap-1 transition shadow-sm cursor-pointer"
                      title="Tengeneza namba ya kipekee ya nasibu yenye tarakimu 4"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      <span>Nasibu</span>
                    </button>
                  </div>
                </div>

                {/* Real-time ID verification indicator */}
                <div className="flex items-center gap-1.5 text-[11px]">
                  {isIdValid.valid ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{isIdValid.message}</span>
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>{isIdValid.message}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nenosiri la Mfanyakazi (Password):
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mfano: 1234 au asha2024"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Ipendekezwe kulingana na matumizi ya mfanyakazi.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Namba ya Simu:</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="06... au 07..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Wadhifa (Role):</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                >
                  <option value="cashier">Muuza Duka (Cashier) - Rekodi mauzo kwenye Excel & POS na funga siku</option>
                  <option value="manager">Meneja (Manager) - Anaona ripoti na kusimamia stoo</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  disabled={!isIdValid.valid}
                  className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow cursor-pointer disabled:opacity-50"
                >
                  {editingUser ? 'Hifadhi Mabadiliko' : 'Sajili Mfanyakazi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
