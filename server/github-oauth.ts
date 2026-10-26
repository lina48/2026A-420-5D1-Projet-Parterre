type GitHubOAuthConfig = {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  clientOrigin: string;
};

type GitHubProfile = {
  id: number;
  login: string;
  name: string | null;
};

type GitHubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
};

export function getGitHubOAuthConfig(): GitHubOAuthConfig | null {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  const callbackUrl = process.env.GITHUB_OAUTH_CALLBACK_URL?.trim();
  if (!clientId || !clientSecret || !callbackUrl) return null;

  const callback = new URL(callbackUrl);
  if (
    callback.pathname !== '/api/auth/github/callback' ||
    callback.username ||
    callback.password ||
    callback.search ||
    callback.hash
  ) {
    throw new Error('GITHUB_OAUTH_CALLBACK_URL doit cibler /api/auth/github/callback sans paramètres.');
  }
  if (callback.protocol !== 'https:' && callback.hostname !== 'localhost' && callback.hostname !== '127.0.0.1') {
    throw new Error('GITHUB_OAUTH_CALLBACK_URL doit utiliser HTTPS hors développement local.');
  }

  const client = new URL(process.env.CLIENT_ORIGIN ?? 'http://localhost:5173');
  if (client.protocol !== 'https:' && client.hostname !== 'localhost' && client.hostname !== '127.0.0.1') {
    throw new Error('CLIENT_ORIGIN doit utiliser HTTPS hors développement local.');
  }
  if (client.username || client.password || client.search || client.hash) {
    throw new Error('CLIENT_ORIGIN doit être une origine valide, sans identifiants ni paramètres.');
  }

  return { clientId, clientSecret, callbackUrl: callback.toString(), clientOrigin: client.origin };
}

export function buildGitHubAuthorizationUrl(config: GitHubOAuthConfig, state: string) {
  const authorization = new URL('https://github.com/login/oauth/authorize');
  authorization.searchParams.set('client_id', config.clientId);
  authorization.searchParams.set('redirect_uri', config.callbackUrl);
  authorization.searchParams.set('scope', 'read:user user:email');
  authorization.searchParams.set('state', state);
  return authorization.toString();
}

export async function getVerifiedGitHubIdentity(config: GitHubOAuthConfig, code: string) {
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Parterre',
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.callbackUrl,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!tokenResponse.ok) throw new Error(`GitHub token exchange failed with status ${tokenResponse.status}.`);
  const token = await tokenResponse.json() as { access_token?: unknown; token_type?: unknown; error?: unknown };
  if (typeof token.access_token !== 'string' || token.token_type !== 'bearer') {
    throw new Error('GitHub did not return a valid OAuth access token.');
  }

  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token.access_token}`,
    'User-Agent': 'Parterre',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const [profileResponse, emailsResponse] = await Promise.all([
    fetch('https://api.github.com/user', { headers, signal: AbortSignal.timeout(10000) }),
    fetch('https://api.github.com/user/emails', { headers, signal: AbortSignal.timeout(10000) }),
  ]);
  if (!profileResponse.ok) throw new Error(`GitHub profile request failed with status ${profileResponse.status}.`);
  if (!emailsResponse.ok) throw new Error(`GitHub email request failed with status ${emailsResponse.status}.`);

  const profile = await profileResponse.json() as Partial<GitHubProfile>;
  const emails = await emailsResponse.json() as GitHubEmail[];
  const primaryEmail = Array.isArray(emails)
    ? emails.find((email) => email.primary && email.verified && typeof email.email === 'string')
    : undefined;

  if (!Number.isSafeInteger(profile.id) || (profile.id ?? 0) <= 0 || typeof profile.login !== 'string' || !primaryEmail) {
    throw new Error('GitHub profile is missing a stable ID or verified primary email.');
  }

  return {
    githubId: profile.id!,
    name: (typeof profile.name === 'string' && profile.name.trim() ? profile.name : profile.login).trim().slice(0, 120),
    email: primaryEmail.email.trim().toLowerCase(),
  };
}

export function getGitHubRedirectUri(config: GitHubOAuthConfig, fragment: Record<string, string>) {
  const redirect = new URL('/connexion', config.clientOrigin);
  redirect.hash = new URLSearchParams(fragment).toString();
  return redirect.toString();
}
