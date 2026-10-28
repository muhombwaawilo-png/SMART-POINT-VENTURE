import React, { useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
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
} from 'lucide-react';

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
  } = useStore();

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper date calculations
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay() || 7; // get current day of week (1 is Mon, 7 is Sun)
  startOfWeek.setDate(startOfWeek.getDate() - day + 1); // Set to Monday
  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentMonthPrefix = `${currentYear}-${currentMonth}`;

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
            <button
              onClick={() => setActiveTab('pos')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition active:scale-95"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>{t.navPOS}</span>
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 transition"
            >
              <CreditCard className="h-4 w-4" />
              <span>{t.recordExpense}</span>
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

      {/* 8 Core Dashboard Cards as requested */}
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
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {language === 'sw' ? 'Kuanzia Jumatatu wiki hii' : 'Since Monday this week'}
          </div>
        </div>

        {/* Card 4: Weekly Profit */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              4. {t.weeklyProfit} ({language === 'sw' ? 'Halisi' : 'Net'})
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatTZS(metrics.weeklyNetProfit)}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {language === 'sw' ? 'Faida Ghafi:' : 'Gross Profit:'} {formatTZS(metrics.weeklyGrossProfit)}
          </div>
        </div>

        {/* Card 5: Monthly Sales */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              5. {t.monthlySales}
            </span>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatTZS(metrics.monthlySales)}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {language === 'sw' ? 'Mwezi huu mzima' : 'Current full month'}
          </div>
        </div>

        {/* Card 6: Monthly Profit */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              6. {t.monthlyProfit} ({language === 'sw' ? 'Halisi' : 'Net'})
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatTZS(metrics.monthlyNetProfit)}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {language === 'sw' ? 'Margin ya Faida:' : 'Profit Margin:'}{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {metrics.monthlySales > 0
                ? `${((metrics.monthlyNetProfit / metrics.monthlySales) * 100).toFixed(1)}%`
                : '0%'}
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
    </div>
  );
};
