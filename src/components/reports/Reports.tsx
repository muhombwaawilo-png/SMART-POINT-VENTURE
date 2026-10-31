import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  FileBarChart,
  Printer,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Mail,
} from 'lucide-react';
import { PrintReportModal } from './PrintReportModal';
import { GmailHubModal } from '../gmail/GmailHubModal';

export const Reports: React.FC = () => {
  const {
    sales,
    expenses,
    products,
    customers,
    settings,
    formatTZS,
    language,
    t,
  } = useStore();

  const [activeReportTab, setActiveReportTab] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showGmailModal, setShowGmailModal] = useState(false);

  const now = new Date();

  // 1. DAILY REPORT DATA
  const dailyReportData = useMemo(() => {
    const daySales = sales.filter(s => s.date === selectedDate && s.status === 'completed');
    const totalSales = daySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalCOGS = daySales.reduce((sum, s) => sum + s.totalCost, 0);
    const grossProfit = totalSales - totalCOGS;

    const dayExpenses = expenses.filter(e => e.date === selectedDate);
    const totalExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;

    const cashSales = daySales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.totalAmount, 0);
    const mobileMoneySales = daySales
      .filter(s => ['mpesa', 'airtel_money', 'mixx', 'tigopesa', 'halopesa'].includes(s.paymentMethod))
      .reduce((sum, s) => sum + s.totalAmount, 0);
    const bankSales = daySales.filter(s => s.paymentMethod === 'bank').reduce((sum, s) => sum + s.totalAmount, 0);
    const creditSales = daySales.filter(s => s.isCredit).reduce((sum, s) => sum + s.totalAmount, 0);

    const totalQtySold = daySales.reduce(
      (sum, s) => sum + s.items.reduce((iSum, it) => iSum + it.quantity, 0),
      0
    );

    return {
      date: selectedDate,
      totalSales,
      totalCOGS,
      grossProfit,
      totalExpenses,
      netProfit,
      txCount: daySales.length,
      cashSales,
      mobileMoneySales,
      bankSales,
      creditSales,
      totalQtySold,
      items: daySales,
    };
  }, [sales, expenses, selectedDate]);

  // 2. WEEKLY REPORT DATA (Monday to Sunday)
  const weeklyReportData = useMemo(() => {
    const startOfWeek = new Date(now);
    const currentDay = startOfWeek.getDay() || 7; // Mon=1..Sun=7
    startOfWeek.setDate(startOfWeek.getDate() - currentDay + 1);

    const days: {
      date: string;
      dayName: string;
      sales: number;
      cost: number;
      grossProfit: number;
      expenses: number;
      netProfit: number;
      txCount: number;
    }[] = [];

    const dayLabelsSw = ['Jumatatu (Mon)', 'Jumanne (Tue)', 'Jumatano (Wed)', 'Alhamisi (Thu)', 'Ijumaa (Fri)', 'Jumamosi (Sat)', 'Jumapili (Sun)'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      const dStr = d.toISOString().split('T')[0];

      const daySales = sales.filter(s => s.date === dStr && s.status === 'completed');
      const dayRev = daySales.reduce((sum, s) => sum + s.totalAmount, 0);
      const dayCost = daySales.reduce((sum, s) => sum + s.totalCost, 0);
      const dayGross = dayRev - dayCost;
      const dayExp = expenses.filter(e => e.date === dStr).reduce((sum, e) => sum + e.amount, 0);
      const dayNet = dayGross - dayExp;

      days.push({
        date: dStr,
        dayName: dayLabelsSw[i],
        sales: dayRev,
        cost: dayCost,
        grossProfit: dayGross,
        expenses: dayExp,
        netProfit: dayNet,
        txCount: daySales.length,
      });
    }

    const totalWeeklySales = days.reduce((sum, d) => sum + d.sales, 0);
    const totalWeeklyCost = days.reduce((sum, d) => sum + d.cost, 0);
    const totalWeeklyGrossProfit = days.reduce((sum, d) => sum + d.grossProfit, 0);
    const totalWeeklyExpenses = days.reduce((sum, d) => sum + d.expenses, 0);
    const totalWeeklyNetProfit = days.reduce((sum, d) => sum + d.netProfit, 0);

    const highestDay = [...days].sort((a, b) => b.sales - a.sales)[0];
    const lowestDay = [...days].filter(d => d.sales > 0).sort((a, b) => a.sales - b.sales)[0] || days[0];

    return {
      days,
      totalWeeklySales,
      totalWeeklyCost,
      totalWeeklyGrossProfit,
      totalWeeklyExpenses,
      totalWeeklyNetProfit,
      avgDailySales: Math.round(totalWeeklySales / 7),
      avgDailyProfit: Math.round(totalWeeklyNetProfit / 7),
      highestDay,
      lowestDay,
    };
  }, [sales, expenses]);

  // 3. MONTHLY REPORT DATA & COMPARISON
  const monthlyReportData = useMemo(() => {
    const curYear = now.getFullYear();
    const curMonth = String(now.getMonth() + 1).padStart(2, '0');
    const curMonthStr = `${curYear}-${curMonth}`;

    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
    const prevMonthStr = `${prevYear}-${prevMonth}`;

    // Current Month
    const curSales = sales.filter(s => s.date.startsWith(curMonthStr) && s.status === 'completed');
    const curRev = curSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const curCost = curSales.reduce((sum, s) => sum + s.totalCost, 0);
    const curGross = curRev - curCost;
    const curExp = expenses.filter(e => e.date.startsWith(curMonthStr)).reduce((sum, e) => sum + e.amount, 0);
    const curNet = curGross - curExp;

    // Previous Month
    const prevSales = sales.filter(s => s.date.startsWith(prevMonthStr) && s.status === 'completed');
    const prevRev = prevSales.reduce((sum, s) => sum + s.totalAmount, 0) || 1; // avoid divide by zero
    const growthPercent = (((curRev - prevRev) / prevRev) * 100).toFixed(1);

    const totalStockValue = products.reduce((sum, p) => sum + p.currentStock * p.buyingPrice, 0);
    const totalDebt = customers.reduce((sum, c) => sum + c.totalDebt, 0);

    return {
      curMonthName: now.toLocaleDateString(language === 'sw' ? 'sw-TZ' : 'en-US', { month: 'long', year: 'numeric' }),
      curRev,
      curCost,
      curGross,
      curExp,
      curNet,
      curTxCount: curSales.length,
      growthPercent: parseFloat(growthPercent),
      totalStockValue,
      totalDebt,
    };
  }, [sales, expenses, products, customers, language]);

  // Export CSV helper
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeReportTab === 'weekly') {
      csvContent += 'Tarehe,Siku,Mauzo (Sales),Gharama ya Bidhaa (Cost),Faida Ghafi (Gross Profit),Matumizi (Expenses),Faida Halisi (Net Profit),Miamala\n';
      weeklyReportData.days.forEach(d => {
        csvContent += `"${d.date}","${d.dayName}",${d.sales},${d.cost},${d.grossProfit},${d.expenses},${d.netProfit},${d.txCount}\n`;
      });
      csvContent += `"JUMLA WIKI","TOTAL",${weeklyReportData.totalWeeklySales},${weeklyReportData.totalWeeklyCost},${weeklyReportData.totalWeeklyGrossProfit},${weeklyReportData.totalWeeklyExpenses},${weeklyReportData.totalWeeklyNetProfit},-\n`;
    } else if (activeReportTab === 'daily') {
      csvContent += 'Risiti,Muda,Mhudumu,Njia ya Malipo,Mteja,Mauzo,Faida Ghafi\n';
      dailyReportData.items.forEach(s => {
        csvContent += `"${s.receiptNumber}","${s.time}","${s.employeeName}","${s.paymentMethod}","${s.customerName || ''}",${s.totalAmount},${s.grossProfit}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smart_point_venture_ripoti_${activeReportTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Printable Report Header (visible when printing) */}
      <div className="hidden print:block text-center border-b pb-4 mb-4 font-mono">
        <h1 className="text-xl font-bold uppercase">{settings.name}</h1>
        <p className="text-xs">{settings.location}</p>
        <p className="text-xs">Simu: {settings.phone1} / {settings.phone2}</p>
        <p className="text-xs italic">"{settings.taglineSwahili}"</p>
      </div>

      {/* Top Banner & Export Actions */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            {t.navReports}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'sw'
              ? 'Ripoti rasmi za mauzo, gharama, faida halisi na ukuaji wa duka'
              : 'Financial business statements, daily ledgers, weekly matrix, and monthly growth'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowPrintModal(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>{language === 'sw' ? 'Chapisha Ripoti ya Mfanyakazi' : 'Print Staff Report'}</span>
          </button>
          <button
            onClick={() => setShowGmailModal(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition cursor-pointer"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Gmail Hub</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{t.exportCSV}</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl text-xs font-semibold print:hidden">
        <button
          onClick={() => setActiveReportTab('daily')}
          className={`flex-1 py-2 rounded-lg transition ${
            activeReportTab === 'daily'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {t.dailyReport}
        </button>
        <button
          onClick={() => setActiveReportTab('weekly')}
          className={`flex-1 py-2 rounded-lg transition ${
            activeReportTab === 'weekly'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {t.weeklyReport}
        </button>
        <button
          onClick={() => setActiveReportTab('monthly')}
          className={`flex-1 py-2 rounded-lg transition ${
            activeReportTab === 'monthly'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {t.monthlyReport}
        </button>
      </div>

      {/* TAB 1: DAILY REPORT */}
      {activeReportTab === 'daily' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.filterByDate}:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 block">{t.totalRevenue}</span>
              <span className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1 block">
                {formatTZS(dailyReportData.totalSales)}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 block">{t.costOfGoods}</span>
              <span className="text-xl font-black font-mono text-slate-600 dark:text-slate-300 mt-1 block">
                {formatTZS(dailyReportData.totalCOGS)}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 block">{t.operatingExpenses}</span>
              <span className="text-xl font-black font-mono text-rose-600 mt-1 block">
                -{formatTZS(dailyReportData.totalExpenses)}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-emerald-600 block">{t.netProfit}</span>
              <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                +{formatTZS(dailyReportData.netProfit)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WEEKLY REPORT (MONDAY TO SUNDAY) */}
      {activeReportTab === 'weekly' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Mchanganuo wa Wiki Hii (Jumatatu - Jumapili)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-3.5">Siku & Tarehe</th>
                    <th className="py-3 px-3.5 text-right">{t.todaySales}</th>
                    <th className="py-3 px-3.5 text-right">{t.costOfGoods}</th>
                    <th className="py-3 px-3.5 text-right text-emerald-600">{t.grossProfit}</th>
                    <th className="py-3 px-3.5 text-right text-rose-600">{t.operatingExpenses}</th>
                    <th className="py-3 px-3.5 text-right text-emerald-600 font-bold">{t.netProfit}</th>
                    <th className="py-3 px-3.5 text-center">Miamala</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {weeklyReportData.days.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 font-mono">
                      <td className="py-3 px-3.5 font-sans font-semibold text-slate-900 dark:text-white">
                        {d.dayName}
                        <div className="text-[10px] text-slate-400 font-mono">{d.date}</div>
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-slate-900 dark:text-white">
                        {formatTZS(d.sales)}
                      </td>
                      <td className="py-3 px-3.5 text-right text-slate-500">
                        {formatTZS(d.cost)}
                      </td>
                      <td className="py-3 px-3.5 text-right text-emerald-600 font-bold">
                        +{formatTZS(d.grossProfit)}
                      </td>
                      <td className="py-3 px-3.5 text-right text-rose-600">
                        -{formatTZS(d.expenses)}
                      </td>
                      <td className="py-3 px-3.5 text-right text-emerald-600 font-black">
                        +{formatTZS(d.netProfit)}
                      </td>
                      <td className="py-3 px-3.5 text-center font-sans text-slate-600 dark:text-slate-400">
                        {d.txCount}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-slate-900 text-white font-mono font-black text-xs">
                    <td className="py-3.5 px-3.5 font-sans uppercase">JUMLA YA WIKI (TOTALS)</td>
                    <td className="py-3.5 px-3.5 text-right text-emerald-400">{formatTZS(weeklyReportData.totalWeeklySales)}</td>
                    <td className="py-3.5 px-3.5 text-right text-slate-300">{formatTZS(weeklyReportData.totalWeeklyCost)}</td>
                    <td className="py-3.5 px-3.5 text-right text-emerald-400">+{formatTZS(weeklyReportData.totalWeeklyGrossProfit)}</td>
                    <td className="py-3.5 px-3.5 text-right text-rose-400">-{formatTZS(weeklyReportData.totalWeeklyExpenses)}</td>
                    <td className="py-3.5 px-3.5 text-right text-emerald-300">+{formatTZS(weeklyReportData.totalWeeklyNetProfit)}</td>
                    <td className="py-3.5 px-3.5 text-center font-sans">{weeklyReportData.days.reduce((s, d) => s + d.txCount, 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Weekly Highlights Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block font-semibold">Siku ya Mauzo ya Juu Zaidi:</span>
              <strong className="text-sm text-slate-900 dark:text-white block mt-1">
                {weeklyReportData.highestDay?.dayName.split(' ')[0]} ({formatTZS(weeklyReportData.highestDay?.sales || 0)})
              </strong>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block font-semibold">Wastani wa Mauzo / Siku:</span>
              <strong className="text-sm font-mono text-emerald-600 block mt-1">
                {formatTZS(weeklyReportData.avgDailySales)}
              </strong>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block font-semibold">Wastani wa Faida / Siku:</span>
              <strong className="text-sm font-mono text-emerald-600 block mt-1">
                +{formatTZS(weeklyReportData.avgDailyProfit)}
              </strong>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block font-semibold">Margin ya Faida ya Wiki:</span>
              <strong className="text-sm font-mono text-slate-900 dark:text-white block mt-1">
                {weeklyReportData.totalWeeklySales > 0
                  ? `${((weeklyReportData.totalWeeklyNetProfit / weeklyReportData.totalWeeklySales) * 100).toFixed(1)}%`
                  : '0%'}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MONTHLY REPORT */}
      {activeReportTab === 'monthly' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white capitalize">
                Ripoti ya Mwezi: {monthlyReportData.curMonthName}
              </h3>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="h-4 w-4" />
                <span>Ukuaji wa Mauzo: +{monthlyReportData.growthPercent}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block">Jumla ya Mauzo ya Mwezi (Revenue):</span>
                <span className="text-lg font-black font-mono text-slate-900 dark:text-white block mt-1">
                  {formatTZS(monthlyReportData.curRev)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block">Gharama za Bidhaa (COGS):</span>
                <span className="text-lg font-black font-mono text-slate-700 dark:text-slate-300 block mt-1">
                  {formatTZS(monthlyReportData.curCost)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block">Matumizi ya Uendeshaji:</span>
                <span className="text-lg font-black font-mono text-rose-600 block mt-1">
                  -{formatTZS(monthlyReportData.curExp)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 sm:col-span-2 lg:col-span-3">
                <span className="text-emerald-800 dark:text-emerald-300 font-bold block">
                  FAIDA HALISI YA MWEZI (NET PROFIT):
                </span>
                <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400 block mt-1">
                  +{formatTZS(monthlyReportData.curNet)}
                </span>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-1">
                  Hii ndiyo faida halisi iliyobaki baada ya kurejesha gharama zote za ununuzi na kulipia matumizi yote ya duka mwezi huu.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT REPORT MODAL */}
      <PrintReportModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        initialPeriod={activeReportTab === 'daily' ? 'today' : 'this_week'}
      />

      {/* GMAIL HUB MODAL */}
      <GmailHubModal
        isOpen={showGmailModal}
        onClose={() => setShowGmailModal(false)}
      />
    </div>
  );
};
