
import { rdsDBOps } from '@/db/rds/ops';
import { ServiceResponse } from '@/types/custom';
import { UserProfile, UserAccountProvider } from '@shared/types/users';
import { UUID } from 'crypto';
import { t_GameMode } from '@shared/constants/allgamemodes';
import { EloNotFound } from '@/types/dbErrors';
import { StandardStartingElo } from '@shared/constants/game.constants';
import { getEloGameMode, isEloGameMode } from '@shared/utils/gameinfo';

const userDbOps = rdsDBOps.user;

export const userService = {

  async GetUserByID(uuid: UUID | null): Promise<UserProfile> {
    if (!uuid) {
      return { username: 'Anonymous', isAnonymous: true, isAuthenticated: false };
    }
    const user = await userDbOps.getUserByID(uuid);
    if (!user) {
      return { username: 'Anonymous', isAnonymous: true, isAuthenticated: false };
    }
    return {
      username: user.username,
      pfp: user.profile_pic || undefined,
      isAnonymous: false,
      isAuthenticated: true,
      provider: user.mail_provider as UserAccountProvider,
    };
  },

  async deleteUserAccount(uuid: UUID): Promise<ServiceResponse> {

    // TODO change to set is_deleted to true

    return { status: 200, message: 'Deleted' };
  },


  getOrSetPlayerElo: async (userId: string, gamemode: t_GameMode): Promise<number> => {
    // This function should retrieve the player's Elo rating for the specified game mode.
    // check redis cache first (future improvement)
    let gm = getEloGameMode(gamemode);
    if (!gm) {
      throw new Error("Elo not tracked for this gamemode");
    }
    // if not found, check the database

    try {
      return await rdsDBOps.user.getUserEloByID(userId, gm);
    } catch (error: any) {
      if (error instanceof EloNotFound) {
        // If the Elo rating is not found, initialize it to a default value

        const elo = StandardStartingElo; // Default Elo value (change as needed)

        await rdsDBOps.user.initEloForUser(userId, gm, elo);
        return elo;
      }
      throw error; // Re-throw other errors
    }

  },

  incrUserELO: userDbOps.alterElo.bind(userDbOps),

};
