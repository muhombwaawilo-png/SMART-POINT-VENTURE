import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { DailyClosing as DailyClosingType } from '../../types';
import {
  CalendarCheck,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  History,
  TrendingDown,
  TrendingUp,
  FileText,
  AlertCircle,
} from 'lucide-react';

export const DailyClosing: React.FC = () => {
  const {
    sales,
    expenses,
    closings,
    currentUser,
    confirmDailyClosing,
    formatTZS,
    language,
    t,
  } = useStore();

  const todayStr = new Date().toISOString().split('T')[0];

  // Closing Form
  const [openingCash, setOpeningCash] = useState<number>(50000); // Standard 50,000 TZS float
  const [actualCash, setActualCash] = useState<string>('');
  const [shiftName, setShiftName] = useState('Zamu ya Kutwa (Full Day Shift)');
  const [notes, setNotes] = useState('');
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  // Auto-calculated figures for today's sales
  const todaySales = useMemo(() => {
    return sales.filter(s => s.date === todayStr && s.status === 'completed');
  }, [sales, todayStr]);

  const cashSales = useMemo(() => {
    return todaySales
      .filter(s => s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + s.totalAmount, 0);
  }, [todaySales]);

  const mobileMoneySales = useMemo(() => {
    return todaySales
      .filter(s => ['mpesa', 'airtel_money', 'mixx', 'tigopesa', 'halopesa'].includes(s.paymentMethod))
      .reduce((sum, s) => sum + s.totalAmount, 0);
  }, [todaySales]);

  const bankSales = useMemo(() => {
    return todaySales
      .filter(s => s.paymentMethod === 'bank')
      .reduce((sum, s) => sum + s.totalAmount, 0);
  }, [todaySales]);

  const creditSales = useMemo(() => {
    return todaySales
      .filter(s => s.isCredit)
      .reduce((sum, s) => sum + s.totalAmount, 0);
  }, [todaySales]);

  // Expenses paid from cash drawer today
  const cashExpenses = useMemo(() => {
    return expenses
      .filter(e => e.date === todayStr && e.paidFromCashDrawer)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, todayStr]);

  // Expected Cash = Opening Cash + Cash Sales - Cash Expenses
  const expectedCash = openingCash + cashSales - cashExpenses;

  // Actual cash count parsed
  const parsedActualCash = parseFloat(actualCash) || 0;
  const difference = parsedActualCash - expectedCash;

  const isShortage = actualCash !== '' && difference < 0;
  const isSurplus = actualCash !== '' && difference > 0;
  const isBalanced = actualCash !== '' && difference === 0;

  // Handle Form Submit
  const handleClosingSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (actualCash === '') {
      alert(language === 'sw' ? 'Tafadhali weka hesabu halisi ya pesa uliyohesabu drooni!' : 'Please enter actual cash counted!');
      return;
    }

    if (isShortage && !notes.trim()) {
      alert(
        language === 'sw'
          ? 'Kuna upungufu wa fedha! Tafadhali andika maelezo au sababu kwenye sanduku la maelezo kabla ya kufunga.'
          : 'Cash shortage detected! Please enter an explanation note.'
      );
      return;
    }

    confirmDailyClosing({
      shiftName,
      openingCash,
      actualCash: parsedActualCash,
      notes: notes || (isBalanced ? 'Hesabu imelingana safi kabisa.' : ''),
    });

    setIsSubmittedSuccess(true);
    setActualCash('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Title & Info Banner */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            {t.closingTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.closingSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          <User className="h-3.5 w-3.5 text-emerald-600" />
          <span>{t.responsibleEmployee}: <strong>{currentUser.name}</strong></span>
        </div>
      </div>

      {/* Main Closing Grid: Left Form & Breakdown, Right History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Closing Computation Form (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-5">
          <form onSubmit={handleClosingSubmit} className="space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-emerald-600" />
              <span>{language === 'sw' ? 'Mahesabu ya Siku ya Leo' : "Today's Cash Reconciliation"}</span>
            </h3>

            {/* Financial Ledger Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="text-slate-500 font-medium block">{t.openingCash} (Float):</label>
                <input
                  type="number"
                  value={openingCash}
                  onChange={e => setOpeningCash(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full px-2.5 py-1.5 text-sm font-bold font-mono rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                <span className="text-emerald-800 dark:text-emerald-300 font-semibold block">{t.cashSales}:</span>
                <span className="text-base font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1 block">
                  +{formatTZS(cashSales)}
                </span>
                <span className="text-[10px] text-emerald-600">{todaySales.filter(s => s.paymentMethod === 'cash').length} miamala ya fedha taslimu</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-medium block">{t.mobileMoneySales} (M-Pesa/Airtel):</span>
                <span className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                  {formatTZS(mobileMoneySales)}
                </span>
                <span className="text-[10px] text-slate-400">Pesa iliyopo mtandaoni (haipo drooni)</span>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40">
                <span className="text-rose-800 dark:text-rose-300 font-semibold block">{t.cashExpenses}:</span>
                <span className="text-base font-black font-mono text-rose-600 dark:text-rose-400 mt-1 block">
                  -{formatTZS(cashExpenses)}
                </span>
                <span className="text-[10px] text-rose-500">Iliyotolewa drooni kulipa matumizi</span>
              </div>
            </div>

            {/* Expected Cash in Drawer Highlight */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                  {t.expectedCash}
                </span>
                <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
                  {formatTZS(expectedCash)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  ({formatTZS(openingCash)} + {formatTZS(cashSales)} - {formatTZS(cashExpenses)})
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-500/40" />
            </div>

            {/* Actual Cash Input */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>{t.actualCashCounted} (Weka pesa uliyohesabu kwa mikono):</span>
                <span className="text-slate-400 font-normal">TZS</span>
              </label>
              <input
                type="number"
                required
                value={actualCash}
                onChange={e => setActualCash(e.target.value)}
                placeholder="Mfano: 450000"
                className="w-full px-4 py-3 text-xl font-black font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Live Difference Display: SHORTAGE vs SURPLUS vs BALANCED */}
            {actualCash !== '' && (
              <div
                className={`p-4 rounded-xl border flex items-center justify-between transition animate-in fade-in ${
                  isShortage
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    : isSurplus
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isShortage ? (
                    <TrendingDown className="h-6 w-6 text-rose-600" />
                  ) : isSurplus ? (
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  ) : (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  )}
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider">
                      {isShortage
                        ? t.cashShortage
                        : isSurplus
                        ? t.cashSurplus
                        : t.cashBalanced}
                    </div>
                    <div className="text-lg font-black font-mono">
                      {isShortage
                        ? `-${formatTZS(Math.abs(difference))}`
                        : isSurplus
                        ? `+${formatTZS(difference)}`
                        : 'TZS 0 (0% Tofauti)'}
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs">
                  {isShortage ? (
                    <span className="font-semibold text-rose-700 dark:text-rose-300">
                      Pesa imepungua kwenye droo!
                    </span>
                  ) : isSurplus ? (
                    <span className="font-semibold text-blue-700 dark:text-blue-300">
                      Kuna pesa ya ziada isiyo na rekodi
                    </span>
                  ) : (
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                      Hesabu inalingana sawa kabisa
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Notes input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {t.closingNotes} ({isShortage ? 'Inahitajika kwa sababu ya upungufu' : 'Hiari'}):
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={
                  isShortage
                    ? 'Taja sababu ya upungufu huu wa fedha...'
                    : 'Maelezo ya ziada kuhusu zamu hii...'
                }
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{t.confirmClosing}</span>
            </button>
          </form>

          {isSubmittedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Ufungaji wa siku umethibitishwa na kuhifadhiwa kwenye kumbukumbu za duka!</span>
            </div>
          )}
        </div>

        {/* Right: Past Closings History */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <History className="h-4 w-4 text-slate-400" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {t.pastClosings}
            </h3>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
            {closings.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                Hakuna rekodi za ufungaji bado
              </div>
            ) : (
              closings.map(c => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{c.date}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        c.discrepancyType === 'shortage'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          : c.discrepancyType === 'surplus'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {c.discrepancyType === 'shortage'
                        ? 'UPUNGUFU'
                        : c.discrepancyType === 'surplus'
                        ? 'ZIADA'
                        : 'IMELINGANA'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Mhudumu:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{c.employeeName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Mauzo ya Cash:</span>
                      <span>{formatTZS(c.cashSales)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pesa Iliyotarajiwa:</span>
                      <span>{formatTZS(c.expectedCash)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                      <span>Pesa Iliyohesabiwa:</span>
                      <span>{formatTZS(c.actualCash)}</span>
                    </div>
                    {c.difference !== 0 && (
                      <div className="flex justify-between font-black text-rose-600">
                        <span>Tofauti:</span>
                        <span>{formatTZS(c.difference)}</span>
                      </div>
                    )}
                  </div>

                  {c.notes && (
                    <div className="text-[10px] italic text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">
                      "{c.notes}"
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
