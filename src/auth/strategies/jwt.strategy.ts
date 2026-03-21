// src/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // The ! at the end tells TypeScript "I guarantee this is not undefined"
      // It will crash at runtime if JWT_ACCESS_SECRET is missing from .env,
      // which is exactly what you want — fail loud, fail early.
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

async validate(payload: { sub: string; email: string; role: string; business_id: string | null }): Promise<any> {
  const user = await this.usersService.findById(payload.sub);
  if (!user) {
    return null;
  }
  return {
    ...user,
    business_id: payload.business_id,  // ← ajout : disponible dans tous les controllers
  };
}
}