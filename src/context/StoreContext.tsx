import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  Product,
  Sale,
  Purchase,
  Expense,
  Customer,
  Supplier,
  StockMovement,
  DailyClosing,
  AuditLog,
  StoreNotification,
  BusinessSettings,
  PaymentMethod,
  SaleItem,
  UserRole,
  ExcelSaleRow,
} from '../types';
import {
  initialSettings,
  initialUsers,
  initialSuppliers,
  initialCustomers,
  initialProducts,
  initialSales,
  initialPurchases,
  initialExpenses,
  initialDailyClosings,
  initialAuditLogs,
  initialNotifications,
  initialExcelSalesRows,
} from '../data/initialData';
import { Language, translations } from '../i18n/translations';

interface StoreState {
  settings: BusinessSettings;
  users: User[];
  suppliers: Supplier[];
  customers: Customer[];
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
  closings: DailyClosing[];
  auditLogs: AuditLog[];
  notifications: StoreNotification[];
  excelSalesRows: ExcelSaleRow[];
}

const STORAGE_KEY = 'smart_point_venture_db_v4';
const AUTH_KEY = 'smart_point_auth_v2';
const USER_ID_KEY = 'smart_point_user_id_v2';
const LANG_KEY = 'smart_point_lang';
const THEME_KEY = 'smart_point_theme';

interface StoreContextType {
  // Store data
  settings: BusinessSettings;
  users: User[];
  suppliers: Supplier[];
  customers: Customer[];
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
  closings: DailyClosing[];
  auditLogs: AuditLog[];
  notifications: StoreNotification[];
  excelSalesRows: ExcelSaleRow[];
  
  // UI & Session
  currentUser: User;
  setCurrentUser: (user: User) => void;
  isAuthenticated: boolean;
  login: (portal: 'admin' | 'staff', identifier: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['sw'];
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOnline: boolean;
  
  // Business logic actions
  recordSale: (saleData: {
    items: SaleItem[];
    subtotal: number;
    discount: number;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    paymentRef?: string;
    amountReceived: number;
    changeGiven: number;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    isCredit: boolean;
    creditDue?: string;
    notes?: string;
  }) => Sale;
  
  cancelSale: (saleId: string, reason: string) => boolean;
  
  addProduct: (product: Omit<Product, 'id' | 'status'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  adjustStock: (productId: string, quantityChange: number, type: 'adjustment' | 'damage' | 'expiry' | 'return', reason: string) => void;
  
  recordPurchase: (purchaseData: {
    supplierId: string;
    supplierName: string;
    invoiceNumber: string;
    items: { productId: string; productName: string; quantity: number; unitCost: number; totalCost: number }[];
    totalCost: number;
    amountPaid: number;
    paymentMethod: PaymentMethod;
    paymentStatus: 'paid' | 'partial' | 'credit';
    notes?: string;
  }) => Purchase;
  
  recordExpense: (expenseData: {
    category: Expense['category'];
    description: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paidFromCashDrawer: boolean;
    receiptRef?: string;
  }) => Expense;
  
  recordCustomerPayment: (customerId: string, amount: number, paymentMethod: PaymentMethod, reference?: string) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'totalDebt' | 'createdAt'>) => Customer;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'balanceOwed'>) => Supplier;
  
  confirmDailyClosing: (closingData: {
    shiftName: string;
    openingCash: number;
    actualCash: number;
    notes: string;
  }) => DailyClosing;
  
  // Employees with Numeric Employee Number & Password
  generateNumericEmployeeId: (mode?: 'sequential' | 'random') => string;
  isEmployeeNumberUnique: (empNo: string, excludeUserId?: string) => boolean;
  addEmployee: (employee: Omit<User, 'id'>) => User;
  updateEmployee: (id: string, updates: Partial<User>) => void;
  deleteEmployee: (id: string) => boolean;
  
