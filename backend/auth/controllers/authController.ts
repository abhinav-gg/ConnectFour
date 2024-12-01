import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { UserService } from '../../users/services/userService';
import { validateEmail, validatePassword, validateUsername } from '../../utils/validation';

export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  register = async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;

      // Validate input
      if (!validateUsername(username)) {
        return res.status(400).json({ 
          message: 'Invalid username. Must be 3-20 characters and contain only letters, numbers, and underscores.' 
        });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
      }

      if (!validatePassword(password)) {
        return res.status(400).json({ 
          message: 'Password must be at least 8 characters long and contain at least one number and one letter.' 
        });
      }

      // Check if user exists
      const [existingEmail, existingUsername] = await Promise.all([
        this.userService.findByEmail(email),
        this.userService.findByUsername(username)
      ]);

      if (existingEmail) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      if (existingUsername) {
        return res.status(400).json({ message: 'Username already taken' });
      }

      // Hash password and create user
      const hashedPassword = await this.authService.hashPassword(password);
      const user = await this.userService.create({
        username,
        email,
        password_hash: hashedPassword
      });

      // Generate token
      const token = this.authService.generateToken(user);

      res.status(201).json({ 
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          rapid_elo: user.rapid_elo,
          blitz_elo: user.blitz_elo,
          bullet_elo: user.bullet_elo
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Error registering user' });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Verify credentials
      const user = await this.authService.verifyCredentials(email, password);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Update last login
      await this.userService.updateLastLogin(user.id);

      // Generate token
      const token = this.authService.generateToken(user);

      res.json({ 
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          rapid_elo: user.rapid_elo,
          blitz_elo: user.blitz_elo,
          bullet_elo: user.bullet_elo,
          tags: user.tags
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Error logging in' });
    }
  };

  logout = async (req: Request, res: Response) => {
    try {
      // Optional: Add token to blacklist if implementing token invalidation
      // await this.authService.invalidateToken(req.headers.authorization);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Error logging out' });
    }
  };

  forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const user = await this.userService.findByEmail(email);
      if (!user) {
        // Return success even if email doesn't exist (security best practice)
        return res.json({ message: 'If an account exists, a password reset email will be sent.' });
      }

      // Generate reset token and send email
      const resetToken = await this.authService.generatePasswordResetToken(user.id);
      // await emailService.sendPasswordResetEmail(email, resetToken);

      res.json({ message: 'If an account exists, a password reset email will be sent.' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Error processing request' });
    }
  };
}