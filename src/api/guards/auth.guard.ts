import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { getJwtSecret } from '../src/modules/auth/auth.service';
import { consumeSseTicket, SseTicketScope } from './sse-ticket.store';

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
      const sseTicketUserId = this.consumeSseTicketForRequest(request);
      if (sseTicketUserId) {
        (request as any).user = { id: sseTicketUserId, email: '' };
        return true;
      }
    }

    if (!token) {
      throw new UnauthorizedException('Missing Authorization Bearer token');
    }

    // Resolve secret outside try/catch so production enforcement errors propagate
    const secret = getJwtSecret();

    // Decode real JWT — single source of truth for secret via auth.service.ts
    try {
      const payload = jwt.verify(token, secret) as { sub: string; email: string };
      (request as any).user = { id: payload.sub, email: payload.email };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired Authentication Token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) {
      return token; // allow-secret
    }

    return undefined;
  }

  private consumeSseTicketForRequest(request: Request): string | null {
    const scope = this.getSseStreamScope(request);
    if (!scope) {
      return null;
    }

    if (!request.query || typeof request.query.ticket !== 'string') {
      return null;
    }

    return consumeSseTicket(request.query.ticket, scope);
  }

  private getSseStreamScope(request: Request): SseTicketScope | null {
    const rawPath = (request.originalUrl || request.path || '').split('?')[0];
    if (rawPath.endsWith('/notifications/stream')) {
      return 'notifications';
    }
    if (rawPath.endsWith('/fury/stream')) {
      return 'fury';
    }
    return null;
  }
}
