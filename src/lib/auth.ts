// Authentication utilities for doctor routes

import { cookies } from 'next/headers';
import { getDoctorByEmail } from './db';
import bcrypt from 'bcryptjs';

const SESSION_COOKIE_NAME = 'doctor_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface DoctorSession {
  doctorId: string;
  email: string;
  expiresAt: number;
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function createSession(doctorId: string, email: string): Promise<string> {
  const session: DoctorSession = {
    doctorId,
    email,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS / 1000,
  });

  return JSON.stringify(session);
}

export async function getSession(): Promise<DoctorSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie) return null;

  try {
    const session: DoctorSession = JSON.parse(sessionCookie.value);

    if (session.expiresAt < Date.now()) {
      await clearSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireAuth(): Promise<DoctorSession> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

