// src/auth/auth.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { PasswordResetToken, TokenType } from './entities/password-reset-token.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { EmailService } from '../email/email.service';
import { Role } from 'src/users/enums/role.enum';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Business } from '../businesses/entities/business.entity';
import { TaxRate } from '../businesses/entities/tax-rate.entity';


@Injectable()
export class AuthService {

constructor(
  private readonly usersService: UsersService,
  private readonly jwtService: JwtService,
  private readonly configService: ConfigService,
  private readonly emailService: EmailService,
  @InjectRepository(RefreshToken)
  private readonly refreshTokenRepo: Repository<RefreshToken>,
  @InjectRepository(PasswordResetToken)
  private readonly resetTokenRepo: Repository<PasswordResetToken>,
  @InjectRepository(User)
  private readonly usersRepository: Repository<User>,
  @InjectRepository(Tenant)
  private readonly tenantsRepository: Repository<Tenant>,
  @InjectRepository(Business)
  private readonly businessesRepository: Repository<Business>,
  @InjectRepository(TaxRate)
  private readonly taxRatesRepository: Repository<TaxRate>,
) {}

  // ─── Called by LocalStrategy during login ─────────────────────────────────
async validateUser(email: string, password: string): Promise<User | null> {
    console.log('=== validateUser called ===');
    console.log('Email received:', email);
    console.log('Password received:', password);

    const user = await this.usersService.findByEmail(email);
    console.log('User found in DB:', user ? 'YES' : 'NO');

    if (!user) {
      console.log('Returning null — user not found');
      return null;
    }

    console.log('Stored password_hash:', user.password_hash);
    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    console.log('Password matches:', passwordMatches);

    if (!passwordMatches) {
      console.log('Returning null — password mismatch');
      return null;
    }

    console.log('Returning user — success');
    return user;
  }

