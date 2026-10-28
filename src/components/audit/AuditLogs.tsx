import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { ShieldCheck, Search, Calendar, User, Filter, AlertCircle } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const { auditLogs, language, t } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQ =
        !q ||
        log.action.toLowerCase().includes(q) ||
        log.actionSwahili.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q);

      const matchesAct = selectedAction === 'all' || log.action === selectedAction;

      return matchesQ && matchesAct;
    });
  }, [auditLogs, searchQuery, selectedAction]);

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <span>{t.auditTitle}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.auditSubtitle}
          </p>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Jumla ya Matukio Yaliyorekodiwa: <strong className="text-slate-900 dark:text-white font-mono">{auditLogs.length}</strong>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tafuta kwenye kumbukumbu (mfano: Asha, Mauzo, Kughairi, Stoo)..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3.5">Muda & Tarehe</th>
                <th className="py-3 px-3.5">Mhusika (User)</th>
                <th className="py-3 px-3.5">Wadhifa</th>
                <th className="py-3 px-3.5">Kitendo (Action)</th>
                <th className="py-3 px-3.5">Maelezo Kamili (Audit Details)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3.5 text-slate-500 font-mono whitespace-nowrap">
                    <div>{log.date}</div>
                    <div className="text-[10px] text-slate-400">{log.time}</div>
                  </td>
                  <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    {log.userName}
                  </td>
                  <td className="py-3 px-3.5 text-slate-500 capitalize">
                    {t[log.userRole] || log.userRole}
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {log.actionSwahili}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 leading-relaxed max-w-md">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
