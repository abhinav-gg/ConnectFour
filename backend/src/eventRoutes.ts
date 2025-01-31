// src/routes/authRoutes.ts
import { dbOperations } from '@/db/operations';
import { Request, Response, Router } from 'express';



// discord stuff
const ICHACK_DISCORD_CLIENT_ID = process.env.ICHACK_DISCORD_CLIENT_ID || '';
const ICHACK_DISCORD_CLIENT_SECRET = process.env.ICHACK_DISCORD_CLIENT_SECRET || '';
const ICHACK_DISCORD_REDIRECT_URI = process.env.ICHACK_DISCORD_REDIRECT_URI || '';
const ICHACK_DISCORD_API_KEY = process.env.ICHACK_DISCORD_API_KEY || '';

const eventRouter = Router();

eventRouter.get('/ichack25/discord', async (req: Request, res: Response) => {

    try {
        const code = req.query.code as string;
    
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
        // call ICH database here
        
        const ichackResponse = await fetch(`https://my.ichack.org/api/profile/discord/${user.id}`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
            token: ICHACK_DISCORD_API_KEY
            }).toString()
        });

        if (!ichackResponse.ok) {
            // get 404 response only
            if (ichackResponse.status === 404) {
            res.status(404).json({ error: 'User not found' });
            return;
            }
            throw new Error(`HTTP error! status: ${ichackResponse.status}`);
        } else {
            const ichackData = await ichackResponse.json();
            console.log(ichackData); 
        }
    } catch (error) {
        console.error('Error during authentication:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});


