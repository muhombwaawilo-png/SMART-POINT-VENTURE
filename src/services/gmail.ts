import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// All 14 Workspace Gmail scopes configured for this applet
export const GMAIL_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
];

const provider = new GoogleAuthProvider();
GMAIL_SCOPES.forEach(scope => provider.addScope(scope));

// In-memory token cache (Never stored in localStorage per skill constraints)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Initializes the auth listener to monitor sign-in state
 */
export const initGmailAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

/**
 * Trigger Google Sign-in popup with Gmail scopes
 */
export const signInWithGoogleGmail = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google sign in');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Gmail Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Returns currently cached access token
 */
export const getGmailAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Signs out from Firebase/Google Auth
 */
export const signOutGmail = async () => {
  await firebaseSignOut(auth);
  cachedAccessToken = null;
};

/**
 * Encode raw RFC 2822 email string to base64url format
 */
function encodeBase64Url(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export interface SendEmailParams {
  to: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  cc?: string;
}

/**
 * Send an email via the Gmail REST API
 */
export const sendGmailEmail = async (params: SendEmailParams): Promise<{ id: string; threadId: string }> => {
  if (!cachedAccessToken) {
    throw new Error('Hujaingia kwenye akaunti ya Google/Gmail. Tafadhali bonyeza "Sign in with Google" kwanza.');
  }

  const currentUserEmail = auth.currentUser?.email || 'me';

  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}?=`;
  const boundary = `__smartpoint_${Date.now()}__`;

  let emailContent = [
    `From: SMART POINT VENTURE <${currentUserEmail}>`,
    `To: ${params.to}`,
    params.cc ? `Cc: ${params.cc}` : '',
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    params.bodyText || '',
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    params.bodyHtml || params.bodyText || '',
    '',
    `--${boundary}--`,
  ]
    .filter(line => line !== null && line !== undefined)
    .join('\r\n');

  const raw = encodeBase64Url(emailContent);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gmail API Error: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetch basic user Gmail profile details (emailAddress, messagesTotal)
 */
export const getGmailProfile = async (): Promise<{ emailAddress: string; messagesTotal: number } | null> => {
  if (!cachedAccessToken) return null;

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
    },
  });

  if (!res.ok) return null;
  return res.json();
};
