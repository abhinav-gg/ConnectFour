import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { dbOperations } from '@/db/operations';
import dotenv from 'dotenv';

dotenv.config();

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

export function generateAccessToken(userId: string): string {
  const JWT_SECRET = process.env.JWT_SECRET;
  const JWT_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES;

  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET');
  }

  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN || '15m' });
}

export function generateRefreshToken(userId: string): string {
  const JWT_REFRESH_SECRET = process.env.REFRESH_SECRET;
  const JWT_REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES;

  if (!JWT_REFRESH_SECRET) {
    throw new Error('Missing JWT_REFRESH_SECRET');
  }

  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN || '7d' });
}

export async function verifyAccessToken(token: string): Promise<string | null> {
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET');
  }

  try {
    return jwt.verify(token, JWT_SECRET) as string;
  } catch (err) {
    return null;
  }

}