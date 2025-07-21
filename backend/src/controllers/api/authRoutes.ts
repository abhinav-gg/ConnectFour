// src/routes/authRoutes.ts
import { NextFunction, Router, Request, Response } from 'express';
import { authenticateAdmin, authenticateSession, verifyRecaptcha, requireUnauthenticated } from '@/lib/auth/middleware';
import { authService } from '@/services/auth.service';
import { ServiceResponse, UserSessionTTL, GoogleTokenResponse, UserAccountProvider } from '@/types/custom';
import { myConfig } from '@/config/env';
import { User } from '@/db/models/User';
import { hashPassword } from '@/lib/auth/auth';
import { validatePassword, validateUsername } from '@/shared/utils/validation';
import { UserOperations } from '@/db/rds/repositories/userOps';
import { EmailDoesNotExist } from '@/types/dbErrors';

const authRouter = Router();

// Registration Route
authRouter.post('/register', verifyRecaptcha, async (req: Request, res: any) => {

  const { username, email, password } = req.body as { username: string, email: string, password: string; };
  const usernameNormalised = username.trim().toLowerCase();
  const emailNormalised = email.trim().toLowerCase();
  const passwordNormalised = password.trim();

  if (!validateUsername(usernameNormalised)) {
    return res.status(400).json({ error: 'Invalid Username' });
  }
  if (!validatePassword(passwordNormalised)) {
    return res.status(400).json({ error: 'Invalid Username' });
  }
  const pwdHash =  await hashPassword(passwordNormalised);

  try {
    const u: User = authService.parseUser(usernameNormalised, emailNormalised, UserAccountProvider.Local, pwdHash)

    const resp = await authService.registerUser(u)

    if (resp.status !== 200) {
      return res.status(resp.status).json({ error: resp.message });
    }

    return res.status(200) // over to the frontend to ask for the verification code
    
  } catch (error) {
    // commented out as too verbose
    // console.log(error);
    return res.status(400).json({ error: 'Invalid input' });
  }

    return res.status(500).json({ error: 'Failed to create user' });
  // }
});

// Login Route
authRouter.post('/login', verifyRecaptcha, async (req: Request, res: any) => {
  const { usernameEmail, password } = req.body;
  
  const result: ServiceResponse = await authService.loginLocalUser(usernameEmail, password)
  if (result.status !== 200) {
    return res.status(result.status).json({ error: result.message });
  }
  else {
    res.cookie('sessionToken', result.message, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 1000 * UserSessionTTL, // in milliseconds
    });
    res.json({ status: 'Success' });
  }
});

// TODO: stop bots from creating multiple anonymous users
authRouter.get('/anonymous', verifyRecaptcha, requireUnauthenticated, async (req: Request, res: Response) => {
  // Create a new user called Anonymous
  // Add security to prevent multiple anonymous users by bots
  console.log("Creating anonymous user");
  try {
    const sessionToken = await authService.makeAnonymousSession();

    res.cookie('sessionToken', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 1000 * UserSessionTTL, // in milliseconds
    });

    res.json({ status: 'Success' });
  } catch (error) {
    console.error('Failed to login:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

// Profile Route
authRouter.get('/profile', authenticateSession, async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const user = await authService.getUserProfile(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);

  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

authRouter.get('/has-session', authenticateSession, (req: any, res: Response) => {
  res.json({ message: 'You are authenticated!', user: req.user });
});

authRouter.post('/logout', authenticateSession, async (req: Request, res: Response): Promise<void> => {
  // If the user is authenticated, proceed to clear the session token cookie
  const userId = (req as any).user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
  }
  try {

    await authService.logoutUser(userId); // Revoke the session token
    res.clearCookie('sessionToken'); // Clear the session token cookie
    res.json({ status: 'Success' }); // Return success response
  }
  catch (error) {
    console.error('Failed to logout:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

authRouter.get('/isadmin', authenticateSession, authenticateAdmin, async (req: Request, res: Response, next: NextFunction) => {
  res.json({ isAdmin: true });
});

authRouter.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Test endpoint' });
});


authRouter.get("/google/callback", async (req: Request, res: Response): Promise<void> => {
  const code = req.query.code as string;

  if (!code) {
    res.status(400).send("Missing code");
    return;
  }
  let userInfo;
  try {
    // 1. Exchange code for tokens
    // Use fetch with method 'POST' to exchange code for tokens
    const params = new URLSearchParams({
      client_id: myConfig.GOOGLE_CLIENT_ID!,
      client_secret: myConfig.GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: myConfig.GOOGLE_CLIENT_REDIRECT_URI!, 
    });
    console.log(1)
    const tokenResRaw = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!tokenResRaw.ok) {
      throw new Error(`Failed to fetch token: ${tokenResRaw.statusText}`);
    }
    console.log(2)
    const tokenResData = (await tokenResRaw.json()) as GoogleTokenResponse;

    const { access_token, id_token } = tokenResData;

    // 2. Get user info
    const userInfoRaw = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    userInfo = await userInfoRaw.json();
    console.log("User Info:", userInfo);
    
    if (!userInfo) {
      throw new Error()
    }


  } catch (error) {
    console.error("Error during Google OAuth callback:", error);
    res.status(500).send("Internal Server Error");
    return;
  }

  const { email, verified_email } = userInfo as {
    email: string;
    verified_email: boolean;
  };
    
  // 3. Check if user exists
  try {

    if (!verified_email) {
      res.status(400).send("Issue verifying user email");
      return;
    }

    const user = await UserOperations.getUserByEmail(email);

    if (user.mail_provider !== UserAccountProvider.Google) {
      res.status(500).send("Account exists from other mail provider");
      return;
    }
    
    // 4. If user exists, create session (east peasy authService)
    await authService.loginGoogleUser(email);

    res.redirect('/profile'); 
    return;

  } catch (error) {
    if (error instanceof EmailDoesNotExist) {
      
      // register the email here

      // 5. If user does not exist, create a new user with google provider
      
  

    }
    throw error;
  }

});



export default authRouter;



