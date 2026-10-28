import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Expense, ExpenseCategory, PaymentMethod } from '../../types';
import {
  CreditCard,
  Plus,
  Search,
  Calendar,
  DollarSign,
  User,
  Zap,
  Droplets,
  Truck,
  Users,
  Smartphone,
  Wifi,
  Package,
  Wrench,
  Shield,
  FileText,
  X,
} from 'lucide-react';

export const Expenses: React.FC = () => {
  const {
    expenses,
    recordExpense,
    currentUser,
    formatTZS,
    language,
    t,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Expense Form
  const [category, setCategory] = useState<ExpenseCategory>('packaging');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidFromDrawer, setPaidFromDrawer] = useState<boolean>(true);
  const [receiptRef, setReceiptRef] = useState('');

  // Categories helper
  const expenseCategories: { id: ExpenseCategory; label: string; icon: any }[] = [
    { id: 'rent', label: t.expRent, icon: FileText },
    { id: 'electricity', label: t.expElectricity, icon: Zap },
    { id: 'water', label: t.expWater, icon: Droplets },
    { id: 'transport', label: t.expTransport, icon: Truck },
    { id: 'salaries', label: t.expSalaries, icon: Users },
    { id: 'airtime', label: t.expAirtime, icon: Smartphone },
    { id: 'internet', label: t.expInternet, icon: Wifi },
    { id: 'packaging', label: t.expPackaging, icon: Package },
    { id: 'repairs', label: t.expRepairs, icon: Wrench },
    { id: 'maintenance', label: t.expMaintenance, icon: Wrench },
    { id: 'taxes', label: t.expTaxes, icon: Shield },
    { id: 'mobile_charges', label: t.expMobileCharges, icon: Smartphone },
    { id: 'other', label: t.expOther, icon: CreditCard },
  ];

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        e.description.toLowerCase().includes(q) ||
        e.enteredByName.toLowerCase().includes(q) ||
        (e.receiptRef && e.receiptRef.toLowerCase().includes(q));

      const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;

      return matchesQuery && matchesCat;
    });
  }, [expenses, searchQuery, selectedCategory]);

  // Aggregate stats
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const stats = useMemo(() => {
    const todayExpenses = expenses.filter(e => e.date === todayStr).reduce((s, e) => s + e.amount, 0);
    const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonthPrefix)).reduce((s, e) => s + e.amount, 0);
    const cashDrawerPaid = expenses.filter(e => e.date === todayStr && e.paidFromCashDrawer).reduce((s, e) => s + e.amount, 0);

    return {
      todayExpenses,
      monthlyExpenses,
      cashDrawerPaid,
      totalCount: expenses.length,
    };
  }, [expenses, todayStr, currentMonthPrefix]);

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount) || 0;
    if (parsedAmount <= 0 || !description.trim()) {
      alert(language === 'sw' ? 'Jaza kiasi na maelezo ya matumizi!' : 'Enter amount and description!');
      return;
    }

    recordExpense({
      category,
      description: description.trim(),
      amount: parsedAmount,
      paymentMethod,
      paidFromCashDrawer: paidFromDrawer,
      receiptRef: receiptRef.trim() || undefined,
    });

    setShowAddModal(false);
    setDescription('');
    setAmount('');
    setReceiptRef('');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Matumizi ya Leo</span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {formatTZS(stats.todayExpenses)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Kutoka Droo ya Pesa: <strong className="text-slate-700 dark:text-slate-300">{formatTZS(stats.cashDrawerPaid)}</strong>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Matumizi ya Mwezi Huu</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatTZS(stats.monthlyExpenses)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Yanakatwa kwenye Faida Ghafi kupata Faida Halisi
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase">Rekodi Matumizi</span>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full mt-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>{t.recordExpense}</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tafuta maelezo ya matumizi, risiti, aliyerekodi..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
        >
          <option value="all">-- Kategoria Zote za Matumizi --</option>
          {expenseCategories.map(c => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Expense Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3.5">Tarehe & Muda</th>
                <th className="py-3 px-3.5">Aina ya Matumizi</th>
                <th className="py-3 px-3.5">Maelezo</th>
                <th className="py-3 px-3.5">Njia ya Malipo</th>
                <th className="py-3 px-3.5 text-center">Imelipwa Drooni?</th>
                <th className="py-3 px-3.5">Aliyerekodi</th>
                <th className="py-3 px-3.5 text-right">Kiasi (TZS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Hakuna matumizi yaliyopatikana
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 font-mono">
                      <div>{exp.date}</div>
                      <div className="text-[10px] text-slate-400">{exp.time}</div>
                    </td>
                    <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white capitalize">
                      {expenseCategories.find(c => c.id === exp.category)?.label || exp.category}
                    </td>
                    <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300">
                      <div>{exp.description}</div>
                      {exp.receiptRef && (
                        <div className="text-[10px] font-mono text-slate-400">Ref: {exp.receiptRef}</div>
                      )}
                    </td>
                    <td className="py-3 px-3.5 font-semibold uppercase text-slate-600 dark:text-slate-400">
                      {exp.paymentMethod}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {exp.paidFromCashDrawer ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                          NDIYO (DROO)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          HAPANA
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 font-medium">
                      {exp.enteredByName}
                    </td>
                    <td className="py-3 px-3.5 text-right font-black font-mono text-rose-600 dark:text-rose-400">
                      -{formatTZS(exp.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t.recordExpense}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">{t.expenseCategory}:</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {expenseCategories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">{t.expenseDescription}:</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Mfano: Mifuko ya kubebea mzigo, umeme wa LUKU..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Kiasi cha Fedha (TZS):</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Mfano: 15000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">{t.paymentMethod}:</label>
                <select
                  value={paymentMethod}
                  onChange={e => {
                    const pm = e.target.value as PaymentMethod;
                    setPaymentMethod(pm);
                    if (pm !== 'cash') {
                      setPaidFromDrawer(false);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="cash">{t.pmCash}</option>
                  <option value="mpesa">{t.pmMpesa}</option>
                  <option value="airtel_money">{t.pmAirtel}</option>
                  <option value="bank">{t.pmBank}</option>
                </select>
              </div>

              {/* Paid from drawer check */}
              {paymentMethod === 'cash' && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40">
                  <input
                    type="checkbox"
                    id="paidFromDrawer"
                    checked={paidFromDrawer}
                    onChange={e => setPaidFromDrawer(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="paidFromDrawer" className="text-xs font-semibold text-amber-900 dark:text-amber-200 cursor-pointer">
                    Pesa hii imetolewa moja kwa moja kwenye droo ya duka (Cash Drawer)?
                  </label>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Kumbukumbu ya Risiti / Ref (Hiari):</label>
                <input
                  type="text"
                  value={receiptRef}
                  onChange={e => setReceiptRef(e.target.value)}
                  placeholder="Mfano: LUKU-098234..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow"
                >
                  Hifadhi Matumizi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
