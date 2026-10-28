import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  TrendingUp,
  AlertTriangle,
  DollarSign,
  PieChart,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Info,
} from 'lucide-react';

export const ProfitAnalysis: React.FC = () => {
  const { sales, expenses, products, formatTZS, language, t } = useStore();

  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const startOfWeek = new Date(now);
  const curDay = startOfWeek.getDay() || 7;
  startOfWeek.setDate(startOfWeek.getDate() - curDay + 1);
  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

  const curMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Filtered sales and expenses
  const filteredData = useMemo(() => {
    let filteredSales = sales.filter(s => s.status === 'completed');
    let filteredExpenses = expenses;

    if (timeFilter === 'today') {
      filteredSales = filteredSales.filter(s => s.date === todayStr);
      filteredExpenses = filteredExpenses.filter(e => e.date === todayStr);
    } else if (timeFilter === 'week') {
      filteredSales = filteredSales.filter(s => s.date >= startOfWeekStr);
      filteredExpenses = filteredExpenses.filter(e => e.date >= startOfWeekStr);
    } else if (timeFilter === 'month') {
      filteredSales = filteredSales.filter(s => s.date.startsWith(curMonthPrefix));
      filteredExpenses = filteredExpenses.filter(e => e.date.startsWith(curMonthPrefix));
    }

    const revenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const cogs = filteredSales.reduce((sum, s) => sum + s.totalCost, 0);
    const grossProfit = revenue - cogs;
    const operatingExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - operatingExpenses;
    const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0';

    return {
      revenue,
      cogs,
      grossProfit,
      operatingExpenses,
      netProfit,
      profitMargin,
      txCount: filteredSales.length,
    };
  }, [sales, expenses, timeFilter, todayStr, startOfWeekStr, curMonthPrefix]);

  // Product profitability rankings
  const productProfitRankings = useMemo(() => {
    const map: Record<string, { name: string; category: string; revenue: number; cost: number; profit: number; margin: number; unit: string }> = {};

    sales.filter(s => s.status === 'completed').forEach(s => {
      s.items.forEach(it => {
        if (!map[it.productId]) {
          const prod = products.find(p => p.id === it.productId);
          map[it.productId] = {
            name: it.productName,
            category: prod?.category || 'chakula',
            revenue: 0,
            cost: 0,
            profit: 0,
            margin: 0,
            unit: it.unit,
          };
        }
        map[it.productId].revenue += it.totalPrice;
        map[it.productId].cost += it.totalCost;
        map[it.productId].profit += it.grossProfit;
      });
    });

    return Object.values(map)
      .map(p => ({
        ...p,
        margin: p.revenue > 0 ? parseFloat(((p.profit / p.revenue) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [sales, products]);

  return (
    <div className="space-y-5">
      {/* Big Educational Flag: SALES ≠ PROFIT */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-6 rounded-2xl text-white border border-emerald-800/40 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-black tracking-widest uppercase text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              <span>KANUNI KUU YA SMART POINT VENTURE</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              MAUZO SIYO FAIDA! (SALES ≠ PROFIT)
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Katika biashara ya rejareja Dar es Salaam, fedha zote zinazoingia kwenye droo au M-Pesa (Revenue)
              zinajumuisha <strong>mtaji wa awali wa kununua mzigo (Cost of Goods)</strong> pamoja na{' '}
              <strong>gharama za uendeshaji (Expenses)</strong>. Faida yako halisi ni kile kinachobaki baada ya kutoa hivi vyote.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl text-xs font-bold border border-white/10">
            {(['today', 'week', 'month', 'all'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setTimeFilter(tab)}
                className={`px-3 py-1.5 rounded-lg capitalize transition ${
                  timeFilter === tab ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
              >
                {tab === 'today' ? 'Leo' : tab === 'week' ? 'Wiki Hii' : tab === 'month' ? 'Mwezi Huu' : 'Yote'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Formula Waterfall: Revenue - COGS = Gross, Gross - Expenses = Net */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
          {language === 'sw' ? 'Mlolongo wa Mahesabu ya Faida (Profit Waterfall)' : 'Profit Calculation Formula'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-xs">
          {/* 1. Revenue */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 block font-bold uppercase">1. Mauzo (Revenue)</span>
            <span className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1 block">
              {formatTZS(filteredData.revenue)}
            </span>
            <span className="text-[10px] text-slate-500">Pesa yote iliyoingia</span>
          </div>

          {/* Minus sign */}
          <div className="text-center font-bold text-slate-400 text-lg hidden md:block">−</div>

          {/* 2. COGS */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 block font-bold uppercase">2. Gharama za Mzigo (COGS)</span>
            <span className="text-xl font-black font-mono text-slate-700 dark:text-slate-300 mt-1 block">
              {formatTZS(filteredData.cogs)}
            </span>
            <span className="text-[10px] text-slate-500">Mtaji wa kununua bidhaa</span>
          </div>

          {/* Equals sign */}
          <div className="text-center font-bold text-slate-400 text-lg hidden md:block">=</div>

          {/* 3. Gross Profit */}
          <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/40">
            <span className="text-teal-800 dark:text-teal-300 block font-bold uppercase">3. Faida Ghafi (Gross)</span>
            <span className="text-xl font-black font-mono text-teal-700 dark:text-teal-400 mt-1 block">
              +{formatTZS(filteredData.grossProfit)}
            </span>
            <span className="text-[10px] text-teal-600">Kabla ya kutoa matumizi</span>
          </div>
        </div>

        {/* Next step: Gross Profit - Expenses = Net Profit */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/40">
            <span className="text-teal-800 dark:text-teal-300 block font-bold uppercase">Faida Ghafi</span>
            <span className="text-lg font-black font-mono text-teal-700 dark:text-teal-400 mt-1 block">
              {formatTZS(filteredData.grossProfit)}
            </span>
          </div>

          <div className="text-center font-bold text-slate-400 text-lg hidden md:block">−</div>

          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40">
            <span className="text-rose-800 dark:text-rose-300 block font-bold uppercase">Matumizi ya Uendeshaji</span>
            <span className="text-lg font-black font-mono text-rose-600 dark:text-rose-400 mt-1 block">
              {formatTZS(filteredData.operatingExpenses)}
            </span>
            <span className="text-[10px] text-rose-500">Kodi, LUKU, Maji, Nauli</span>
          </div>

          <div className="text-center font-bold text-slate-400 text-lg hidden md:block">=</div>

          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 shadow-sm">
            <span className="text-emerald-800 dark:text-emerald-300 block font-black uppercase text-xs">
              FAIDA HALISI (NET PROFIT)
            </span>
            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
              +{formatTZS(filteredData.netProfit)}
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
              Net Profit Margin: {filteredData.profitMargin}%
            </span>
          </div>
        </div>
      </div>

      {/* Product Profitability Rankings */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-5 space-y-3">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            {language === 'sw' ? 'Mchanganuo wa Faida ya Kila Bidhaa (Product Profitability)' : 'Product Profitability Ranking'}
          </h3>
          <p className="text-xs text-slate-500">
            {language === 'sw'
              ? 'Husaidia uamuzi wa kuongeza mtaji kwenye bidhaa zenye faida kubwa'
              : 'Helps owner decide which products should receive more working capital'}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3.5">#</th>
                <th className="py-3 px-3.5">Jina la Bidhaa</th>
                <th className="py-3 px-3.5 text-right">Mauzo Yote</th>
                <th className="py-3 px-3.5 text-right">Mtaji (Cost)</th>
                <th className="py-3 px-3.5 text-right text-emerald-600 font-bold">Faida Ghafi</th>
                <th className="py-3 px-3.5 text-right font-bold">Margin (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {productProfitRankings.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3.5 font-sans font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3.5 font-sans font-bold text-slate-900 dark:text-white">
                    {p.name}
                  </td>
                  <td className="py-2.5 px-3.5 text-right text-slate-800 dark:text-slate-200">
                    {formatTZS(p.revenue)}
                  </td>
                  <td className="py-2.5 px-3.5 text-right text-slate-500">
                    {formatTZS(p.cost)}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatTZS(p.profit)}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-bold text-slate-900 dark:text-white">
                    {p.margin}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
