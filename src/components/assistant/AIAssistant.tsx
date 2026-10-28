import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Loader2,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AIAssistant: React.FC = () => {
  const {
    sales,
    expenses,
    products,
    customers,
    settings,
    currentUser,
    language,
    formatTZS,
    t,
  } = useStore();

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialGreeting = language === 'sw'
    ? `Habari Mkurugenzi ${currentUser.name}! Mimi ni Msaidizi wako wa Biashara wa SMART POINT VENTURE. Ninafuatilia rekodi halisi za mauzo, gharama, faida halisi, madeni na hali ya stoo ya duka lako hapa Dar es Salaam. Ungependa kufahamu nini kuhusu biashara yako leo?`
    : `Hello ${currentUser.name}! I am your AI Business Assistant for SMART POINT VENTURE. I analyze your actual sales, costs, operating expenses, net profit, customer debts, and stock levels. What would you like to know about your business today?`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: initialGreeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Compile real store context for Gemini
  const buildStoreContext = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const startOfWeek = new Date(now);
    const curDay = startOfWeek.getDay() || 7;
    startOfWeek.setDate(startOfWeek.getDate() - curDay + 1);
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
    const curMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const todaySales = sales.filter(s => s.date === todayStr && s.status === 'completed');
    const todayRev = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const todayCost = todaySales.reduce((sum, s) => sum + s.totalCost, 0);
    const todayGross = todayRev - todayCost;
    const todayExpenses = expenses.filter(e => e.date === todayStr).reduce((sum, e) => sum + e.amount, 0);
    const todayNet = todayGross - todayExpenses;

    const weeklySales = sales.filter(s => s.date >= startOfWeekStr && s.status === 'completed');
    const weeklyRev = weeklySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const weeklyCost = weeklySales.reduce((sum, s) => sum + s.totalCost, 0);
    const weeklyGross = weeklyRev - weeklyCost;
    const weeklyExpenses = expenses.filter(e => e.date >= startOfWeekStr).reduce((sum, e) => sum + e.amount, 0);
    const weeklyNet = weeklyGross - weeklyExpenses;

    const monthlySales = sales.filter(s => s.date.startsWith(curMonthPrefix) && s.status === 'completed');
    const monthlyRev = monthlySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const monthlyCost = monthlySales.reduce((sum, s) => sum + s.totalCost, 0);
    const monthlyGross = monthlyRev - monthlyCost;
    const monthlyExpenses = expenses.filter(e => e.date.startsWith(curMonthPrefix)).reduce((sum, e) => sum + e.amount, 0);
    const monthlyNet = monthlyGross - monthlyExpenses;

    const totalStockCost = products.reduce((sum, p) => sum + p.currentStock * p.buyingPrice, 0);
    const totalCustomerDebt = customers.reduce((sum, c) => sum + c.totalDebt, 0);

    const lowStock = products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStockLevel).map(p => `${p.name} (zimebaki ${p.currentStock} ${p.unit})`);
    const outOfStock = products.filter(p => p.currentStock === 0).map(p => p.name);

    return {
      storeName: settings.name,
      owner: settings.owner,
      location: settings.location,
      currency: 'TZS',
      today: {
        date: todayStr,
        salesRevenue: todayRev,
        costOfGoodsSold: todayCost,
        grossProfit: todayGross,
        expenses: todayExpenses,
        netProfit: todayNet,
        transactionsCount: todaySales.length,
      },
      thisWeek: {
        sinceMonday: startOfWeekStr,
        salesRevenue: weeklyRev,
        costOfGoodsSold: weeklyCost,
        grossProfit: weeklyGross,
        expenses: weeklyExpenses,
        netProfit: weeklyNet,
      },
      thisMonth: {
        month: curMonthPrefix,
        salesRevenue: monthlyRev,
        costOfGoodsSold: monthlyCost,
        grossProfit: monthlyGross,
        expenses: monthlyExpenses,
        netProfit: monthlyNet,
      },
      inventory: {
        totalStockValuationCost: totalStockCost,
        lowStockProducts: lowStock,
        outOfStockProducts: outOfStock,
      },
      customerDebts: {
        totalOutstandingDebt: totalCustomerDebt,
        topDebtors: customers.filter(c => c.totalDebt > 0).map(c => `${c.name}: ${c.totalDebt} TZS`),
      },
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          storeContext: buildStoreContext(),
          language,
        }),
      });

      if (!response.ok) {
        throw new Error('Server error');
      }

      const data = await response.json();
      const assistantReply: ChatMessage = {
        id: `msg-resp-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Samahani, sikuweza kuchakata jibu.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, assistantReply]);
    } catch (err) {
      console.error(err);
      // Fallback local response based on real store context
      const ctx = buildStoreContext();
      let fallbackText = '';
      if (query.includes('leo') || query.includes('today')) {
        fallbackText = `Mauzo ya Leo ni ${formatTZS(ctx.today.salesRevenue)}. Gharama za bidhaa zilizouzwa (COGS) ni ${formatTZS(ctx.today.costOfGoodsSold)}, matumizi ya leo ni ${formatTZS(ctx.today.expenses)}, hivyo FAIDA HALISI YA LEO NI ${formatTZS(ctx.today.netProfit)}.`;
      } else if (query.includes('wiki') || query.includes('week')) {
        fallbackText = `Mauzo ya Wiki hii ni ${formatTZS(ctx.thisWeek.salesRevenue)} na Faida Halisi ya wiki ni ${formatTZS(ctx.thisWeek.netProfit)}.`;
      } else if (query.includes('kuisha') || query.includes('stock')) {
        fallbackText = `Bidhaa zilizopungua stoo: ${ctx.inventory.lowStockProducts.join(', ') || 'Hakuna'}. Zilizoisha kabisa: ${ctx.inventory.outOfStockProducts.join(', ') || 'Hakuna'}.`;
      } else if (query.includes('deni') || query.includes('madeni') || query.includes('debt')) {
        fallbackText = `Jumla ya madeni ya wateja ni ${formatTZS(ctx.customerDebts.totalOutstandingDebt)}. Wateja wanaoongoza: ${ctx.customerDebts.topDebtors.join(', ')}.`;
      } else {
        fallbackText = `Kulingana na data ya SMART POINT VENTURE: Mauzo ya Mwezi huu ni ${formatTZS(ctx.thisMonth.salesRevenue)}, Faida Halisi ni ${formatTZS(ctx.thisMonth.netProfit)}. Thamani ya stoo iliyopo ni ${formatTZS(ctx.inventory.totalStockValuationCost)}.`;
      }

      const assistantReply: ChatMessage = {
        id: `msg-resp-${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, assistantReply]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = language === 'sw'
    ? [
        'Leo nimeuza kiasi gani na faida ni ipi?',
        'Faida yangu ya wiki hii ni kiasi gani?',
        'Ni bidhaa gani zinakaribia kuisha stoo?',
        'Madeni ya wateja yapo kiasi gani?',
        'Matumizi ya mwezi huu yamefikia kiasi gani?',
      ]
    : [
        'What were my total sales and net profit today?',
        'How much net profit did we make this week?',
        'Which products are running low on stock?',
        'What is our total outstanding customer debt?',
        'How much did we spend on operating expenses this month?',
      ];

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-purple-900/10 via-emerald-900/10 to-slate-900/10 dark:from-purple-950/40 dark:to-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{t.aiAssistantTitle}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                Server-side Gemini 3.8 Flash
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.aiAssistantSubtitle}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                id: 'msg-reset',
                sender: 'assistant',
                text: initialGreeting,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Futa Maongezi (Reset)"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                  isUser
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-purple-600 text-white shadow-sm'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed space-y-1 ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200/60 dark:border-slate-700'
                }`}
              >
                <div className="whitespace-pre-line font-medium">{msg.text}</div>
                <div
                  className={`text-[10px] text-right font-mono ${
                    isUser ? 'text-emerald-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
              <span>{t.analyzingStoreData}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 transition"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input box */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            placeholder={t.askQuestionPlaceholder}
            className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || loading}
            className={`p-2.5 rounded-xl font-bold transition flex items-center justify-center ${
              !inputQuery.trim() || loading
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30'
            }`}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
