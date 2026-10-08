/**
 * Who is calling.
 *
 * Production: the client sends a Firebase ID token. We verify it ourselves
 * against Google's published signing keys — no Firebase Admin SDK, which does
 * not run on Workers and is not needed for verification.
 *
 * Local development: when, and only when, the Worker is started with
 * AUTH_MODE=dev, a `Dev <base64 json>` header is accepted so the app can be
 * exercised end to end without a real Firebase project. Nothing in
 * wrangler.jsonc sets AUTH_MODE, so a deploy can never accept dev tokens.
 */

export interface Caller {
  uid: string;
  name: string;
  email: string | null;
  photoUrl: string | null;
}

export class AuthError extends Error {}

const JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

interface Jwk {
  kid: string;
  kty: string;
  n: string;
  e: string;
  alg?: string;
}

let jwksCache: { keys: Map<string, CryptoKey>; expiresAt: number } | null = null;

async function signingKey(kid: string): Promise<CryptoKey> {
  if (!jwksCache || Date.now() > jwksCache.expiresAt || !jwksCache.keys.has(kid)) {
    const res = await fetch(JWKS_URL);
    if (!res.ok) throw new AuthError('Could not fetch Firebase signing keys');
    const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') ?? '')?.[1] ?? 3600);
    const { keys } = (await res.json()) as { keys: Jwk[] };
    const imported = new Map<string, CryptoKey>();
    for (const jwk of keys) {
      imported.set(
        jwk.kid,
        await crypto.subtle.importKey(
          'jwk',
          { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
          { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
          false,
          ['verify']
        )
      );
    }
    jwksCache = { keys: imported, expiresAt: Date.now() + maxAge * 1000 };
  }
  const key = jwksCache.keys.get(kid);
  if (!key) throw new AuthError('Token signed with an unknown key');
  return key;
}

function b64urlDecode(part: string): Uint8Array {
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function decodeJson<T>(part: string): T {
  return JSON.parse(new TextDecoder().decode(b64urlDecode(part))) as T;
}

/** Verifies a Firebase ID token per https://firebase.google.com/docs/auth/admin/verify-id-tokens */
export async function verifyFirebaseToken(token: string, projectId: string): Promise<Caller> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new AuthError('Malformed token');
  const [h, p, s] = parts;

  const header = decodeJson<{ alg: string; kid: string }>(h);
  if (header.alg !== 'RS256' || !header.kid) throw new AuthError('Unexpected token algorithm');

  const ok = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    await signingKey(header.kid),
    b64urlDecode(s),
    new TextEncoder().encode(`${h}.${p}`)
  );
  if (!ok) throw new AuthError('Bad token signature');

  const claims = decodeJson<{
    aud: string;
    iss: string;
    sub: string;
    exp: number;
    iat: number;
    auth_time?: number;
    name?: string;
    email?: string;
    picture?: string;
  }>(p);
  const now = Math.floor(Date.now() / 1000);
  const skew = 60;
  if (claims.aud !== projectId) throw new AuthError('Token is for a different project');
  if (claims.iss !== `https://securetoken.google.com/${projectId}`) throw new AuthError('Wrong issuer');
  if (!claims.sub) throw new AuthError('Token has no subject');
  if (claims.exp < now - skew) throw new AuthError('Token expired');
  if (claims.iat > now + skew) throw new AuthError('Token issued in the future');
  if (claims.auth_time !== undefined && claims.auth_time > now + skew) {
    throw new AuthError('Token auth_time in the future');
  }

  return {
    uid: claims.sub,
    name: claims.name || claims.email?.split('@')[0] || 'W8VR member',
    email: claims.email ?? null,
    photoUrl: claims.picture ?? null,
  };
}

export interface AuthEnv {
  FIREBASE_PROJECT_ID: string;
  AUTH_MODE?: string;
}

export async function authenticate(request: Request, env: AuthEnv): Promise<Caller> {
  const header = request.headers.get('authorization') ?? '';
  const [scheme, value] = header.split(' ', 2);

  if (scheme === 'Bearer' && value) {
    return verifyFirebaseToken(value, env.FIREBASE_PROJECT_ID);
  }

  if (scheme === 'Dev' && value) {
    if (env.AUTH_MODE !== 'dev') throw new AuthError('Dev tokens are disabled');
    const parsed = decodeJson<{ uid?: string; name?: string; email?: string }>(value);
    if (!parsed.uid || !/^[\w.-]{3,128}$/.test(parsed.uid)) throw new AuthError('Bad dev token');
    return {
      uid: parsed.uid,
      name: parsed.name || 'Dev user',
      email: parsed.email ?? null,
      photoUrl: null,
    };
  }

  throw new AuthError('Sign in to use shared features');
}
