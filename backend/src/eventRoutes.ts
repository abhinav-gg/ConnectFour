// src/routes/authRoutes.ts
import { dbOperations } from '@/db/operations';
import { Request, Response, Router } from 'express';
import { authenticateSession, authenticateSessionRedirect } from './lib/auth/middleware';
import { GameMode } from '@shared/Models/gameInfo';
import { ICHacker } from '@shared/Models/eventInfo';



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
        const leaderboard = await dbOperations.getLeaderboard(gamemodeId, event);
        return leaderboard;
    } catch (error) {
        console.error('Failed to get leaderboard:', error);
        throw error;
    }
}


eventRouter.get('/get-leaderboard', async (req: Request, res: Response) => {
    // Check the gamemode and event and fetch the leaderboard from database
    const gamemode = req.body.gamemode;
    if (!gamemode) {
        res.status(500).json({ error: 'Invalid Data' });
        return;
    }
    const lb = await GetLeaderboard(gamemode, '');
});


eventRouter.get('/get-ichack25-leaderboard', authenticateSession, async (req: Request, res: Response) => {
    // extract token
    const token = (req as any).user?.userId;

    
    const gamemode = req.body.gamemode;
    const event = req.body.event;
    if (!gamemode) {
        res.status(500).json({ error: 'Invalid Data' });
        return;
    }

    // verify the user is ICH


    const lb = await GetLeaderboard(gamemode, '');
});



export default eventRouter;