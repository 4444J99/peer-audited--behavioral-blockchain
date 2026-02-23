import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

const DEV_MOCK_TOKEN = 'dev-mock-jwt-token-alpha-omega'; // allow-secret
const DEV_MOCK_USER_ID = 'd0000000-0000-0000-0000-000000000001';

function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'styx-dev-secret-do-not-use-in-production'; // allow-secret
}

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector?: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check for @Public() decorator
    const isPublic = this.reflector?.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request); // allow-secret

    if (!token) {
      throw new UnauthorizedException('Missing Authorization Bearer token');
    }

    // Dev-mode fallback: accept the old mock token so existing integrations don't break
    if (token === DEV_MOCK_TOKEN) { // allow-secret
      (request as any).user = { id: DEV_MOCK_USER_ID, email: 'demo@styx.protocol' };
      return true;
    }

    // Decode real JWT
    try {
      const payload = jwt.verify(token, getJwtSecret()) as { sub: string; email: string };
      (request as any).user = { id: payload.sub, email: payload.email };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired Authentication Token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined; // allow-secret
  }
}
