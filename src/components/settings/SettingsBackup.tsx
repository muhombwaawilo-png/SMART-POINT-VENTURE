import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Settings,
  Download,
  Upload,
  RefreshCw,
  Store,
  Phone,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Sun,
  Moon,
} from 'lucide-react';

export const SettingsBackup: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportDatabaseJSON,
    importDatabaseJSON,
    resetToDemoData,
    language,
    theme,
    setTheme,
    t,
  } = useStore();

  const [name, setName] = useState(settings.name);
  const [owner, setOwner] = useState(settings.owner);
  const [location, setLocation] = useState(settings.location);
  const [phone1, setPhone1] = useState(settings.phone1);
  const [phone2, setPhone2] = useState(settings.phone2);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooterSwahili);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // File import ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      name: name.trim(),
      owner: owner.trim(),
      location: location.trim(),
      phone1: phone1.trim(),
      phone2: phone2.trim(),
      receiptFooterSwahili: receiptFooter.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smart_point_venture_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDatabaseJSON(content);
        if (success) {
          alert(language === 'sw' ? 'Data imerejeshwa kwa mafanikio!' : 'Database restored successfully!');
        } else {
          alert(language === 'sw' ? 'Faili hili haliendani na mfumo!' : 'Invalid backup file format!');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (
      confirm(
        language === 'sw'
          ? 'Je, una uhakika unataka kurejesha data za awali za mfano (Demo Data)? Mabadiliko ya majaribio yatarejeshwa kwenye hali nzuri ya kuanzia.'
          : 'Reset database to realistic Tanzanian demo records?'
      )
    ) {
      resetToDemoData();
      alert('Data za mfano zimerejeshwa kikamilifu!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-emerald-600" />
          <span>{t.settingsTitle}</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {language === 'sw'
            ? 'Taarifa za duka, namba za simu kwenye risiti, na mfumo wa kuhifadhi (Backup & Restore)'
            : 'Configure store contacts, receipt information and manage JSON database backups'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Store Settings Form (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            {language === 'sw' ? 'Taarifa Rasmi za Duka (Store Profile)' : 'Business Profile'}
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Jina la Biashara:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Mkurugenzi (Owner):</label>
                <input
                  type="text"
                  required
                  value={owner}
                  onChange={e => setOwner(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Eneo la Biashara:</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Namba ya Simu 1:</label>
                <input
                  type="text"
                  required
                  value={phone1}
                  onChange={e => setPhone1(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Namba ya Simu 2:</label>
                <input
                  type="text"
                  value={phone2}
                  onChange={e => setPhone2(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Ujumbe wa Mwisho wa Risiti (Footer):</label>
                <input
                  type="text"
                  value={receiptFooter}
                  onChange={e => setReceiptFooter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              {savedSuccess ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Mipangilio imehifadhiwa!
                </span>
              ) : <div />}

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/30 transition"
              >
                Hifadhi Mipangilio
              </button>
            </div>
          </form>
        </div>

        {/* Right: Theme / Appearance & Backup */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-5">
          {/* Appearance: Dark mode / White mode button */}
          <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Mandhari ya Mfumo (Appearance)
              </h3>
              <p className="text-[11px] text-slate-500">
                Chagua kati ya Hali ya Mchana (White Mode) au Hali ya Usiku (Dark Mode).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition cursor-pointer ${
                  theme === 'light'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/30'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-500'
                }`}
              >
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                  <Sun className="h-4 w-4" />
                </div>
                <div className="text-center">
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">White Mode</span>
                  <span className="text-[10px] text-slate-500">Hali ya Mchana</span>
                </div>
                {theme === 'light' && (
                  <span className="text-[10px] font-bold text-emerald-600">✓ Inayotumika</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition cursor-pointer ${
                  theme === 'dark'
                    ? 'border-emerald-500 bg-emerald-950/30 ring-2 ring-emerald-500/30'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-500'
                }`}
              >
                <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 shadow-sm">
                  <Moon className="h-4 w-4" />
                </div>
                <div className="text-center">
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">Dark Mode</span>
                  <span className="text-[10px] text-slate-500">Hali ya Usiku</span>
                </div>
                {theme === 'dark' && (
                  <span className="text-[10px] font-bold text-emerald-400">✓ Inayotumika</span>
                )}
              </button>
            </div>
          </div>

          <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            {language === 'sw' ? 'Usalama & Hifadhi ya Data' : 'Backup & Recovery'}
          </h3>

          {/* Download Backup */}
          <div className="space-y-2">
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
              1. {t.exportData}
            </span>
            <p className="text-[11px] text-slate-500">
              Pakua faili lenye kumbukumbu zote za bidhaa, mauzo, matumizi, madeni na wafanyakazi.
            </p>
            <button
              onClick={handleDownloadBackup}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition"
            >
              <Download className="h-4 w-4 text-emerald-600" />
              <span>Pakua Backup (JSON)</span>
            </button>
          </div>

          {/* Restore Backup */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
              2. {t.importData}
            </span>
            <p className="text-[11px] text-slate-500">
              Rejesha data kutoka kwenye faili la backup ulilopakua awali.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition"
            >
              <Upload className="h-4 w-4 text-blue-600" />
              <span>Pakia Faili la Backup</span>
            </button>
          </div>

          {/* Reset Demo Data */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="font-bold text-xs text-rose-600 dark:text-rose-400 block">
              3. {t.resetDemo}
            </span>
            <p className="text-[11px] text-slate-500">
              Hurejesha data zote kwenye hali safi ya mfano wa SMART POINT VENTURE (Kinyerezi).
            </p>
            <button
              onClick={handleResetDemo}
              className="w-full py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-800/40 flex items-center justify-center gap-2 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Rejesha Data za Mfano</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
