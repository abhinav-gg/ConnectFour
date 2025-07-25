import { z } from 'zod';


// Zod schema for 
export const UserRegistration = z.object({
  username: z.string(),
  email: z.string().email(),
  mail_provider: z.string().length(1),
  profile_pic: z.string().nullable(),
  password_hash: z.string().nullable(),
});


// Zod schema for User
export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email(),
  email_verified: z.boolean(),
  profile_pic: z.string().nullable(),
  password_hash: z.string().nullable(),
  mail_provider: z.string().length(1),
  created_at: z.date(),
  updated_at: z.date(),
  deleted_at: z.date().nullable(),
  last_login: z.date(),
});


// TypeScript types derived from Zod schemas
export type User = z.infer<typeof UserSchema>;
export type RegUser = z.infer<typeof UserRegistration>;
