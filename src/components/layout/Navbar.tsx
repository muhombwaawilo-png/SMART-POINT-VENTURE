import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Store,
  Bell,
  Sun,
  Moon,
  Globe,
  UserCheck,
  ShieldAlert,
  Wifi,
  WifiOff,
  Clock,
  LogOut,
  ChevronDown,
  X,
  AlertTriangle,
  Package,
  DollarSign,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    settings,
    currentUser,
    setCurrentUser,
    users,
    logout,
    language,
    setLanguage,
    t,
    theme,
    setTheme,
    toggleTheme,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setActiveTab,
    isOnline,
    formatTZS,
  } = useStore();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Live Tanzanian clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZone: 'Africa/Dar_es_Salaam',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadNotifications = notifications.filter(n => !n.isRead);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Super Admin</span>;
      case 'manager':
        return <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Meneja</span>;
      case 'cashier':
        return <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Muuza Duka</span>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand info */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-base sm:text-lg">
                  {settings.name}
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded border border-amber-300 dark:border-amber-700/50">
                  DAR ES SALAAM
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
                {language === 'sw' ? settings.taglineSwahili : settings.tagline}
              </p>
            </div>
          </div>

          {/* Center / Right tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Clock & Connection */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-mono">{currentTime}</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <div className="flex items-center gap-1">
                {isOnline ? (
                  <>
                    <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-[11px] text-amber-600 dark:text-amber-400">Local Mirror</span>
                  </>
                )}
              </div>
            </div>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'sw' ? 'en' : 'sw')}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
              title={language === 'sw' ? 'Badili kuwa Kiingereza' : 'Switch to Swahili'}
            >
              <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold">{language === 'sw' ? 'SW' : 'EN'}</span>
            </button>

            {/* Dark Mode & White Mode Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/90'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
                title="Hali ya Mchana (White Mode)"
              >
                <Sun className={`h-3.5 w-3.5 ${theme === 'light' ? 'text-amber-500' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">White Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-white shadow-sm border border-slate-700'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
                title="Hali ya Usiku (Dark Mode)"
              >
                <Moon className={`h-3.5 w-3.5 ${theme === 'dark' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">Dark Mode</span>
              </button>
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 text-[10px] font-bold bg-rose-500 text-white rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">
                      {t.systemAlerts} ({unreadNotifications.length})
                    </span>
                    {unreadNotifications.length > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                      >
                        Soma zote
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                        Hakuna taarifa mpya kwa sasa
                      </div>
                    ) : (
                      notifications.slice(0, 6).map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markNotificationRead(notif.id);
                            if (notif.linkTab) setActiveTab(notif.linkTab);
                            setShowNotifications(false);
                          }}
                          className={`p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition flex items-start gap-3 ${
                            !notif.isRead ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                          }`}
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            {notif.type === 'low_stock' || notif.type === 'out_of_stock' ? (
                              <Package className="h-4 w-4 text-amber-500" />
                            ) : notif.type === 'cash_shortage' ? (
                              <AlertTriangle className="h-4 w-4 text-rose-500" />
                            ) : (
                              <DollarSign className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                              {notif.title}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Active User Switcher Badge */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
              >
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80'}
                  alt={currentUser.name}
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-emerald-500"
                />
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {currentUser.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] leading-tight flex items-center gap-1">
                    {getRoleBadge(currentUser.role)}
                    {currentUser.employeeNumber && (
                      <span className="font-mono text-slate-400">({currentUser.employeeNumber})</span>
                    )}
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* User switcher dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.currentUser}:</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        {t[currentUser.role]}
                      </p>
                      {currentUser.employeeNumber && (
                        <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 font-bold">
                          {currentUser.employeeNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  {users.length > 1 && (
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="px-2 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Akaunti za Mfumo:
                      </p>
                      {users.map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setCurrentUser(u);
                            setShowUserMenu(false);
                            if (u.role === 'cashier') {
                              setActiveTab('excel');
                            }
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition ${
                            u.id === currentUser.id
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <img src={u.avatarUrl} alt={u.name} className="h-6 w-6 rounded-full object-cover" />
                            <div className="text-left">
                              <div>{u.name}</div>
                              <div className="text-[10px] text-slate-400">
                                {u.employeeNumber || t[u.role]}
                              </div>
                            </div>
                          </div>
                          {u.id === currentUser.id && <UserCheck className="h-3.5 w-3.5 text-emerald-600" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Explicit Logout Option */}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{t.logout || 'Ondoka Kwenye Mfumo (Log Out)'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Logout Button */}
            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/60 transition"
              title="Ondoka kwenye mfumo (Log Out)"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="text-[11px]">Ondoka</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
