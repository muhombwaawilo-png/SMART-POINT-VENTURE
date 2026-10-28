import React from 'react';
import { useStore } from '../../context/StoreContext';
import {
  LayoutDashboard,
  ShoppingCart,
  FileSpreadsheet,
  Receipt,
  Boxes,
  Truck,
  CreditCard,
  CalendarCheck,
  Users,
  Building2,
  UserCog,
  FileBarChart,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Settings,
  HelpCircle,
  AlertCircle,
  Menu,
  X,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { activeTab, setActiveTab, currentUser, t, products, notifications, closings } = useStore();

  const lowStockCount = products.filter(p => p.status === 'low_stock' || p.status === 'out_of_stock').length;

  const navItems = [
    {
      id: 'dashboard',
      label: t.navDashboard,
      icon: LayoutDashboard,
      roles: ['super_admin', 'manager'],
    },
    {
      id: 'excel',
      label: t.navExcel || 'Daftari la Mauzo (Excel)',
      icon: FileSpreadsheet,
      roles: ['super_admin', 'manager', 'cashier'],
      badge: 'Excel',
      badgeColor: 'bg-teal-600 text-white',
    },
    {
      id: 'pos',
      label: t.navPOS,
      icon: ShoppingCart,
      roles: ['super_admin', 'manager', 'cashier'],
      badge: 'Fast',
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'sales',
      label: t.navSales,
      icon: Receipt,
      roles: ['super_admin', 'manager', 'cashier'],
    },
    {
      id: 'products',
      label: t.navProducts,
      icon: Boxes,
      roles: ['super_admin', 'manager'],
      badge: lowStockCount > 0 ? `${lowStockCount}` : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'purchases',
      label: t.navPurchases,
      icon: Truck,
      roles: ['super_admin', 'manager'],
    },
    {
      id: 'expenses',
      label: t.navExpenses,
      icon: CreditCard,
      roles: ['super_admin', 'manager'],
    },
    {
      id: 'closing',
      label: t.navClosing,
      icon: CalendarCheck,
      roles: ['super_admin', 'manager', 'cashier'],
    },
    {
      id: 'debts',
      label: t.navDebts,
      icon: Users,
      roles: ['super_admin', 'manager', 'cashier'],
    },
    {
      id: 'suppliers',
      label: t.navSuppliers,
      icon: Building2,
      roles: ['super_admin', 'manager'],
    },
    {
      id: 'employees',
      label: t.navEmployees,
      icon: UserCog,
      roles: ['super_admin'],
    },
    {
      id: 'reports',
      label: t.navReports,
      icon: FileBarChart,
      roles: ['super_admin', 'manager'],
    },
    {
      id: 'profit',
      label: t.navProfit,
      icon: TrendingUp,
      roles: ['super_admin', 'manager'],
    },
    {
      id: 'assistant',
      label: t.navAssistant,
      icon: Sparkles,
      roles: ['super_admin', 'manager'],
      badge: 'AI',
      badgeColor: 'bg-purple-600 text-white',
    },
    {
      id: 'audit',
      label: t.navAudit,
      icon: ShieldCheck,
      roles: ['super_admin'],
    },
    {
      id: 'settings',
      label: t.navSettings,
      icon: Settings,
      roles: ['super_admin'],
    },
  ];

  // Filter items by current user's role
  const allowedNavItems = navItems.filter(item => {
    if (currentUser.role === 'super_admin') return true;
    return item.roles.includes(currentUser.role);
  });

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {allowedNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Store Location / Owner Card */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 font-bold">
              <span>Smart Point Venture</span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">Dar es Salaam</span>
            </div>
            <div className="truncate text-[10px]">Kinyerezi – Kifuru – Mwanzo Mgumu</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">Mkurugenzi: Awilo Suleiman</div>
          </div>
        </div>
      </aside>
    </>
  );
};
