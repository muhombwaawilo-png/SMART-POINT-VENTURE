import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Product,
  SaleItem,
  PaymentMethod,
  ProductCategory,
  Sale,
  ProductVariant,
} from '../../types';
import {
  Search,
  Barcode,
  Trash2,
  Plus,
  Minus,
  Check,
  Printer,
  Copy,
  CreditCard,
  Phone,
  User,
  ShoppingBag,
  Layers,
  ArrowRight,
  X,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export const POS: React.FC = () => {
  const {
    products,
    customers,
    currentUser,
    settings,
    recordSale,
    formatTZS,
    language,
    t,
  } = useStore();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  // Cart state
  interface CartItem extends SaleItem {
    baseProduct: Product;
  }
  const [cart, setCart] = useState<CartItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);

  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [customCustomerPhone, setCustomCustomerPhone] = useState('');
  const [creditDueDate, setCreditDueDate] = useState('');
  const [saleNotes, setSaleNotes] = useState('');

  // Completed Receipt Modal State
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Category mapping
  const categories: { id: string; label: string }[] = [
    { id: 'all', label: t.allCategories },
    { id: 'nafaka_na_unga', label: t.categoryNafaka },
    { id: 'chakula', label: t.categoryChakula },
    { id: 'mafuta_na_sukari', label: t.categoryMafuta },
    { id: 'vinywaji', label: t.categoryVinywaji },
    { id: 'mahitaji_ya_nyumbani', label: t.categoryMahitaji },
    { id: 'viungo_na_chumvi', label: t.categoryViungo },
  ];

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.swahiliName.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.code.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Add product to cart (or variant)
  const addToCart = (product: Product, variant?: ProductVariant) => {
    if (product.currentStock <= 0) {
      alert(`Bidhaa "${product.name}" imeisha stoo!`);
      return;
    }

    setCart(prevCart => {
      const variantKey = variant ? variant.id : 'base';
      const existingIndex = prevCart.findIndex(
        item => item.productId === product.id && (item.variantId || 'base') === variantKey
      );

      const unitPrice = variant ? variant.sellingPrice : product.sellingPrice;
      const unitCost = variant ? variant.buyingPrice : product.buyingPrice;
      const unitName = variant ? variant.unit : product.unit;
      const displayName = variant ? `${product.name} (${variant.name})` : product.name;

      if (existingIndex >= 0) {
        const item = prevCart[existingIndex];
        const newQty = item.quantity + 1;
        const newTotalPrice = newQty * item.unitPrice - item.discount;
        const newTotalCost = newQty * item.unitCost;

        const updated = [...prevCart];
        updated[existingIndex] = {
          ...item,
          quantity: newQty,
          totalPrice: newTotalPrice,
          totalCost: newTotalCost,
          grossProfit: newTotalPrice - newTotalCost,
        };
        return updated;
      } else {
        const item: CartItem = {
          productId: product.id,
          productName: displayName,
          quantity: 1,
          unit: unitName,
          unitCost,
          unitPrice,
          discount: 0,
          totalPrice: unitPrice,
          totalCost: unitCost,
          grossProfit: unitPrice - unitCost,
          variantId: variant?.id,
          variantName: variant?.name,
          baseProduct: product,
        };
        return [...prevCart, item];
      }
    });
  };

  // Update item quantity in cart
  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeItem(index);
      return;
    }

    setCart(prev => {
      const updated = [...prev];
      const item = updated[index];
      const newTotalPrice = newQty * item.unitPrice - item.discount;
      const newTotalCost = newQty * item.unitCost;

      updated[index] = {
        ...item,
        quantity: newQty,
        totalPrice: newTotalPrice,
        totalCost: newTotalCost,
        grossProfit: newTotalPrice - newTotalCost,
      };
      return updated;
    });
  };

  // Remove item from cart
  const removeItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Clear cart
  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm(language === 'sw' ? 'Je, una uhakika unataka kufuta kikapu chote?' : 'Clear all items from cart?')) {
      setCart([]);
      setGlobalDiscount(0);
    }
  };

  // Barcode handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;
    const found = products.find(p => p.barcode === barcodeInput.trim());
    if (found) {
      addToCart(found);
      setBarcodeInput('');
    } else {
      alert(`Hakuna bidhaa yenye barcode "${barcodeInput}"`);
    }
  };

  // Calculate Subtotal & Totals
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [cart]);

  const totalDiscount = useMemo(() => {
    const itemDiscounts = cart.reduce((sum, item) => sum + (item.discount || 0), 0);
    return itemDiscounts + (globalDiscount || 0);
  }, [cart, globalDiscount]);

  const totalPayable = Math.max(0, subtotal - totalDiscount);

  // Quick tender amount click
  const setQuickAmount = (amount: number) => {
    setAmountReceived(String(amount));
  };

  const parsedReceived = parseFloat(amountReceived) || 0;
  const changeToReturn = paymentMethod === 'cash' ? Math.max(0, parsedReceived - totalPayable) : 0;

  // Finalize Sale
  const handleCompleteSale = () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'cash' && parsedReceived < totalPayable) {
      alert(
        language === 'sw'
          ? `Kiasi kilichopokelewa (${formatTZS(parsedReceived)}) ni pungufu ya jumla (${formatTZS(totalPayable)})!`
          : `Received amount is less than total payable!`
      );
      return;
    }

    if (paymentMethod === 'credit') {
      if (!selectedCustomerId && !customCustomerName) {
        alert(
          language === 'sw'
            ? 'Tafadhali chagua au weka jina la mteja wa mkopo!'
            : 'Please select or enter customer name for credit sale!'
        );
        return;
      }
    }

    let customerName = customCustomerName;
    let customerPhone = customCustomerPhone;
    if (selectedCustomerId) {
      const c = customers.find(cust => cust.id === selectedCustomerId);
      if (c) {
        customerName = c.name;
        customerPhone = c.phone;
      }
    }

    const sale = recordSale({
      items: cart,
      subtotal,
      discount: totalDiscount,
      totalAmount: totalPayable,
      paymentMethod,
      paymentRef,
      amountReceived: paymentMethod === 'cash' ? parsedReceived : totalPayable,
      changeGiven: changeToReturn,
      customerId: selectedCustomerId || undefined,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      isCredit: paymentMethod === 'credit',
      creditDue: creditDueDate || undefined,
      notes: saleNotes || undefined,
    });

    setCompletedSale(sale);
    setShowCheckoutModal(false);
    setShowReceiptModal(true);

    // Reset cart
    setCart([]);
    setGlobalDiscount(0);
    setAmountReceived('');
    setPaymentRef('');
    setSaleNotes('');
  };

  // Receipt print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-4 overflow-hidden">
      {/* LEFT: Product Catalog & Search (60% width on desktop) */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Top Search & Barcode Bar */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t.searchProduct}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Quick Barcode Scan Input */}
            <form onSubmit={handleBarcodeSubmit} className="hidden sm:flex items-center gap-1">
              <div className="relative w-36">
                <Barcode className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  placeholder="Barcode..."
                  className="w-full pl-8 pr-2 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              >
                Enter
              </button>
            </form>
          </div>

          {/* Categories Tab Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingBag className="h-10 w-10 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
              <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                {language === 'sw' ? 'Hakuna bidhaa iliyopatikana' : 'No products found'}
              </p>
              <p className="text-xs text-slate-400">
                {language === 'sw' ? 'Jaribu kubadili jina au kategoria' : 'Try another search query or category'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {filteredProducts.map(product => {
                const isOutOfStock = product.currentStock <= 0;
                const isLowStock = product.currentStock > 0 && product.currentStock <= product.minStockLevel;

                return (
                  <div
                    key={product.id}
                    className={`rounded-xl border p-3 flex flex-col justify-between transition group relative ${
                      isOutOfStock
                        ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:shadow-md cursor-pointer'
                    }`}
                  >
                    <div>
                      {/* Brand & Stock count */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="truncate uppercase font-medium">{product.brand}</span>
                        <span
                          className={`font-semibold ${
                            isOutOfStock
                              ? 'text-rose-500'
                              : isLowStock
                              ? 'text-amber-500 font-bold'
                              : 'text-slate-500'
                          }`}
                        >
                          {product.currentStock} {product.unit}
                        </span>
                      </div>

                      {/* Product Name */}
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        {product.name}
                      </h4>
                    </div>

                    <div className="mt-3">
                      {/* Price */}
                      <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatTZS(product.sellingPrice)}
                        <span className="text-[10px] font-normal text-slate-400 ml-1">/{product.unit}</span>
                      </div>

                      {/* Variants or Quick Add Button */}
                      {product.variants && product.variants.length > 0 ? (
                        <div className="mt-2 space-y-1">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                            {language === 'sw' ? 'Vipimo:' : 'Sizes:'}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {product.variants.map(v => (
                              <button
                                key={v.id}
                                disabled={isOutOfStock}
                                onClick={e => {
                                  e.stopPropagation();
                                  addToCart(product, v);
                                }}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                                title={`Nunua ${v.name} kwa ${formatTZS(v.sellingPrice)}`}
                              >
                                {v.name.split(' ')[0]} ({formatTZS(v.sellingPrice)})
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <button
                          disabled={isOutOfStock}
                          onClick={() => addToCart(product)}
                          className={`w-full mt-2 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${
                            isOutOfStock
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-200 dark:border-emerald-800/40'
                          }`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>{language === 'sw' ? 'Weka Kikapuni' : 'Add to Cart'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Active Shopping Cart & Checkout (40% width on desktop) */}
      <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Cart Header */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {language === 'sw' ? 'Kikapu cha Mauzo' : 'Customer Cart'}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {cart.reduce((sum, i) => sum + i.quantity, 0)}
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t.clearCart}</span>
            </button>
          )}
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100 dark:divide-slate-800/60">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                <ShoppingBag className="h-6 w-6 stroke-[1.5]" />
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{t.cartEmpty}</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">{t.cartEmptyDesc}</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {item.productName}
                  </h5>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{formatTZS(item.unitPrice)}</span>
                    <span>×</span>
                    <span>{item.quantity} {item.unit}</span>
                  </div>
                </div>

                {/* Quantity steppers */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                    <button
                      onClick={() => updateQuantity(idx, item.quantity - 1)}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-2 text-xs font-bold font-mono text-slate-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(idx, item.quantity + 1)}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Total price & remove */}
                  <div className="text-right min-w-[70px]">
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {formatTZS(item.totalPrice)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(idx)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded transition"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary & Checkout Trigger */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>{t.subtotal}:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{formatTZS(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>{t.discount}:</span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              {totalDiscount > 0 ? `-${formatTZS(totalDiscount)}` : 'TZS 0'}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900 dark:text-white">{t.totalPayable}:</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {formatTZS(totalPayable)}
            </span>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => {
              setAmountReceived(String(totalPayable));
              setShowCheckoutModal(true);
            }}
            className={`w-full py-3 rounded-xl font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition ${
              cart.length === 0
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 shadow-emerald-600/30'
            }`}
          >
            <span>{t.completeSale}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* MODAL 1: Checkout & Payment Selection */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'sw' ? 'Kamilisha Malipo ya Mauzo' : 'Complete Sale Payment'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'sw' ? 'Chagua njia ya malipo na thibitisha pesa' : 'Select payment method and confirm tender'}
                </p>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Total Payable Prominent Card */}
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase">
                    {t.totalPayable}
                  </span>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                    {formatTZS(totalPayable)}
                  </div>
                </div>
                <div className="text-right text-xs text-emerald-800 dark:text-emerald-300">
                  <div>{cart.length} {language === 'sw' ? 'aina za bidhaa' : 'items'}</div>
                  <div className="font-mono">{currentUser.name}</div>
                </div>
              </div>

              {/* Payment Method Selector Grid */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {t.paymentMethod}:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'cash', label: 'Cash (Taslimu)', color: 'text-emerald-600' },
                    { id: 'mpesa', label: 'M-Pesa (Lipa)', color: 'text-red-600' },
                    { id: 'airtel_money', label: 'Airtel Money', color: 'text-rose-600' },
                    { id: 'mixx', label: 'Mixx by Yas', color: 'text-indigo-600' },
                    { id: 'tigopesa', label: 'Tigo Pesa', color: 'text-blue-600' },
                    { id: 'halopesa', label: 'HaloPesa', color: 'text-orange-600' },
                    { id: 'bank', label: 'Benki (NMB/CRDB)', color: 'text-sky-600' },
                    { id: 'credit', label: 'Mkopo (Credit)', color: 'text-amber-600' },
                  ].map(pm => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                        paymentMethod === pm.id
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash specific: Amount received & quick tender */}
              {paymentMethod === 'cash' && (
                <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t.amountReceived} (TZS):
                    </label>
                    <button
                      type="button"
                      onClick={() => setAmountReceived(String(totalPayable))}
                      className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                    >
                      {t.exactAmount}
                    </button>
                  </div>
                  <input
                    type="number"
                    value={amountReceived}
                    onChange={e => setAmountReceived(e.target.value)}
                    placeholder="Weka kiasi kilichopokelewa..."
                    className="w-full px-3 py-2 text-lg font-black font-mono rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  {/* Quick Tender shortcuts */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[5000, 10000, 20000, 50000, 100000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setQuickAmount(amt)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition"
                      >
                        {amt.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  {/* Change Calculation */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t.changeGiven}:</span>
                    <span
                      className={`text-base font-black font-mono ${
                        changeToReturn > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {formatTZS(changeToReturn)}
                    </span>
                  </div>
                </div>
              )}

              {/* Mobile Money or Bank: Reference input */}
              {['mpesa', 'airtel_money', 'mixx', 'tigopesa', 'halopesa', 'bank'].includes(paymentMethod) && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {language === 'sw' ? 'Namba ya Muamala / Ref Code (Hiari):' : 'Transaction Ref #:'}
                  </label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                    placeholder="Mfano: QJD918204K..."
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Customer selection for Credit or Loyalty */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>{paymentMethod === 'credit' ? `${t.customerName} (Inahitajika kwa Mkopo):` : `${t.customerName}:`}</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={selectedCustomerId}
                    onChange={e => {
                      setSelectedCustomerId(e.target.value);
                      if (e.target.value) {
                        const cust = customers.find(c => c.id === e.target.value);
                        if (cust) {
                          setCustomCustomerName(cust.name);
                          setCustomCustomerPhone(cust.phone);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="">{language === 'sw' ? '-- Chagua Mteja Aliyesajiliwa --' : '-- Existing Customer --'}</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) - Deni: {formatTZS(c.totalDebt)}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={customCustomerName}
                    onChange={e => {
                      setCustomCustomerName(e.target.value);
                      setSelectedCustomerId('');
                    }}
                    placeholder={language === 'sw' ? 'Au andika jina la mteja...' : 'Or type customer name...'}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {paymentMethod === 'credit' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-700 dark:text-amber-400 block">
                      {t.creditDueDate}:
                    </label>
                    <input
                      type="date"
                      value={creditDueDate}
                      onChange={e => setCreditDueDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Ghairi
              </button>
              <button
                type="button"
                onClick={handleCompleteSale}
                className="px-6 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                <span>{language === 'sw' ? 'Thibitisha & Chapisha Risiti' : 'Confirm & Print Receipt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Completed Thermal Receipt View & Print */}
      {showReceiptModal && completedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[95vh]">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <Check className="h-4 w-4" />
                <span>{language === 'sw' ? 'Mauzo Yamekamilika!' : 'Sale Completed!'}</span>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Printable Thermal Receipt Container */}
            <div
              id="printable-receipt"
              className="p-5 font-mono text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 overflow-y-auto space-y-3"
            >
              {/* Receipt Header */}
              <div className="text-center space-y-1 border-b border-dashed border-slate-300 dark:border-slate-700 pb-3">
                <h2 className="text-base font-black tracking-tight uppercase">
                  {settings.name}
                </h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  {settings.location}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Tel: {settings.phone1} / {settings.phone2}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Mkurugenzi: {settings.owner}
                </p>
              </div>

              {/* Transaction Metadata */}
              <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-300 dark:border-slate-700 pb-2">
                <div className="flex justify-between">
                  <span>Risiti:</span>
                  <span className="font-bold">{completedSale.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tarehe:</span>
                  <span>{completedSale.date} {completedSale.time}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mhudumu:</span>
                  <span>{completedSale.employeeName}</span>
                </div>
                {completedSale.customerName && (
                  <div className="flex justify-between">
                    <span>Mteja:</span>
                    <span>{completedSale.customerName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Malipo:</span>
                  <span className="uppercase font-bold">{completedSale.paymentMethod}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 border-b border-dashed border-slate-300 dark:border-slate-700 pb-3">
                <div className="flex justify-between font-bold text-[10px] uppercase text-slate-500">
                  <span>Bidhaa</span>
                  <span>Kiasi</span>
                </div>
                {completedSale.items.map((item, i) => (
                  <div key={i} className="text-[11px]">
                    <div className="flex justify-between">
                      <span className="font-medium truncate max-w-[190px]">{item.productName}</span>
                      <span className="font-bold">{formatTZS(item.totalPrice)}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {item.quantity} {item.unit} @ {formatTZS(item.unitPrice)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="text-[11px] space-y-1 border-b border-dashed border-slate-300 dark:border-slate-700 pb-2">
                <div className="flex justify-between">
                  <span>Jumla Ndogo:</span>
                  <span>{formatTZS(completedSale.subtotal)}</span>
                </div>
                {completedSale.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Punguzo:</span>
                    <span>-{formatTZS(completedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-1">
                  <span>JUMLA KUU:</span>
                  <span>{formatTZS(completedSale.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Pesa Iliyopokelewa:</span>
                  <span>{formatTZS(completedSale.amountReceived)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Chenji:</span>
                  <span>{formatTZS(completedSale.changeGiven)}</span>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="text-center text-[10px] text-slate-500 dark:text-slate-400 pt-2 space-y-1">
                <p className="font-bold">{language === 'sw' ? settings.receiptFooterSwahili : settings.receiptFooter}</p>
                <p>"{settings.taglineSwahili}"</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Funga
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>{t.printReceipt}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
