import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Mail,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  LogOut,
  RefreshCw,
  FileText,
  User,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  initGmailAuth,
  signInWithGoogleGmail,
  signOutGmail,
  getGmailAccessToken,
  sendGmailEmail,
  auth,
} from '../../services/gmail';
import { User as FirebaseUser } from 'firebase/auth';

interface GmailHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GmailHubModal: React.FC<GmailHubModalProps> = ({ isOpen, onClose }) => {
  const { sales, expenses, settings, formatTZS, language } = useStore();

  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Email form state
  const [toEmail, setToEmail] = useState(settings.notificationEmail || 'colimbajr@gmail.com');
  const [emailSubject, setEmailSubject] = useState('Ripoti ya Biashara - SMART POINT VENTURE');
  const [emailMessage, setEmailMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auth listener
  useEffect(() => {
    const unsubscribe = initGmailAuth(
      (user, accessToken) => {
        setGoogleUser(user);
        setToken(accessToken);
      },
      () => {
        setGoogleUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  // Handle Google Login with official GSI styling
  const handleGoogleLogin = async () => {
    setIsLoadingAuth(true);
    setFeedback(null);
    try {
      const res = await signInWithGoogleGmail();
      if (res) {
        setGoogleUser(res.user);
        setToken(res.accessToken);
        setFeedback({
          type: 'success',
          message: `Umeunganishwa kikamilifu na akaunti ya Google: ${res.user.email}`,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Haikuweza kuunganisha akaunti ya Google.',
      });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleGoogleLogout = async () => {
    await signOutGmail();
    setGoogleUser(null);
    setToken(null);
    setFeedback({
      type: 'success',
      message: 'Umeondoka kwenye Gmail kikamilifu.',
    });
  };

  // Quick report templates
  const applyDailyReportTemplate = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.date === today && s.status === 'completed');
    const totalRev = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalCOGS = todaySales.reduce((sum, s) => sum + s.totalCost, 0);
    const grossProfit = totalRev - totalCOGS;
    const todayExp = expenses.filter(e => e.date === today).reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - todayExp;

    setEmailSubject(`Ripoti ya Mauzo ya Leo (${today}) - SMART POINT VENTURE`);
    setEmailMessage(
`Habari Awilo Suleiman,

Huu hapa ni muhtasari wa mauzo na mwenendo wa biashara ya leo katika SMART POINT VENTURE (Kinyerezi - Kifuru):

• Tarehe: ${today}
• Idadi ya Miamala: ${todaySales.length}
• Jumla ya Mauzo: ${formatTZS(totalRev)}
• Gharama za Mzigo (COGS): ${formatTZS(totalCOGS)}
• Faida ya Mauzo (Gross Profit): ${formatTZS(grossProfit)}
• Matumizi ya Siku: ${formatTZS(todayExp)}
• Faida Halisi (Net Profit): ${formatTZS(netProfit)}

Mfumo unafanya kazi vizuri.
Asante.`
    );
  };

  // Send Email with mandatory user confirmation
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail || !toEmail.includes('@')) {
      alert('Tafadhali weka anwani sahihi ya barua pepe!');
      return;
    }
    if (!emailSubject.trim()) {
      alert('Tafadhali weka mada ya barua pepe!');
      return;
    }

    // MANDATORY Confirmation per Workspace skill
    const confirmed = window.confirm(
      `Unathibitisha kutuma barua pepe hii kwenda kwa: ${toEmail}?\n\nMada: ${emailSubject}`
    );
    if (!confirmed) return;

    setIsSending(true);
    setFeedback(null);

    try {
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #065f46; color: white; padding: 18px 24px;">
            <h2 style="margin: 0; font-size: 18px;">SMART POINT VENTURE</h2>
            <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.9;">Kinyerezi - Kifuru - Mwanzo Mgumu, Dar es Salaam</p>
          </div>
          <div style="padding: 24px; color: #1e293b; line-height: 1.6; white-space: pre-wrap; font-size: 14px;">
${emailMessage}
          </div>
          <div style="background-color: #f8fafc; padding: 12px 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
            Imetumwa kupitia Gmail kutoka Mfumo wa SMART POINT VENTURE.
          </div>
        </div>
      `;

      await sendGmailEmail({
        to: toEmail,
        subject: emailSubject,
        bodyText: emailMessage,
        bodyHtml: htmlBody,
      });

      setFeedback({
        type: 'success',
        message: `Barua pepe imetumwa kikamilifu kwenda kwa ${toEmail}!`,
      });
      setEmailMessage('');
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Hitilafu imetokea wakati wa kutuma barua pepe.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600 text-white shadow-md">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Gmail Hub — SMART POINT VENTURE</span>
                <span className="px-1.5 py-0.5 text-[10px] bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 rounded font-bold">
                  Google Workspace
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tuma ripoti za biashara, risiti za wateja na arifa moja kwa moja kupitia Gmail
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Google Auth Status Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {googleUser ? (
                <>
                  <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow">
                    {googleUser.email ? googleUser.email.charAt(0).toUpperCase() : 'G'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {googleUser.displayName || 'Google Account'}
                      </span>
                      <span className="px-1.5 py-0.2 text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded">
                        Connected
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {googleUser.email}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Akaunti ya Gmail Haijaunganishwa
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Unganisha akaunti ya Google ili kutuma ripoti na risiti
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Auth Action Buttons with official Google button styling */}
            <div>
              {googleUser ? (
                <button
                  type="button"
                  onClick={handleGoogleLogout}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Ondoka (Sign Out)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoadingAuth}
                  className="flex items-center gap-2.5 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm text-xs font-bold text-slate-800 dark:text-slate-100 transition cursor-pointer disabled:opacity-50"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>{isLoadingAuth ? 'Inaunganisha...' : 'Sign in with Google'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Alert feedback */}
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Email Compose Form */}
          <form onSubmit={handleSendEmail} className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tuma Barua Pepe Kupitia Gmail
              </label>
              <button
                type="button"
                onClick={applyDailyReportTemplate}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3" />
                <span>Weka Ripoti ya Leo Kiotomatiki</span>
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Mpokeaji (Email):
                </span>
                <input
                  type="email"
                  required
                  value={toEmail}
                  onChange={e => setToEmail(e.target.value)}
                  placeholder="colimbajr@gmail.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Mada (Subject):
                </span>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Ujumbe (Message Body):
                </span>
                <textarea
                  rows={6}
                  required
                  value={emailMessage}
                  onChange={e => setEmailMessage(e.target.value)}
                  placeholder="Andika taarifa au maelezo unayotaka kutuma..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Uthibitisho wa mtumiaji utaombwa kabla ya barua pepe kutumwa.
              </span>

              <button
                type="submit"
                disabled={isSending || !token}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSending ? 'Inatuma...' : 'Tuma Barua Pepe (Send)'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
