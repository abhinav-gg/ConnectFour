
import { rdsDBOps } from '@/db/rds/ops';
import { redisOps } from '@/redis/ops';
import { RESERVED_USERNAMES } from '@shared/reserved_usernames';
import { ServiceResponse, UserAccountProvider, UserSessionTTL } from '@/types/custom';
import { hashPassword, verifyPassword } from '@/lib/auth/auth';
import { generateSessionToken } from '@/lib/auth/auth';
import { UserProfile } from '@shared/types/users';
import { UserTags } from '@shared/constants/usertags';
import { generateVerificationCode } from '@/utils/validation';
import { sendEmailVerifyCode } from '@/lib/email/verifyCodes';
import { EmailSendError } from '@/types/miscErrors';
import { User, UserSchema } from '@/db/models/User';
import { UsernameExists } from '@/types/dbErrors';

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

  parseUser(username: string, email: string, provider: UserAccountProvider, pwd?: string, pfp?: string): User {
    const user = UserSchema.parse({
      username,
      email,
      password: pwd,
      profile_pic: pfp,
      mail_provider: provider
    });
    return user;
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
  async registerUser(user: User): Promise<ServiceResponse> {

    if (disallowedUsernames.has(user.username)) {
      throw new UsernameExists()
    }
    
    switch (user.mail_provider) {
      case UserAccountProvider.Local: {
        if (!user.password_hash) {
          // no pwd in local mode is a failure
          return { status: 400, message: 'No PWD provided' };
        }
        
        await userDbOps.createUser(user.username, user.email, UserAccountProvider.Local, false, undefined, user.password_hash);

      } 
      case UserAccountProvider.Google: {
      
        await userDbOps.createUser(user.username, user.email, UserAccountProvider.Google, true, user.profile_pic!);

      }

    }

    return { status: 200, message: "account added" }

  },

  async loginGoogleUser(email: string): Promise<ServiceResponse> {

    try {
      const user = await userDbOps.getUserByEmail(email);

      const sessionToken = await authService.createSession(user.id);
  
      return { status: 200, message: sessionToken };
  
      
    } catch (error) {
      console.error('Failed to login:', error);
      return { status: 500, message: 'Failed to login' };
    }
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
  
      const passwordMatch = await verifyPassword(user.password_hash!, password);
      if (!passwordMatch) {
        return { status: 400, message: 'Invalid password' };
      }

      else if (!user.email_verified) {
        // the user needs to enter a verification code
        return { status: 400, message: 'Email Has Not Been Verified' }
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


  async checkAdministrator(userId: string): Promise<boolean> {
    return await userDbOps.checkForTag(userId, UserTags.ADMIN);
  },


  async sendEmailVerification(email: string, username: string): Promise<ServiceResponse> {
    const redisOp = await redisOps();
    const vCode = generateVerificationCode();
    
    // send email with vCode
    try {

      sendEmailVerifyCode(vCode, username, email)
      
      await redisOp.user.setEmailVerificationCode(email, vCode);
    }
    catch (error: any) {

      if (error instanceof EmailSendError) {
        return { status: 500, message: 'Failed to send email' };
      }
    }

    return { status: 200, message: 'Email sent and code set' };;

  },

  async attemptEmailVerification(email: string, vCode: number): Promise<void> {


  },

};
