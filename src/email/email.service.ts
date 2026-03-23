// src/email/email.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    // Create the email transporter using Gmail
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('GMAIL_USER'),
        pass: this.configService.get<string>('GMAIL_PASS'),
      },
    });
  }

  // ─── Send Email Verification ─────────────────────────────────────────────
  async sendVerificationEmail(to: string, token: string, userName: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    const mailOptions = {
      from: `"SaaS Platform" <${this.configService.get<string>('GMAIL_USER')}>`,
      to,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to SaaS Platform, ${userName}!</h2>
          <p>Thanks for signing up. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link into your browser:<br>
            <a href="${verificationLink}">${verificationLink}</a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 24 hours.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${to}`);
  }

  // ─── Send Password Reset Email ───────────────────────────────────────────
  async sendPasswordResetEmail(to: string, token: string, userName: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"NovEntra" <${this.configService.get<string>('GMAIL_USER')}>`,
      to,
      subject: 'Reset Your NovEntra Password',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">NovEntra</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Business Management Platform</p>
          </div>
          
          <!-- Content -->
          <div style="background-color: white; padding: 40px 30px;">
            <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 24px;">Password Reset Request</h2>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Hi ${userName},</p>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              We received a request to reset your password for your NovEntra account. Click the button below to create a new password:
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 16px 40px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: 600; 
                        font-size: 16px;
                        box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                Reset My Password
              </a>
            </div>
            
            <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
              Or copy and paste this link into your browser:
            </p>
            <p style="color: #667eea; font-size: 14px; word-break: break-all; margin: 10px 0 0 0;">
              <a href="${resetLink}" style="color: #667eea;">${resetLink}</a>
            </p>
            
            <!-- Warning Box -->
            <div style="background-color: #fff5f5; border-left: 4px solid #fc8181; padding: 15px; margin: 30px 0; border-radius: 4px;">
              <p style="color: #c53030; font-size: 14px; margin: 0; font-weight: 600;">⏱️ This link will expire in 1 hour</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #a0aec0; font-size: 13px; margin: 0 0 10px 0;">
              If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.
            </p>
            <p style="color: #cbd5e0; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} NovEntra. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${to}`);
  }

  // ─── Send Welcome Email (after verification) ────────────────────────────
  async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    const mailOptions = {
      from: `"SaaS Platform" <${this.configService.get<string>('GMAIL_USER')}>`,
      to,
      subject: 'Welcome to SaaS Platform!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome aboard, ${userName}! 🎉</h2>
          <p>Your email has been verified successfully. You're all set to start using SaaS Platform.</p>
          <p>Here's what you can do next:</p>
          <ul style="line-height: 1.8;">
            <li>Set up your business profile</li>
            <li>Create your first invoice</li>
            <li>Invite team members</li>
            <li>Track expenses</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.configService.get<string>('FRONTEND_URL')}/dashboard" 
               style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If you have any questions, feel free to reach out to our support team.
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${to}`);
  }
}