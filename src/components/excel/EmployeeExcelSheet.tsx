import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { PaymentMethod, ExcelSaleRow } from '../../types';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Calendar,
  User,
  DollarSign,
  Package,
  Download,
  Printer,
  Search,
  Filter,
  Layers,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Save,
  Check,
} from 'lucide-react';

export const EmployeeExcelSheet: React.FC = () => {
  const {
    currentUser,
    users,
    products,
    excelSalesRows,
    addExcelSaleRow,
    updateExcelSaleRow,
    deleteExcelSaleRow,
    commitExcelSales,
    formatTZS,
    language,
    t,
  } = useStore();

  const isSuperAdmin = currentUser.role === 'super_admin';
  const isManager = currentUser.role === 'manager';
  const canSelectOtherEmployees = isSuperAdmin || isManager;

  // Selected date filter (default today)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Selected employee filter (Super Admin can pick any employee or "all")
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    canSelectOtherEmployees ? 'all' : currentUser.id
  );

  // Quick-entry input fields
  const [newProductName, setNewProductName] = useState('');
  const [newSelectedProductId, setNewSelectedProductId] = useState('');
  const [newQuantity, setNewQuantity] = useState<number | ''>(1);
  const [newUnit, setNewUnit] = useState('piece');
  const [newUnitPrice, setNewUnitPrice] = useState<number | ''>('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>('cash');
  const [commitFeedback, setCommitFeedback] = useState<string | null>(null);

  // When a product is selected from dropdown, auto-fill unit & selling price
  const handleProductSelect = (productId: string) => {
    setNewSelectedProductId(productId);
    const prod = products.find(p => p.id === productId);
    if (prod) {
      setNewProductName(prod.name);
      setNewUnit(prod.unit);
      setNewUnitPrice(prod.sellingPrice);
    }
  };

  // Handle adding new row
  const handleAddRow = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newProductName.trim()) {
      alert('Tafadhali chagua au ingiza jina la bidhaa!');
      return;
    }
    const qty = Number(newQuantity) || 1;
    const price = Number(newUnitPrice) || 0;

    if (qty <= 0) {
      alert('Idadi ya bidhaa lazima iwe zaidi ya sifuri!');
      return;
    }
    if (price <= 0) {
      alert('Tafadhali weka bei sahihi ya bidhaa!');
      return;
    }

    addExcelSaleRow({
      productId: newSelectedProductId || undefined,
      productName: newProductName.trim(),
      quantity: qty,
      unit: newUnit,
      unitPrice: price,
      paymentMethod: newPaymentMethod,
      date: selectedDate,
    });

    // Reset quick inputs
    setNewProductName('');
    setNewSelectedProductId('');
    setNewQuantity(1);
    setNewUnitPrice('');
    setNewPaymentMethod('cash');
  };

  // Filter rows based on date & employee selection
  const filteredRows = useMemo(() => {
    return excelSalesRows.filter(r => {
      const matchDate = !selectedDate || r.date === selectedDate;
      const matchEmp =
        selectedEmployeeId === 'all'
          ? true
          : r.employeeId === selectedEmployeeId;
      return matchDate && matchEmp;
    });
  }, [excelSalesRows, selectedDate, selectedEmployeeId]);

  // Aggregate Calculations for this Excel Sheet
  const sheetStats = useMemo(() => {
    const totalItemsSold = filteredRows.reduce((sum, r) => sum + r.quantity, 0);
    const totalDailySales = filteredRows.reduce((sum, r) => sum + r.totalPrice, 0);
    const uncommittedRows = filteredRows.filter(r => !r.isCommitted);
    const uncommittedTotal = uncommittedRows.reduce((sum, r) => sum + r.totalPrice, 0);

    const cashSales = filteredRows.filter(r => r.paymentMethod === 'cash').reduce((sum, r) => sum + r.totalPrice, 0);
    const mobileMoneySales = filteredRows
      .filter(r => ['mpesa', 'airtel_money', 'mixx', 'tigopesa', 'halopesa'].includes(r.paymentMethod))
      .reduce((sum, r) => sum + r.totalPrice, 0);
    const creditSales = filteredRows.filter(r => r.paymentMethod === 'credit').reduce((sum, r) => sum + r.totalPrice, 0);

    return {
      rowCount: filteredRows.length,
      totalItemsSold,
      totalDailySales,
      uncommittedCount: uncommittedRows.length,
      uncommittedTotal,
      cashSales,
      mobileMoneySales,
      creditSales,
    };
  }, [filteredRows]);

  // Commit sales (transfer to main system)
  const handleCommitSales = () => {
    const targetEmp = selectedEmployeeId === 'all' ? currentUser.id : selectedEmployeeId;
    const res = commitExcelSales(targetEmp, selectedDate);
    setCommitFeedback(res.message);
    setTimeout(() => setCommitFeedback(null), 5000);
  };

  // Export to CSV / Excel file
  const handleExportCSV = () => {
    if (filteredRows.length === 0) {
      alert('Hakuna miamala ya kusafirisha.');
      return;
    }

    const headers = [
      'Namba ya Mstari',
      'Tarehe',
      'Saa',
      'Namba ya Mfanyakazi',
      'Jina la Mfanyakazi',
      'Bidhaa Iliyouzwa',
      'Idadi',
      'Kipimo',
      'Bei kwa Kila Moja (TZS)',
      'Jumla ya Mstari (TZS)',
      'Njia ya Malipo',
      'Imethibitishwa Stoo',
    ];

    const rows = filteredRows.map((r, idx) => [
      idx + 1,
      r.date,
      r.time,
      r.employeeNumber || 'N/A',
      `"${r.employeeName}"`,
      `"${r.productName}"`,
      r.quantity,
      r.unit,
      r.unitPrice,
      r.totalPrice,
      r.paymentMethod,
      r.isCommitted ? 'NDIYO' : 'BADO',
    ]);

    // Add summary row at bottom
    rows.push([]);
    rows.push([
      'JUMLA YA SIKU',
      selectedDate,
      '',
      '',
      '',
      'Jumla ya Idadi ya Bidhaa Zote:',
      sheetStats.totalItemsSold,
      '',
      'Jumla ya Mauzo ya Siku:',
      sheetStats.totalDailySales,
      '',
      '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `SmartPointVenture_Daftari_Excel_${selectedDate}_${selectedEmployeeId}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Excel Title */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-emerald-800/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight flex items-center gap-2">
                  <span>Daftari la Mauzo la Excel</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                    LIVE SPREADSHEET
                  </span>
                </h1>
                <p className="text-xs text-emerald-200/80">
                  SMART POINT VENTURE • Dar es Salaam • Kinyerezi – Kifuru – Mwanzo Mgumu
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl mt-1">
              {isSuperAdmin
                ? 'Kama Super Admin, unaweza kuona madaftari ya mauzo ya kila mfanyakazi, idadi ya bidhaa zilizouzwa, bei zake, na jumla ya mauzo ya siku nzima.'
                : `Akaunti ya Mfanyakazi: ${currentUser.name} (Namba ya Kazi: ${currentUser.employeeNumber || '1001'}). Ingiza bidhaa, idadi na bei—mfumo utahesabu moja kwa moja jumla ya kila mstari na jumla ya siku.`}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition flex items-center gap-1.5 shadow-sm"
              title="Pakua kama faili ya Excel / CSV"
            >
              <Download className="h-4 w-4 text-emerald-300" />
              <span>Pakua Excel (.CSV)</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition flex items-center gap-1.5 shadow-sm"
              title="Chapisha daftari hili"
            >
              <Printer className="h-4 w-4 text-teal-300" />
              <span>Chapisha</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar (Date & Employee Selector for Admin) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tarehe:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          {/* Employee Selector (Enabled for Admin / Manager) */}
          {canSelectOtherEmployees ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Mfanyakazi:
              </label>
              <select
                value={selectedEmployeeId}
                onChange={e => setSelectedEmployeeId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
              >
                <option value="all">Wafanyakazi Wote (All Employees)</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.employeeNumber || u.role})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <User className="h-3.5 w-3.5 text-emerald-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {currentUser.name}
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                ({currentUser.employeeNumber || 'STAFF'})
              </span>
            </div>
          )}
        </div>

        {/* Commitment status button */}
        {sheetStats.uncommittedCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Mstari {sheetStats.uncommittedCount} bado haijathibitishwa stoo
            </span>
            <button
              onClick={handleCommitSales}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1.5 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Thibitisha Kwenye Stoo</span>
            </button>
          </div>
        )}
      </div>

      {/* Success Notification after commit */}
      {commitFeedback && (
        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{commitFeedback}</span>
        </div>
      )}

      {/* SUMMARY CARDS (Required by user: Total quantity sold, Daily sales total) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Daily Total Sales */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Jumla ya Mauzo ya Siku</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {formatTZS(sheetStats.totalDailySales)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Tarehe: <span className="font-mono font-medium">{selectedDate}</span>
          </p>
        </div>

        {/* 2. Total Quantity of Items Sold */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Jumla ya Idadi ya Bidhaa</span>
            <Package className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white">
            {sheetStats.totalItemsSold.toLocaleString()} <span className="text-xs font-normal text-slate-400">vipimo</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Kutoka kwenye mistari <span className="font-bold">{sheetStats.rowCount}</span>
          </p>
        </div>

        {/* 3. Cash & Mobile Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Taslimu & Simu</span>
            <Smartphone className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-xs font-mono space-y-0.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Taslimu (Cash):</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{formatTZS(sheetStats.cashSales)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Simu (M-Pesa nk):</span>
              <span className="font-bold text-emerald-600">{formatTZS(sheetStats.mobileMoneySales)}</span>
            </div>
          </div>
        </div>

        {/* 4. Credit / Mikopo */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Mauzo ya Mikopo</span>
            <CreditCard className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-amber-600 dark:text-amber-400">
            {formatTZS(sheetStats.creditSales)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Madeni yaliyosajiliwa
          </p>
        </div>
      </div>

      {/* QUICK ENTRY ROW (Fast typing / rapid barcode or product selection) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Ingiza Mstari Mpya Kwenye Daftari (Excel Row Entry)</span>
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Mfumo unazidisha kiotomatiki: <strong>Idadi × Bei = Jumla ya Mstari</strong>
          </span>
        </div>

        <form onSubmit={handleAddRow} className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
          {/* Product Select / Input (4 cols) */}
          <div className="sm:col-span-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Bidhaa Iliyouzwa:
            </label>
            <div className="space-y-1">
              <select
                value={newSelectedProductId}
                onChange={e => handleProductSelect(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
              >
                <option value="">-- Chagua kutoka orodha ya duka --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unit}) - {formatTZS(p.sellingPrice)} (Stoo: {p.currentStock})
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newProductName}
                onChange={e => {
                  setNewProductName(e.target.value);
                  setNewSelectedProductId('');
                }}
                placeholder="Au andika jina la bidhaa hapa..."
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-[11px]"
              />
            </div>
          </div>

          {/* Quantity (2 cols) */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Idadi:
            </label>
            <input
              type="number"
              min="0.1"
              step="any"
              required
              value={newQuantity}
              onChange={e => setNewQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="1"
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
            />
            <select
              value={newUnit}
              onChange={e => setNewUnit(e.target.value)}
              className="w-full mt-1 px-1.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-300"
            >
              <option value="piece">Vipande (Pcs)</option>
              <option value="kg">Kilo (Kg)</option>
              <option value="packet">Pakiti (Pkt)</option>
              <option value="bottle">Chupa (Btl)</option>
              <option value="bunch">Bunda/Fungu</option>
              <option value="box">Katoni/Box</option>
            </select>
          </div>

          {/* Price Per Item (2 cols) */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Bei kwa Kila Moja (TZS):
            </label>
            <input
              type="number"
              min="1"
              required
              value={newUnitPrice}
              onChange={e => setNewUnitPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="Bei ya kuuzia"
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
            />
            <div className="text-[10px] text-slate-400 mt-1 truncate">
              Jumla: <strong className="text-emerald-600 dark:text-emerald-400">{formatTZS((Number(newQuantity) || 0) * (Number(newUnitPrice) || 0))}</strong>
            </div>
          </div>

          {/* Payment Method (2 cols) */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Malipo:
            </label>
            <select
              value={newPaymentMethod}
              onChange={e => setNewPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
            >
              <option value="cash">Taslimu (Cash)</option>
              <option value="mpesa">M-Pesa</option>
              <option value="airtel_money">Airtel Money</option>
              <option value="mixx">Mixx by Yas</option>
              <option value="tigopesa">Tigo Pesa</option>
              <option value="halopesa">HaloPesa</option>
              <option value="bank">Benki</option>
              <option value="credit">Mkopo (Deni)</option>
            </select>
          </div>

          {/* Submit Button (2 cols) */}
          <div className="sm:col-span-2 flex flex-col justify-end">
            <button
              type="submit"
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Ongeza Mstari</span>
            </button>
          </div>
        </form>

        {/* Quick Product Chips for Rapid 1-Click Fill */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-400 font-semibold shrink-0">Vyakula maarufu:</span>
          {products.slice(0, 6).map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleProductSelect(p.id)}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 transition font-medium flex items-center gap-1"
            >
              <span>{p.name}</span>
              <span className="font-mono text-[10px] text-slate-400">({formatTZS(p.sellingPrice)})</span>
            </button>
          ))}
        </div>
      </div>

      {/* SPREADSHEET TABLE (Styled as authentic Excel / Google Sheets grid) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Excel Header Toolbar */}
        <div className="bg-emerald-700 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Jedwali la Mauzo la Excel ({selectedDate})</span>
            <span className="text-[11px] font-normal text-emerald-100">
              — Mistari {filteredRows.length} imerekodiwa
            </span>
          </div>
          <div className="font-mono text-emerald-100 text-xs">
            JUMLA: {formatTZS(sheetStats.totalDailySales)}
          </div>
        </div>

        {/* Scrollable Spreadsheet Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-700 tracking-wider">
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 w-12 text-center">#</th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 w-20">Saa</th>
                {canSelectOtherEmployees && (
                  <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Mfanyakazi</th>
                )}
                <th className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-700 min-w-[180px]">
                  Bidhaa Iliyouzwa
                </th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 w-24 text-right">
                  Idadi
                </th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 w-20">
                  Kipimo
                </th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 w-32 text-right">
                  Bei kwa Kila Moja
                </th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 w-36 text-right bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                  Jumla ya Mstari
                </th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 w-28">
                  Njia ya Malipo
                </th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 w-24 text-center">
                  Hali
                </th>
                <th className="py-2.5 px-3 w-16 text-center">Vitendo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={canSelectOtherEmployees ? 11 : 10}
                    className="py-12 text-center text-slate-400 dark:text-slate-500"
                  >
                    <FileSpreadsheet className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-bold text-sm text-slate-600 dark:text-slate-400">
                      Hakuna mistari ya mauzo iliyorekodiwa tarehe hii.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Tumia sehemu ya juu kuingiza bidhaa iliyouzwa, idadi na bei.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => {
                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group font-sans"
                    >
                      {/* Row number */}
                      <td className="py-2 px-3 border-r border-slate-100 dark:border-slate-800 text-center font-mono text-slate-400 text-[11px] bg-slate-50/50 dark:bg-slate-800/20">
                        {index + 1}
                      </td>

                      {/* Time */}
                      <td className="py-2 px-3 border-r border-slate-100 dark:border-slate-800 font-mono text-[11px] text-slate-500">
                        {row.time}
                      </td>

                      {/* Employee (for admin view) */}
                      {canSelectOtherEmployees && (
                        <td className="py-2 px-3 border-r border-slate-100 dark:border-slate-800">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {row.employeeName}
                          </span>
                          <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                            {row.employeeNumber || 'STAFF'}
                          </span>
                        </td>
                      )}

                      {/* Product Name */}
                      <td className="py-2 px-4 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                        {row.productName}
                      </td>

                      {/* Quantity */}
                      <td className="py-2 px-3 border-r border-slate-100 dark:border-slate-800 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        {row.quantity}
                      </td>

                      {/* Unit */}
                      <td className="py-2 px-3 border-r border-slate-100 dark:border-slate-800 text-slate-500 text-[11px] capitalize">
                        {row.unit}
                      </td>

                      {/* Unit Price */}
                      <td className="py-2 px-3 border-r border-slate-100 dark:border-slate-800 text-right font-mono text-slate-700 dark:text-slate-300">
                        {formatTZS(row.unitPrice)}
                      </td>

                      {/* Row Total = Quantity * UnitPrice */}
                      <td className="py-2 px-3 border-r border-slate-100 dark:border-slate-800 text-right font-mono font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
                        {formatTZS(row.totalPrice)}
                      </td>

                      {/* Payment Method */}
                      <td className="py-2 px-3 border-r border-slate-100 dark:border-slate-800">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.paymentMethod === 'cash'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              : row.paymentMethod === 'credit'
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {row.paymentMethod.toUpperCase()}
                        </span>
                      </td>

                      {/* Committed Status */}
                      <td className="py-2 px-3 border-r border-slate-100 dark:border-slate-800 text-center">
                        {row.isCommitted ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <Check className="h-3 w-3" />
                            <span>Imethibitishwa</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-500">
                            Bado
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Una uhakika unataka kufuta mstari wa "${row.productName}"?`)) {
                              deleteExcelSaleRow(row.id);
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Futa mstari huu"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* SPREADSHEET FOOTER (Required running totals) */}
            {filteredRows.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700 font-extrabold text-xs">
                  <td
                    colSpan={canSelectOtherEmployees ? 4 : 3}
                    className="py-3 px-4 text-slate-800 dark:text-slate-100 uppercase tracking-wider text-right"
                  >
                    JUMLA KUU ZA SIKU ({selectedDate}):
                  </td>

                  {/* Total Quantity Across All Rows */}
                  <td className="py-3 px-3 text-right font-mono text-slate-900 dark:text-white border-r border-slate-300 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-semibold">Jumla ya Idadi</span>
                    <span className="text-sm font-black">{sheetStats.totalItemsSold.toLocaleString()}</span>
                  </td>

                  <td className="py-3 px-3 border-r border-slate-300 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400">vipimo</span>
                  </td>

                  <td className="py-3 px-3 border-r border-slate-300 dark:border-slate-700 text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">Wastani / Bidhaa</span>
                    <span className="font-mono text-xs">
                      {formatTZS(
                        sheetStats.totalItemsSold > 0
                          ? Math.round(sheetStats.totalDailySales / sheetStats.totalItemsSold)
                          : 0
                      )}
                    </span>
                  </td>

                  {/* Total Daily Sales */}
                  <td className="py-3 px-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/40 border-r border-slate-300 dark:border-slate-700 text-sm">
                    <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block font-semibold">
                      Jumla ya Mauzo ya Siku
                    </span>
                    <span>{formatTZS(sheetStats.totalDailySales)}</span>
                  </td>

                  <td colSpan={3} className="py-3 px-3 text-center text-slate-400 text-[10px]">
                    SMART POINT VENTURE SPREADSHEET
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
