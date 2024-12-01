import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Password Reset Request',
        html: `
          <h1>Password Reset Request</h1>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetLink}">Reset Password</a>
          <p>If you didn't request this, please ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        `,
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendVerificationEmail(to: string, verificationToken: string) {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Verify Your Email',
        html: `
          <h1>Welcome to Connect4!</h1>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationLink}">Verify Email</a>
          <p>If you didn't create an account, please ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
        `,
      });
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }
}

// Create and export a singleton instance
export const emailService = new EmailService();
