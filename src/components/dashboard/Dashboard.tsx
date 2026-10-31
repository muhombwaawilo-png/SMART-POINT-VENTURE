import React, { useMemo, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Sale } from '../../types';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Users,
  CreditCard,
  ShieldCheck,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
  CheckCircle2,
  Printer,
  Mail,
  Trash2,
  Check,
  X,
  Eye,
  Volume2,
  VolumeX,
  Radio,
  FileText,
  AlertCircle,
  Smartphone,
} from 'lucide-react';
import { PrintReportModal } from '../reports/PrintReportModal';
import { GmailHubModal } from '../gmail/GmailHubModal';

export const Dashboard: React.FC = () => {
  const {
    sales,
    products,
    expenses,
    customers,
    settings,
    currentUser,
    language,
    t,
    formatTZS,
    setActiveTab,
    approveSale,
    deleteSale,
    deleteSaleItem,
    isLiveChimeEnabled,
    setIsLiveChimeEnabled,
    playSaleChime,
  } = useStore();

  const isSuperAdmin = currentUser.role === 'super_admin';

  // Modals
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printModalPeriod, setPrintModalPeriod] = useState<'today' | 'this_week' | 'custom'>('today');
  const [showGmailModal, setShowGmailModal] = useState(false);

  // Void/Delete sale modal state
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  const [deleteReason, setDeleteReason] = useState('Ilirekodiwa kimakosa na muuzaji');

  // Inspect / Line item deletion modal state
  const [inspectingSale, setInspectingSale] = useState<Sale | null>(null);
  const [itemDeleteReason, setItemDeleteReason] = useState('Bidhaa iliwekwa kimakosa');

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper date calculations
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay() || 7;
  startOfWeek.setDate(startOfWeek.getDate() - day + 1);
  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentMonthPrefix = `${currentYear}-${currentMonth}`;

  // Pending staff sales queue
  const pendingSales = useMemo(() => {
    return sales.filter(s => s.status === 'pending_approval');
  }, [sales]);

  // Recent 10 sales
  const recentSales = useMemo(() => {
    return sales.slice(0, 10);
  }, [sales]);

  // Metrics computation
  const metrics = useMemo(() => {
    // 1. Today's sales & profit
    const todaySalesList = sales.filter(s => s.date === todayStr && s.status === 'completed');
    const todaySales = todaySalesList.reduce((acc, s) => acc + s.totalAmount, 0);
    const todayCOGS = todaySalesList.reduce((acc, s) => acc + s.totalCost, 0);
    const todayGrossProfit = todaySales - todayCOGS;
    const todayExpenses = expenses
      .filter(e => e.date === todayStr)
      .reduce((acc, e) => acc + e.amount, 0);
    const todayNetProfit = todayGrossProfit - todayExpenses;

    // 2. Weekly sales & profit
    const weeklySalesList = sales.filter(s => s.date >= startOfWeekStr && s.status === 'completed');
    const weeklySales = weeklySalesList.reduce((acc, s) => acc + s.totalAmount, 0);
    const weeklyCOGS = weeklySalesList.reduce((acc, s) => acc + s.totalCost, 0);
    const weeklyGrossProfit = weeklySales - weeklyCOGS;
    const weeklyExpenses = expenses
      .filter(e => e.date >= startOfWeekStr)
      .reduce((acc, e) => acc + e.amount, 0);
    const weeklyNetProfit = weeklyGrossProfit - weeklyExpenses;

    // 3. Monthly sales & profit
    const monthlySalesList = sales.filter(s => s.date.startsWith(currentMonthPrefix) && s.status === 'completed');
    const monthlySales = monthlySalesList.reduce((acc, s) => acc + s.totalAmount, 0);
    const monthlyCOGS = monthlySalesList.reduce((acc, s) => acc + s.totalCost, 0);
    const monthlyGrossProfit = monthlySales - monthlyCOGS;
    const monthlyExpenses = expenses
      .filter(e => e.date.startsWith(currentMonthPrefix))
      .reduce((acc, e) => acc + e.amount, 0);
    const monthlyNetProfit = monthlyGrossProfit - monthlyExpenses;

    // 4. Stock value
    const totalStockValue = products.reduce((acc, p) => acc + p.currentStock * p.buyingPrice, 0);
    const expectedRetailValue = products.reduce((acc, p) => acc + p.currentStock * p.sellingPrice, 0);

    // 5. Total customer debt
    const totalCustomerDebt = customers.reduce((acc, c) => acc + c.totalDebt, 0);

    // 6. Stock alerts
    const lowStockItems = products.filter(p => p.status === 'low_stock' || p.currentStock <= p.minStockLevel);
    const outOfStockItems = products.filter(p => p.status === 'out_of_stock' || p.currentStock === 0);

    return {
      todaySales,
      todayGrossProfit,
      todayNetProfit,
      todayExpenses,
      weeklySales,
      weeklyGrossProfit,
      weeklyNetProfit,
      weeklyExpenses,
      monthlySales,
      monthlyGrossProfit,
      monthlyNetProfit,
      monthlyExpenses,
      totalStockValue,
      expectedRetailValue,
      totalCustomerDebt,
      lowStockItems,
      outOfStockItems,
      todayTransactionCount: todaySalesList.length,
    };
  }, [sales, expenses, products, customers, todayStr, startOfWeekStr, currentMonthPrefix]);

  // Payment methods breakdown
  const paymentBreakdown = useMemo(() => {
    const methods: Record<string, number> = {
      cash: 0,
      mpesa: 0,
      airtel_money: 0,
      mixx: 0,
      bank: 0,
      credit: 0,
    };

    sales.filter(s => s.status === 'completed').forEach(s => {
      const pm = s.paymentMethod;
      if (methods[pm] !== undefined) {
        methods[pm] += s.totalAmount;
      } else {
        methods.cash += s.totalAmount;
      }
    });

    const total = Object.values(methods).reduce((a, b) => a + b, 0) || 1;
    return { methods, total };
  }, [sales]);

  // Last 7 days trend for chart
  const last7DaysData = useMemo(() => {
    const days: { date: string; dayLabel: string; sales: number; profit: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString(language === 'sw' ? 'sw-TZ' : 'en-US', { weekday: 'short' });

      const daySalesList = sales.filter(s => s.date === dStr && s.status === 'completed');
      const daySales = daySalesList.reduce((acc, s) => acc + s.totalAmount, 0);
      const dayCOGS = daySalesList.reduce((acc, s) => acc + s.totalCost, 0);
      const dayExpenses = expenses.filter(e => e.date === dStr).reduce((acc, e) => acc + e.amount, 0);
      const dayNetProfit = daySales - dayCOGS - dayExpenses;

      days.push({
        date: dStr,
        dayLabel: dayName,
        sales: daySales,
        profit: dayNetProfit,
      });
    }
    return days;
  }, [sales, expenses, language]);

  const maxDailySale = Math.max(...last7DaysData.map(d => d.sales), 50000);

  // Top selling products
  const topProducts = useMemo(() => {
    const itemMap: Record<string, { name: string; quantity: number; revenue: number; profit: number }> = {};
    sales.filter(s => s.status === 'completed').forEach(s => {
      s.items.forEach(item => {
        if (!itemMap[item.productId]) {
          itemMap[item.productId] = {
            name: item.productName,
            quantity: 0,
            revenue: 0,
            profit: 0,
          };
        }
        itemMap[item.productId].quantity += item.quantity;
        itemMap[item.productId].revenue += item.totalPrice;
        itemMap[item.productId].profit += item.grossProfit;
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [sales]);

  const formattedDate = new Date().toLocaleDateString(
    language === 'sw' ? 'sw-TZ' : 'en-US',
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  // Confirm void/deletion of mistaken sale
  const handleConfirmDeleteSale = () => {
    if (!deletingSale) return;
    if (!deleteReason.trim()) {
      alert('Tafadhali andika sababu ya kufuta mauzo haya.');
      return;
    }

    const success = deleteSale(deletingSale.id, deleteReason);
    if (success) {
      setDeletingSale(null);
      setDeleteReason('Ilirekodiwa kimakosa na muuzaji');
      if (inspectingSale?.id === deletingSale.id) {
        setInspectingSale(null);
      }
    }
  };

  // Delete line item inside inspecting sale
  const handleDeleteLineItem = (index: number) => {
    if (!inspectingSale) return;
    const item = inspectingSale.items[index];
    const confirmed = window.confirm(
      `Je, una uhakika wa kufuta "${item.productName}" (${item.quantity} ${item.unit}) kwenye risiti hii? Mzigo utarudishwa stoo mara moja.`
    );
    if (!confirmed) return;

    deleteSaleItem(inspectingSale.id, index, itemDeleteReason);
    // Refresh inspected sale from latest sales list
    const updated = sales.find(s => s.id === inspectingSale.id);
    if (updated) {
      setInspectingSale(updated);
    } else {
      setInspectingSale(null);
    }
  };

  // Batch approve all pending sales
  const handleApproveAllPending = () => {
    if (pendingSales.length === 0) return;
    const confirmed = window.confirm(
      `Unathibitisha kupitisha mauzo yote ${pendingSales.length} yaliyoingizwa na muuza duka?`
    );
    if (!confirmed) return;

    pendingSales.forEach(s => approveSale(s.id));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Store Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                DAR ES SALAAM – KINYEREZI – KIFURU – MWANZO MGUMU
              </span>
              <span className="text-xs text-slate-300">|</span>
              <span className="text-xs text-emerald-200 font-medium">Mkurugenzi: {settings.owner}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
              {settings.name}
            </h1>
            <p className="text-sm text-emerald-200/90 italic font-medium mt-0.5">
              "{language === 'sw' ? settings.taglineSwahili : settings.tagline}"
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              <span>{formattedDate}</span>
              <span>•</span>
              <span className="text-slate-300">Tel: {settings.phone1} / {settings.phone2}</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* PRINT SALES REPORT BUTTON */}
            <button
              onClick={() => {
                setPrintModalPeriod('today');
                setShowPrintModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition active:scale-95 cursor-pointer border border-emerald-400/40"
              title="Chapisha au Print ripoti ya mauzo ya siku husika au ya wiki husika kwa mfanyakazi"
            >
              <Printer className="h-4 w-4" />
              <span>{language === 'sw' ? 'Chapisha Ripoti ya Mauzo' : 'Print Sales Report'}</span>
            </button>

            {/* GMAIL HUB BUTTON */}
            <button
              onClick={() => setShowGmailModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition active:scale-95 cursor-pointer border border-purple-400/40"
              title="Fungua Gmail Hub kutuma ripoti za biashara au risiti"
            >
              <Mail className="h-4 w-4" />
              <span>Gmail Hub</span>
            </button>

            <button
              onClick={() => setActiveTab('pos')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 transition"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>{t.navPOS}</span>
            </button>
            <button
              onClick={() => setActiveTab('closing')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 font-semibold text-xs transition"
            >
              <Clock className="h-4 w-4" />
              <span>{t.navClosing}</span>
            </button>
          </div>
        </div>

        {/* Decorative corner background shimmer */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* 1. REAL-TIME SALES CONFIRMATION & APPROVAL QUEUE (KUDHIBITISHA PAPO KWA PAPO) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-md p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-3.5 w-3.5 rounded-full bg-emerald-500 animate-ping absolute inset-0" />
              <div className="h-3.5 w-3.5 rounded-full bg-emerald-600 relative" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                  {language === 'sw'
                    ? 'Uthibitishaji wa Mauzo Papo kwa Papo (Live Sales Confirmation)'
                    : 'Live Sales Approval & Confirmation Queue'}
                </h2>
                {pendingSales.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                    {pendingSales.length} {language === 'sw' ? 'Yanasubiri Uthibitisho' : 'Pending'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'sw'
                  ? 'Muuza duka (cashier) akiingiza mauzo, taarifa zinaonekana hapa moja kwa moja ili uweze kudhibitisha au kufuta makosa.'
                  : 'Real-time sales entries submitted by cashiers for instant Super Admin verification or deletion.'}
              </p>
            </div>
          </div>

          {/* Sound alert & Batch actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsLiveChimeEnabled(!isLiveChimeEnabled);
                if (!isLiveChimeEnabled) playSaleChime();
              }}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                isLiveChimeEnabled
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200'
              }`}
              title="Kengele ya Mauzo ya Papo kwa Papo (Audio alert)"
            >
              {isLiveChimeEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span className="hidden sm:inline">
                {isLiveChimeEnabled ? 'Sauti: Imewashwa' : 'Sauti: Imezimwa'}
              </span>
            </button>

            {pendingSales.length > 1 && (
              <button
                onClick={handleApproveAllPending}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition flex items-center gap-1 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Thibitisha Yote ({pendingSales.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Pending Queue List */}
        {pendingSales.length === 0 ? (
          <div className="py-6 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center gap-2">
            <div className="p-2.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {language === 'sw'
                ? 'Hakuna mauzo yanayosubiri uthibitisho kwa sasa.'
                : 'No pending transactions awaiting approval.'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md">
              {language === 'sw'
                ? 'Wafanyakazi wakiingiza mauzo kwenye mashine ya mauzo (POS) au Daftari la Excel, yataonekana hapa hapo kwa papo kwa uthibitisho wako.'
                : 'Transactions submitted by staff in POS or Excel ledger will arrive here live for instant approval.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingSales.map(sale => (
              <div
                key={sale.id}
                className="p-4 rounded-xl border-2 border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm flex flex-col justify-between gap-3 transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-amber-200/60 dark:border-amber-800/40">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      Risiti #{sale.receiptNumber}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {sale.time}
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Muuzaji (Staff):</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {sale.employeeName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Njia ya Malipo:</span>
                      <span className="font-semibold uppercase text-slate-700 dark:text-slate-300">
                        {sale.paymentMethod}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-500 dark:text-slate-400">Jumla ya Mauzo:</span>
                      <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                        {formatTZS(sale.totalAmount)}
                      </span>
                    </div>

                    {/* Products summary */}
                    <div className="mt-2 p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-slate-700 dark:text-slate-300 max-h-20 overflow-y-auto">
                      {sale.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between py-0.5">
                          <span className="truncate pr-2 font-medium">
                            • {it.productName} ({it.quantity} {it.unit})
                          </span>
                          <span className="font-mono font-bold whitespace-nowrap">
                            {formatTZS(it.totalPrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Approval & Void/Delete Actions */}
                <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center gap-1.5">
                  {/* APPROVE BUTTON */}
                  <button
                    onClick={() => approveSale(sale.id)}
                    className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Thibitisha mauzo haya hapo kwa papo"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Thibitisha</span>
                  </button>

                  {/* INSPECT DETAILS BUTTON */}
                  <button
                    onClick={() => setInspectingSale(sale)}
                    className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
                    title="Tazama bidhaa zilizomo au futa bidhaa iliyoingizwa kimakosa"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>

                  {/* VOID / DELETE MISTAKE BUTTON */}
                  <button
                    onClick={() => setDeletingSale(sale)}
                    className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    title="Futa mauzo haya iwapo muuzaji ameyaweka kimakosa"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Futa</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SALES ≠ PROFIT Educational Alert Pill */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/60 rounded-lg text-amber-700 dark:text-amber-300">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <div className="font-extrabold text-xs tracking-wide uppercase">
              {t.salesNotProfit}
            </div>
            <div className="text-xs text-amber-800 dark:text-amber-300/80 mt-0.5">
              {t.salesNotProfitDesc}
            </div>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('profit')}
          className="text-xs font-bold text-amber-900 dark:text-amber-100 underline hover:text-amber-700 whitespace-nowrap self-end sm:self-center"
        >
          {language === 'sw' ? 'Tazama Mchanganuo wa Faida' : 'View Full Profit Breakdown'} →
        </button>
      </div>

      {/* Low Stock Warning Banner if any */}
      {(metrics.lowStockItems.length > 0 || metrics.outOfStockItems.length > 0) && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-rose-900 dark:text-rose-200">
                {language === 'sw' ? 'Tahadhari ya Bidhaa Stoo:' : 'Stock Alert:'}
              </span>{' '}
              <span className="text-rose-800 dark:text-rose-300">
                {metrics.outOfStockItems.length} {language === 'sw' ? 'zimeisha kabisa' : 'out of stock'},{' '}
                {metrics.lowStockItems.length} {language === 'sw' ? 'zinakaribia kuisha' : 'low on stock'}.
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('products')}
            className="text-xs font-bold text-rose-700 dark:text-rose-300 underline hover:text-rose-900"
          >
            {language === 'sw' ? 'Agiza Mzigo' : 'Manage Stock'}
          </button>
        </div>
      )}

      {/* 8 Core Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Sales */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              1. {t.todaySales}
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatTZS(metrics.todaySales)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>{metrics.todayTransactionCount} {language === 'sw' ? 'miamala imekamilika' : 'transactions today'}</span>
          </div>
        </div>

        {/* Card 2: Today's Profit */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              2. {t.todayProfit} ({language === 'sw' ? 'Halisi' : 'Net'})
            </span>
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatTZS(metrics.todayNetProfit)}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{language === 'sw' ? 'Ghafi:' : 'Gross:'} {formatTZS(metrics.todayGrossProfit)}</span>
            <span>{language === 'sw' ? 'Matumizi:' : 'Exp:'} {formatTZS(metrics.todayExpenses)}</span>
          </div>
        </div>

        {/* Card 3: Weekly Sales */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              3. {t.weeklySales}
            </span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatTZS(metrics.weeklySales)}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>{language === 'sw' ? 'Faida Ghafi:' : 'Gross:'} {formatTZS(metrics.weeklyGrossProfit)}</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              +{formatTZS(metrics.weeklyNetProfit)}
            </span>
          </div>
        </div>

        {/* Card 4: Monthly Sales */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              4. {t.monthlySales}
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatTZS(metrics.monthlySales)}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>{language === 'sw' ? 'Faida Halisi:' : 'Net Profit:'}</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              +{formatTZS(metrics.monthlyNetProfit)}
            </span>
          </div>
        </div>

        {/* Card 5: Daily Expenses */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              5. {language === 'sw' ? 'Matumizi ya Leo' : 'Today\'s Expenses'}
            </span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatTZS(metrics.todayExpenses)}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {language === 'sw' ? 'Wiki nzima:' : 'This week:'} {formatTZS(metrics.weeklyExpenses)}
          </div>
        </div>

        {/* Card 6: Cash in Drawer */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              6. {language === 'sw' ? 'Pesa Taslimu Drooni' : 'Cash in Drawer'}
            </span>
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatTZS(paymentBreakdown.methods.cash)}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {language === 'sw' ? 'M-Pesa / Tigo / Airtel:' : 'Mobile Money:'}{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {formatTZS(paymentBreakdown.methods.mpesa + paymentBreakdown.methods.airtel_money + paymentBreakdown.methods.mixx)}
            </span>
          </div>
        </div>

        {/* Card 7: Total Stock Value */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              7. {t.stockValue}
            </span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatTZS(metrics.totalStockValue)}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {language === 'sw' ? 'Mauzo yakikamilika:' : 'At retail price:'}{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {formatTZS(metrics.expectedRetailValue)}
            </span>
          </div>
        </div>

        {/* Card 8: Outstanding Customer Debt */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              8. {t.customerDebt}
            </span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {formatTZS(metrics.totalCustomerDebt)}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {customers.filter(c => c.totalDebt > 0).length} {language === 'sw' ? 'wateja wana madeni' : 'debtors'}
            </span>
            <button
              onClick={() => setActiveTab('debts')}
              className="text-rose-600 dark:text-rose-400 font-bold hover:underline"
            >
              {language === 'sw' ? 'Fuatilia' : 'Track'} →
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RECENT SALES & BUTTON YA KUFUTA BIDHAA / MAUZO YA MAKOSA */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{language === 'sw' ? 'Miamala ya Hivi Karibuni na Marekebisho' : 'Recent Transactions & Mistake Management'}</span>
              <span className="text-[11px] font-normal text-slate-400">
                ({sales.length} {language === 'sw' ? 'Jumla' : 'Total'})
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'sw'
                ? 'Super Admin anaweza kufuta mauzo au bidhaa zilizowekwa kimakosa na muuzaji, na kurudisha mzigo stoo.'
                : 'Super Admin can void and delete mistaken sales, restoring inventory and debt balances.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPrintModalPeriod('today');
                setShowPrintModal(true);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>{language === 'sw' ? 'Chapisha ya Leo' : 'Print Today'}</span>
            </button>
            <button
              onClick={() => {
                setPrintModalPeriod('this_week');
                setShowPrintModal(true);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>{language === 'sw' ? 'Chapisha ya Wiki' : 'Print Week'}</span>
            </button>
          </div>
        </div>

        {recentSales.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Hakuna miamala ya mauzo bado. Anza kurekodi mauzo kupitia POS au Daftari la Excel.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Risiti</th>
                  <th className="py-2.5 px-3">Muda</th>
                  <th className="py-2.5 px-3">Muuzaji (Cashier)</th>
                  <th className="py-2.5 px-3">Bidhaa Zilizomo</th>
                  <th className="py-2.5 px-3">Malipo</th>
                  <th className="py-2.5 px-3 text-right">Kiasi</th>
                  <th className="py-2.5 px-3 text-center">Hali</th>
                  <th className="py-2.5 px-3 text-right">Vitendo (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {recentSales.map(s => {
                  const isPending = s.status === 'pending_approval';
                  const isCancelled = s.status === 'cancelled';

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition ${
                        isPending ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {s.receiptNumber}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">
                        {s.date} {s.time.slice(0, 5)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {s.employeeName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono uppercase">
                          {s.employeeRole}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {s.items.map(it => `${it.productName} (${it.quantity})`).join(', ')}
                      </td>
                      <td className="py-2.5 px-3 uppercase text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        {s.paymentMethod}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatTZS(s.totalAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isPending ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            Inasubiri Uthibitisho
                          </span>
                        ) : isCancelled ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                            Imefutwa
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Imethibitishwa
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* If pending, show Approve button */}
                          {isPending && (
                            <button
                              onClick={() => approveSale(s.id)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              title="Thibitisha mauzo haya"
                            >
                              <Check className="h-3 w-3" />
                              <span>Thibitisha</span>
                            </button>
                          )}

                          {/* View & Edit individual items button */}
                          <button
                            onClick={() => setInspectingSale(s)}
                            className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Tazama bidhaa zilizomo au futa bidhaa ya makosa"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {/* BUTTON YA KUFUTA BIDHAA ZILIZOWEKWA KIMAKOSA NA MUUZAJI */}
                          {!isCancelled && isSuperAdmin && (
                            <button
                              onClick={() => setDeletingSale(s)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                              title="Futa muamala huu uliowekwa kimakosa na muuzaji"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Futa Makosa</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 7-Day Sales & Profit Trends Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'sw' ? 'Mwenendo wa Mauzo na Faida ya Siku 7' : '7-Day Sales & Net Profit Trends'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'sw' ? 'Kulinganisha kiwango cha mauzo dhidi ya faida halisi' : 'Comparing daily revenue vs net profit in TZS'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-400">{language === 'sw' ? 'Mauzo' : 'Sales'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-teal-300 dark:bg-teal-700" />
                <span className="text-slate-600 dark:text-slate-400">{language === 'sw' ? 'Faida Halisi' : 'Net Profit'}</span>
              </div>
            </div>
          </div>

          {/* Interactive CSS Bar Graph */}
          <div className="h-56 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-100 dark:border-slate-800">
            {last7DaysData.map((d, index) => {
              const salesHeight = Math.max(8, Math.min(100, (d.sales / maxDailySale) * 100));
              const profitHeight = Math.max(4, Math.min(salesHeight, (Math.max(0, d.profit) / maxDailySale) * 100));

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1 h-full relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none z-20 whitespace-nowrap shadow-lg">
                      <span>Mauzo: {formatTZS(d.sales)}</span>
                      <span className="text-emerald-300">Faida: {formatTZS(d.profit)}</span>
                    </div>

                    {/* Sales Bar */}
                    <div
                      style={{ height: `${salesHeight}%` }}
                      className="w-full max-w-[28px] bg-emerald-500 rounded-t-md transition-all group-hover:brightness-110"
                    />
                    {/* Profit Bar */}
                    <div
                      style={{ height: `${profitHeight}%` }}
                      className="w-full max-w-[28px] bg-teal-300 dark:bg-teal-700 rounded-t-md transition-all group-hover:brightness-110"
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 capitalize">
                    {d.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span>{language === 'sw' ? 'Jumla ya Mauzo ya Wiki:' : 'Weekly Revenue:'} <strong className="text-slate-800 dark:text-slate-200">{formatTZS(metrics.weeklySales)}</strong></span>
            <span>{language === 'sw' ? 'Faida Halisi ya Wiki:' : 'Weekly Net Profit:'} <strong className="text-emerald-600 dark:text-emerald-400">{formatTZS(metrics.weeklyNetProfit)}</strong></span>
          </div>
        </div>

        {/* Right: Payment Method Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'sw' ? 'Njia za Malipo (Mauzo)' : 'Payment Method Mix'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'sw' ? 'M-Pesa, Fedha Taslimu, Airtel Money na Mkopo' : 'Cash vs Mobile Money vs Credit'}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { id: 'cash', label: t.pmCash, amount: paymentBreakdown.methods.cash, color: 'bg-emerald-500' },
              { id: 'mpesa', label: t.pmMpesa, amount: paymentBreakdown.methods.mpesa, color: 'bg-red-500' },
              { id: 'airtel_money', label: t.pmAirtel, amount: paymentBreakdown.methods.airtel_money, color: 'bg-rose-600' },
              { id: 'bank', label: t.pmBank, amount: paymentBreakdown.methods.bank, color: 'bg-blue-600' },
              { id: 'credit', label: t.pmCredit, amount: paymentBreakdown.methods.credit, color: 'bg-amber-500' },
            ].map(method => {
              const percent = paymentBreakdown.total > 0
                ? Math.round((method.amount / paymentBreakdown.total) * 100)
                : 0;

              return (
                <div key={method.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{method.label}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatTZS(method.amount)} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className={`h-full rounded-full ${method.color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs text-slate-500 dark:text-slate-400">
            {language === 'sw'
              ? 'Wateja wengi huko Kinyerezi hutumia Fedha Taslimu na M-Pesa kwa manunuzi madogo.'
              : 'Most customers in Kinyerezi use Cash and M-Pesa for daily retail groceries.'}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top Selling Products & Smart Business Insight Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.topSelling}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'sw' ? 'Bidhaa zilizozalisha mauzo makubwa zaidi' : 'Top generating retail inventory'}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('products')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {language === 'sw' ? 'Bidhaa Zote' : 'All Products'} →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">{t.productName}</th>
                  <th className="py-2.5 px-3 text-right">{t.quantity}</th>
                  <th className="py-2.5 px-3 text-right">{t.totalRevenue}</th>
                  <th className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">{t.grossProfit}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          {idx + 1}
                        </span>
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {p.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatTZS(p.revenue)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatTZS(p.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Smart Business Assistant Teaser */}
        <div className="bg-gradient-to-br from-purple-900 to-indigo-950 rounded-xl p-5 text-white shadow-lg border border-purple-800/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span>{language === 'sw' ? 'Uchambuzi wa Akili Mnemba' : 'AI Business Intelligence'}</span>
            </div>
            <h3 className="text-base font-extrabold mt-1 text-white">
              {language === 'sw' ? 'Msaidizi wa Smart Point Venture' : 'Smart Point Venture Assistant'}
            </h3>
            <p className="text-xs text-purple-200/80 mt-2 leading-relaxed">
              {language === 'sw'
                ? 'Uliza maswali ya duka lako kwa Kiswahili au Kiingereza kulingana na mauzo halisi, gharama, madeni na stoo iliyopo.'
                : 'Ask questions about your store in Swahili or English based on actual sales records, COGS, debts and current stock.'}
            </p>

            <div className="mt-4 space-y-2">
              <div
                onClick={() => setActiveTab('assistant')}
                className="p-2.5 rounded-lg bg-white/10 hover:bg-white/15 cursor-pointer text-xs text-purple-100 transition flex items-center justify-between"
              >
                <span>"Leo nimeuza kiasi gani na faida ni ipi?"</span>
                <ChevronRight className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <div
                onClick={() => setActiveTab('assistant')}
                className="p-2.5 rounded-lg bg-white/10 hover:bg-white/15 cursor-pointer text-xs text-purple-100 transition flex items-center justify-between"
              >
                <span>"Ni bidhaa gani inakaribia kuisha stoo?"</span>
                <ChevronRight className="h-3.5 w-3.5 text-purple-400" />
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('assistant')}
            className="mt-5 w-full py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>{language === 'sw' ? 'Fungua Msaidizi wa AI' : 'Open AI Assistant'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: DELETE MISTAKEN SALE CONFIRMATION */}
      {/* ========================================================================= */}
      {deletingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-950/60 rounded-full text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Futa Mauzo Yaliyowekwa Kimakosa
                </h3>
                <p className="text-xs text-slate-500">
                  Risiti #{deletingSale.receiptNumber} — {deletingSale.employeeName}
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900 text-xs space-y-2 text-rose-900 dark:text-rose-200">
              <div className="flex justify-between font-bold">
                <span>Kiasi cha Mauzo:</span>
                <span className="font-mono text-sm">{formatTZS(deletingSale.totalAmount)}</span>
              </div>
              <div className="text-[11px] text-rose-700 dark:text-rose-300">
                Bidhaa zote {deletingSale.items.length} zitarudishwa stoo kiotomatiki, na muamala utaondolewa kwenye rekodi za mapato.
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Sababu ya Kufuta Mauzo Haya:
              </label>
              <textarea
                rows={2}
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="Mfano: Muuzaji aliweka risiti mara mbili kimakosa..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSale(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Ghairi
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSale}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow transition flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Futa na Rudisha Stoo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INSPECT RECEIPT & DELETE INDIVIDUAL MISTAKEN ITEMS */}
      {/* ========================================================================= */}
      {inspectingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Mchanganuo wa Risiti #{inspectingSale.receiptNumber}</span>
                  {inspectingSale.status === 'pending_approval' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                      Inasubiri Uthibitisho
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  Iliyoingizwa na {inspectingSale.employeeName} • {inspectingSale.date} {inspectingSale.time}
                </p>
              </div>
              <button
                onClick={() => setInspectingSale(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Ikiwa muuzaji aliweka bidhaa mojawapo kimakosa, unaweza kuifuta bidhaa hiyo pekee hapa chini:
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {inspectingSale.items.map((it, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {it.productName}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {it.quantity} {it.unit} @ {formatTZS(it.unitPrice)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatTZS(it.totalPrice)}
                      </span>

                      {isSuperAdmin && (
                        <button
                          onClick={() => handleDeleteLineItem(idx)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400 transition"
                          title="Futa bidhaa hii pekee (Iliwekwa kimakosa)"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Jumla Ndogo:</span>
                  <span className="font-mono">{formatTZS(inspectingSale.subtotal)}</span>
                </div>
                {inspectingSale.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Punguzo:</span>
                    <span className="font-mono">-{formatTZS(inspectingSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Jumla Kuu:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    {formatTZS(inspectingSale.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              {inspectingSale.status === 'pending_approval' ? (
                <button
                  onClick={() => {
                    approveSale(inspectingSale.id);
                    setInspectingSale(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>Thibitisha Mauzo Haya</span>
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={() => setInspectingSale(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
              >
                Funga
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT REPORT MODAL */}
      <PrintReportModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        initialPeriod={printModalPeriod}
      />

      {/* GMAIL HUB MODAL */}
      <GmailHubModal
        isOpen={showGmailModal}
        onClose={() => setShowGmailModal(false)}
      />
    </div>
  );
};
