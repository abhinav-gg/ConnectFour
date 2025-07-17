import argon2 from 'argon2';
import { randomBytes } from 'crypto';

export function generateSessionToken(): string {
  // 16 bytes = 128 bits random
  return randomBytes(16).toString('base64');
}

export async function hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
}
  
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
}