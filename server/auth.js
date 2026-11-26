import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { query } from './db.js';

const pbkdf2 = promisify(crypto.pbkdf2);
const COOKIE = 'pizia_session';

function encode(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(value) {
  return crypto.createHmac('sha256', process.env.SESSION_SECRET || 'dev-change-me').update(value).digest('base64url');
}

export function setSession(res, user) {
  const payload = encode(JSON.stringify({ id: user.id, exp: Date.now() + 14 * 24 * 60 * 60 * 1000 }));
  const value = `${payload}.${sign(payload)}`;
  res.cookie(COOKIE, value, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 14 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSession(res) {
  res.clearCookie(COOKIE, { httpOnly: true, sameSite: 'lax', path: '/' });
}

export async function sessionUser(req, _res, next) {
  try {
    const value = req.cookies?.[COOKIE];
    if (!value) return next();
    const [payload, signature] = value.split('.');
    if (!payload || !signature) return next();
    const expected = Buffer.from(sign(payload));
    const supplied = Buffer.from(signature);
    if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) return next();
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.exp < Date.now()) return next();
    const result = await query('SELECT id, username, first_name, email, is_staff, is_superuser FROM auth_user WHERE id = $1 AND is_active = TRUE', [data.id]);
    req.user = result.rows[0] || null;
  } catch {
    req.user = null;
  }
  next();
}

export function requireStaff(req, res, next) {
  if (!req.user?.is_staff) return res.status(401).json({ detail: 'Inicia sesión con una cuenta del personal.' });
  next();
}

export function requireCustomer(req, res, next) {
  if (!req.user || req.user.is_staff) return res.status(401).json({ detail: 'Inicia sesión con tu cuenta de cliente.' });
  next();
}

export async function verifyDjangoPassword(encoded, password) {
  const [algorithm, iterationsText, salt, expected] = String(encoded || '').split('$');
  if (algorithm !== 'pbkdf2_sha256' || !iterationsText || !salt || !expected) return false;
  const iterations = Number(iterationsText);
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > 2_000_000) return false;
  const actual = await pbkdf2(password, salt, iterations, 32, 'sha256');
  const supplied = Buffer.from(expected, 'base64');
  return supplied.length === actual.length && crypto.timingSafeEqual(supplied, actual);
}

export async function encodeDjangoPassword(password) {
  const salt = crypto.randomBytes(12).toString('base64url');
  const iterations = 720_000;
  const hash = await pbkdf2(password, salt, iterations, 32, 'sha256');
  return `pbkdf2_sha256$${iterations}$${salt}$${hash.toString('base64')}`;
}

export { COOKIE };
