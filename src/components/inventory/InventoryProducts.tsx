import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductCategory, ProductUnit, ProductVariant } from '../../types';
import {
  Search,
  Plus,
  Boxes,
  AlertTriangle,
  PackageX,
  Edit2,
  Sliders,
  CheckCircle2,
  Calendar,
  X,
  PlusCircle,
  Trash2,
} from 'lucide-react';

export const InventoryProducts: React.FC = () => {
  const {
    products,
    suppliers,
    addProduct,
    updateProduct,
    adjustStock,
    formatTZS,
    language,
    t,
    canAccess,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  // Stock adjust form
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<'adjustment' | 'damage' | 'expiry' | 'return'>('adjustment');
  const [adjustReason, setAdjustReason] = useState('');

  // Add / Edit Form State
  const initialFormState = {
    code: '',
    name: '',
    swahiliName: '',
    category: 'nafaka_na_unga' as ProductCategory,
    brand: '',
    unit: 'kg' as ProductUnit,
    buyingPrice: 0,
    sellingPrice: 0,
    minStockLevel: 20,
    currentStock: 50,
    supplierId: suppliers[0]?.id || '',
    supplierName: suppliers[0]?.name || '',
    barcode: '',
    expiryDate: '',
    variants: [] as ProductVariant[],
  };

  const [formData, setFormData] = useState(initialFormState);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.swahiliName.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.barcode.includes(q);

      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

      let matchesStatus = true;
      if (stockStatusFilter === 'low_stock') {
        matchesStatus = p.currentStock > 0 && p.currentStock <= p.minStockLevel;
      } else if (stockStatusFilter === 'out_of_stock') {
        matchesStatus = p.currentStock === 0;
      } else if (stockStatusFilter === 'active') {
        matchesStatus = p.currentStock > p.minStockLevel;
      }

      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, selectedCategory, stockStatusFilter]);

  // Overall Inventory Stats
  const stats = useMemo(() => {
    const totalItemsCount = products.length;
    const lowStockCount = products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStockLevel).length;
    const outOfStockCount = products.filter(p => p.currentStock === 0).length;
    const totalCostValue = products.reduce((sum, p) => sum + p.currentStock * p.buyingPrice, 0);
    const totalRetailValue = products.reduce((sum, p) => sum + p.currentStock * p.sellingPrice, 0);
    const potentialGrossProfit = totalRetailValue - totalCostValue;

    return {
      totalItemsCount,
      lowStockCount,
      outOfStockCount,
      totalCostValue,
      totalRetailValue,
      potentialGrossProfit,
    };
  }, [products]);

  // Handle open Edit Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      code: p.code,
      name: p.name,
      swahiliName: p.swahiliName,
      category: p.category,
      brand: p.brand,
      unit: p.unit,
      buyingPrice: p.buyingPrice,
      sellingPrice: p.sellingPrice,
      minStockLevel: p.minStockLevel,
      currentStock: p.currentStock,
      supplierId: p.supplierId,
      supplierName: p.supplierName,
      barcode: p.barcode,
      expiryDate: p.expiryDate || '',
      variants: p.variants || [],
    });
    setShowAddModal(true);
  };

  // Submit Product Add or Edit
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.sellingPrice <= 0) {
      alert(language === 'sw' ? 'Tafadhali jaza jina la bidhaa na bei ya kuuza!' : 'Please enter product name and selling price!');
      return;
    }

    const supplier = suppliers.find(s => s.id === formData.supplierId);
    const supplierName = supplier?.name || formData.supplierName || 'Said Salim Bakhresa & Co.';

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        ...formData,
        supplierName,
      });
    } else {
      addProduct({
        ...formData,
        supplierName,
        code: formData.code || `SPV-P${Math.floor(100 + Math.random() * 900)}`,
        barcode: formData.barcode || `${Math.floor(61611000000 + Math.random() * 99999)}`,
      });
    }

    setShowAddModal(false);
    setEditingProduct(null);
    setFormData(initialFormState);
  };

  // Submit Stock Adjustment
  const handleConfirmAdjust = () => {
    if (!adjustingProduct) return;
    if (adjustQty === 0) {
      alert(language === 'sw' ? 'Weka idadi ya kurekebisha (+ au -)' : 'Enter quantity to adjust');
      return;
    }
    if (!adjustReason.trim()) {
      alert(language === 'sw' ? 'Tafadhali weka sababu ya kurekebisha stoo!' : 'Please enter reason for stock adjustment!');
      return;
    }

    adjustStock(adjustingProduct.id, adjustQty, adjustType, adjustReason);
    setAdjustingProduct(null);
    setAdjustQty(0);
    setAdjustReason('');
  };

  // Variant addition helper
  const addVariantToForm = () => {
    const newVariant: ProductVariant = {
      id: `var-${Date.now()}`,
      name: 'Mfuko 5kg',
      quantityRatio: 5,
      unit: formData.unit,
      buyingPrice: formData.buyingPrice * 5,
      sellingPrice: formData.sellingPrice * 5,
    };
    setFormData({
      ...formData,
      variants: [...formData.variants, newVariant],
    });
  };

  const removeVariantFromForm = (idx: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Inventory Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Jumla ya Bidhaa</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {stats.totalItemsCount} {language === 'sw' ? 'aina' : 'items'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Thamani ya Kununua: <strong className="text-slate-800 dark:text-slate-200">{formatTZS(stats.totalCostValue)}</strong>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Thamani ya Kuuza (Retail)</span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatTZS(stats.totalRetailValue)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Tarajiwa ya Faida: <strong className="text-emerald-600 dark:text-emerald-400">+{formatTZS(stats.potentialGrossProfit)}</strong>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-amber-500 uppercase">{t.lowStockCount}</span>
          <div className="text-xl font-black text-amber-600 mt-1">
            {stats.lowStockCount} {language === 'sw' ? 'bidhaa' : 'items'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Chini ya kiwango cha tahadhari
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-rose-500 uppercase">{t.outOfStockCount}</span>
          <div className="text-xl font-black text-rose-600 mt-1">
            {stats.outOfStockCount} {language === 'sw' ? 'bidhaa' : 'items'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Haitoshi hata mteja 1 (Kilo 0)
          </div>
        </div>
      </div>

      {/* Action Bar & Filters */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={language === 'sw' ? 'Tafuta kwa jina, barcode au chapa...' : 'Search product, barcode...'}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="all">{t.allCategories}</option>
            <option value="nafaka_na_unga">{t.categoryNafaka}</option>
            <option value="chakula">{t.categoryChakula}</option>
            <option value="mafuta_na_sukari">{t.categoryMafuta}</option>
            <option value="vinywaji">{t.categoryVinywaji}</option>
            <option value="mahitaji_ya_nyumbani">{t.categoryMahitaji}</option>
            <option value="viungo_na_chumvi">{t.categoryViungo}</option>
          </select>

          {/* Stock status filter */}
          <select
            value={stockStatusFilter}
            onChange={e => setStockStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="all">{language === 'sw' ? '-- Hali Zote za Stoo --' : '-- All Stock Statuses --'}</option>
            <option value="active">{t.statusActive}</option>
            <option value="low_stock">{t.statusLowStock}</option>
            <option value="out_of_stock">{t.statusOutOfStock}</option>
          </select>
        </div>

        {/* Add Product Button */}
        {canAccess(['super_admin', 'manager']) && (
          <button
            onClick={() => {
              setEditingProduct(null);
              setFormData(initialFormState);
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>{t.quickAddProduct}</span>
          </button>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3.5">Code / Barcode</th>
                <th className="py-3 px-3.5">{t.productName}</th>
                <th className="py-3 px-3.5">{t.brand}</th>
                <th className="py-3 px-3.5 text-right">{t.buyingPrice}</th>
                <th className="py-3 px-3.5 text-right">{t.sellingPrice}</th>
                <th className="py-3 px-3.5 text-right text-emerald-600 dark:text-emerald-400">Faida / Unit</th>
                <th className="py-3 px-3.5 text-center">{t.currentStock}</th>
                <th className="py-3 px-3.5 text-center">{language === 'sw' ? 'Hali' : 'Status'}</th>
                {canAccess(['super_admin', 'manager']) && (
                  <th className="py-3 px-3.5 text-right">{language === 'sw' ? 'Vitendo' : 'Actions'}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    {language === 'sw' ? 'Hakuna bidhaa inayolingana na vigezo vyako' : 'No products found'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const isLow = p.currentStock > 0 && p.currentStock <= p.minStockLevel;
                  const isOut = p.currentStock === 0;
                  const unitProfit = p.sellingPrice - p.buyingPrice;
                  const marginPercent = p.sellingPrice > 0 ? ((unitProfit / p.sellingPrice) * 100).toFixed(0) : 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3.5 font-mono text-[11px] text-slate-500">
                        <div>{p.code}</div>
                        <div className="text-[10px] text-slate-400">{p.barcode}</div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                        {p.variants && p.variants.length > 0 && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            {p.variants.length} {language === 'sw' ? 'vipimo / vifungashio' : 'variants'}
                          </div>
                        )}
                        {p.expiryDate && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            <span>Expiry: {p.expiryDate}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 font-medium">
                        {p.brand}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono text-slate-600 dark:text-slate-300">
                        {formatTZS(p.buyingPrice)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatTZS(p.sellingPrice)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatTZS(unitProfit)} ({marginPercent}%)
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-bold">
                        <span className={isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-800 dark:text-slate-200'}>
                          {p.currentStock} {p.unit}
                        </span>
                        <div className="text-[10px] text-slate-400">Min: {p.minStockLevel}</div>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {isOut ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                            IMEISHA
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                            PUNGUFU
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                            IPO YA KUTOSHA
                          </span>
                        )}
                      </td>
                      {canAccess(['super_admin', 'manager']) && (
                        <td className="py-3 px-3.5 text-right space-x-1">
                          <button
                            onClick={() => {
                              setAdjustingProduct(p);
                              setAdjustQty(0);
                              setAdjustReason('');
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition"
                            title="Rekebisha Idadi ya Stoo"
                          >
                            <Sliders className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                            title="Hariri Bidhaa"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Add or Edit Product */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {editingProduct
                  ? `${language === 'sw' ? 'Hariri Bidhaa:' : 'Edit Product:'} ${editingProduct.name}`
                  : language === 'sw'
                  ? 'Ongeza Bidhaa Mpya Stoo'
                  : 'Add New Product to Store'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.productName} (English / Kiswahili):
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Mfano: Mchele Safi wa Kyela 5kg"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.category}:
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="nafaka_na_unga">{t.categoryNafaka}</option>
                    <option value="chakula">{t.categoryChakula}</option>
                    <option value="mafuta_na_sukari">{t.categoryMafuta}</option>
                    <option value="vinywaji">{t.categoryVinywaji}</option>
                    <option value="mahitaji_ya_nyumbani">{t.categoryMahitaji}</option>
                    <option value="viungo_na_chumvi">{t.categoryViungo}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.brand}:
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Mfano: Azam, Korie, Kilombero..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.unit}:
                  </label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value as ProductUnit })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="litre">Litre (L)</option>
                    <option value="piece">Piece (Kipande/Moja)</option>
                    <option value="packet">Packet (Pakiti)</option>
                    <option value="bottle">Bottle (Chupa)</option>
                    <option value="sack">Sack (Gunia)</option>
                    <option value="carton">Carton (Boksi)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.buyingPrice} (TZS):
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.buyingPrice}
                    onChange={e => setFormData({ ...formData, buyingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {t.sellingPrice} (TZS):
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.sellingPrice}
                    onChange={e => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.currentStock}:
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.currentStock}
                    onChange={e => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.minStockLevel} (Tahadhari):
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.minStockLevel}
                    onChange={e => setFormData({ ...formData, minStockLevel: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.supplier}:
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.expiryDate}:
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Multi-package Variant Manager (For flour/rice 1kg, 2kg, 5kg, 25kg, 50kg) */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {language === 'sw' ? 'Vipimo na Vifungashio vya Ziada (Variants)' : 'Product Package Variants'}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {language === 'sw' ? 'Mfano: Mchele kuuzwa kwa 1kg, 5kg, 25kg au Gunia 50kg' : 'Allow selling in 1kg, 5kg, 25kg bags'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addVariantToForm}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>{language === 'sw' ? 'Ongeza Kipimo' : 'Add Variant'}</span>
                  </button>
                </div>

                {formData.variants.map((v, idx) => (
                  <div key={v.id || idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-4 gap-2 items-center">
                    <input
                      type="text"
                      value={v.name}
                      onChange={e => {
                        const updated = [...formData.variants];
                        updated[idx].name = e.target.value;
                        setFormData({ ...formData, variants: updated });
                      }}
                      placeholder="Jina (mf. 5kg)"
                      className="px-2 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="number"
                      value={v.buyingPrice}
                      onChange={e => {
                        const updated = [...formData.variants];
                        updated[idx].buyingPrice = parseFloat(e.target.value) || 0;
                        setFormData({ ...formData, variants: updated });
                      }}
                      placeholder="Bei ya Kununua"
                      className="px-2 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                    <input
                      type="number"
                      value={v.sellingPrice}
                      onChange={e => {
                        const updated = [...formData.variants];
                        updated[idx].sellingPrice = parseFloat(e.target.value) || 0;
                        setFormData({ ...formData, variants: updated });
                      }}
                      placeholder="Bei ya Kuuza"
                      className="px-2 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariantFromForm(idx)}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold justify-self-end"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-800/50">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30"
                >
                  {editingProduct ? 'Hifadhi Mabadiliko' : 'Ongeza Bidhaa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Adjust Stock Quantity */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.adjustStock}: {adjustingProduct.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Idadi ya Sasa: <strong className="text-slate-800 dark:text-slate-200">{adjustingProduct.currentStock} {adjustingProduct.unit}</strong>
                </p>
              </div>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Aina ya Marekebisho:
                </label>
                <select
                  value={adjustType}
                  onChange={e => setAdjustType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="adjustment">Marekebisho ya Hesabu (Manual Recount)</option>
                  <option value="damage">Bidhaa Zilizoharibika (Damaged)</option>
                  <option value="expiry">Bidhaa Zilizokwisha Muda (Expired)</option>
                  <option value="return">Mzigo Uliorudishwa na Mteja (Return)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Kiasi cha Kuongeza au Kupunguza (Weka - kwa kupunguza):
                </label>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={e => setAdjustQty(parseFloat(e.target.value) || 0)}
                  placeholder="Mfano: +10 au -5"
                  className="w-full px-3 py-2 font-mono font-bold text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <span className="text-[11px] text-slate-500 block">
                  Stoo mpya itakuwa: <strong>{Math.max(0, adjustingProduct.currentStock + adjustQty)} {adjustingProduct.unit}</strong>
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Sababu ya Marekebisho (Inahitajika):
                </label>
                <textarea
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="Mfano: Gunia lilitoboka panya, hesabu ya mwisho wa wiki..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setAdjustingProduct(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Ghairi
              </button>
              <button
                onClick={handleConfirmAdjust}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow"
              >
                Thibitisha Marekebisho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
