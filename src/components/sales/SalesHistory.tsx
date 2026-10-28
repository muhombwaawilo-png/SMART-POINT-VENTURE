import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Sale } from '../../types';
import {
  Search,
  Filter,
  Eye,
  XCircle,
  CheckCircle2,
  Calendar,
  User,
  Printer,
  X,
  CreditCard,
  Download,
} from 'lucide-react';

export const SalesHistory: React.FC = () => {
  const {
    sales,
    currentUser,
    canAccess,
    cancelSale,
    formatTZS,
    language,
    t,
    settings,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Cancellation modal
  const [cancellingSale, setCancellingSale] = useState<Sale | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        s.receiptNumber.toLowerCase().includes(q) ||
        s.employeeName.toLowerCase().includes(q) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        s.items.some(i => i.productName.toLowerCase().includes(q));

      const matchesDate = !selectedDate || s.date === selectedDate;
      const matchesPM = selectedPaymentMethod === 'all' || s.paymentMethod === selectedPaymentMethod;
      const matchesEmp = selectedEmployee === 'all' || s.employeeId === selectedEmployee;

      // Cashiers only see their own sales unless Manager or Super Admin
      const matchesUserPerm = canAccess(['super_admin', 'manager']) || s.employeeId === currentUser.id;

      return matchesQuery && matchesDate && matchesPM && matchesEmp && matchesUserPerm;
    });
  }, [sales, searchQuery, selectedDate, selectedPaymentMethod, selectedEmployee, currentUser, canAccess]);

  // Aggregate stats of filtered
  const stats = useMemo(() => {
    const completed = filteredSales.filter(s => s.status === 'completed');
    const totalAmount = completed.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalProfit = completed.reduce((sum, s) => sum + s.grossProfit, 0);
    const totalCost = completed.reduce((sum, s) => sum + s.totalCost, 0);
    return {
      count: completed.length,
      totalAmount,
      totalProfit,
      totalCost,
    };
  }, [filteredSales]);

  // Handle execute cancel
  const handleConfirmCancel = () => {
    if (!cancellingSale) return;
    if (!cancellationReason.trim()) {
      alert(language === 'sw' ? 'Tafadhali andika sababu ya kufuta mauzo haya!' : 'Please enter cancellation reason!');
      return;
    }

    const success = cancelSale(cancellingSale.id, cancellationReason);
    if (success) {
      setCancellingSale(null);
      setCancellationReason('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            {t.navSales}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'sw'
              ? 'Miamala yote ya mauzo iliyofanyika na taarifa za kila mfanyakazi'
              : 'Complete transaction ledger with responsible cashier logs'}
          </p>
        </div>

        {/* Quick summary metrics */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div>
            <span className="text-slate-400 block">{language === 'sw' ? 'Idadi ya Miamala' : 'Transactions'}:</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{stats.count}</span>
          </div>
          <div>
            <span className="text-slate-400 block">{t.totalRevenue}:</span>
            <span className="text-sm font-black text-slate-900 dark:text-white">{formatTZS(stats.totalAmount)}</span>
          </div>
          {canAccess(['super_admin', 'manager']) && (
            <div>
              <span className="text-slate-400 block">{t.grossProfit}:</span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                +{formatTZS(stats.totalProfit)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={language === 'sw' ? 'Tafuta risiti, mhudumu, mteja...' : 'Search receipt, cashier...'}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <select
          value={selectedPaymentMethod}
          onChange={e => setSelectedPaymentMethod(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">{language === 'sw' ? '-- Njia Zote za Malipo --' : '-- All Payment Methods --'}</option>
          <option value="cash">{t.pmCash}</option>
          <option value="mpesa">{t.pmMpesa}</option>
          <option value="airtel_money">{t.pmAirtel}</option>
          <option value="mixx">{t.pmMixx}</option>
          <option value="bank">{t.pmBank}</option>
          <option value="credit">{t.pmCredit}</option>
        </select>

        <button
          onClick={() => {
            setSearchQuery('');
            setSelectedDate('');
            setSelectedPaymentMethod('all');
          }}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
        >
          {language === 'sw' ? 'Safisha Vichungi (Reset)' : 'Reset Filters'}
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3.5">{t.receiptNumber}</th>
                <th className="py-3 px-3.5">{t.date} & {t.time}</th>
                <th className="py-3 px-3.5">{t.cashierName}</th>
                <th className="py-3 px-3.5">{language === 'sw' ? 'Bidhaa' : 'Items'}</th>
                <th className="py-3 px-3.5">{t.paymentMethod}</th>
                <th className="py-3 px-3.5 text-right">{t.total}</th>
                {canAccess(['super_admin', 'manager']) && (
                  <th className="py-3 px-3.5 text-right text-emerald-600 dark:text-emerald-400">{t.grossProfit}</th>
                )}
                <th className="py-3 px-3.5 text-center">{language === 'sw' ? 'Hali' : 'Status'}</th>
                <th className="py-3 px-3.5 text-right">{language === 'sw' ? 'Vitendo' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    {language === 'sw' ? 'Hakuna muamala uliopatikana' : 'No sales transactions recorded'}
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => {
                  const isCancelled = sale.status === 'cancelled';

                  return (
                    <tr
                      key={sale.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition ${
                        isCancelled ? 'bg-rose-50/30 dark:bg-rose-950/20 line-through opacity-70' : ''
                      }`}
                    >
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        {sale.receiptNumber}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300">
                        <div>{sale.date}</div>
                        <div className="text-[10px] text-slate-400">{sale.time}</div>
                      </td>
                      <td className="py-3 px-3.5 font-medium text-slate-800 dark:text-slate-200">
                        {sale.employeeName}
                      </td>
                      <td className="py-3 px-3.5 max-w-[200px] truncate text-slate-600 dark:text-slate-400">
                        {sale.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-semibold uppercase text-[11px] text-slate-700 dark:text-slate-300">
                          {sale.paymentMethod}
                        </span>
                        {sale.customerName && (
                          <div className="text-[10px] text-slate-400 truncate">
                            Mteja: {sale.customerName}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right font-black font-mono text-slate-900 dark:text-white">
                        {formatTZS(sale.totalAmount)}
                      </td>
                      {canAccess(['super_admin', 'manager']) && (
                        <td className="py-3 px-3.5 text-right font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          +{formatTZS(sale.grossProfit)}
                        </td>
                      )}
                      <td className="py-3 px-3.5 text-center">
                        {isCancelled ? (
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                            {language === 'sw' ? 'IMEGHAIRIWA' : 'CANCELLED'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            {language === 'sw' ? 'IMEKAMILIKA' : 'COMPLETED'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right space-x-1">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Tazama Risiti"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {!isCancelled && canAccess(['super_admin', 'manager']) && (
                          <button
                            onClick={() => setCancellingSale(sale)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                            title="Ghairi / Futa Muamala"
                          >
                            <XCircle className="h-4 w-4" />
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

      {/* Sale Detail & Receipt Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in flex flex-col max-h-[90vh]">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                {selectedSale.receiptNumber}
              </span>
              <button
                onClick={() => setSelectedSale(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto font-mono text-xs space-y-3">
              <div className="text-center border-b border-dashed border-slate-300 dark:border-slate-700 pb-2">
                <h4 className="font-black text-sm uppercase">{settings.name}</h4>
                <p className="text-[10px] text-slate-500">{settings.location}</p>
                <p className="text-[10px] text-slate-500">Tel: {settings.phone1}</p>
              </div>

              <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-300 dark:border-slate-700 pb-2">
                <div className="flex justify-between">
                  <span>Tarehe:</span>
                  <span>{selectedSale.date} {selectedSale.time}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mhudumu:</span>
                  <span>{selectedSale.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Njia:</span>
                  <span className="uppercase font-bold">{selectedSale.paymentMethod}</span>
                </div>
                {selectedSale.paymentRef && (
                  <div className="flex justify-between">
                    <span>Ref:</span>
                    <span>{selectedSale.paymentRef}</span>
                  </div>
                )}
                {selectedSale.customerName && (
                  <div className="flex justify-between">
                    <span>Mteja:</span>
                    <span>{selectedSale.customerName}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1 border-b border-dashed border-slate-300 dark:border-slate-700 pb-2">
                {selectedSale.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <div>
                      <span>{it.productName}</span>
                      <div className="text-[10px] text-slate-500">{it.quantity} {it.unit} @ {formatTZS(it.unitPrice)}</div>
                    </div>
                    <span className="font-bold">{formatTZS(it.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="text-[11px] space-y-0.5">
                <div className="flex justify-between font-bold text-sm pt-1">
                  <span>JUMLA:</span>
                  <span>{formatTZS(selectedSale.totalAmount)}</span>
                </div>
                {canAccess(['super_admin', 'manager']) && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                    <span>Faida Ghafi:</span>
                    <span>+{formatTZS(selectedSale.grossProfit)}</span>
                  </div>
                )}
              </div>

              {selectedSale.status === 'cancelled' && (
                <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[10px] space-y-1">
                  <div className="font-bold">MUAMALA UMEFUTWA / GHAIRI</div>
                  <div>Aliyefuta: {selectedSale.cancelledBy}</div>
                  <div>Sababu: {selectedSale.cancellationReason}</div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2">
              <button
                onClick={() => setSelectedSale(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Funga
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white flex items-center gap-1"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Chapisha</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancellingSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <XCircle className="h-5 w-5" />
              <span>{language === 'sw' ? 'Thibitisha Kughairi Mauzo Haya' : 'Confirm Sale Cancellation'}</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              {language === 'sw'
                ? `Je, una uhakika unataka kughairi risiti #${cancellingSale.receiptNumber} (${formatTZS(cancellingSale.totalAmount)})? Mzigo wote utarudishwa stoo kiotomatiki na kitendo hiki kitaandikwa kwenye Audit Log.`
                : `Are you sure you want to cancel receipt #${cancellingSale.receiptNumber}? Stock will be automatically restored to inventory and logged.`}
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'sw' ? 'Sababu ya Kughairi (Inahitajika):' : 'Cancellation Reason (Required):'}
              </label>
              <textarea
                value={cancellationReason}
                onChange={e => setCancellationReason(e.target.value)}
                placeholder={language === 'sw' ? 'Mfano: Mteja amerudisha mzigo, amekosea kiasi...' : 'Reason for cancellation...'}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setCancellingSale(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Ghairi
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-md transition"
              >
                {language === 'sw' ? 'Ndio, Ghairi Mauzo' : 'Yes, Cancel Sale'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
