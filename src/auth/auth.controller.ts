// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  Response,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { Roles } from './decorators/roles.decorators';
import { RolesGuard } from './guards/roles.guard';
import { Role } from '../users/enums/role.enum';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── POST /auth/register ─────────────────────────────────────────────────
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto, @Response({ passthrough: true }) res) {
    const tokens = await this.authService.register(dto);
    
    // Set HTTP-only cookies
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Access token cookie (15 minutes)
    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });
    
    // Refresh token cookie (7 days)
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    
    // Return user payload
    return {
      user: tokens.user,
    };
  }

  // ─── POST /auth/login ────────────────────────────────────────────────────
  // AuthGuard('local') triggers LocalStrategy.validate() automatically.
  // If validation passes, it puts the user on req.user.
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  async login(@Request() req, @Response({ passthrough: true }) res) {
    const tokens = await this.authService.login(req.user);
    
    // Set HTTP-only cookies
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Access token cookie (15 minutes)
    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    });
    
    // Refresh token cookie (7 days)
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
    
    // Return user payload (not tokens)
    return {
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
      },
    };
  }

  // ─── POST /auth/refresh ──────────────────────────────────────────────────
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() req, @Response({ passthrough: true }) res) {
    const refreshToken = req.cookies?.refresh_token;
    
    if (!refreshToken) {
      // Clear cookies and return 401
      res.clearCookie('access_token');
      res.clearCookie('refresh_token', { path: '/auth/refresh' });
      throw new BadRequestException('Refresh token not found');
    }
    
    try {
      const tokens = await this.authService.refreshTokens(refreshToken);
      
      // Set new access token cookie
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('access_token', tokens.access_token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });
      
      // Return user payload from new access token
      return {
        user: tokens.user,
      };
    } catch (error) {
      // Clear cookies on error
      res.clearCookie('access_token');
      res.clearCookie('refresh_token', { path: '/auth/refresh' });
      throw error;
    }
  }

  // ─── POST /auth/logout ───────────────────────────────────────────────────
  // You must be logged in (have a valid access token) to logout.
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  async logout(@Request() req, @Response({ passthrough: true }) res) {
    const refreshToken = req.cookies?.refresh_token;
    
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    
    // Clear both cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token', { path: '/auth/refresh' });
    
    return { message: 'Logged out successfully' };
  }

  // ─── GET /auth/me ────────────────────────────────────────────────────────
  // Returns the currently logged-in user's info. Frontend uses this on page load.
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Request() req) {
    // Don't send the password_hash to the frontend, ever.
    const { password_hash, ...safeUser } = req.user;
    return safeUser;
  }

  // ─── GET /auth/roles-demo ────────────────────────────────────────────────
  // A demo endpoint to test that RBAC works. Only PLATFORM_ADMIN can hit this.
  @Get('roles-demo')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PLATFORM_ADMIN)
  async rolesDemoAdmin() {
    return { message: 'You are a Platform Administrator. RBAC works.' };
  }

  // ─── GET /auth/roles-demo-owner ──────────────────────────────────────────
  // Demo: Only BUSINESS_OWNER or PLATFORM_ADMIN can access.
  @Get('roles-demo-owner')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PLATFORM_ADMIN, Role.BUSINESS_OWNER)
  async rolesDemoOwner() {
    return { message: 'You are a Business Owner or Admin. RBAC works.' };
  }

  // ─── GET /auth/roles-demo-any ────────────────────────────────────────────
  // Demo: Any authenticated user can access (no @Roles decorator = all roles).
  @Get('roles-demo-any')
  @UseGuards(AuthGuard('jwt'))
  async rolesDemoAny(@Request() req) {
    return {
      message: `Logged in as ${req.user.name}. Your role is: ${req.user.role}`,
    };
  }
  // ─── PATCH /auth/profile ─────────────────────────────────────────────────
  @Patch('profile')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    const { password_hash, ...safeUser } = await this.authService.updateProfile(
      req.user.id,
      dto,
    );
    return safeUser;
  }

  // ─── POST /auth/verify-email ─────────────────────────────────────────────
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto.token);
    return { message: 'Email verified successfully' };
  }

  // ─── POST /auth/forgot-password ──────────────────────────────────────────
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { message: 'If that email exists, a reset link has been sent' };
  }

  // ─── POST /auth/reset-password ───────────────────────────────────────────
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password reset successfully' };
  }

  // ─── POST /auth/change-password ──────────────────────────────────────────
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
    return { message: 'Password changed successfully' };
  }
}