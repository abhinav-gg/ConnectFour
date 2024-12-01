import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '@/models/User';
import { UserService } from './userService';

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_EXPIRES_IN = '24h';
  private readonly userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  private hashPassword(password: string): string {
    return crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');
  }

  private generateToken(userId: string): string {
    return jwt.sign({ userId }, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN
    });
  }

  async register(userData: { email: string; password: string; name: string }) {
    const existingUser = await this.userService.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = this.hashPassword(userData.password);
    
    const user = await this.userService.createUser({
      ...userData,
      password: hashedPassword
    });

    const token = this.generateToken(user.id);
    return { token, user };
  }
}
