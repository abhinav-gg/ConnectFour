
import { rdsDBOps } from '@/db/rds/ops';
import { ServiceResponse } from '@/types/custom';
import { UserProfile } from '@shared/types/users';
import { UUID } from 'crypto';
import { authService } from './auth.service';
import { GameMode } from '@shared/constants/allgamemodes';
import { EloNotFound } from '@/types/dbErrors';
import { StandardStartingElo } from '@shared/constants/game';
import { getIdentity } from '@/utils/validation';

const userDbOps = rdsDBOps.user;

export const userService = {

  async safeGetUserByID(uuid: UUID | null): Promise<UserProfile> {
    if (!uuid) {
      return { username: 'Anonymous' };
    }
    const user = await userDbOps.getUserByID(uuid);
    if (!user) {
      return { username: 'Anonymous' };
    }
    return {
      username: user.username,
      pfp: user.profile_pic || undefined,
    };
  },

  async deleteUserAccount(uuid: UUID): Promise<ServiceResponse> {

    // TODO change to set is_deleted to true

    return { status: 200, message: 'Deleted' };
  },


  getOrSetPlayerElo: async (userId: string, gamemode: GameMode): Promise<number> => {
    // This function should retrieve the player's Elo rating for the specified game mode.
    // check redis cache first (future improvement)

    // if not found, check the database

    try {
      return await rdsDBOps.user.getUserEloByID(userId, gamemode);
    } catch (error: any) {
      if (error instanceof EloNotFound) {
        // If the Elo rating is not found, initialize it to a default value

        const elo = StandardStartingElo; // Default Elo value (change as needed)

        await rdsDBOps.user.initEloForUser(userId, gamemode, elo);
        return elo;
      }
      throw error; // Re-throw other errors
    }

  },

  incrUserELO: userDbOps.alterElo.bind(userDbOps),

};
