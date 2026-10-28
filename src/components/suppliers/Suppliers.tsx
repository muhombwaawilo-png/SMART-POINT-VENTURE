import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Supplier } from '../../types';
import { Building2, Plus, Phone, MapPin, Search, X } from 'lucide-react';

export const Suppliers: React.FC = () => {
  const { suppliers, addSupplier, formatTZS, language, t } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [productsSupplied, setProductsSupplied] = useState('');
  const [contactPerson, setContactPerson] = useState('');

  const filtered = suppliers.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    return !q || s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q) || s.phone.includes(q);
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addSupplier({
      name: name.trim(),
      phone: phone.trim() || '0222000000',
      location: location.trim() || 'Dar es Salaam',
      productsSupplied: productsSupplied.split(',').map(s => s.trim()).filter(Boolean),
      contactPerson: contactPerson.trim() || undefined,
    });

    setShowAddModal(false);
    setName('');
    setPhone('');
    setLocation('');
    setProductsSupplied('');
    setContactPerson('');
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            {t.navSuppliers}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'sw'
              ? 'Wazalishaji na viwanda vinavyosambaza unga, mchele, sukari, mafuta na vinywaji'
              : 'Wholesalers and manufacturers directory with balance owed'}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>Sajili Msambazaji Mpya</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tafuta msambazaji..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Grid of Suppliers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(s => (
          <div
            key={s.id}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 text-xs"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{s.name}</h4>
                {s.contactPerson && (
                  <p className="text-[11px] text-slate-500">Mhusika: {s.contactPerson}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Deni Lililobaki:</span>
                <span className={`font-mono font-bold ${s.balanceOwed > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatTZS(s.balanceOwed)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-emerald-600" />
                <span className="font-mono">{s.phone}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400" />
                <span>{s.location}</span>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-[10px] text-slate-400 block mb-1">Bidhaa Zinazosambazwa:</span>
              <div className="flex flex-wrap gap-1">
                {s.productsSupplied.map((prod, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    {prod}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Sajili Msambazaji Mpya</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Jina la Kampuni / Msambazaji:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Mfano: Said Salim Bakhresa, MeTL..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Simu:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0222..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Eneo / Ofisi:</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Kariakoo, Tazara, Tazara Depot..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Mhusika wa Mauzo (Contact Person):</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  placeholder="Mfano: Juma Bakhresa Sales"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Bidhaa Wanazosambaza (Tenganisha kwa koma):</label>
                <input
                  type="text"
                  value={productsSupplied}
                  onChange={e => setProductsSupplied(e.target.value)}
                  placeholder="Unga, Sukari, Mafuta..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
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
                  Hifadhi Msambazaji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
