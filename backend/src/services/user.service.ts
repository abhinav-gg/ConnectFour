
import { rdsDBOps } from '@/db/rds/ops';
import { ServiceResponse } from '@/types/custom';
import { UserProfile } from '@shared/types/users';
import { UUID } from 'crypto';
import { authService } from './auth.service';
import { GameMode } from '@shared/constants/allgamemodes';
import { EloNotFound } from '@/types/dbErrors';
import { StandardStartingElo } from '@shared/constants/game';

const userDbOps = rdsDBOps.user;

export const userService = {
  
  
  async getUserProfile(sessionId: string): Promise<UserProfile> { 
    
    const identity = await authService.validateToken(sessionId);

    // consider using redis cache for user profiles
    
    if (!identity) {
      throw new Error('Invalid session token');
    } else if (identity.user) {
      const user = await userDbOps.getUserByID(identity.user);
      if (!user) {
        throw new Error('User not found');
      }
      return {
        username: user.username,
        pfp: user.profile_pic
      } as UserProfile;
    } else if (identity.anon) {
      return {
        username: 'Anonymous',
      } as UserProfile;
    } else {
      throw new Error('Invalid identity');
    }
  },

  async deleteUserAccount(uuid: UUID): Promise<ServiceResponse> {

    // TODO change to set is_deleted to true

    return { status: 200, message: 'Deleted' };
  },


  async getUserELO(userId: string, gamemode: GameMode): Promise<number> {

    let elo;
    try {
      let elo = await userDbOps.getUserEloByID(userId, gamemode);
    } catch (error: any) {
      if (error instanceof EloNotFound) {
        elo = StandardStartingElo;

        await userDbOps.initEloForUser(userId, gamemode, elo);

      } else {
        throw error;
      }
    }
    return elo!;
  },



  

  incrUserELO: userDbOps.alterElo.bind(userDbOps),

};
