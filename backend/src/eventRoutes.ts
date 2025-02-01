// src/routes/authRoutes.ts
import { dbOperations } from '@/db/operations';
import { Request, Response, Router } from 'express';
import { authenticateSession } from './lib/auth/middleware';
import { GameMode } from '@shared/Models/gameInfo';
import { ICHacker, ICHackLeaderboardPlayer } from '@shared/Models/eventInfo';
import { register } from 'module';
import { ICHACK25 } from '@shared/events';
import { getUserFromSession } from './lib/auth';
import cors from 'cors';

// discord stuff
const ICHACK_DISCORD_CLIENT_ID = process.env.ICHACK_DISCORD_CLIENT_ID || '';
const ICHACK_DISCORD_CLIENT_SECRET = process.env.ICHACK_DISCORD_CLIENT_SECRET || '';
const ICHACK_DISCORD_REDIRECT_URI = process.env.ICHACK_DISCORD_REDIRECT_URI || '';
const MY_ICHACK_API_KEY = process.env.MY_ICHACK_API_KEY || '';
const CLIENT_URL = process.env.CLIENT_URL || 'https://con4.uk';

const eventRouter = Router();

eventRouter.use(cors({
    origin: CLIENT_URL, // Uses the existing CLIENT_URL env variable
    credentials: true,  // Important! This allows cookies to be sent
  }));

// Prefix: /api/events


eventRouter.post('/ichack25/discord', authenticateSession, async (req: Request, res: Response) => {

    try { 

        const user = (req as any).user?.userId; // Get the session token from the request cookies
        // console.log(req, user)
        if (!user) {
            res.status(403).json({ error: 'User not found' });
            return;
        }
        try {
          
            const code = req.body.code;

            const current = await dbOperations.getUserByID(user);
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
                console.log("Disc OAuth resp:", await tokenResponse.text());
                throw new Error(`Discord OAuth HTTP error! status: ${tokenResponse.status}`);
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
                console.log("Disc API resp:", await userResponse.text());
                throw new Error(`Discord API HTTP error! status: ${userResponse.status}`);
            }
        
            const discordUserInfo = await userResponse.json();
            
            // ioc: debug
            console.log('User ID:', discordUserInfo.id);
            discordUserInfo.id = '582906581470019598' // ivannnn

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
                // console.log("ICH resp:", await ichackResponse.text());
                // console.log("used key: ", MY_ICHACK_API_KEY);
                throw new Error(`ICH HTTP error! status: ${ichackResponse.status}`);
            } else {
                const ichackData: ICHacker = await ichackResponse.json();
                ichackData.user_id = user; // ioc: check

                // Register the user to the event
                try {

                    await dbOperations.registerForEvent(user, ICHACK25);
        
                    await dbOperations.registerToICHACK25(ichackData, discordUserInfo.id);
        
                    res.status(200).json({ message: 'Successfully registered for ICHACK25' });
                }
                catch (error) {
                    console.error('Error during registration:', error);
                    throw error;
                }
            }
          } catch (err) {
            // console.log("discord auth error:", err);
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
        console.log("no user")
        res.status(403).json({ error: 'User not found' });
        return;
    } 

    // verify the user is ICH
    const isICH = await dbOperations.isMemberOfEvent(user.id, ICHACK25);
    if (!isICH) {
        console.log("not ich")
        res.status(403).json({ error: 'User is not a member of ICHACK25' });
        return;
    }

    const gamemode = req.body.gamemode;

    if (!gamemode) {
        res.status(500).json({ error: 'Invalid Data' });
        return;
    }
    if (gamemode.event !== ICHACK25) {
        res.status(403).json({ error: 'Invalid event' });
        return;
    }

    gamemode.event = ''; // I gave up
    const lb = await GetLeaderboard(gamemode, '');
    // console.log(lb);

    // convert to ICHackLeaderboardPlayer
    try {

        const allICH = await dbOperations.getAllICHackers();
        const output = []
        let rank = 1;
        for (let i = 0; i < lb.length; i++) {
            const player = lb[i];
            const user = await dbOperations.getUserByUsername(player.username);
            const foundICH = allICH.find((ich: ICHacker) => ich.user_id === user.id);
            if (!foundICH)
                continue;
            output.push({
                rank: rank++,
                username: player.username,
                elo: Math.round(player.elo),
                fullname: foundICH.name,
                hackspace: foundICH.hackspace,
            } as ICHackLeaderboardPlayer);
        }
        res.json(output).status(200);
    } catch (error) {
        console.error('Failed to get ICHACK25 leaderboard:', error);
        res.status(500).json({ error: 'Failed to get ICHACK25 leaderboard' });
    }
});



export default eventRouter;