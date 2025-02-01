// src/routes/authRoutes.ts
import { dbOperations } from '@/db/operations';
import { Request, Response, Router } from 'express';
import { authenticateSession } from './lib/auth/middleware';
import { GameMode } from '@shared/Models/gameInfo';
import { ICHacker } from '@shared/Models/eventInfo';
import { register } from 'module';
import { ICHACK25 } from '@shared/events';
import { getUserFromSession } from './lib/auth';

// discord stuff
const ICHACK_DISCORD_CLIENT_ID = process.env.ICHACK_DISCORD_CLIENT_ID || '';
const ICHACK_DISCORD_CLIENT_SECRET = process.env.ICHACK_DISCORD_CLIENT_SECRET || '';
const ICHACK_DISCORD_REDIRECT_URI = process.env.ICHACK_DISCORD_REDIRECT_URI || '';
const MY_ICHACK_API_KEY = process.env.MY_ICHACK_API_KEY || '';
const CLIENT_URL = process.env.CLIENT_URL || 'https://con4.uk';

const eventRouter = Router();

// Prefix: /api/events


eventRouter.post('/ichack25/discord', async (req: Request, res: Response) => {

    try { 

        const token = req.cookies.sessionToken; // Get the session token from the request cookies
        if (!token) {
          console.log('No token found');
          res.status(401).json({ error: 'Session token required' });
          return; // Ensure we return here to avoid further execution
        }
      
        try {
          const decoded = await getUserFromSession(token); // Decode the token
          // check if decoded is promise null and raise error
          if (!decoded.userId) {
            throw new Error('Invalid or expired token');
          }
          else {
            // valid token
            // verify the user is ICH

            const code = req.body.code;
            const con4UserId = decoded.userId;

            const current = await dbOperations.getUserByID(con4UserId);
            if (!current) {
                res.status(400).json({ error: 'User not found' });
                return;
            } else if (current.is_anonymous) {
                res.status(400).json({ error: 'Anonymous user cannot register for events' });
                return;
            }

            if (!code) {
                res.status(400).json({ error: 'Authorization code not provided' });
                return;
            }
        
            // Exchange the authorization code for an access token
            const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                client_id: ICHACK_DISCORD_CLIENT_ID,
                client_secret: ICHACK_DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: ICHACK_DISCORD_REDIRECT_URI,
                }).toString()
            });

            if (!tokenResponse.ok) {
                throw new Error(`Discord OAuth HTTP error! status: ${tokenResponse.status}`);
                console.log(await tokenResponse.text());
            }
        
            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;
        
            // Use the access token to fetch the user's information
            const userResponse = await fetch('https://discord.com/api/users/@me', {
                headers: {
                Authorization: `Bearer ${accessToken}`,
                }
            });
        
            if (!userResponse.ok) {
                throw new Error(`Discord API HTTP error! status: ${userResponse.status}`);
                console.log(await userResponse.text());
            }
        
            const discordUserInfo = await userResponse.json();
            
            // ioc: debug
            console.log('User ID:', discordUserInfo.id);

            const ichackResponse = await fetch(`https://my.ichack.org/api/profile/discord/${discordUserInfo.id}`, {
                method: 'GET', 
                headers: {
                'Authorization': MY_ICHACK_API_KEY
                }
            });

            if (!ichackResponse.ok) {
                // get 404 response only
                if (ichackResponse.status === 404) {
                    res.status(403).json({ error: 'User not found in ICHACK database' });
                    return;
                }
                throw new Error(`ICH HTTP error! status: ${ichackResponse.status}`);
                console.log(await ichackResponse.text());
            } else {
                const ichackData: ICHacker = await ichackResponse.json();
                ichackData.user_id = con4UserId; // ioc: check
                console.log(ichackData);

                // Register the user to the event
                try {

                    await dbOperations.registerForEvent(con4UserId, ICHACK25);
        
                    await dbOperations.registerToICHACK25(ichackData, discordUserInfo.id);
        
                    res.status(200).json({ message: 'Successfully registered for ICHACK25' });
                }
                catch (error) {
                    console.error('Error during registration:', error);
                    throw error;
                }
            }
          }
        } catch (err) {
            console.log("discord auth error:", err);
          res.status(500).json({ error: 'Auth failed' });
          return; // Ensure we return here to avoid further execution
        }
    } catch (error) {
        console.error('Error during authentication:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});




async function GetLeaderboard(gamemode: GameMode, event: string) {
    // Check the gamemode and event and fetch the leaderboard from database
    try {
        const gamemodeId = await dbOperations.GetGameModeID(gamemode);
        return await dbOperations.getLeaderboard(gamemodeId, event);
    } catch (error) {
        console.error('Failed to get leaderboard:', error);
        throw error;
    }
}


eventRouter.post('/get-leaderboard', async (req: Request, res: Response) => {
    // Check the gamemode and event and fetch the leaderboard from database
    const gamemode = req.body.gamemode;
    //const event = req.body.event;
    
    if (!gamemode) {
        res.status(500).json({ error: 'Invalid Data' });
        return;
    }
    
    const lb = (await GetLeaderboard(gamemode, '')).map((player: any) => ({ ...player, elo: Math.round(player.elo) }));
    res.json(lb).status(200);
    return;
});

eventRouter.post('/get-ichack25-leaderboard', authenticateSession, async (req: Request, res: Response) => {
    // extract token
    const token = (req as any).user?.userId;
    const user = await dbOperations.getUserByID(token);
    if (!user) {
        res.status(400).json({ error: 'User not found' });
        return;
    } 

    // verify the user is ICH
    const isICH = await dbOperations.isMemberOfEvent(user.id, ICHACK25);
    if (!isICH) {
        res.status(400).json({ error: 'User is not a member of ICHACK25' });
        return;
    }

    const gamemode = req.body.gamemode;
    const event = req.body.event;
    if (event !== ICHACK25) {
        res.status(400).json({ error: 'Invalid Event' });
        return;
    }

    if (!gamemode) {
        res.status(500).json({ error: 'Invalid Data' });
        return;
    }

    const lb = await GetLeaderboard(gamemode, ICHACK25);

    // convert to ICHackLeaderboardPlayer
    const allICH = await dbOperations.getAllICHackers();
    const ichackLeaderboard = lb.map(async (player: any) => {
        const ich = allICH.find((ich: any) => ich.user_id === player.user_id);
        return {
            rank: player.rank,
            username: player.username,
            name: ich!.name,
            elo: player.elo,
            hackspace: ich!.hackspace
        };
    });

    res.json(ichackLeaderboard).status(200);
    return;
});



export default eventRouter;