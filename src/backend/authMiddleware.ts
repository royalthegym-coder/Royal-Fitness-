import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { GymRelationalDatabase, gymDb, sanitizeString } from './gymDatabase.js';

export type GymRole =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'trainer'
  | 'receptionist'
  | 'dietitian'
  | 'member';

export interface AuthSessionUser {
  userId: string;
  email: string;
  name: string;
  role: GymRole;
  gym_id: string;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthSessionUser;
    }
  }
}

// Signing secret from environment with secure in-memory ephemeral fallback (never hardcoded)
const SESSION_SECRET =
  process.env.SESSION_SECRET?.trim() || crypto.randomBytes(32).toString('hex');

const SESSION_TTL_SECONDS = 12 * 60 * 60; // 12 hours
const revokedTokenIds = new Set<string>();

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  const pad = 4 - (input.length % 4 || 4);
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad === 4 ? 0 : pad);
  return Buffer.from(normalized, 'base64').toString('utf8');
}

export function issueSessionToken(user: {
  userId: string;
  email: string;
  name: string;
  role: GymRole;
  gym_id: string;
}): { token: string; expiresAt: string } {
  const nowSec = Math.floor(Date.now() / 1000);
  const exp = nowSec + SESSION_TTL_SECONDS;
  const jti = crypto.randomBytes(12).toString('hex');
  const payload = {
    jti,
    userId: user.userId,
    email: user.email,
    name: user.name,
    role: user.role,
    gym_id: user.gym_id,
    iat: nowSec,
    exp,
  };
  const headerB64 = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest();
  const sigB64 = base64UrlEncode(sig);
  return {
    token: `${headerB64}.${payloadB64}.${sigB64}`,
    expiresAt: new Date(exp * 1000).toISOString(),
  };
}

export function verifySessionToken(
  token: string
): (AuthSessionUser & { jti?: string }) | null {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const expectedSig = base64UrlEncode(
      crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(`${headerB64}.${payloadB64}`)
        .digest()
    );
    const a = Buffer.from(sigB64);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }
    const payload = JSON.parse(base64UrlDecode(payloadB64));
    const nowSec = Math.floor(Date.now() / 1000);
    if (!payload || typeof payload.exp !== 'number' || payload.exp < nowSec) {
      return null;
    }
    if (payload.jti && revokedTokenIds.has(payload.jti)) {
      return null;
    }
    return {
      jti: payload.jti,
      userId: String(payload.userId || ''),
      email: String(payload.email || ''),
      name: String(payload.name || ''),
      role: payload.role as GymRole,
      gym_id: String(payload.gym_id || 'default_gym'),
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export function revokeSessionToken(token: string): void {
  const verified = verifySessionToken(token);
  if (verified?.jti) {
    revokedTokenIds.add(verified.jti);
    if (revokedTokenIds.size > 5000) {
      const oldest = revokedTokenIds.values().next().value;
      if (oldest) revokedTokenIds.delete(oldest);
    }
  }
}

/**
 * Extracts and cryptographically verifies an optional/required Bearer session token.
 * If a Bearer header IS sent and is malformed, tampered, or expired -> rejects with 401.
 */
export function attachAuthContext(strict = false) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const rawToken = authHeader.slice(7).trim();
      const verified = verifySessionToken(rawToken);
      if (!verified) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired authentication token.',
        });
      }
      req.authUser = verified;
      return next();
    }

    if (strict) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Provide a valid Bearer session token.',
      });
    }

    next();
  };
}

/**
 * Role-based access control + gym-level tenant isolation middleware.
 * Enforced strictly whenever an authenticated session is attached (or when strictAuth=true).
 */
export function requireRoles(
  allowedRoles: GymRole[],
  options: { strictAuth?: boolean } = {}
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.authUser;
    if (!user) {
      if (options.strictAuth) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required for this operation.',
        });
      }
      return next();
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied: role "${user.role}" does not have permission for this action.`,
      });
    }

    // Enforce tenant isolation: non-owner users can only query/mutate their own gym_id
    const requestedGymId = sanitizeString(
      (req.query.gym_id || req.body?.gym_id || req.params?.gymId || '') as string,
      80
    );
    if (
      requestedGymId &&
      user.role !== 'owner' &&
      user.role !== 'admin' &&
      requestedGymId !== user.gym_id
    ) {
      return res.status(403).json({
        success: false,
        error: 'Tenant isolation violation: cannot access another gym workspace.',
      });
    }

    next();
  };
}

// Per-IP login brute-force protection
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function createAuthRouter(db: GymRelationalDatabase = gymDb): Router {
  const router = Router();

  router.post('/login', (req: Request, res: Response) => {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'local';
    const now = Date.now();
    const attempt = loginAttempts.get(ip);
    if (attempt && now < attempt.resetAt && attempt.count >= 15) {
      return res.status(429).json({
        success: false,
        error: 'Too many login attempts. Please retry in 5 minutes.',
      });
    }

    const email = sanitizeString(req.body?.email, 160).toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.',
      });
    }

    const user = db.authenticateUser(email, password);
    if (!user) {
      if (!attempt || now >= attempt.resetAt) {
        loginAttempts.set(ip, { count: 1, resetAt: now + 5 * 60_000 });
      } else {
        attempt.count += 1;
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    loginAttempts.delete(ip);
    const { token, expiresAt } = issueSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      gym_id: user.gym_id,
    });

    db.runTransaction((draft) => {
      draft.audit_logs.unshift({
        id: `AUD-AUTH-${Date.now()}`,
        gym_id: user.gym_id,
        actor: user.email,
        action: 'USER_LOGIN',
        entity_type: 'auth',
        entity_id: user.id,
        details: `${user.name} (${user.role}) signed in.`,
        created_at: new Date().toISOString(),
      });
    });

    return res.json({
      success: true,
      token,
      expiresAt,
      user,
    });
  });

  router.get('/me', attachAuthContext(true), (req: Request, res: Response) => {
    return res.json({
      success: true,
      user: req.authUser,
    });
  });

  router.post('/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      revokeSessionToken(authHeader.slice(7).trim());
    }
    return res.json({ success: true });
  });

  return router;
}
