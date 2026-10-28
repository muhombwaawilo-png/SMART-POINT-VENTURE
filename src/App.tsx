import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LoginPortal } from './components/auth/LoginPortal';
import { EmployeeExcelSheet } from './components/excel/EmployeeExcelSheet';
import { Dashboard } from './components/dashboard/Dashboard';
import { POS } from './components/pos/POS';
import { SalesHistory } from './components/sales/SalesHistory';
import { InventoryProducts } from './components/inventory/InventoryProducts';
import { Purchases } from './components/purchases/Purchases';
import { Expenses } from './components/expenses/Expenses';
import { DailyClosing } from './components/closing/DailyClosing';
import { CustomerDebt } from './components/credit/CustomerDebt';
import { Suppliers } from './components/suppliers/Suppliers';
import { Employees } from './components/employees/Employees';
import { Reports } from './components/reports/Reports';
import { ProfitAnalysis } from './components/profit/ProfitAnalysis';
import { AIAssistant } from './components/assistant/AIAssistant';
import { AuditLogs } from './components/audit/AuditLogs';
import { SettingsBackup } from './components/settings/SettingsBackup';
import { Menu, ShieldAlert, ShoppingCart, LayoutDashboard, FileSpreadsheet } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, canAccess, isAuthenticated, language, t } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If user is not logged in, gate access with the LoginPortal
  if (!isAuthenticated) {
    return <LoginPortal />;
  }

  // Render view based on activeTab and permissions
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (!canAccess(['super_admin', 'manager'])) {
          return (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <ShieldAlert className="h-10 w-10 text-amber-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Ufikiaji Umezuiliwa (Access Restricted)
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Kama mhudumu (Cashier), unaweza kurekodi mauzo kwenye Daftari la Excel au Mashine ya Mauzo (POS).
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => setActiveTab('excel')}
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs shadow flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Daftari la Excel</span>
                </button>
                <button
                  onClick={() => setActiveTab('pos')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow"
                >
                  Nenda kwenye POS
                </button>
              </div>
            </div>
          );
        }
        return <Dashboard />;

      case 'excel':
        return <EmployeeExcelSheet />;

      case 'pos':
        return <POS />;

      case 'sales':
        return <SalesHistory />;

      case 'products':
        if (!canAccess(['super_admin', 'manager'])) {
          return <EmployeeExcelSheet />;
        }
        return <InventoryProducts />;

      case 'purchases':
        if (!canAccess(['super_admin', 'manager'])) {
          return <EmployeeExcelSheet />;
        }
        return <Purchases />;

      case 'expenses':
        if (!canAccess(['super_admin', 'manager'])) {
          return <EmployeeExcelSheet />;
        }
        return <Expenses />;

      case 'closing':
        return <DailyClosing />;

      case 'debts':
        return <CustomerDebt />;

      case 'suppliers':
        if (!canAccess(['super_admin', 'manager'])) {
          return <EmployeeExcelSheet />;
        }
        return <Suppliers />;

      case 'employees':
        if (!canAccess(['super_admin'])) {
          return (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Sehemu ya Mkurugenzi Mkuu Tu (Super Admin Only)
              </h3>
            </div>
          );
        }
        return <Employees />;

      case 'reports':
        if (!canAccess(['super_admin', 'manager'])) {
          return <EmployeeExcelSheet />;
        }
        return <Reports />;

      case 'profit':
        if (!canAccess(['super_admin', 'manager'])) {
          return <EmployeeExcelSheet />;
        }
        return <ProfitAnalysis />;

      case 'assistant':
        return <AIAssistant />;

      case 'audit':
        if (!canAccess(['super_admin'])) {
          return <EmployeeExcelSheet />;
        }
        return <AuditLogs />;

      case 'settings':
        if (!canAccess(['super_admin'])) {
          return <EmployeeExcelSheet />;
        }
        return <SettingsBackup />;

      default:
        return currentUser.role === 'cashier' ? <EmployeeExcelSheet /> : <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased transition-colors">
      <Navbar />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 lg:pl-64 pt-3 pb-16 px-3 sm:px-6 lg:px-8">
          {/* Mobile top toggle */}
          <div className="lg:hidden flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2 text-xs font-bold shadow-sm"
            >
              <Menu className="h-4 w-4" />
              <span>Menyu</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('excel')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                  activeTab === 'excel'
                    ? 'bg-teal-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Excel</span>
              </button>

              <button
                onClick={() => setActiveTab('pos')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                  activeTab === 'pos'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
                <span>POS</span>
              </button>

              {canAccess(['super_admin', 'manager']) && (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                    activeTab === 'dashboard'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Kuu</span>
                </button>
              )}
            </div>
          </div>

          {/* Render Active Component */}
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainContent />
    </StoreProvider>
  );
}
