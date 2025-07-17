
import { rdsDBOps } from '@/db/rds/ops';
import { redisOps } from '@/redis/ops';
import { RESERVED_USERNAMES } from '@shared/reserved_usernames';
import { ServiceResponse, UserSessionTTL } from '@/types/custom';
import { verifyPassword } from '@/lib/auth/auth';
import { generateSessionToken } from '@/lib/auth/auth';
import { UserProfile } from '@shared/types/users';
import { UserTags } from '@shared/constants/usertags';

const disallowedUsernames = new Set(RESERVED_USERNAMES);
const userDbOps = rdsDBOps.user;

export const authService = {
  
  // for complex services that use multiple dbs and logic like registration

  async createSession(userId: string): Promise<string> {
    const redisOp = await redisOps();
    const sessionToken = generateSessionToken();
    try {
      const tok = await redisOp.user.setSession(sessionToken, userId, UserSessionTTL);
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
    try {
      await redisOp.user.setAnonymousSession(sessionToken, UserSessionTTL);
      return sessionToken;
    } catch (error) {
      console.error('Failed to create anonymous session:', error);
      throw new Error('Anonymous session creation failed');
    }
  },

  async getUserProfile(userId: string): Promise<UserProfile> { 
    const redisOp = await redisOps();
    const sessionUserID = await redisOp.user.getSession(userId);
    if (!sessionUserID) {
      throw new Error('Invalid or expired session token');
    }
    const user = await userDbOps.getUserByID(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      username: user.username,
    } as UserProfile;
  },

  async registerUser(username: string, password: string, email: string) {


    // const usernameNormalised = username.trim().toLowerCase();
    // const emailNormalised = email.trim().toLowerCase();
    // const passwordNormalised = password.trim();

    // if (disallowedUsernames.has(usernameNormalised)) {
    //   return { status: 400, message: 'Username is already taken' };
    // }

    // try {
    //   // Validate data with Zod schema
    //   const passwordHash = await hashPassword(passwordNormalised);
    //   // const result = await userDbOps.createUser(usernameNormalised, emailNormalised, passwordHash);
    //   const sessionToken = await createSession(result.id);
      
      



    // } catch (error: Error) {
    //   return { status: 400, message: error.message || 'Invalid input' };
    // }


  },


  async loginUser(usernamEmail: string, password: string): Promise<ServiceResponse> {

    if (!usernamEmail) {
      return { status: 400, message: 'No Username Or Email (honestly Impressive)' };
    } else if (!password) {
      return { status: 400, message: 'No PWD provided' };
    }

    console.log('Login:', usernamEmail);
    usernamEmail = usernamEmail.trim().toLowerCase();
    const isEmail = usernamEmail.includes('@');

    try {
      let fetchedHash: string | null = null;
      if (isEmail) {
        fetchedHash = await userDbOps.getPasswordHashByEmail(usernamEmail);
      } else {
        fetchedHash = await userDbOps.getPasswordHashByUsername(usernamEmail);
      }
  
      if (!fetchedHash) {
        return { status: 400, message: 'User Not Found' };
      }
      else {
        const passwordMatch = await verifyPassword(fetchedHash, password);
        if (!passwordMatch) {
          return { status: 400, message: 'Invalid password' };
        }
      }
  
      const user = await userDbOps.getUserDataByUsername(usernamEmail);
      if (!user) {
        return { status: 404, message: 'User not found' };
      }
  
      const sessionToken = await authService.createSession(user.id);
  
      return { status: 200, message: sessionToken };
  
      
    } catch (error) {
      console.error('Failed to login:', error);
      return { status: 500, message: 'Failed to login' };
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



  async verifyEmail(vCode: number) {
    
  },

  async checkAdministrator(userId: string): Promise<boolean> {
    return await userDbOps.checkForTag(userId, UserTags.ADMIN);
  }



};