  // ─── Registration ────────────────────────────────────────────────────────
 

// src/auth/auth.service.ts
async register(registerDto: RegisterDto): Promise<{ access_token: string; refresh_token: string; user: any }> {
  // Check if user already exists
  const existingUser = await this.usersRepository.findOne({
    where: { email: registerDto.email },
  });

  if (existingUser) {
    throw new BadRequestException('Email already registered');
  }

  // Use queryRunner for transaction
  const queryRunner = this.usersRepository.manager.connection.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Create the user
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = queryRunner.manager.create(User, {
      email: registerDto.email,
      name: registerDto.name,
      password_hash: hashedPassword,
      phone_number: registerDto.phone_number,
      role: Role.BUSINESS_OWNER,
      is_verified: false,
      is_suspended: false,
    });
    await queryRunner.manager.save(user);

    // 2. Create the tenant
    const tenant = queryRunner.manager.create(Tenant, {
      name: registerDto.tenant.name,
      domain: registerDto.tenant.domain,
      contactEmail: registerDto.tenant.contactEmail || registerDto.email,
      description: registerDto.tenant.description,
      ownerId: user.id,
      settings: {},
      billingPlan: 'free', // Default billing plan
    });
    await queryRunner.manager.save(tenant);

    // 3. Create the business
    const business = queryRunner.manager.create(Business, {
      tenant_id: tenant.id,
      name: registerDto.business.name,
      logo: registerDto.business.logo,
      tax_id: registerDto.business.tax_id,
      currency: registerDto.business.currency || 'TND',
      address: registerDto.business.address,
    });
    await queryRunner.manager.save(business);

    // 4. Create the default tax rate
    const taxRate = queryRunner.manager.create(TaxRate, {
      business_id: business.id,
      name: registerDto.taxRate.name,
      rate: registerDto.taxRate.rate,
      is_default: registerDto.taxRate.is_default,
    });
    await queryRunner.manager.save(taxRate);

    // Commit transaction
    await queryRunner.commitTransaction();

    // 5. Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  } catch (error: any) {
    // Rollback on error
    await queryRunner.rollbackTransaction();
    console.error('Registration error:', error);
    throw new BadRequestException('Failed to register user: ' + (error?.message || 'Unknown error'));
  } finally {
    // Release queryRunner
    await queryRunner.release();
  }
}
  // ─── Login ───────────────────────────────────────────────────────────────
  // This is called AFTER LocalStrategy already validated the user
  async login(user: User): Promise<{ access_token: string; refresh_token: string; user: any }> {
    const tokens = await this.generateTokens(user);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  // ─── Refresh Token ───────────────────────────────────────────────────────
  async refreshTokens(refreshToken: string): Promise<{ access_token: string; refresh_token: string; user: any }> {
    // Find the refresh token in DB
    const tokenRecord = await this.refreshTokenRepo.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    // If not found, revoked, or expired → reject
    if (!tokenRecord || tokenRecord.is_revoked || tokenRecord.expires_at < new Date()) {
      throw new BadRequestException('Invalid or expired refresh token');
    }

    // Revoke the old refresh token (rotation — each refresh gives a new one)
    await this.refreshTokenRepo.update(tokenRecord.id, { is_revoked: true });

    // Issue brand new tokens
    const tokens = await this.generateTokens(tokenRecord.user);
    return {
      ...tokens,
      user: {
        id: tokenRecord.user.id,
        email: tokenRecord.user.email,
        name: tokenRecord.user.name,
        role: tokenRecord.user.role,
      },
    };
  }

  // ─── Logout ──────────────────────────────────────────────────────────────
  async logout(refreshToken: string): Promise<void> {
    const tokenRecord = await this.refreshTokenRepo.findOne({
      where: { token: refreshToken },
    });
    if (tokenRecord) {
      await this.refreshTokenRepo.update(tokenRecord.id, { is_revoked: true });
    }
  }

  // ─── Token Generation (private helper) ──────────────────────────────────
  private async generateTokens(user: User): Promise<{ access_token: string; refresh_token: string }> {
    // Access token payload — this is what gets decoded on every request
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

const access_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET')!,
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRY') as any,
    });

    // Refresh token — stored in DB, long-lived
    const refresh_token = uuidv4();
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRY'); // '7d'
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 7); // 7 days from now

    await this.refreshTokenRepo.save({
      token: refresh_token,
      user_id: user.id,
      expires_at,
    });

    return { access_token, refresh_token };
  }

  // ─── Update Profile ──────────────────────────────────────────────────────
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if email is being changed and if it's already taken
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.usersService.findByEmail(dto.email);
      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }
      user.email = dto.email;
      user.is_verified = false; // New email needs verification
    }

    if (dto.name) {
      user.name = dto.name;
    }

    if (dto.password) {
      user.password_hash = await bcrypt.hash(dto.password, 12);
    }

    return this.usersService.updateUser(userId, user);
  }

  // ─── Verify Email ────────────────────────────────────────────────────────
  async verifyEmail(token: string): Promise<void> {
    const tokenRecord = await this.resetTokenRepo.findOne({
      where: { token, type: TokenType.EMAIL_VERIFICATION },
      relations: ['user'],
    });

    if (!tokenRecord || tokenRecord.is_used || tokenRecord.expires_at < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.usersService.verify(tokenRecord.user.id);
    await this.resetTokenRepo.update(tokenRecord.id, { is_used: true });

    // ✅ NEW: Send welcome email
    await this.emailService.sendWelcomeEmail(tokenRecord.user.email, tokenRecord.user.name);
  }
  // ─── Forgot Password ─────────────────────────────────────────────────────
  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      return; // Silently succeed (don't reveal if email exists)
    }

    // Generate secure random token
    const crypto = await import('crypto');
    const rawToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token before storing
    const hashedToken = await bcrypt.hash(rawToken, 10);
    
    // Set expiry to 1 hour from now
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + 1);

    // Update user with reset token and expiry
    await this.usersRepository.update(user.id, {
      password_reset_token: hashedToken,
      password_reset_expires: expires_at,
    });

    // Send email with raw token (not hashed)
    await this.emailService.sendPasswordResetEmail(user.email, rawToken, user.name);
  }

  // ─── Reset Password ──────────────────────────────────────────────────────
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find all users with non-null reset tokens that haven't expired
    const users = await this.usersRepository.find({
      where: {
        password_reset_token: Not(IsNull()),
      },
    });

    // Find the user whose hashed token matches the provided token
    let matchedUser: User | null = null;
    for (const user of users) {
      if (user.password_reset_token && user.password_reset_expires) {
        // Check if token matches and hasn't expired
        const tokenMatches = await bcrypt.compare(token, user.password_reset_token);
        const notExpired = user.password_reset_expires > new Date();
        
        if (tokenMatches && notExpired) {
          matchedUser = user;
          break;
        }
      }
    }

    if (!matchedUser) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash the new password
    const password_hash = await bcrypt.hash(newPassword, 12);
    
    // Update password and clear reset token fields
    await this.usersRepository.update(matchedUser.id, {
      password_hash,
      password_reset_token: () => 'NULL',
      password_reset_expires: () => 'NULL',
    });
  }

  // ─── Change Password (for logged-in users) ──────────────────────────────
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Find user
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.usersRepository.update(userId, { password_hash });
  }
}