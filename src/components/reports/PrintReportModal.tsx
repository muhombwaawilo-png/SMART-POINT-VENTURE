import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Printer,
  X,
  Mail,
  Download,
  Calendar,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Package,
} from 'lucide-react';
import { sendGmailEmail, getGmailAccessToken } from '../../services/gmail';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPeriod?: 'today' | 'this_week' | 'custom';
  initialEmployeeId?: string;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  initialPeriod = 'today',
  initialEmployeeId = 'all',
}) => {
  const {
    sales,
    expenses,
    users,
    settings,
    formatTZS,
    language,
    currentUser,
  } = useStore();

  const [period, setPeriod] = useState<'today' | 'this_week' | 'custom'>(initialPeriod);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(initialEmployeeId);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [customStartDate, setCustomStartDate] = useState(todayStr);
  const [customEndDate, setCustomEndDate] = useState(todayStr);

  // Email sending state
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(settings.notificationEmail || 'colimbajr@gmail.com');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Calculate start and end date for current filter
  const { startDate, endDate, periodLabel } = useMemo(() => {
    const now = new Date();
    if (period === 'today') {
      return {
        startDate: todayStr,
        endDate: todayStr,
        periodLabel: language === 'sw' ? `Siku ya Leo (${todayStr})` : `Today (${todayStr})`,
      };
    } else if (period === 'this_week') {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay() || 7;
      startOfWeek.setDate(startOfWeek.getDate() - day + 1);
      const startStr = startOfWeek.toISOString().split('T')[0];
      return {
        startDate: startStr,
        endDate: todayStr,
        periodLabel: language === 'sw' ? `Wiki Hii (${startStr} hadi ${todayStr})` : `This Week (${startStr} to ${todayStr})`,
      };
    } else {
      return {
        startDate: customStartDate,
        endDate: customEndDate,
        periodLabel: `${customStartDate} → ${customEndDate}`,
      };
    }
  }, [period, customStartDate, customEndDate, todayStr, language]);

  // Selected employee metadata
  const selectedUser = useMemo(() => {
    if (selectedEmployeeId === 'all') return null;
    return users.find(u => u.id === selectedEmployeeId) || null;
  }, [users, selectedEmployeeId]);

  // Filter sales matching period and employee
  const matchingSales = useMemo(() => {
    return sales.filter(s => {
      const inDateRange = s.date >= startDate && s.date <= endDate;
      const inEmployee = selectedEmployeeId === 'all' || s.employeeId === selectedEmployeeId;
      const isCountable = s.status === 'completed';
      return inDateRange && inEmployee && isCountable;
    });
  }, [sales, startDate, endDate, selectedEmployeeId]);

  // Financial and volume metrics
  const reportStats = useMemo(() => {
    const totalRevenue = matchingSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalCOGS = matchingSales.reduce((sum, s) => sum + s.totalCost, 0);
    const grossProfit = totalRevenue - totalCOGS;

    // Matching expenses if reporting for all or relevant
    const matchingExpenses = expenses.filter(e => e.date >= startDate && e.date <= endDate);
    const totalExpenses = selectedEmployeeId === 'all' ? matchingExpenses.reduce((sum, e) => sum + e.amount, 0) : 0;
    const netProfit = grossProfit - totalExpenses;

    const paymentMethods: Record<string, number> = {
      cash: 0,
      mpesa: 0,
      airtel_money: 0,
      mixx: 0,
      bank: 0,
      credit: 0,
    };

    let totalItemsQuantity = 0;
    const productBreakdown: Record<string, { name: string; unit: string; quantity: number; revenue: number }> = {};

    matchingSales.forEach(s => {
      const pm = s.paymentMethod;
      if (paymentMethods[pm] !== undefined) {
        paymentMethods[pm] += s.totalAmount;
      } else {
        paymentMethods.cash += s.totalAmount;
      }

      s.items.forEach(it => {
        totalItemsQuantity += it.quantity;
        if (!productBreakdown[it.productId]) {
          productBreakdown[it.productId] = {
            name: it.productName,
            unit: it.unit,
            quantity: 0,
            revenue: 0,
          };
        }
        productBreakdown[it.productId].quantity += it.quantity;
        productBreakdown[it.productId].revenue += it.totalPrice;
      });
    });

    return {
      txCount: matchingSales.length,
      totalRevenue,
      totalCOGS,
      grossProfit,
      totalExpenses,
      netProfit,
      totalItemsQuantity,
      paymentMethods,
      products: Object.values(productBreakdown).sort((a, b) => b.revenue - a.revenue),
    };
  }, [matchingSales, expenses, startDate, endDate, selectedEmployeeId]);

  if (!isOpen) return null;

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Send via Gmail
  const handleSendViaGmail = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      alert('Tafadhali weka barua pepe (email) sahihi!');
      return;
    }

    const token = getGmailAccessToken();
    if (!token) {
      alert('Hujaunganisha Gmail. Tafadhali fungua Gmail Hub na ubonyeze "Sign in with Google" kwanza.');
      return;
    }

    const confirmed = window.confirm(
      `Unathibitisha kutuma Ripoti ya Mauzo ya ${periodLabel} kwa barua pepe ya ${recipientEmail}?`
    );
    if (!confirmed) return;

    setIsSendingEmail(true);
    setEmailStatus(null);

    const subject = `Ripoti ya Mauzo (${periodLabel}) - SMART POINT VENTURE`;
    const employeeTitle = selectedUser
      ? `${selectedUser.name} (ID: ${selectedUser.employeeNumber || 'STAFF'})`
      : 'Wafanyakazi Wote (All Staff)';

    const bodyHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #065f46; color: #ffffff; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 1px;">SMART POINT VENTURE</h1>
          <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Kinyerezi - Kifuru - Mwanzo Mgumu, Dar es Salaam</p>
          <p style="margin: 2px 0 0; font-size: 12px; opacity: 0.85;">Simu: 0654275518 / 0657635845 | Mkurugenzi: AWILO SULEIMAN</p>
        </div>

        <div style="padding: 20px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <h2 style="margin: 0 0 10px; font-size: 16px; color: #0f172a;">Ripoti Rasmi ya Mauzo</h2>
          <table style="width: 100%; font-size: 13px;">
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Kipindi:</td>
              <td style="font-weight: bold; text-align: right;">${periodLabel}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Mfanyakazi / Muuzaji:</td>
              <td style="font-weight: bold; text-align: right;">${employeeTitle}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Idadi ya Miamala:</td>
              <td style="font-weight: bold; text-align: right;">${reportStats.txCount}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Jumla ya Vipande Vilivyouzwa:</td>
              <td style="font-weight: bold; text-align: right;">${reportStats.totalItemsQuantity}</td>
            </tr>
          </table>
        </div>

        <div style="padding: 20px;">
          <h3 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; color: #334155;">Muhtasari wa Fedha na Malipo</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0;">Fedha Taslimu (Cash):</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatTZS(reportStats.paymentMethods.cash)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0;">M-Pesa:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #dc2626;">${formatTZS(reportStats.paymentMethods.mpesa)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0;">Airtel Money:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #e11d48;">${formatTZS(reportStats.paymentMethods.airtel_money)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0;">Mikopo (Madeni Mapya):</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #d97706;">${formatTZS(reportStats.paymentMethods.credit)}</td>
            </tr>
            <tr style="border-bottom: 2px solid #0f172a; font-size: 15px;">
              <td style="padding: 10px 0; font-weight: bold; color: #047857;">JUMLA YA MAUZO:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #047857;">${formatTZS(reportStats.totalRevenue)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #059669; font-weight: bold;">FAIDA YA MAUZO:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #059669;">+${formatTZS(reportStats.grossProfit)}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #f1f5f9; padding: 12px; font-size: 11px; color: #64748b; text-align: center;">
          Imetumwa kiotomatiki kutoka kwenye mfumo wa biashara wa SMART POINT VENTURE, Dar es Salaam.
        </div>
      </div>
    `;

    try {
      await sendGmailEmail({
        to: recipientEmail,
        subject,
        bodyHtml,
        bodyText: `Ripoti ya Mauzo ya SMART POINT VENTURE (${periodLabel})\nMfanyakazi: ${employeeTitle}\nJumla ya Mauzo: ${formatTZS(reportStats.totalRevenue)}\nFaida: ${formatTZS(reportStats.grossProfit)}`,
      });

      setEmailStatus({
        type: 'success',
        message: `Ripoti ya mauzo imetumwa kikamilifu kwa barua pepe: ${recipientEmail}`,
      });
      setShowEmailPrompt(false);
    } catch (err: any) {
      setEmailStatus({
        type: 'error',
        message: err.message || 'Hitilafu imetokea wakati wa kutuma barua pepe kupitia Gmail.',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Risiti', 'Tarehe', 'Muda', 'Muuzaji', 'Namba ya Mfanyakazi', 'Bidhaa', 'Idadi', 'Njia ya Malipo', 'Jumla (TZS)'];
    const rows = matchingSales.map(s => [
      s.receiptNumber,
      s.date,
      s.time,
      `"${s.employeeName}"`,
      `"${s.employeeId}"`,
      `"${s.items.map(it => `${it.productName} (${it.quantity} ${it.unit})`).join('; ')}"`,
      s.items.reduce((sum, it) => sum + it.quantity, 0),
      s.paymentMethod,
      s.totalAmount,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ripoti_Mauzo_${period}_${selectedEmployeeId}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden print:border-none print:shadow-none print:max-w-none print:max-h-none print:w-full">
        
        {/* Controls Toolbar (Hidden on Print) */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-600 text-white">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'sw' ? 'Chapisha Ripoti ya Mauzo ya Mfanyakazi' : 'Print Staff Sales Report'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'sw' ? 'Chagua kipindi (leo / wiki) na mfanyakazi husika' : 'Select period & cashier'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEmailPrompt(!showEmailPrompt)}
              className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>{language === 'sw' ? 'Tuma kwa Gmail' : 'Email via Gmail'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>{language === 'sw' ? 'Chapisha (Print)' : 'Print Document'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filter Configuration Strip (Hidden on Print) */}
        <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs print:hidden">
          {/* Period Selection */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                period === 'today' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              {language === 'sw' ? 'Siku ya Leo' : 'Today'}
            </button>
            <button
              onClick={() => setPeriod('this_week')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                period === 'this_week' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              {language === 'sw' ? 'Wiki Hii' : 'This Week'}
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                period === 'custom' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              {language === 'sw' ? 'Tarehe Nyingine' : 'Custom Dates'}
            </button>
          </div>

          {/* Custom Date Inputs if active */}
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
              />
              <span className="text-slate-400">hadi</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
              />
            </div>
          )}

          {/* Employee Selector */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {language === 'sw' ? 'Mfanyakazi:' : 'Staff Member:'}
            </span>
            <select
              value={selectedEmployeeId}
              onChange={e => setSelectedEmployeeId(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="all">
                {language === 'sw' ? '-- Wafanyakazi Wote (All) --' : '-- All Staff Members --'}
              </option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} (ID: {u.employeeNumber || '1000'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Optional Email Prompt Banner */}
        {showEmailPrompt && (
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border-b border-purple-200 dark:border-purple-800 flex items-center justify-between gap-3 text-xs print:hidden">
            <div className="flex items-center gap-2 flex-1">
              <Mail className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="font-semibold text-purple-900 dark:text-purple-200">
                {language === 'sw' ? 'Tuma ripoti hii kupitia Gmail kwenda:' : 'Email this report via Gmail to:'}
              </span>
              <input
                type="email"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                placeholder="colimbajr@gmail.com"
                className="px-3 py-1 text-xs rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex-1 max-w-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSendViaGmail}
                disabled={isSendingEmail}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow transition disabled:opacity-50"
              >
                {isSendingEmail ? 'Inatuma...' : 'Tuma Sasa'}
              </button>
              <button
                onClick={() => setShowEmailPrompt(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Email status alert */}
        {emailStatus && (
          <div
            className={`p-2.5 text-xs font-semibold flex items-center gap-2 print:hidden ${
              emailStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-b border-rose-200'
            }`}
          >
            {emailStatus.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            )}
            <span>{emailStatus.message}</span>
          </div>
        )}

        {/* PRINTABLE REPORT BODY */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-900 bg-white print:overflow-visible print:p-0 print:space-y-4">
          {/* Shop Header */}
          <div className="border-b-2 border-slate-900 pb-4 text-center">
            <h1 className="text-xl sm:text-2xl font-black tracking-wide text-slate-900 uppercase">
              {settings.name}
            </h1>
            <p className="text-xs font-bold text-slate-700 mt-1 uppercase tracking-wider">
              {settings.location}
            </p>
            <div className="text-xs text-slate-600 flex flex-wrap items-center justify-center gap-4 mt-1 font-medium">
              <span>Simu: {settings.phone1} / {settings.phone2}</span>
              <span>•</span>
              <span>Mkurugenzi: {settings.owner}</span>
            </div>
            <div className="mt-2 inline-block px-3 py-1 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded">
              RIPOTI RASMI YA MAUZO YA MFANYAKAZI
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Kipindi / Tarehe:</span>
              <span className="font-bold text-slate-900">{periodLabel}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Mfanyakazi (Cashier):</span>
              <span className="font-bold text-slate-900">
                {selectedUser ? `${selectedUser.name}` : 'Wafanyakazi Wote'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Namba ya Mfanyakazi (ID):</span>
              <span className="font-bold font-mono text-slate-900">
                {selectedUser ? `${selectedUser.employeeNumber || 'STAFF'}` : 'WOTE'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Tarehe ya Kuchapishwa:</span>
              <span className="font-bold text-slate-900 font-mono">
                {new Date().toLocaleString('en-GB', { timeZone: 'Africa/Dar_es_Salaam' })}
              </span>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block">Jumla ya Mauzo</span>
              <span className="text-base sm:text-lg font-black text-emerald-700">
                {formatTZS(reportStats.totalRevenue)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 uppercase block">Idadi ya Miamala</span>
              <span className="text-base sm:text-lg font-black text-slate-900">
                {reportStats.txCount}
              </span>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-[11px] font-bold text-blue-800 uppercase block">Vipande Vilivyouzwa</span>
              <span className="text-base sm:text-lg font-black text-blue-700">
                {reportStats.totalItemsQuantity}
              </span>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <span className="text-[11px] font-bold text-amber-800 uppercase block">Faida ya Mauzo</span>
              <span className="text-base sm:text-lg font-black text-amber-700">
                +{formatTZS(reportStats.grossProfit)}
              </span>
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
              1. Mgawanyo wa Njia za Malipo (Payment Breakdown)
            </h3>
            <table className="w-full text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 text-left">Njia ya Malipo</th>
                  <th className="py-2 px-3 text-right">Kiasi Kilichopokelewa (TZS)</th>
                  <th className="py-2 px-3 text-right">Asilimia (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="py-2 px-3">Fedha Taslimu (Cash)</td>
                  <td className="py-2 px-3 text-right font-bold">{formatTZS(reportStats.paymentMethods.cash)}</td>
                  <td className="py-2 px-3 text-right">
                    {reportStats.totalRevenue > 0
                      ? Math.round((reportStats.paymentMethods.cash / reportStats.totalRevenue) * 100)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3">M-Pesa (Vodacom)</td>
                  <td className="py-2 px-3 text-right font-bold text-rose-700">{formatTZS(reportStats.paymentMethods.mpesa)}</td>
                  <td className="py-2 px-3 text-right">
                    {reportStats.totalRevenue > 0
                      ? Math.round((reportStats.paymentMethods.mpesa / reportStats.totalRevenue) * 100)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3">Airtel Money</td>
                  <td className="py-2 px-3 text-right font-bold text-rose-600">{formatTZS(reportStats.paymentMethods.airtel_money)}</td>
                  <td className="py-2 px-3 text-right">
                    {reportStats.totalRevenue > 0
                      ? Math.round((reportStats.paymentMethods.airtel_money / reportStats.totalRevenue) * 100)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3">Tigo Pesa / Halopesa / Mixx</td>
                  <td className="py-2 px-3 text-right font-bold">{formatTZS(reportStats.paymentMethods.mixx)}</td>
                  <td className="py-2 px-3 text-right">
                    {reportStats.totalRevenue > 0
                      ? Math.round((reportStats.paymentMethods.mixx / reportStats.totalRevenue) * 100)
                      : 0}%
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3">Mkopo (Madeni ya Wateja)</td>
                  <td className="py-2 px-3 text-right font-bold text-amber-700">{formatTZS(reportStats.paymentMethods.credit)}</td>
                  <td className="py-2 px-3 text-right">
                    {reportStats.totalRevenue > 0
                      ? Math.round((reportStats.paymentMethods.credit / reportStats.totalRevenue) * 100)
                      : 0}%
                  </td>
                </tr>
                <tr className="bg-slate-100 font-black">
                  <td className="py-2 px-3 uppercase">Jumla ya Malipo Yote</td>
                  <td className="py-2 px-3 text-right text-emerald-800 text-sm font-black">
                    {formatTZS(reportStats.totalRevenue)}
                  </td>
                  <td className="py-2 px-3 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Product Sales Summary Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
              2. Orodha ya Bidhaa Zilizouzwa (Products Sold)
            </h3>
            {reportStats.products.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-500">
                Hakuna mauzo yaliyorekodiwa kwa kigezo hiki.
              </div>
            ) : (
              <table className="w-full text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 text-left">Na.</th>
                    <th className="py-2 px-3 text-left">Jina la Bidhaa</th>
                    <th className="py-2 px-3 text-right">Idadi</th>
                    <th className="py-2 px-3 text-right">Kipimo</th>
                    <th className="py-2 px-3 text-right">Jumla ya Mauzo (TZS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {reportStats.products.map((p, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : ''}>
                      <td className="py-1.5 px-3 font-mono">{idx + 1}</td>
                      <td className="py-1.5 px-3 font-bold text-slate-900">{p.name}</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold">{p.quantity}</td>
                      <td className="py-1.5 px-3 text-right text-slate-600">{p.unit}</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold">{formatTZS(p.revenue)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-black">
                    <td colSpan={2} className="py-2 px-3 uppercase text-right">Jumla Kuu:</td>
                    <td className="py-2 px-3 text-right font-mono font-bold">{reportStats.totalItemsQuantity}</td>
                    <td className="py-2 px-3"></td>
                    <td className="py-2 px-3 text-right font-mono font-black text-emerald-800 text-sm">
                      {formatTZS(reportStats.totalRevenue)}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Signatures & Official Validation */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-6">
              <span className="font-bold text-slate-700 block">Sahihi ya Mfanyakazi / Muuzaji:</span>
              <div className="border-b border-dashed border-slate-400 w-48 pt-6"></div>
              <div>
                <span className="text-slate-500 block">Jina: {selectedUser?.name || '__________________________'}</span>
                <span className="text-slate-500 block font-mono">ID: {selectedUser?.employeeNumber || '______'}</span>
              </div>
            </div>

            <div className="space-y-6 text-right">
              <span className="font-bold text-slate-700 block">Sahihi ya Super Admin / Msimamizi Mkuu:</span>
              <div className="border-b border-dashed border-slate-400 w-48 ml-auto pt-6"></div>
              <div>
                <span className="text-slate-500 block font-bold">AWILO SULEIMAN</span>
                <span className="text-slate-500 block">Mkurugenzi Mtendaji (Owner)</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-center pt-2 italic">
            SMART POINT VENTURE — Mfumo Mahususi wa Mauzo, Stoo na Uhasibu. Dar es Salaam, Tanzania.
          </div>
        </div>
      </div>
    </div>
  );
};
