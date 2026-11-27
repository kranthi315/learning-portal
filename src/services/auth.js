import { PublicClientApplication } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID;
const authority = import.meta.env.VITE_ENTRA_AUTHORITY || 'https://login.microsoftonline.com/organizations';

export const authMode = clientId ? 'entra' : 'demo';

let client;
let initialization;

function getClient() {
  if (!clientId) {
    throw new Error('Microsoft Entra sign-in is not configured. Set VITE_ENTRA_CLIENT_ID.');
  }

  client ||= new PublicClientApplication({
    auth: {
      clientId,
      authority,
      redirectUri: import.meta.env.VITE_ENTRA_REDIRECT_URI || window.location.origin,
      postLogoutRedirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: 'sessionStorage',
    },
  });

  return client;
}

export function initializeAuth() {
  if (authMode === 'demo') return Promise.resolve(null);
  initialization ||= (async () => {
    const application = getClient();
    await application.initialize();
    const redirectResult = await application.handleRedirectPromise();
    const account = redirectResult?.account || application.getAllAccounts()[0] || null;
    if (account) application.setActiveAccount(account);
    return account;
  })();
  return initialization;
}

export async function signInWithMicrosoft() {
  if (authMode !== 'entra') {
    throw new Error('Microsoft Entra sign-in is unavailable in demo mode.');
  }
  const application = getClient();
  await application.loginRedirect({ scopes: ['openid', 'profile', 'email'] });
}

export async function signOutFromMicrosoft() {
  if (authMode !== 'entra') return;
  const application = getClient();
  const account = application.getActiveAccount();
  await application.logoutRedirect(account ? { account } : {});
}

export async function getApiAccessToken() {
  const apiScope = import.meta.env.VITE_ENTRA_API_SCOPE;
  if (!apiScope) {
    throw new Error('Configure VITE_ENTRA_API_SCOPE to request access to the Azure Functions API.');
  }
  const account = getClient().getActiveAccount();
  if (!account) throw new Error('Sign in before calling the Learning Hub API.');

  const result = await getClient().acquireTokenSilent({ account, scopes: [apiScope] });
  return result.accessToken;
}
