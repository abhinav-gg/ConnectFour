// src/routes/authRoutes.ts
import { dbOperations } from '@/db/operations';
import { Request, Response, Router } from 'express';
import { authenticateSession, authenticateSessionRedirect } from './lib/auth/middleware';
import { GameMode } from '@shared/Models/gameInfo';
import { ICHacker } from '@shared/Models/eventInfo';
import { register } from 'module';
import { ICHACK25 } from '@shared/events';



// discord stuff
const ICHACK_DISCORD_CLIENT_ID = process.env.ICHACK_DISCORD_CLIENT_ID || '';
const ICHACK_DISCORD_CLIENT_SECRET = process.env.ICHACK_DISCORD_CLIENT_SECRET || '';
const ICHACK_DISCORD_REDIRECT_URI = process.env.ICHACK_DISCORD_REDIRECT_URI || '';
const MY_ICHACK_API_KEY = process.env.MY_ICHACK_API_KEY || '';
const CLIENT_URL = process.env.CLIENT_URL || 'https://con4.uk';

const eventRouter = Router();

// Prefix: /api/events


eventRouter.get('/ichack25/discord', authenticateSessionRedirect, async (req: Request, res: Response) => {

    try { 
        const code = req.query.code as string;
        const userId = (req as any).user?.userId;
        const current = await dbOperations.getUserByID(userId);
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
            throw new Error(`HTTP error! status: ${tokenResponse.status}`);
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
            throw new Error(`HTTP error! status: ${userResponse.status}`);
        }
    
        const user = await userResponse.json();
        
        console.log('User ID:', user.id);
        user.id = '211186900386578432'

        const ichackResponse = await fetch(`https://my.ichack.org/api/profile/discord/${user.id}`, {
            method: 'GET', 
            headers: {
            'Authorization': MY_ICHACK_API_KEY
            }
        });

        if (!ichackResponse.ok) {
            // get 404 response only
            if (ichackResponse.status === 404) {
                res.redirect(`${CLIENT_URL}/events/ichack25?error=not-ichack`);
                return;
            }
            throw new Error(`HTTP error! status: ${ichackResponse.status}`);
        } else {
            const ichackData: ICHacker = await ichackResponse.json();
            console.log(ichackData); 

            // Register the user to the event
            try {

                await dbOperations.registerForEvent(userId, ICHACK25);
    
                await dbOperations.registerToICHACK25(ichackData, user.id);
    
                res.redirect(`${CLIENT_URL}/events/ichack25?success=true`);
            }
            catch (error) {
                console.error('Error during registration:', error);
                throw error;
            }
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
    const lb = await GetLeaderboard(gamemode, '');
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