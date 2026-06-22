import { createHmac } from 'crypto';
import type { NextRequest } from 'next/server';

export const ADMIN_COOKIE = 'bf_admin';
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET not configured');
  return s;
}

export function signAdminToken(email: string): string {
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + EXPIRY_MS })).toString('base64url');
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token: string): string | null {
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac('sha256', secret()).update(payload).digest('base64url');
  if (sig !== expected) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { email: string; exp: number };
    if (data.exp < Date.now()) return null;
    return data.email;
  } catch {
    return null;
  }
}

export function verifyAdminCookie(req: NextRequest): boolean {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  return !!token && verifyAdminToken(token) !== null;
}
