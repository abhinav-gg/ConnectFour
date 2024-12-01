import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { UserService } from '../services/userService';
import { validateEmail, validatePassword, validateUsername } from '@/utils/validation';

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

      // Create user and generate token
      const { user, token } = await this.authService.register({ 
        email, 
        password, 
        name: username 
      });

      res.status(201).json({ 
        token,
        user: user.toSafeObject()
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Error registering user' });
    }
  };
}