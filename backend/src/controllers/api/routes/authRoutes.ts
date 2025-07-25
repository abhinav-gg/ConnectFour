// src/routes/authRoutes.ts
import { NextFunction, Router, Request, Response } from 'express';
import { authenticateAdmin, authenticateSession, verifyRecaptcha, requireUnauthenticated } from '@/lib/auth/middleware';
import { authService } from '@/controllers/api/services/auth.service';
import { ServiceResponse, GoogleTokenResponse } from '@/types/custom';
import { UserAccountProvider } from "@shared/types/users";
import { myConfig } from '@config/env';
import { RegUser, User, UserRegistration, UserSchema } from '@/db/models/User';
import { hashPassword } from '@/lib/auth/auth';
import { validatePassword, validateUsername } from '@shared/utils/validation';
import { EmailDoesNotExist } from '@/types/dbErrors';
import { APIResponse } from '@shared/types/Responses';
import jwt from 'jsonwebtoken';
import { RedisSchema } from '@/redis/redisSchema';
import { userService } from '../services/user.service';


const authRouter = Router();

const UserSessionTTL = RedisSchema.session.ttl;

// Registration Route
authRouter.post('/register', verifyRecaptcha, async (req: Request, res: any) => {

  const { username, email, password } = req.body as { username: string, email: string, password: string, mail_provider: UserAccountProvider, picture: string };
  const usernameNormalised = username.trim().toLowerCase();
  const emailNormalised = email.trim().toLowerCase();
  const passwordNormalised = password.trim();

  if (!validateUsername(usernameNormalised)) {
    return res.status(400).json({ error: 'Invalid Username' });
  }

  try {
    let resp: ServiceResponse = { status: 500, message: "" }

    if (!validatePassword(passwordNormalised)) {
      return res.status(400).json({ error: 'Invalid Username' });
    }
    const pwdHash =  await hashPassword(passwordNormalised);
    const u = UserRegistration.parse({
      username: usernameNormalised, 
      email: emailNormalised, 
      mail_provider: UserAccountProvider.Local, 
      password: pwdHash
    })
    resp = await authService.registerUser(u)

    if (resp.status !== 200) {
      return res.status(resp.status).json({ error: resp.message });
    }

    return res.status(200) // over to the frontend to ask for the verification code
    
  } catch (error) {
    return res.status(400).json({ error: 'Invalid input' });
  }

});

