
import { rdsDBOps } from '@/db/rds/ops';
import { redisOps } from '@/redis/ops';
import { RESERVED_USERNAMES } from '@shared/reserved_usernames';
import { ServiceResponse } from '@/types/custom';
import { UserAccountProvider } from "@shared/types/users";
import { hashPassword, verifyPassword } from '@/lib/auth/auth';
import { generateSessionToken } from '@/lib/auth/auth';
import { UserProfile } from '@shared/types/users';
import { UserTags } from '@shared/constants/usertags';
import { generateVerificationCode } from '@/utils/validation';
import { sendEmailVerifyCode } from '@/lib/email/verifyCodes';
import { EmailSendError } from '@/types/miscErrors';
import { RegUser, User, UserSchema } from '@/db/models/User';
import { UsernameExists } from '@/types/dbErrors';
import { UUID } from 'crypto';
import { RedisSchema } from '@/redis/redisSchema';

const disallowedUsernames = new Set(RESERVED_USERNAMES);
const userDbOps = rdsDBOps.user;

export const userService = {
  
  
  async getUserProfile(sessionId: string): Promise<UserProfile> { 
    const redisOp = await redisOps();
    const userId = await redisOp.user.getSession(sessionId);
    if (!userId) {
      throw new Error('Invalid or expired session token');
    }
    const user = await userDbOps.getUserByID(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      username: user.username,
      pfp: user.profile_pic
    } as UserProfile;
  },

  async deleteUserAccount(uuid: UUID): Promise<ServiceResponse> {

    // TODO change to set is_deleted to true

    return { status: 200, message: 'Deleted' };
  },


};
