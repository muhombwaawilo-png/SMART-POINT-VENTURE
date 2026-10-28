export type UserRole = 'super_admin' | 'manager' | 'cashier';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  name: string;
  username: string;
  employeeNumber?: string;
  password?: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  pin?: string;
}

export interface ExcelSaleRow {
  id: string;
  rowNumber: number;
  productId?: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  date: string;
  time: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  isCommitted: boolean;
}

export type ProductCategory = 
  | 'nafaka_na_unga'
  | 'chakula'
  | 'mafuta_na_sukari'
  | 'vinywaji'
  | 'mahitaji_ya_nyumbani'
  | 'viungo_na_chumvi';

export type ProductUnit = 
  | 'kg'
  | 'g'
  | 'litre'
  | 'ml'
  | 'piece'
  | 'packet'
  | 'carton'
  | 'bottle'
  | 'crate'
  | 'sack';

export interface ProductVariant {
  id: string;
  name: string;
  quantityRatio: number; // e.g. 5 for 5kg if base is 1kg
  unit: ProductUnit;
  buyingPrice: number;
  sellingPrice: number;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  swahiliName: string;
  category: ProductCategory;
  brand: string;
  unit: ProductUnit;
  buyingPrice: number;
  sellingPrice: number;
  minStockLevel: number;
  currentStock: number;
  supplierId: string;
  supplierName: string;
  barcode: string;
  expiryDate?: string; // YYYY-MM-DD
  status: 'active' | 'low_stock' | 'out_of_stock' | 'inactive';
  variants?: ProductVariant[];
  imagePlaceholder?: string;
}

export type PaymentMethod = 
  | 'cash'
  | 'mpesa'
  | 'airtel_money'
  | 'mixx'
  | 'tigopesa'
  | 'halopesa'
  | 'bank'
  | 'credit';

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: ProductUnit;
  unitCost: number;
  unitPrice: number;
  discount: number;
  totalCost: number;
  totalPrice: number;
  grossProfit: number;
  variantId?: string;
  variantName?: string;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  timestamp: number;
  employeeId: string;
  employeeName: string;
  employeeRole: UserRole;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  totalCost: number;
  grossProfit: number;
  paymentMethod: PaymentMethod;
  paymentRef?: string;
  amountReceived: number;
  changeGiven: number;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  isCredit: boolean;
  creditPaid: number;
  creditDue?: string;
  status: 'completed' | 'cancelled';
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  notes?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  time: string;
  timestamp: number;
  items: PurchaseItem[];
  totalCost: number;
  amountPaid: number;
  balanceOwed: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'partial' | 'credit';
  employeeId: string;
  employeeName: string;
  notes?: string;
}

export type ExpenseCategory = 
  | 'rent'
  | 'electricity'
  | 'water'
  | 'transport'
  | 'salaries'
  | 'airtime'
  | 'internet'
  | 'packaging'
  | 'repairs'
  | 'maintenance'
  | 'taxes'
  | 'mobile_charges'
  | 'other';

export interface Expense {
  id: string;
  date: string;
  time: string;
  timestamp: number;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paidFromCashDrawer: boolean;
  enteredById: string;
  enteredByName: string;
  receiptRef?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  location: string;
  totalDebt: number;
  creditLimit: number;
  notes?: string;
  createdAt: string;
}

export interface CustomerPayment {
  id: string;
  customerId: string;
  customerName: string;
  saleId?: string;
  date: string;
  time: string;
  timestamp: number;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  recordedById: string;
  recordedByName: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  location: string;
  productsSupplied: string[];
  balanceOwed: number;
  contactPerson?: string;
}

export type StockMovementType = 
  | 'sale'
  | 'purchase'
  | 'adjustment'
  | 'damage'
  | 'expiry'
  | 'return';

export interface StockMovement {
  id: string;
  timestamp: number;
  date: string;
  time: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantityChange: number; // positive or negative
  previousStock: number;
  newStock: number;
  reason: string;
  referenceId?: string; // sale id or purchase id
  userId: string;
  userName: string;
}

export interface DailyClosing {
  id: string;
  date: string;
  shiftName: string;
  employeeId: string;
  employeeName: string;
  openingCash: number;
  cashSales: number;
  mobileMoneySales: number;
  bankSales: number;
  creditSales: number;
  cashExpenses: number;
  expectedCash: number;
  actualCash: number;
  difference: number;
  discrepancyType: 'balanced' | 'shortage' | 'surplus';
  notes: string;
  closedAt: string;
  timestamp: number;
  status: 'confirmed';
}

export interface AuditLog {
  id: string;
  timestamp: number;
  date: string;
  time: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  actionSwahili: string;
  details: string;
  ip?: string;
}

export interface StoreNotification {
  id: string;
  timestamp: number;
  type: 'low_stock' | 'out_of_stock' | 'expiring' | 'cash_shortage' | 'new_credit' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  severity: 'info' | 'warning' | 'danger';
  linkTab?: string;
}

export interface BusinessSettings {
  name: string;
  owner: string;
  location: string;
  phone1: string;
  phone2: string;
  currency: string;
  tagline: string;
  taglineSwahili: string;
  receiptFooter: string;
  receiptFooterSwahili: string;
  autoBackupDays: number;
}