// Login Route
authRouter.post('/login', verifyRecaptcha, async (req: Request, res: any) => {
  const { usernameEmail, password } = req.body;
  
  try {
    const result: ServiceResponse = await authService.loginLocalUser(usernameEmail, password)
    
    if (result.status === 401){

      // verify the email and redirect with the code.
      const preVerifyJwt = jwt.sign(
        { email: result.message, provider: UserAccountProvider.Google },
        myConfig.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const params = new URLSearchParams({ jwt: preVerifyJwt });

      res.redirect(`/auth/verify-email?${params.toString()}`)
      return 

    }
    else if (result.status !== 200) {
      return res.status(result.status).json({ success: false, message: result.message } as APIResponse);
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
  }
  catch (error: any) {

  }
});

// Verify Email
authRouter.post('/verify-email', verifyRecaptcha, async (req: Request, res: any) => {
  const { code, token } = req.body;
  
  let payload: any;
  try {
    payload = jwt.verify(token, myConfig.JWT_SECRET) as 
      { email: string; provider: UserAccountProvider };
  
    if (payload.provider !== UserAccountProvider.Local)
      throw new Error()

  } catch {
    return res.status(400).json({ error: 'Invalid Provider' });
  }
  console.log(payload)

  const result: ServiceResponse = await authService.attemptEmailVerification(payload.email, code)

  if (result.status !== 200) {
    return res.status(result.status).json({ success: false, message: result.message } as APIResponse);
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
authRouter.get('/me', authenticateSession, async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const user = await userService.getUserProfile(userId);

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

authRouter.get('/google/start', (req, res) => {
  const queryParams = new URLSearchParams({
    client_id: myConfig.GOOGLE_CLIENT_ID,
    redirect_uri: myConfig.GOOGLE_CLIENT_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${queryParams.toString()}`;
  res.redirect(googleAuthUrl);
});



authRouter.get("/google/callback", async (req: Request, res: Response): Promise<void> => {
  const code = req.query.code as string;

  if (!code) {
    res.status(400).send("Missing code");
    return;
  }
  let userInfo;
  try {
    
    const params = new URLSearchParams({
      client_id: myConfig.GOOGLE_CLIENT_ID,
      client_secret: myConfig.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: myConfig.GOOGLE_CLIENT_REDIRECT_URI, 
    });
    
    const tokenResRaw = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    
    if (!tokenResRaw.ok) {
      const errorJson = await tokenResRaw.json();
      console.error('Google OAuth error:', errorJson);
      throw new Error(`Failed to fetch token: ${tokenResRaw.statusText}`);
    }

    console.log("passed")
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

  const { email, verified_email, picture } = userInfo as {
    email: string;
    verified_email: boolean;
    picture: string;
  };

  // I know this looks wrong but its actually optimal
  const htmlPattern = (token?: string | null) => `
  <!DOCTYPE html>
  <html>
    <head><title>Signing In...</title></head>
    <body>
      <script>
        // Ensure window.opener exists (opened via window.open)
        if (window.opener) {
          window.opener.postMessage({
            type: 'oauth-${token ? 'register' : 'login'}',
            token: ${JSON.stringify(token)},
          }, '${myConfig.CLIENT_URL}');
          window.close();
        } else {
          document.body.innerText = 'Could not complete login. Please close this window.';
        }
      </script>
    </body>
  </html>
`;
    
  // 3. Check if user exists
  try {
    if (!verified_email) {
      res.status(400).send("Issue verifying user email");
      return;
    }

    // 4. If user exists, create session (east peasy authService) 
    const sessionToken = await authService.loginGoogleUser(email);
    
    // Set the secure session cookie
    res.cookie('sessionToken', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 1000 * UserSessionTTL, // in milliseconds
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlPattern());
    return;

  } catch (error: any) {

    if (error instanceof EmailDoesNotExist) {
      console.log("Error Received")
      const preSignupToken = jwt.sign(
        { email, picture, provider: UserAccountProvider.Google },
        myConfig.JWT_SECRET,
        { expiresIn: '1h' }
      );

        res.setHeader('Content-Type', 'text/html');
        res.send(htmlPattern(preSignupToken));
        return;

    }
    throw error;
  }

});

// Registration Route
authRouter.post('/google/register', verifyRecaptcha, async (req: Request, res: any) => {

  const { username, token } = req.body as { username: string, token: string };
  let payload: any;
  try {
    payload = jwt.verify(token, myConfig.JWT_SECRET) as 
      { email: string; picture: string; provider: UserAccountProvider };
  
    if (payload.provider !== UserAccountProvider.Google)
      throw new Error()

  } catch {
    return res.status(400).json({ error: 'Invalid Provider' });
  }
  console.log(payload)
  const usernameNormalised = username.trim().toLowerCase();
  const emailNormalised = payload.email.trim().toLowerCase();
  const profile_pic = payload.picture;

  if (!validateUsername(usernameNormalised)) {
    return res.status(400).json({ error: 'Invalid Username' });
  }

  try {
    let resp: ServiceResponse = { status: 500, message: "" }
    let u: RegUser = UserRegistration.parse({
        username: usernameNormalised, 
        email: emailNormalised, 
        mail_provider: UserAccountProvider.Google, 
        profile_pic,
        password_hash: null
      })
    
    resp = await authService.registerUser(u)

    if (resp.status !== 200) {
      return res.status(resp.status).json({ success:false, message: resp.message } as APIResponse);
    }

    await authService.loginGoogleUser(emailNormalised);

    res.redirect('/profile'); 
    
  } catch (error: any) {
    console.error(error)
    return res.status(500).json({ error: "Server Error" });
  }
});



export default authRouter;



