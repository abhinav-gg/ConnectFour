import { Router } from 'express';
import { AuthController } from './controllers/authController';
import { validateRequest } from './middleware/validateRequest';
import { AuthService } from './services/authService';
import { UserService } from './services/userService';

export class UserRoutes {
  private router: Router;
  private authController: AuthController;

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {
    this.router = Router();
    this.authController = new AuthController(authService, userService);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/register', 
      validateRequest({
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 },
        name: { type: 'string' }
      }),
      this.authController.register
    );

    this.router.post('/login',
      validateRequest({
        email: { type: 'string', format: 'email' },
        password: { type: 'string' }
      }),
      this.authController.login
    );

    // Optional but recommended routes
    this.router.post('/logout', this.authController.logout);
    this.router.post('/refresh-token', this.authController.refreshToken);
    this.router.post('/forgot-password', this.authController.forgotPassword);
    this.router.post('/reset-password', this.authController.resetPassword);
  }

  public getRouter(): Router {
    return this.router;
  }
}
