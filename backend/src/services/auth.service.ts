import { rdsDBOps } from '@/db/rds/ops';
import { redisOps } from '@/redis/ops';
import { RESERVED_USERNAMES } from '@shared/reserved_usernames';
import { ServiceResponse } from '@/types/custom';
import { UserAccountProvider } from "@shared/types/users";
import { generateUUID, verifyPassword } from '@/lib/auth/auth';
import { generateSessionToken } from '@/lib/auth/auth';
import { UserTags } from '@shared/constants/usertags';
import { generateVerificationCode } from '@/lib/auth/auth';
import { sendEmailVerifyCode } from '@/lib/email/verifyCodes';
import { EmailSendError } from '@/types/miscErrors';
import { RegUser, User, UserSchema } from '@/db/models/User';
import { UsernameExists } from '@/types/dbErrors';
import { RedisSchema } from '@/redis/redisSchema';
import { getIdentity } from '@/utils/validation';
import { PlayerIdentity } from '@/types/custom';
import jwt from 'jsonwebtoken';
import { myConfig } from '@config/env';


const disallowedUsernames = new Set(RESERVED_USERNAMES);
const userDbOps = rdsDBOps.user;

export const authService = {
  
  // for complex services that use multiple dbs and logic like registration

  async makeUserSession(userId: string): Promise<string> {
    const redisOp = await redisOps();
    const sessionToken = generateSessionToken();
    try {
      await redisOp.user.setSession(sessionToken, `user:${userId}`);

    } catch (error) {
      console.error('Failed to create session:', error);
      // interesting for debugging/
      throw new Error('Session creation failed');
    }
    return sessionToken;
  },

  async makeAnonymousSession(): Promise<string> {
    const redisOp = await redisOps();
    const sessionToken = generateSessionToken();
    const userId = generateUUID();
    try {
      await redisOp.user.setSession(sessionToken, `anon:${userId}`);
      return sessionToken;
    } catch (error) {
      console.error('Failed to create anonymous session:', error);
      throw new Error('Anonymous session creation failed');
    }
  },


  /**
   * Function to register a user and throw error if it fails from rds
   * @param provider 
   * @param username 
   * @param email 
   * @param pwdHash 
   * @param profilePic 
   * @returns 
   */
  async registerUser(user: RegUser): Promise<ServiceResponse> {

    if (disallowedUsernames.has(user.username)) {
      throw new UsernameExists()
    }
    
    switch (user.mail_provider) {
      case UserAccountProvider.Local: {
        if (!user.password_hash) {
          return { status: 400, message: 'No PWD provided' };
        }
        
        await userDbOps.createUser(user.username, user.email, UserAccountProvider.Local, false, undefined, user.password_hash);
        const resp = await this.sendEmailVerification(user.email, user.username)
        return resp;

      } 
      case UserAccountProvider.Google: {
      
        await userDbOps.createUser(user.username, user.email, UserAccountProvider.Google, true, user.profile_pic!);

      }
    }

    return { status: 200, message: "account added" }

  },

  async loginGoogleUser(email: string): Promise<ServiceResponse> {

    const user = await userDbOps.getUserByEmail(email);
    if (user.mail_provider !== UserAccountProvider.Google)
      return { status: 400, message: "Email is not with google" };

    rdsDBOps.user.recordUserLogin(user.id) // Update Last Login

    const sessionToken = await authService.makeUserSession(user.id);

    return { status: 200, message: sessionToken };
  
  },


  async loginLocalUser(usernamEmail: string, password: string): Promise<ServiceResponse> {

    if (!usernamEmail) {
      return { status: 400, message: 'No Username Or Email (honestly Impressive)' };
    } else if (!password) {
      return { status: 400, message: 'No PWD provided' };
    }

    console.log('Login:', usernamEmail);
    usernamEmail = usernamEmail.trim().toLowerCase();
    const isEmail = usernamEmail.includes('@');

    try {
      let user: User;
      if (isEmail) {
        user = await userDbOps.getUserByEmail(usernamEmail);
      } else {
        user = await userDbOps.getUserByUsername(usernamEmail);
      }

      if (user.mail_provider !== UserAccountProvider.Local)
        return { status: 500, message: 'User signed up with a different provider' };
  
      const passwordMatch = await verifyPassword(user.password_hash!, password);
      if (!passwordMatch) {
        return { status: 400, message: 'Invalid user or password' };
      }

      const handleEmailCheck = await this.handleEmailVerificationCheck(user)
      if (handleEmailCheck.status !== 200) {
        return handleEmailCheck; // Return the email verification status if not verified
      }

      rdsDBOps.user.recordUserLogin(user.id) // Update Last Login

      const sessionToken = await this.makeUserSession(user.id);
  
      return { status: 200, message: sessionToken };
  
      
    } catch (error: any) {
      return { status: 500, message: error.message };
    }
  },
  

  async logoutUser(token: string): Promise<void> {
    const redisOp = await redisOps();
    try {
      await redisOp.user.dropSession(token);
    } catch (error) {
      console.error('Failed to logout:', error);
      const existedSession = await redisOp.user.getSession(token);
      if (!existedSession) {
        // If the session didn't exit, we can assume logout was successful but redis failed?
        return;
      }
      throw new Error('Logout failed');
    }
  },


  checkAdministrator: (userId: string) => userDbOps.checkForTag(userId, UserTags.ADMIN),


  async sendEmailVerification(email: string, username: string): Promise<ServiceResponse> {
    const redisOp = await redisOps();

    const canSend = await this.checkEmailVerifyCodes(email)

    if (!canSend)
      return { status: 400, message: 'Code was sent recently' };

    const vCode = generateVerificationCode();
    
    // send email with vCode
    try {

      sendEmailVerifyCode(vCode, username, email)
      
      await redisOp.user.setEmailCode(email, vCode);
    }
    catch (error: any) {
      console.error('Failed to send email:', error);
      if (error instanceof EmailSendError) {
        return { status: 500, message: 'Failed to send email' };
      }
    }

    return { status: 200, message: 'Email sent and code set' };

  },

  async attemptEmailVerification(email: string, vCode: string): Promise<ServiceResponse> {

    const redis = await redisOps();

    const u = await rdsDBOps.user.getUserByEmail(email)

    if (u.email_verified || u.mail_provider !== UserAccountProvider.Local)
      return { status: 400, message: 'Invalid Action' };

    const valid = await redis.user.validateEmailCode(email, vCode);

    if (valid) {

      await rdsDBOps.user.setEmailVerifiedById(u.id);

      await redis.user.deleteAllEmailVerifyCodes(email); // Delete all active codes for this email

      rdsDBOps.user.recordUserLogin(u.id) // Update Last Login

      const sessionToken = await this.makeUserSession(u.id);
  
      return { status: 200, message: sessionToken };
    }

    else
      return { status: 400, message: 'Email code doesn\'t match' };
  },



  async checkEmailVerifyCodes(email: string): Promise<ServiceResponse> {

    // scan for all of their email verify keys
    const redis = await redisOps();

    const keysWithTTL = await redis.user.getEmailCodeTTLs(email)

    if (keysWithTTL.length === 0)
      return {
        status: 200,
        message: "No valid codes"
      }

    // Get TTLs of all keys
    const ttls = keysWithTTL.map(k => k.ttl);

    const fullTTL = RedisSchema.auth.emailVerification.ttl; // e.g. 86400 seconds (24h)
    const oneMinTTL = fullTTL - 60;       // TTL threshold for keys older than 1 min
    const fiveMinTTL = fullTTL - 300;     // TTL threshold for keys older than 5 min

    const count = ttls.length;

    const success = {
      status: 200,
      message: "New code ready"
    }

    if (count < 5) {
      // Allow if last key TTL is less or equal to oneMinTTL (older than 1 min)
      const maxTTL = Math.max(...ttls);
      if (maxTTL <= oneMinTTL) return success;
    } else {
      // For 5 or more keys: allow if oldest key TTL <= fiveMinTTL (older than 5 min)
      const minTTL = Math.min(...ttls);
      if (minTTL <= fiveMinTTL) return success;
    }

    return {
      status: 400,
      message: "Must wait to request new code"
    }; // otherwise, disallow
  },

  /**
   * Function to handle email verification check for a user
   * This checks if the user's email is verified, and if not, sends a verification email if allowed.
   * @param user User object to check email verification status
   * @returns 
   */
  async handleEmailVerificationCheck(user: User): Promise<ServiceResponse> {
    if (!user.email_verified) {
      const canSendEmail = await this.checkEmailVerifyCodes(user.email)
      if (canSendEmail.status === 200) {

        this.sendEmailVerification(user.email, user.username)
        return { status: 401, message: 'Email not verified, check your email for a verification code' };
        
      } else {
        return { status: 401, message: canSendEmail.message };
      }

    } else {
      return { status: 200, message: 'Email verified' };
    }
  },


  /**
   * Function to validate a session token and return the PlayerIdentity
   * @param token session token to be decoded
   * @returns PlayerIdentity decoded from the stored prefix template (user or anon)
   */
  async validateToken(token: string): Promise<PlayerIdentity> {

    const redisOp = await redisOps(); // Get the Redis connection

    const sessionUserID = await redisOp.user.getSession(token); // Decode the session token

    // check if decoded is promise null and raise error
    if (sessionUserID === null) {
      throw new Error('Invalid or expired token');
    }
    return getIdentity(sessionUserID);

  },

  signJWT: (data: any, expiresIn: string): string => {
    return jwt.sign(
      data, 
      myConfig.JWT_SECRET, 
      { expiresIn, algorithm: 'HS256' } as jwt.SignOptions).toString();
  },

  verifyJWT: (token: string): any => {
    try {
      return jwt.verify(token, myConfig.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (error) {
      throw new Error('Invalid JWT');
    }
  },

};
