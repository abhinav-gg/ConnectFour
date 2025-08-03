// src/routes/authRoutes.ts
import { NextFunction, Router, Request, Response } from 'express';
import { authenticateAdmin, authenticateSession, verifyRecaptcha, requireUnauthenticated, optionalAuth, AuthenticatedRequest, getReqPlayerUUID, requireReqUserUUID } from '@/lib/auth/middleware';
import { authService } from '@/services/auth.service';
import { ServiceResponse, GoogleTokenResponse } from '@/types/custom';
import { UserAccountProvider } from "@shared/types/users";
import { myConfig } from '@config/env';
import { RegUser, UserRegistration } from '@/db/models/User';
import { hashPassword } from '@/lib/auth/auth';
import { validateEmail, validatePassword, validateUsername } from '@shared/utils/validation';
import { EmailDoesNotExist, EmailExists, UsernameExists } from '@/types/dbErrors';
import { APIResponse } from '@shared/types/Responses';
import { RedisSchema } from '@/redis/redisSchema';
import { userService } from '../../../services/user.service';
import { sendUserToGame } from '@/lib/game.middleware';
import { rdsDBOps } from '@/db/rds/ops';
import { UUID } from 'crypto';


const authRouter = Router();

const UserSessionTTL = RedisSchema.session.ttl;

// Registration Route
authRouter.post('/register/start', requireUnauthenticated, verifyRecaptcha, async (req: Request, res: any) => {

  const { email, mail_provider } = req.body as { email: string, mail_provider: UserAccountProvider };
  const emailNormalised = email.trim().toLowerCase();
  if (mail_provider !== UserAccountProvider.Local) {
    return res.status(400).json({ error: 'Invalid Mail Provider' });
  }

  if (!validateEmail(emailNormalised)) {
    return res.status(400).json({ error: 'Invalid Email' });
  }

  try {
    const user = await rdsDBOps.user.getUserByEmail(emailNormalised);
    // User exists, check verification status
    if (user && user.email_verified) {
      return res.status(400).json({ error: 'Email already registered and verified' });
    }
    // User exists but not verified, send verification code
    const response = await authService.handleEmailVerificationCheck(user);
    console.error(response.message);
    // verify the email and redirect with the code.
    const preVerifyJwt = authService.signJWT(
      { email: user.email, provider: user.mail_provider },
      '1h'
    );

    const params = new URLSearchParams({ jwt: preVerifyJwt });

    res.redirect(`/auth/verify-email?${params.toString()}`);

  } catch {
    // User does not exist, continue
    res.status(200).json({ message: 'User does not exist, proceed' });
  }
});



authRouter.post('/register', requireUnauthenticated, verifyRecaptcha, async (req: Request, res: any) => {

  const { username, email, password, mail_provider } = req.body as { username: string, email: string, password: string, mail_provider: UserAccountProvider };
  const usernameNormalised = username.trim().toLowerCase();
  const emailNormalised = email.trim().toLowerCase();
  const passwordNormalised = password.trim();

  if (mail_provider !== UserAccountProvider.Local) {
    return res.status(400).json({ error: 'Invalid Mail Provider' });
  }
  
  if (!validateUsername(usernameNormalised)) {
    return res.status(400).json({ error: 'Invalid Username' });
  }
  if (!validateEmail(emailNormalised)) {
    return res.status(400).json({ error: 'Invalid Username' });
  }
  if (!validatePassword(passwordNormalised)) {
    return res.status(400).json({ error: 'Invalid Password' });
  }

  try {
    let resp: ServiceResponse = { status: 500, message: "" }

    const pwdHash =  await hashPassword(passwordNormalised);
    const u = UserRegistration.parse({
      username: usernameNormalised, 
      email: emailNormalised, 
      mail_provider: mail_provider, 
      password_hash: pwdHash
    })
    resp = await authService.registerUser(u)

    if (resp.status !== 200) {
      return res.status(resp.status).json({ error: resp.message });
    }

    const  presignupJWT = authService.signJWT(
      { email: emailNormalised, provider: UserAccountProvider.Local },
      '1h'
    );
    // 
    return res.status(200).json({ jwt: presignupJWT }) // over to the frontend to ask for the verification code
    
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }

});

// Login Route
authRouter.post('/login', requireUnauthenticated, verifyRecaptcha, async (req: Request, res: any) => {
  const { usernameEmail, password } = req.body;
  
  try {
    const result: ServiceResponse = await authService.loginLocalUser(usernameEmail, password)
    
    if (result.status === 401){

      // verify the email and redirect with the code.
      const preVerifyJwt = authService.signJWT(
        { email: result.message, provider: UserAccountProvider.Google },
        '24h'
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
    console.error(error)
  }
});

// Verify Email
authRouter.post('/verify-email', requireUnauthenticated, verifyRecaptcha, async (req: Request, res: any) => {
  const { code, token } = req.body;
  
  let payload: any;
  try {
    payload = authService.verifyJWT(token) as 
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

// Profile Route
authRouter.get('/me', optionalAuth, sendUserToGame, async (req: AuthenticatedRequest, res: Response) => {
  
  try {

    const userId = req.identity?.user || req.identity?.anon;
    
    let user = await userService.safeGetUserByID(userId ?? null);

    if (user.username === "Anonymous") {
      
      const sessionToken = await authService.makeAnonymousSession();
      res.cookie('sessionToken', sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 1000 * UserSessionTTL, // in milliseconds
      });
    }

    res.json(user);

  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

authRouter.post('/logout', authenticateSession, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = getReqPlayerUUID(req);
    await authService.logoutUser(userId); // Revoke the session token
    res.clearCookie('sessionToken'); // Clear the session token cookie
    res.json({ status: 'Success' }); // Return success response
  }
  catch (error) {
    console.error('Failed to logout:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

authRouter.get('/isadmin', authenticateSession, authenticateAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  res.json({ isAdmin: false });
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
      const preSignupToken = authService.signJWT(
        { email, picture, provider: UserAccountProvider.Google },
        '1h'
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
    payload = authService.verifyJWT(token) as
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

    res.status(200).json({ message: "Success" });

  } catch (error: any) {
    console.error(error)
    if (error instanceof UsernameExists) {
      return res.status(400).json({ error: 'Username already exists' });
    } else if (error instanceof EmailExists) {
      return res.status(400).json({ error: 'Account already exists' });
    }
    return res.status(500).json({ error: "Server Error" });
  }
});



export default authRouter;



