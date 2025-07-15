// src/routes/authRoutes.ts
import { NextFunction, Router, Request, Response } from 'express';
import { authenticateAdmin, authenticateSession, verifyRecaptcha, requireUnauthenticated } from '@/lib/auth/middleware';
import { authService } from '@/services/auth.service';
import { ServiceResponse, UserSessionTTL } from '@/types/custom';

const authRouter = Router();

// Registration Route
authRouter.post('/register', verifyRecaptcha, async (req: Request, res: any) => {
  // const { username, email, password } = req.body as { username: string, email: string, password: string; };
  // const usernameNormalised = username.trim().toLowerCase();
  // const emailNormalised = email.trim().toLowerCase();
  // const passwordNormalised = password.trim();

  // const schema = z.object({
  //   username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_.]*$/),
  //   email: z.string().email(),
  //   password: z.string().min(8).max(1024),
  // }); // RegistrationUserSchema

  // try {
  //   schema.parse({ username: usernameNormalised, email: emailNormalised, password: passwordNormalised });
  // } catch (error) {
  //   // commented out as too verbose
  //   // console.log(error);
  //   return res.status(400).json({ error: 'Invalid input' });
  // }

  // // check against disallowed usernames
  // if (disallowedUsernames.has(usernameNormalised)) {
  //   return res.status(400).json({ error: 'Username is already taken' });
  // }

  // try {
  //   const passwordHash = await hashPassword(passwordNormalised);
  //   const result = await dbOperations.createUser(usernameNormalised, emailNormalised, passwordHash);
  //   const sessionToken = await createSession(result.id);

  //   res.cookie('sessionToken', sessionToken, {
  //     httpOnly: true,
  //     secure: true,
  //     sameSite: 'strict',
  //     maxAge: 1000 * 60 * 60 * 24 * 7,
  //   });

  //   return res.json({ status: 'Success', data: result });
  // } catch (error) {
  //   console.error('Failed to create user:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  // }
});

// Login Route
authRouter.post('/login', verifyRecaptcha, async (req: Request, res: any) => {
  const { usernameEmail, password } = req.body;
  
  const result: ServiceResponse = await authService.loginUser(usernameEmail, password)
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


// dotenv.config();

// const app = express();
// const port = 3000;

// // Google OAuth2 client
// const oauth2Client = new OAuth2Client(
//   process.env.GOOGLE_CLIENT_ID,
//   process.env.GOOGLE_CLIENT_SECRET,
//   process.env.GOOGLE_REDIRECT_URI
// );

// // Redirect user to Google's OAuth2 consent screen
// app.get('/auth/google', (req: Request, res: Response) => {
//   const url = oauth2Client.generateAuthUrl({
//     access_type: 'offline',
//     scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
//   });
//   res.redirect(url);
// });

// // Callback endpoint: handles the code from Google and exchanges it for an access token
// app.get('/auth/google/callback', async (req: Request, res: Response) => {
//   const code = req.query.code as string;

//   if (!code) {
//     return res.status(400).json({ error: 'Code missing from Google callback' });
//   }

//   try {
//     // Exchange authorization code for tokens
//     const { tokens } = await oauth2Client.getToken(code);
//     oauth2Client.setCredentials(tokens);

//     // Use the access token to get user info
//     const ticket = await oauth2Client.verifyIdToken({
//       idToken: tokens.id_token!,
//       audience: process.env.GOOGLE_CLIENT_ID, // Ensure the ID token is for your app
//     });

//     const payload = ticket.getPayload();
//     if (payload) {
//       // Here, you can save the user info to your database and create a session for the user
//       res.json({
//         user: {
//           id: payload.sub,
//           name: payload.name,
//           email: payload.email,
//           picture: payload.picture,
//         },
//       });
//     } else {
//       res.status(400).json({ error: 'Failed to get user information from ID token' });
//     }
//   } catch (error) {
//     console.error('Error while exchanging code for token:', error);
//     res.status(500).json({ error: 'Failed to authenticate with Google' });
//   }
// });

export default authRouter;



