import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Purchase, PaymentMethod } from '../../types';
import {
  Truck,
  Plus,
  Search,
  Calendar,
  Building2,
  Package,
  CheckCircle2,
  Clock,
  X,
  Trash2,
} from 'lucide-react';

export const Purchases: React.FC = () => {
  const {
    purchases,
    suppliers,
    products,
    recordPurchase,
    currentUser,
    formatTZS,
    language,
    t,
  } = useStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Items to purchase
  interface ItemRow {
    productId: string;
    quantity: number;
    unitCost: number;
  }
  const [itemsRows, setItemsRows] = useState<ItemRow[]>([
    {
      productId: products[0]?.id || '',
      quantity: 10,
      unitCost: products[0]?.buyingPrice || 2000,
    },
  ]);

  const handleAddItemRow = () => {
    setItemsRows([
      ...itemsRows,
      {
        productId: products[0]?.id || '',
        quantity: 5,
        unitCost: products[0]?.buyingPrice || 2000,
      },
    ]);
  };

  const handleRemoveItemRow = (idx: number) => {
    setItemsRows(itemsRows.filter((_, i) => i !== idx));
  };

  const calculatedTotalCost = itemsRows.reduce((sum, row) => sum + row.quantity * row.unitCost, 0);

  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemsRows.length === 0 || calculatedTotalCost <= 0) {
      alert('Weka angalau bidhaa 1 na kiasi halali!');
      return;
    }

    const supplier = suppliers.find(s => s.id === supplierId);
    const supplierName = supplier?.name || 'Msambazaji';
    const parsedPaid = parseFloat(amountPaid) || calculatedTotalCost;

    let paymentStatus: 'paid' | 'partial' | 'credit' = 'paid';
    if (parsedPaid === 0) {
      paymentStatus = 'credit';
    } else if (parsedPaid < calculatedTotalCost) {
      paymentStatus = 'partial';
    }

    const preparedItems = itemsRows.map(row => {
      const prod = products.find(p => p.id === row.productId);
      return {
        productId: row.productId,
        productName: prod?.name || 'Bidhaa',
        quantity: row.quantity,
        unitCost: row.unitCost,
        totalCost: row.quantity * row.unitCost,
      };
    });

    recordPurchase({
      supplierId,
      supplierName,
      invoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
      items: preparedItems,
      totalCost: calculatedTotalCost,
      amountPaid: parsedPaid,
      paymentMethod,
      paymentStatus,
      notes,
    });

    setShowAddModal(false);
    setInvoiceNumber('');
    setAmountPaid('');
    setNotes('');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            {t.navPurchases}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'sw'
              ? 'Kuingiza mizigo mipya stoo toka kwa wasambazaji (Bakhresa, MeTL, Murzah, n.k)'
              : 'Record incoming inventory and supplier invoice purchases'}
          </p>
        </div>

        <button
          onClick={() => {
            setAmountPaid(String(calculatedTotalCost));
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>{t.recordPurchase}</span>
        </button>
      </div>

      {/* Purchases List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3.5">Ankara / Invoice</th>
                <th className="py-3 px-3.5">Tarehe</th>
                <th className="py-3 px-3.5">Msambazaji</th>
                <th className="py-3 px-3.5">Bidhaa Zilizopokelewa</th>
                <th className="py-3 px-3.5 text-right">Gharama Kamili</th>
                <th className="py-3 px-3.5 text-right">Kiasi Kilicholipwa</th>
                <th className="py-3 px-3.5 text-right">Deni Lililobaki</th>
                <th className="py-3 px-3.5 text-center">Hali</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Hakuna manunuzi yaliyorekodiwa bado
                  </td>
                </tr>
              ) : (
                purchases.map(pur => (
                  <tr key={pur.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3.5 font-bold font-mono text-slate-900 dark:text-white">
                      {pur.invoiceNumber}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 font-mono">
                      {pur.date}
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {pur.supplierName}
                    </td>
                    <td className="py-3 px-3.5 max-w-xs truncate text-slate-600 dark:text-slate-400">
                      {pur.items.map(it => `${it.productName} (${it.quantity})`).join(', ')}
                    </td>
                    <td className="py-3 px-3.5 text-right font-black font-mono text-slate-900 dark:text-white">
                      {formatTZS(pur.totalCost)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-emerald-600 font-bold">
                      {formatTZS(pur.amountPaid)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-rose-600 font-bold">
                      {pur.balanceOwed > 0 ? formatTZS(pur.balanceOwed) : 'TZS 0'}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pur.paymentStatus === 'paid'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : pur.paymentStatus === 'partial'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {pur.paymentStatus === 'paid' ? 'IMELIPWA YOTE' : pur.paymentStatus === 'partial' ? 'NUSU' : 'HAIJALIPWA'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Purchase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-in fade-in flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t.recordPurchase}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPurchase} className="space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">{t.supplier}:</label>
                  <select
                    value={supplierId}
                    onChange={e => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">{t.invoiceNumber}:</label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    placeholder="Mfano: INV-BAKH-9021"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Items Table in Purchase */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Bidhaa Zilizopokelewa:</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Ongeza Bidhaa</span>
                  </button>
                </div>

                {itemsRows.map((row, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                    <select
                      value={row.productId}
                      onChange={e => {
                        const updated = [...itemsRows];
                        const prod = products.find(p => p.id === e.target.value);
                        updated[idx].productId = e.target.value;
                        if (prod) updated[idx].unitCost = prod.buyingPrice;
                        setItemsRows(updated);
                      }}
                      className="sm:col-span-2 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.unit})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      value={row.quantity}
                      onChange={e => {
                        const updated = [...itemsRows];
                        updated[idx].quantity = parseFloat(e.target.value) || 0;
                        setItemsRows(updated);
                      }}
                      placeholder="Idadi"
                      className="px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                    />

                    <div className="flex items-center justify-between gap-1">
                      <input
                        type="number"
                        value={row.unitCost}
                        onChange={e => {
                          const updated = [...itemsRows];
                          updated[idx].unitCost = parseFloat(e.target.value) || 0;
                          setItemsRows(updated);
                        }}
                        placeholder="Bei ya Kununua"
                        className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                      />
                      {itemsRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total & Payment details */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                  <span>Jumla ya Gharama ya Mzigo:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    {formatTZS(calculatedTotalCost)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Kiasi Kilicholipwa (TZS):</label>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={e => setAmountPaid(e.target.value)}
                      placeholder={String(calculatedTotalCost)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Njia ya Malipo:</label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="bank">Benki (NMB/CRDB)</option>
                      <option value="cash">Cash</option>
                      <option value="mpesa">M-Pesa</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow"
                >
                  Thibitisha & Ongeza Stoo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