  // Excel Sales Sheet Methods
  addExcelSaleRow: (row: {
    productId?: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    paymentMethod: PaymentMethod;
    date?: string;
    time?: string;
  }) => ExcelSaleRow;
  updateExcelSaleRow: (id: string, updates: Partial<ExcelSaleRow>) => void;
  deleteExcelSaleRow: (id: string) => void;
  commitExcelSales: (targetEmployeeId?: string, targetDate?: string) => { success: boolean; count: number; totalAmount: number; message: string };
  
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  
  updateSettings: (newSettings: Partial<BusinessSettings>) => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonString: string) => boolean;
  resetToDemoData: () => void;
  
  // Helpers
  formatTZS: (amount: number) => string;
  canAccess: (requiredRoles: UserRole[]) => boolean;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load saved state or use initial demo data
  const [storeState, setStoreState] = useState<StoreState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clean and migrate users to ensure numeric employee numbers!
        const cleanedUsers = (parsed.users || [])
          .map((u: User) => {
            if (u.id === 'user-awilo') {
              return {
                ...u,
                employeeNumber: u.employeeNumber && /^\d+$/.test(u.employeeNumber) ? u.employeeNumber : '1000',
              };
            }
            // If employee had EMP-001 or non-numeric, convert to numeric 1001, etc.
            let empNum = u.employeeNumber || '';
            if (empNum.startsWith('EMP-')) {
              const parsedNum = parseInt(empNum.replace('EMP-', ''), 10);
              empNum = isNaN(parsedNum) ? '1001' : String(1000 + parsedNum);
            } else if (!/^\d+$/.test(empNum)) {
              empNum = '1001';
            }
            return {
              ...u,
              employeeNumber: empNum,
              username: empNum, // numeric employee ID serves as username
            };
          })
          .filter(
            (u: User) =>
              u.id === 'user-awilo' ||
              (u.employeeNumber && /^\d+$/.test(u.employeeNumber))
          );
        if (cleanedUsers.length === 0) {
          cleanedUsers.push(initialUsers[0]);
        }

        return {
          ...parsed,
          users: cleanedUsers,
          sales: [],
          excelSalesRows: [],
          closings: [],
          expenses: [],
          customers: (parsed.customers || initialCustomers).map((c: Customer) => ({ ...c, totalDebt: 0 })),
        };
      }
    } catch (e) {
      console.error('Failed to parse saved state from localStorage:', e);
    }
    return {
      settings: initialSettings,
      users: initialUsers,
      suppliers: initialSuppliers,
      customers: initialCustomers,
      products: initialProducts,
      sales: initialSales,
      purchases: initialPurchases,
      expenses: initialExpenses,
      closings: initialDailyClosings,
      auditLogs: initialAuditLogs,
      notifications: initialNotifications,
      excelSalesRows: initialExcelSalesRows,
    };
  });

  // Persist to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storeState));
    } catch (e) {
      console.error('Failed to persist state to localStorage:', e);
    }
  }, [storeState]);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(AUTH_KEY) === 'true';
  });

  // Current session user
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedUserId = localStorage.getItem(USER_ID_KEY);
    if (savedUserId) {
      const found = storeState.users.find(u => u.id === savedUserId);
      if (found) return found;
    }
    return storeState.users.find(u => u.role === 'super_admin') || storeState.users[0];
  });

  // Login handler
  const login = (portal: 'admin' | 'staff', identifier: string, password: string): { success: boolean; message?: string } => {
    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (portal === 'admin') {
      const admin = storeState.users.find(u => u.role === 'super_admin');
      if (!admin) {
        return { success: false, message: 'Akaunti ya Super Admin haijapatikana.' };
      }

      const idMatch =
        admin.username.toLowerCase() === cleanId.toLowerCase() ||
        admin.phone === cleanId ||
        (admin.employeeNumber && admin.employeeNumber === cleanId);
      const passMatch = (admin.password || 'awilo123') === cleanPass;

      if (idMatch && passMatch) {
        setCurrentUser(admin);
        setIsAuthenticated(true);
        localStorage.setItem(AUTH_KEY, 'true');
        localStorage.setItem(USER_ID_KEY, admin.id);
        setActiveTab('dashboard');
        addAuditLog('USER_LOGIN', 'Kuingia Kwenye Mfumo', `Mkurugenzi ${admin.name} ameingia kwenye mfumo kupitia Super Admin Portal.`);
        return { success: true };
      }
      return { success: false, message: 'Jina la mtumiaji, simu au nenosiri la Super Admin si sahihi.' };
    } else {
      // Staff Portal - expects numeric employee ID as username
      if (!cleanId) {
        return { success: false, message: 'Tafadhali ingiza Namba ya Mfanyakazi (Numeric Employee ID).' };
      }

      if (!/^\d+$/.test(cleanId)) {
        return { success: false, message: 'Namba ya mfanyakazi lazima iwe ya tarakimu/namba pekee (mfano: 1001).' };
      }

      const emp = storeState.users.find(
        u =>
          u.role !== 'super_admin' &&
          (u.employeeNumber === cleanId || u.username === cleanId)
      );

      if (!emp) {
        return {
          success: false,
          message: `Namba ya mfanyakazi "${cleanId}" haijasajiliwa. Tafadhali wasiliana na Super Admin akutengenezee namba ya kipekee.`,
        };
      }

      if (emp.status !== 'active') {
        return { success: false, message: 'Akaunti hii imesimamishwa na Mkurugenzi Mkuu.' };
      }

      if ((emp.password || emp.pin || '1234') !== cleanPass) {
        return { success: false, message: 'Nenosiri la mfanyakazi si sahihi.' };
      }

      setCurrentUser(emp);
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_KEY, 'true');
      localStorage.setItem(USER_ID_KEY, emp.id);
      setActiveTab('excel'); // default to their Excel Sales Ledger
      addAuditLog('USER_LOGIN', 'Kuingia Kwenye Mfumo', `Mfanyakazi ${emp.name} (Namba ya Kazi: ${emp.employeeNumber}) ameingia kwenye Staff Portal.`);
      return { success: true };
    }
  };

  // Logout handler
  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_ID_KEY);
    addAuditLog('USER_LOGOUT', 'Kuondoka Kwenye Mfumo', `${currentUser.name} ameondoka kwenye mfumo.`);
  };

  // Language state (default Swahili)
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem(LANG_KEY) as Language) || 'sw';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANG_KEY, lang);
  };

  const t = translations[language];

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Online / Offline monitor
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Format TZS currency e.g. TZS 1,250,000
  const formatTZS = (amount: number): string => {
    const safeAmount = Math.round(amount || 0);
    return `TZS ${safeAmount.toLocaleString('en-US')}`;
  };

  // Helper to check user permission
  const canAccess = (requiredRoles: UserRole[]): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;
    return requiredRoles.includes(currentUser.role);
  };

  // Audit log helper
  const addAuditLog = (action: string, actionSwahili: string, details: string) => {
    const now = new Date();
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'System',
      userRole: currentUser?.role || 'super_admin',
      action,
      actionSwahili,
      details,
    };
    setStoreState(prev => ({
      ...prev,
      auditLogs: [newLog, ...prev.auditLogs],
    }));
  };

  // Dispatch notification
  const addNotification = (
    type: StoreNotification['type'],
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'danger',
    linkTab?: string
  ) => {
    const newNotif: StoreNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      type,
      title,
      message,
      isRead: false,
      severity,
      linkTab,
    };
    setStoreState(prev => ({
      ...prev,
      notifications: [newNotif, ...prev.notifications],
    }));
  };

  // 1. RECORD SALE
  const recordSale = (saleData: {
    items: SaleItem[];
    subtotal: number;
    discount: number;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    paymentRef?: string;
    amountReceived: number;
    changeGiven: number;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    isCredit: boolean;
    creditDue?: string;
    notes?: string;
  }): Sale => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    const receiptNum = `SPV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let totalCost = 0;
    const computedItems: SaleItem[] = saleData.items.map(item => {
      const itemCost = item.unitCost * item.quantity;
      const itemPrice = item.totalPrice;
      const grossProfit = itemPrice - itemCost;
      totalCost += itemCost;
      return {
        ...item,
        totalCost: itemCost,
        grossProfit,
      };
    });

    const grossProfit = saleData.totalAmount - totalCost;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      receiptNumber: receiptNum,
      date: dateStr,
      time: timeStr,
      timestamp: Date.now(),
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      employeeRole: currentUser.role,
      items: computedItems,
      subtotal: saleData.subtotal,
      discount: saleData.discount,
      totalAmount: saleData.totalAmount,
      totalCost,
      grossProfit,
      paymentMethod: saleData.paymentMethod,
      paymentRef: saleData.paymentRef,
      amountReceived: saleData.amountReceived,
      changeGiven: saleData.changeGiven,
      customerId: saleData.customerId,
      customerName: saleData.customerName,
      customerPhone: saleData.customerPhone,
      isCredit: saleData.isCredit,
      creditPaid: saleData.isCredit ? 0 : saleData.totalAmount,
      creditDue: saleData.creditDue,
      status: 'completed',
      notes: saleData.notes,
    };

    setStoreState(prev => {
      const updatedProducts = [...prev.products];
      const newStockMovements: StockMovement[] = [];

      saleData.items.forEach(saleItem => {
        const prodIndex = updatedProducts.findIndex(p => p.id === saleItem.productId);
        if (prodIndex >= 0) {
          const prod = updatedProducts[prodIndex];
          const qtyToDeduct = saleItem.quantity;
          const prevStock = prod.currentStock;
          const newStock = Math.max(0, prevStock - qtyToDeduct);

          let newStatus = prod.status;
          if (newStock === 0) {
            newStatus = 'out_of_stock';
          } else if (newStock <= prod.minStockLevel) {
            newStatus = 'low_stock';
          } else {
            newStatus = 'active';
          }

          updatedProducts[prodIndex] = {
            ...prod,
            currentStock: newStock,
            status: newStatus,
          };

          newStockMovements.push({
            id: `mov-${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            date: dateStr,
            time: timeStr,
            productId: prod.id,
            productName: prod.name,
            type: 'sale',
            quantityChange: -qtyToDeduct,
            previousStock: prevStock,
            newStock,
            reason: `Mauzo ya Risiti #${receiptNum}`,
            referenceId: newSale.id,
            userId: currentUser.id,
            userName: currentUser.name,
          });

          if (newStock <= prod.minStockLevel && prevStock > prod.minStockLevel) {
            addNotification(
              newStock === 0 ? 'out_of_stock' : 'low_stock',
              newStock === 0 ? `Bidhaa Imeisha: ${prod.name}` : `Kiwango cha Chini: ${prod.name}`,
              `Kiasi kilichobaki ni ${newStock} ${prod.unit}. Kiwango cha chini ni ${prod.minStockLevel}.`,
              newStock === 0 ? 'danger' : 'warning',
              'products'
            );
          }
        }
      });

      let updatedCustomers = prev.customers;
      if (saleData.isCredit && saleData.customerId) {
        updatedCustomers = prev.customers.map(c => {
          if (c.id === saleData.customerId) {
            return {
              ...c,
              totalDebt: c.totalDebt + saleData.totalAmount,
            };
          }
          return c;
        });

        addNotification(
          'new_credit',
          `Mauzo Mapya ya Mkopo: ${saleData.customerName || 'Mteja'}`,
          `Mteja amepewa bidhaa za ${formatTZS(saleData.totalAmount)} kwa mkopo.`,
          'info',
          'debts'
        );
      }

      return {
        ...prev,
        sales: [newSale, ...prev.sales],
        products: updatedProducts,
        customers: updatedCustomers,
      };
    });

    addAuditLog(
      'SALE_COMPLETED',
      'Mauzo Yamekamilika',
      `Risiti #${receiptNum} ya thamani ya ${formatTZS(saleData.totalAmount)} imerekodiwa kwa njia ya ${saleData.paymentMethod}.`
    );

    return newSale;
  };

  // 2. CANCEL SALE
  const cancelSale = (saleId: string, reason: string): boolean => {
    if (!canAccess(['super_admin', 'manager'])) {
      alert('Huna mamlaka ya kufuta muamala huu.');
      return false;
    }

    const sale = storeState.sales.find(s => s.id === saleId);
    if (!sale || sale.status === 'cancelled') return false;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    setStoreState(prev => {
      const updatedSales = prev.sales.map(s => {
        if (s.id === saleId) {
          return {
            ...s,
            status: 'cancelled' as const,
            cancellationReason: reason,
            cancelledBy: currentUser.name,
            cancelledAt: `${dateStr} ${timeStr}`,
          };
        }
        return s;
      });

      const updatedProducts = [...prev.products];
      sale.items.forEach(item => {
        const pIndex = updatedProducts.findIndex(p => p.id === item.productId);
        if (pIndex >= 0) {
          const prod = updatedProducts[pIndex];
          const restoredStock = prod.currentStock + item.quantity;
          let newStatus = prod.status;
          if (restoredStock > prod.minStockLevel) newStatus = 'active';
          else if (restoredStock > 0) newStatus = 'low_stock';

          updatedProducts[pIndex] = {
            ...prod,
            currentStock: restoredStock,
            status: newStatus,
          };
        }
      });

      let updatedCustomers = prev.customers;
      if (sale.isCredit && sale.customerId) {
        updatedCustomers = prev.customers.map(c => {
          if (c.id === sale.customerId) {
            return {
              ...c,
              totalDebt: Math.max(0, c.totalDebt - sale.totalAmount),
            };
          }
          return c;
        });
      }

      return {
        ...prev,
        sales: updatedSales,
        products: updatedProducts,
        customers: updatedCustomers,
      };
    });

    addAuditLog(
      'SALE_CANCELLED',
      'Muamala wa Mauzo Umefutwa',
      `Risiti #${sale.receiptNumber} ya ${formatTZS(sale.totalAmount)} imefutwa na ${currentUser.name}. Sababu: ${reason}. Mzigo umerudishwa stoo.`
    );

    return true;
  };

  // 3. PRODUCT MANAGEMENT
  const addProduct = (productData: Omit<Product, 'id' | 'status'>): Product => {
    let initialStatus: Product['status'] = 'active';
    if (productData.currentStock === 0) {
      initialStatus = 'out_of_stock';
    } else if (productData.currentStock <= productData.minStockLevel) {
      initialStatus = 'low_stock';
    }

    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      status: initialStatus,
    };

    setStoreState(prev => ({
      ...prev,
      products: [newProduct, ...prev.products],
    }));

    addAuditLog(
      'PRODUCT_CREATED',
      'Bidhaa Mpya Imeongezwa',
      `Bidhaa "${newProduct.name}" imeongezwa na ${currentUser.name}. Bei ya kuuza: ${formatTZS(newProduct.sellingPrice)}.`
    );

    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setStoreState(prev => {
      const updatedProducts = prev.products.map(p => {
        if (p.id === id) {
          const merged = { ...p, ...updates };
          if (merged.currentStock === 0) merged.status = 'out_of_stock';
          else if (merged.currentStock <= merged.minStockLevel) merged.status = 'low_stock';
          else merged.status = 'active';
          return merged;
        }
        return p;
      });
      return { ...prev, products: updatedProducts };
    });

    addAuditLog(
      'PRODUCT_UPDATED',
      'Taarifa za Bidhaa Zimebadilishwa',
      `Bidhaa #${id} imesasishwa na ${currentUser.name}.`
    );
  };

  const adjustStock = (
    productId: string,
    quantityChange: number,
    type: 'adjustment' | 'damage' | 'expiry' | 'return',
    reason: string
  ) => {
    setStoreState(prev => {
      const updatedProducts = prev.products.map(p => {
        if (p.id === productId) {
          const newStock = Math.max(0, p.currentStock + quantityChange);
          let newStatus = p.status;
          if (newStock === 0) newStatus = 'out_of_stock';
          else if (newStock <= p.minStockLevel) newStatus = 'low_stock';
          else newStatus = 'active';

          return { ...p, currentStock: newStock, status: newStatus };
        }
        return p;
      });

      return { ...prev, products: updatedProducts };
    });

    const prod = storeState.products.find(p => p.id === productId);
    addAuditLog(
      'STOCK_ADJUSTED',
      'Marekebisho ya Stoo',
      `Stoo ya "${prod?.name || productId}" imerekebishwa (${quantityChange > 0 ? '+' : ''}${quantityChange}). Sababu: ${reason}. Aina: ${type}.`
    );
  };

  // 4. RECORD STOCK PURCHASE
  const recordPurchase = (purchaseData: {
    supplierId: string;
    supplierName: string;
    invoiceNumber: string;
    items: { productId: string; productName: string; quantity: number; unitCost: number; totalCost: number }[];
    totalCost: number;
    amountPaid: number;
    paymentMethod: PaymentMethod;
    paymentStatus: 'paid' | 'partial' | 'credit';
    notes?: string;
  }): Purchase => {
    const now = new Date();
    const balanceOwed = purchaseData.totalCost - purchaseData.amountPaid;

    const newPurchase: Purchase = {
      id: `pur-${Date.now()}`,
      invoiceNumber: purchaseData.invoiceNumber,
      supplierId: purchaseData.supplierId,
      supplierName: purchaseData.supplierName,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      timestamp: Date.now(),
      items: purchaseData.items,
      totalCost: purchaseData.totalCost,
      amountPaid: purchaseData.amountPaid,
      balanceOwed,
      paymentMethod: purchaseData.paymentMethod,
      paymentStatus: purchaseData.paymentStatus,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      notes: purchaseData.notes,
    };

    setStoreState(prev => {
      const updatedProducts = [...prev.products];
      purchaseData.items.forEach(item => {
        const pIndex = updatedProducts.findIndex(p => p.id === item.productId);
        if (pIndex >= 0) {
          const prod = updatedProducts[pIndex];
          const newStock = prod.currentStock + item.quantity;
          let newStatus = prod.status;
          if (newStock > prod.minStockLevel) newStatus = 'active';
          else if (newStock > 0) newStatus = 'low_stock';

          updatedProducts[pIndex] = {
            ...prod,
            currentStock: newStock,
            status: newStatus,
          };
        }
      });

      const updatedSuppliers = prev.suppliers.map(s => {
        if (s.id === purchaseData.supplierId) {
          return {
            ...s,
            balanceOwed: s.balanceOwed + balanceOwed,
          };
        }
        return s;
      });

      return {
        ...prev,
        purchases: [newPurchase, ...prev.purchases],
        products: updatedProducts,
        suppliers: updatedSuppliers,
      };
    });

    addAuditLog(
      'STOCK_PURCHASED',
      'Mzigo Mpya Umenunuliwa',
      `Ankara #${purchaseData.invoiceNumber} kutoka kwa ${purchaseData.supplierName} ya thamani ya ${formatTZS(purchaseData.totalCost)} imethibitishwa.`
    );

    return newPurchase;
  };

  // 5. EXPENSE MANAGEMENT
  const recordExpense = (expenseData: {
    category: Expense['category'];
    description: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paidFromCashDrawer: boolean;
    receiptRef?: string;
  }): Expense => {
    const now = new Date();
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      timestamp: Date.now(),
      category: expenseData.category,
      description: expenseData.description,
      amount: expenseData.amount,
      paymentMethod: expenseData.paymentMethod,
      paidFromCashDrawer: expenseData.paidFromCashDrawer,
      enteredById: currentUser.id,
      enteredByName: currentUser.name,
      receiptRef: expenseData.receiptRef,
    };

    setStoreState(prev => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses],
    }));

    addAuditLog(
      'EXPENSE_RECORDED',
      'Matumizi Yamerekodiwa',
      `Matumizi ya ${formatTZS(expenseData.amount)} (${expenseData.category}: ${expenseData.description}) yamerekodiwa na ${currentUser.name}.`
    );

    return newExpense;
  };

  // 6. CUSTOMER CREDIT & DEBT MANAGEMENT
  const recordCustomerPayment = (
    customerId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    reference?: string
  ) => {
    const customer = storeState.customers.find(c => c.id === customerId);
    if (!customer) return;

    setStoreState(prev => {
      const updatedCustomers = prev.customers.map(c => {
        if (c.id === customerId) {
          return {
            ...c,
            totalDebt: Math.max(0, c.totalDebt - amount),
          };
        }
        return c;
      });

      return {
        ...prev,
        customers: updatedCustomers,
      };
    });

    addAuditLog(
      'DEBT_PAYMENT_RECORDED',
      'Malipo ya Deni Yamerekodiwa',
      `Mteja ${customer.name} amelipa ${formatTZS(amount)} kwa njia ya ${paymentMethod}.`
    );
  };

  const addCustomer = (customerData: Omit<Customer, 'id' | 'totalDebt' | 'createdAt'>): Customer => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      totalDebt: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setStoreState(prev => ({
      ...prev,
      customers: [...prev.customers, newCustomer],
    }));

    addAuditLog(
      'CUSTOMER_CREATED',
      'Mteja Mpya Ameongezwa',
      `Mteja "${newCustomer.name}" (${newCustomer.phone}) ameongezwa na ${currentUser.name}.`
    );

    return newCustomer;
  };

  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'balanceOwed'>): Supplier => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `sup-${Date.now()}`,
      balanceOwed: 0,
    };

    setStoreState(prev => ({
      ...prev,
      suppliers: [...prev.suppliers, newSupplier],
    }));

    addAuditLog(
      'SUPPLIER_CREATED',
      'Msambazaji Mpya Ameongezwa',
      `Msambazaji "${newSupplier.name}" ameongezwa na ${currentUser.name}.`
    );

    return newSupplier;
  };

  // 7. DAILY CLOSING
  const confirmDailyClosing = (closingData: {
    shiftName: string;
    openingCash: number;
    actualCash: number;
    notes: string;
  }): DailyClosing => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const todaySales = storeState.sales.filter(s => s.date === today && s.status === 'completed');
    const cashSales = todaySales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.totalAmount, 0);
    const mobileMoneySales = todaySales
      .filter(s => ['mpesa', 'airtel_money', 'mixx', 'tigopesa', 'halopesa'].includes(s.paymentMethod))
      .reduce((sum, s) => sum + s.totalAmount, 0);
    const bankSales = todaySales.filter(s => s.paymentMethod === 'bank').reduce((sum, s) => sum + s.totalAmount, 0);
    const creditSales = todaySales.filter(s => s.isCredit).reduce((sum, s) => sum + s.totalAmount, 0);

    const cashExpenses = storeState.expenses
      .filter(e => e.date === today && e.paidFromCashDrawer)
      .reduce((sum, e) => sum + e.amount, 0);

    const expectedCash = closingData.openingCash + cashSales - cashExpenses;
    const difference = closingData.actualCash - expectedCash;

    let discrepancyType: DailyClosing['discrepancyType'] = 'balanced';
    if (difference < 0) discrepancyType = 'shortage';
    else if (difference > 0) discrepancyType = 'surplus';

    const newClosing: DailyClosing = {
      id: `close-${Date.now()}`,
      date: today,
      shiftName: closingData.shiftName,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      openingCash: closingData.openingCash,
      cashSales,
      mobileMoneySales,
      bankSales,
      creditSales,
      cashExpenses,
      expectedCash,
      actualCash: closingData.actualCash,
      difference,
      discrepancyType,
      notes: closingData.notes,
      closedAt: now.toISOString(),
      timestamp: Date.now(),
      status: 'confirmed',
    };

    setStoreState(prev => ({
      ...prev,
      closings: [newClosing, ...prev.closings],
    }));

    if (discrepancyType === 'shortage') {
      addNotification(
        'cash_shortage',
        `Tahadhari: Upungufu wa Pesa Drooni (${formatTZS(Math.abs(difference))})!`,
        `Mfanyakazi ${currentUser.name} amefunga siku na upungufu wa fedha wa ${formatTZS(difference)}.`,
        'danger',
        'closing'
      );
    }

    addAuditLog(
      'DAILY_CLOSING_CONFIRMED',
      'Ufungaji wa Siku Umethibitishwa',
      `Siku imefungwa na ${currentUser.name}. Tarajiwa: ${formatTZS(expectedCash)}, Halisi: ${formatTZS(closingData.actualCash)}. Tofauti: ${formatTZS(difference)}.`
    );

    return newClosing;
  };

  // 8. EMPLOYEE MANAGEMENT (With Numeric Employee ID as Username & Password)
  const generateNumericEmployeeId = (mode: 'sequential' | 'random' = 'sequential'): string => {
    const existingIds = new Set(
      storeState.users
        .map(u => u.employeeNumber?.trim())
        .filter((n): n is string => Boolean(n && /^\d+$/.test(n)))
    );

    if (mode === 'random') {
      // Generate unique 4-digit numeric ID
      for (let attempt = 0; attempt < 2000; attempt++) {
        const randomId = String(Math.floor(1001 + Math.random() * 8998));
        if (!existingIds.has(randomId)) {
          return randomId;
        }
      }
    }

    // Default sequential: Find max numeric ID and increment, starting from 1001
    const numericList = Array.from(existingIds)
      .map(n => parseInt(n, 10))
      .filter(n => !isNaN(n) && n >= 1000);

    const nextId = numericList.length > 0 ? Math.max(...numericList) + 1 : 1001;
    return String(nextId);
  };

  const isEmployeeNumberUnique = (empNo: string, excludeUserId?: string): boolean => {
    const clean = empNo.trim();
    if (!clean || !/^\d+$/.test(clean)) return false;
    return !storeState.users.some(
      u => u.id !== excludeUserId && (u.employeeNumber === clean || u.username === clean)
    );
  };

  const addEmployee = (employeeData: Omit<User, 'id'>): User => {
    // Generate next unique numeric ID if not provided, non-numeric, or already taken
    let numericId = employeeData.employeeNumber?.trim() || '';
    if (!numericId || !/^\d+$/.test(numericId) || !isEmployeeNumberUnique(numericId)) {
      numericId = generateNumericEmployeeId('sequential');
    }

    const newEmployee: User = {
      ...employeeData,
      id: `user-${Date.now()}`,
      employeeNumber: numericId,
      username: numericId, // Numeric employee ID is the username for login!
      password: employeeData.password?.trim() || '1234',
    };

    setStoreState(prev => ({
      ...prev,
      users: [...prev.users, newEmployee],
    }));

    addAuditLog(
      'EMPLOYEE_CREATED',
      'Mfanyakazi Mpya Ameongezwa',
      `Akaunti ya "${newEmployee.name}" yenye Namba ya Utambulisho wa Namba (ID: ${newEmployee.employeeNumber}) imeundwa na ${currentUser.name}.`
    );

    return newEmployee;
  };

  const updateEmployee = (id: string, updates: Partial<User>) => {
    setStoreState(prev => ({
      ...prev,
      users: prev.users.map(u => {
        if (u.id === id) {
          const updatedEmpNum = updates.employeeNumber?.trim() || u.employeeNumber;
          return {
            ...u,
            ...updates,
            employeeNumber: updatedEmpNum,
            username: u.role === 'super_admin' ? (updates.username || u.username) : (updatedEmpNum || u.username),
          };
        }
        return u;
      }),
    }));

    addAuditLog(
      'EMPLOYEE_UPDATED',
      'Akaunti ya Mfanyakazi Imebadilishwa',
      `Mfanyakazi #${id} amebadilishwa na ${currentUser.name}.`
    );
  };

  const deleteEmployee = (id: string): boolean => {
    const target = storeState.users.find(u => u.id === id);
    if (!target || target.role === 'super_admin') {
      alert('Huwezi kufuta akaunti ya Super Admin!');
      return false;
    }

    setStoreState(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== id),
    }));

    addAuditLog(
      'EMPLOYEE_DELETED',
      'Mfanyakazi Ameondolewa',
      `Mfanyakazi "${target.name}" (${target.employeeNumber}) ameondolewa kwenye mfumo na ${currentUser.name}.`
    );

    return true;
  };

  // 9. EXCEL SALES SHEET LEDGER (Each employee gets row-by-row excel entry)
  const addExcelSaleRow = (row: {
    productId?: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    paymentMethod: PaymentMethod;
    date?: string;
    time?: string;
  }): ExcelSaleRow => {
    const now = new Date();
    const date = row.date || now.toISOString().split('T')[0];
    const time = row.time || now.toTimeString().split(' ')[0];

    // Compute row number for this employee today
    const employeeRowsToday = storeState.excelSalesRows.filter(
      r => r.employeeId === currentUser.id && r.date === date
    );
    const rowNumber = employeeRowsToday.length + 1;
    const totalPrice = row.quantity * row.unitPrice;

    const newRow: ExcelSaleRow = {
      id: `row-${Date.now()}-${Math.random().toString().slice(-4)}`,
      rowNumber,
      productId: row.productId,
      productName: row.productName,
      quantity: row.quantity,
      unit: row.unit,
      unitPrice: row.unitPrice,
      totalPrice,
      paymentMethod: row.paymentMethod,
      date,
      time,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      employeeNumber: currentUser.employeeNumber || 'STAFF',
      isCommitted: false,
    };

    setStoreState(prev => ({
      ...prev,
      excelSalesRows: [newRow, ...prev.excelSalesRows],
    }));

    return newRow;
  };

  const updateExcelSaleRow = (id: string, updates: Partial<ExcelSaleRow>) => {
    setStoreState(prev => ({
      ...prev,
      excelSalesRows: prev.excelSalesRows.map(r => {
        if (r.id === id) {
          const merged = { ...r, ...updates };
          merged.totalPrice = merged.quantity * merged.unitPrice;
          return merged;
        }
        return r;
      }),
    }));
  };

  const deleteExcelSaleRow = (id: string) => {
    setStoreState(prev => ({
      ...prev,
      excelSalesRows: prev.excelSalesRows.filter(r => r.id !== id),
    }));
  };

  const commitExcelSales = (targetEmployeeId?: string, targetDate?: string) => {
    const empId = targetEmployeeId || currentUser.id;
    const dateStr = targetDate || new Date().toISOString().split('T')[0];

    const uncommitted = storeState.excelSalesRows.filter(
      r => r.employeeId === empId && r.date === dateStr && !r.isCommitted
    );

    if (uncommitted.length === 0) {
      return { success: false, count: 0, totalAmount: 0, message: 'Hakuna mauzo mapya ya kuthibitisha kwenye daftari la leo.' };
    }

    const saleItems: SaleItem[] = uncommitted.map(r => {
      const prod = storeState.products.find(p => p.id === r.productId) ||
                   storeState.products.find(p => p.name.toLowerCase() === r.productName.toLowerCase());
      const unitCost = prod ? prod.buyingPrice : Math.round(r.unitPrice * 0.75);
      const totalCost = unitCost * r.quantity;
      const totalPrice = r.totalPrice;

      return {
        productId: prod?.id || `custom-${Date.now()}`,
        productName: r.productName,
        quantity: r.quantity,
        unit: (prod?.unit || r.unit || 'piece') as any,
        unitCost,
        unitPrice: r.unitPrice,
        discount: 0,
        totalCost,
        totalPrice,
        grossProfit: totalPrice - totalCost,
      };
    });

    const totalAmount = saleItems.reduce((sum, it) => sum + it.totalPrice, 0);
    const primaryPM = uncommitted[0]?.paymentMethod || 'cash';

    recordSale({
      items: saleItems,
      subtotal: totalAmount,
      discount: 0,
      totalAmount,
      paymentMethod: primaryPM,
      amountReceived: totalAmount,
      changeGiven: 0,
      isCredit: primaryPM === 'credit',
      notes: `Daftari la Excel: ${uncommitted[0]?.employeeName} (${uncommitted[0]?.employeeNumber})`,
    });

    // Mark as committed
    setStoreState(prev => ({
      ...prev,
      excelSalesRows: prev.excelSalesRows.map(r =>
        r.employeeId === empId && r.date === dateStr ? { ...r, isCommitted: true } : r
      ),
    }));

    return {
      success: true,
      count: uncommitted.length,
      totalAmount,
      message: `Mauzo ${uncommitted.length} yenye jumla ya ${formatTZS(totalAmount)} yamethibitishwa na kukatwa stoo!`,
    };
  };

  // 10. NOTIFICATIONS
  const markNotificationRead = (id: string) => {
    setStoreState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => (n.id === id ? { ...n, isRead: true } : n)),
    }));
  };

  const markAllNotificationsRead = () => {
    setStoreState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, isRead: true })),
    }));
  };

  // 11. SETTINGS & BACKUP
  const updateSettings = (newSettings: Partial<BusinessSettings>) => {
    setStoreState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));

    addAuditLog('SETTINGS_UPDATED', 'Mipangilio ya Mfumo Imebadilishwa', `Mipangilio imesasishwa.`);
  };

  const exportDatabaseJSON = (): string => {
    return JSON.stringify(storeState, null, 2);
  };

  const importDatabaseJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.settings && parsed.products && parsed.sales) {
        setStoreState(parsed);
        addAuditLog('DATABASE_RESTORED', 'Data ya Mfumo Imerejeshwa', `Hifadhi imerejeshwa.`);
        return true;
      }
    } catch (e) {
      console.error('Invalid backup JSON:', e);
    }
    return false;
  };

  const resetToDemoData = () => {
    const demoState: StoreState = {
      settings: initialSettings,
      users: initialUsers,
      suppliers: initialSuppliers,
      customers: initialCustomers,
      products: initialProducts,
      sales: initialSales,
      purchases: initialPurchases,
      expenses: initialExpenses,
      closings: initialDailyClosings,
      auditLogs: initialAuditLogs,
      notifications: initialNotifications,
      excelSalesRows: initialExcelSalesRows,
    };
    setStoreState(demoState);
    setCurrentUser(demoState.users[0]);
    addAuditLog('DEMO_DATA_RESET', 'Data za Mfano Zimerejeshwa', 'Mfumo umerejeshwa kwa Super Admin pekee.');
  };

  return (
    <StoreContext.Provider
      value={{
        ...storeState,
        currentUser,
        setCurrentUser,
        isAuthenticated,
        login,
        logout,
        language,
        setLanguage,
        t,
        theme,
        setTheme,
        toggleTheme,
        activeTab,
        setActiveTab,
        isOnline,
        recordSale,
        cancelSale,
        addProduct,
        updateProduct,
        adjustStock,
        recordPurchase,
        recordExpense,
        recordCustomerPayment,
        addCustomer,
        addSupplier,
        confirmDailyClosing,
        generateNumericEmployeeId,
        isEmployeeNumberUnique,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addExcelSaleRow,
        updateExcelSaleRow,
        deleteExcelSaleRow,
        commitExcelSales,
        markNotificationRead,
        markAllNotificationsRead,
        updateSettings,
        exportDatabaseJSON,
        importDatabaseJSON,
        resetToDemoData,
        formatTZS,
        canAccess,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
