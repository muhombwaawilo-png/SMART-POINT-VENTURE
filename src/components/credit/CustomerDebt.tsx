import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Customer, PaymentMethod } from '../../types';
import {
  Users,
  Search,
  Plus,
  DollarSign,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  X,
  CreditCard,
} from 'lucide-react';

export const CustomerDebt: React.FC = () => {
  const {
    customers,
    sales,
    recordCustomerPayment,
    addCustomer,
    formatTZS,
    language,
    t,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentRef, setPaymentRef] = useState('');

  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustLocation, setNewCustLocation] = useState('');
  const [newCustLimit, setNewCustLimit] = useState<number>(100000);
  const [newCustNotes, setNewCustNotes] = useState('');

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.location.toLowerCase().includes(q)
      );
    });
  }, [customers, searchQuery]);

  // Total debt metrics
  const totalOutstandingDebt = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.totalDebt, 0);
  }, [customers]);

  const debtorCount = customers.filter(c => c.totalDebt > 0).length;

  // Handle Debt Payment
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCustomer) return;
    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) {
      alert(language === 'sw' ? 'Weka kiasi halali cha malipo!' : 'Enter valid payment amount!');
      return;
    }

    recordCustomerPayment(payingCustomer.id, amount, paymentMethod, paymentRef);
    setShowPaymentModal(false);
    setPayingCustomer(null);
    setPaymentAmount('');
    setPaymentRef('');
  };

  // Handle Add Customer
  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      alert(language === 'sw' ? 'Jaza jina na namba ya simu ya mteja!' : 'Enter customer name and phone!');
      return;
    }

    addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      location: newCustLocation.trim() || 'Dar es Salaam',
      creditLimit: newCustLimit,
      notes: newCustNotes.trim(),
    });

    setShowAddCustomerModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustLocation('');
    setNewCustNotes('');
  };

  // Get credit sales for a selected customer
  const customerCreditSales = useMemo(() => {
    if (!selectedCustomer) return [];
    return sales.filter(s => s.customerId === selectedCustomer.id && s.isCredit);
  }, [sales, selectedCustomer]);

  return (
    <div className="space-y-4">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm sm:col-span-2 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t.totalCustomerDebt}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {formatTZS(totalOutstandingDebt)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {debtorCount} {language === 'sw' ? 'wateja wana madeni ya dukani yasiyolipwa' : 'customers with outstanding balance'}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
            <Users className="h-8 w-8" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase">Mteja Mpya</span>
          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Ongeza Mteja wa Mkopo</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tafuta mteja kwa jina, namba ya simu au eneo..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3.5">Jina la Mteja</th>
                <th className="py-3 px-3.5">Mawasiliano (Simu)</th>
                <th className="py-3 px-3.5">Eneo / Mtaa</th>
                <th className="py-3 px-3.5 text-right">Ukomo wa Mkopo</th>
                <th className="py-3 px-3.5 text-right">Deni Lililopo</th>
                <th className="py-3 px-3.5 text-center">Hali</th>
                <th className="py-3 px-3.5 text-right">Vitendo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Hakuna mteja aliyepatikana
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => {
                  const hasDebt = c.totalDebt > 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{c.name}</span>
                        </div>
                        {c.notes && (
                          <div className="text-[10px] text-slate-400 font-normal truncate max-w-xs">
                            {c.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-600 dark:text-slate-300">
                        {c.phone}
                      </td>
                      <td className="py-3 px-3.5 text-slate-500">
                        {c.location}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono text-slate-500">
                        {formatTZS(c.creditLimit)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-black font-mono">
                        <span className={hasDebt ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}>
                          {formatTZS(c.totalDebt)}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {hasDebt ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                            ANA DENI
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                            HANA DENI
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right space-x-1.5">
                        {hasDebt && (
                          <button
                            onClick={() => {
                              setPayingCustomer(c);
                              setPaymentAmount(String(c.totalDebt));
                              setShowPaymentModal(true);
                            }}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-200 dark:border-emerald-800 transition"
                          >
                            Pokea Malipo
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Receive Customer Debt Payment */}
      {showPaymentModal && payingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {t.recordCustomerPayment}: {payingCustomer.name}
                </h3>
                <p className="text-xs text-rose-600 font-bold mt-0.5">
                  Deni Kamili Lililopo: {formatTZS(payingCustomer.totalDebt)}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Kiasi Anacholipa (TZS):
                </label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  placeholder="Kiasi..."
                  className="w-full px-3 py-2 text-base font-black font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Njia ya Malipo:
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="cash">{t.pmCash}</option>
                  <option value="mpesa">{t.pmMpesa}</option>
                  <option value="airtel_money">{t.pmAirtel}</option>
                  <option value="mixx">{t.pmMixx}</option>
                  <option value="bank">{t.pmBank}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Kumbukumbu ya Malipo / Ref (Hiari):
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={e => setPaymentRef(e.target.value)}
                  placeholder="Mfano: M-Pesa msg..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px]">
                Baki ya deni itakuwa:{' '}
                <strong>
                  {formatTZS(Math.max(0, payingCustomer.totalDebt - (parseFloat(paymentAmount) || 0)))}
                </strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow"
                >
                  Thibitisha Malipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Customer */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Sajili Mteja Mpya
              </h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Jina Kamili la Mteja:</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  placeholder="Mfano: Mwalimu Mwamba"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Namba ya Simu:</label>
                <input
                  type="text"
                  required
                  value={newCustPhone}
                  onChange={e => setNewCustPhone(e.target.value)}
                  placeholder="Mfano: 0713456789"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Eneo / Mtaa:</label>
                <input
                  type="text"
                  value={newCustLocation}
                  onChange={e => setNewCustLocation(e.target.value)}
                  placeholder="Mfano: Kinyerezi Stand, Kifuru..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Ukomo wa Mkopo (Credit Limit TZS):</label>
                <input
                  type="number"
                  value={newCustLimit}
                  onChange={e => setNewCustLimit(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Maelezo ya Ziada (Hiari):</label>
                <textarea
                  value={newCustNotes}
                  onChange={e => setNewCustNotes(e.target.value)}
                  placeholder="Mfano: Anafanya kazi shule ya sekondari..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow"
                >
                  Sajili Mteja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
