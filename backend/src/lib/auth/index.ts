import argon2 from 'argon2';
import { dbOperations } from '@/db/operations';
import dotenv from 'dotenv';

dotenv.config();

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

async function generateSessionToken(): Promise<string> {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Buffer.from(bytes).toString('base64');
}

export async function createSession(userId: string): Promise<string> {
  const token = await generateSessionToken();
  await dbOperations.createUserSession(userId, token);
  return token;
}

export async function revokeSession(token: string): Promise<void> {
  await dbOperations.revokeSessionByToken(token);
}

export async function getUserFromSession(token: string): Promise<{ userId: string | null; }> {
  return { userId: await dbOperations.getUserFromSession(token) };
}