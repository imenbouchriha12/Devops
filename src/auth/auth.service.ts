// src/auth/auth.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
async register(registerDto: RegisterDto) {
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
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
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
  async login(user: User): Promise<{ access_token: string; refresh_token: string }> {
    return this.generateTokens(user);
  }

  // ─── Refresh Token ───────────────────────────────────────────────────────
  async refreshTokens(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
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
    return this.generateTokens(tokenRecord.user);
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

    // ── Trouver le business_id lié à cet utilisateur ─────────────────
    let business_id: string | null = null;

    try {
      const tenant = await this.tenantsRepository.findOne({
        where: { ownerId: user.id },
      });

      if (tenant) {
        const business = await this.businessesRepository.findOne({
          where: { tenant_id: tenant.id },
          order: { created_at: 'ASC' },
        });
        if (business) {
          business_id = business.id;
        }
      }
    }  catch (error: any) {
  console.warn('Could not resolve business_id for JWT payload:', error?.message);
}

    // ── Construire le payload JWT ─────────────────────────────────────
    const payload = {
      sub:         user.id,
      email:       user.email,
      role:        user.role,
      business_id: business_id,  // null pour PLATFORM_ADMIN
    };

    const access_token = this.jwtService.sign(payload, {
      secret:    this.configService.get<string>('JWT_ACCESS_SECRET')!,
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRY') as any,
    });

    // ── Refresh token (stocké en DB) ──────────────────────────────────
    const refresh_token = uuidv4();
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 7); // 7 jours

    await this.refreshTokenRepo.save({
      token:   refresh_token,
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

    const token = uuidv4();
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + 1); // 1 hour

    await this.resetTokenRepo.save({
      token,
      user_id: user.id,
      type: TokenType.PASSWORD_RESET,
      expires_at,
    });

    // ✅ NEW: Send actual email instead of console.log
    await this.emailService.sendPasswordResetEmail(user.email, token, user.name);
  }
  // ─── Reset Password ──────────────────────────────────────────────────────
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenRecord = await this.resetTokenRepo.findOne({
      where: { token, type: TokenType.PASSWORD_RESET },
      relations: ['user'],
    });

    if (!tokenRecord || tokenRecord.is_used || tokenRecord.expires_at < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const password_hash = await bcrypt.hash(newPassword, 12);
    await this.usersService.updateUser(tokenRecord.user.id, {
      ...tokenRecord.user,
      password_hash,
    });

    await this.resetTokenRepo.update(tokenRecord.id, { is_used: true });
  }
}