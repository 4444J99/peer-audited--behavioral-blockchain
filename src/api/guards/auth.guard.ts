import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request); // allow-secret
    
    if (!token) {
      throw new UnauthorizedException('Missing Authorization Bearer token');
    }

    // Phase Beta: Mock JWT/Signature validation
    // Future integration: Auth0 or Supabase JWT decoding
    if (token !== 'dev-mock-jwt-token-alpha-omega') {
      throw new UnauthorizedException('Invalid or expired Authentication Token');
    }

    // Attach basic user object to request context 
    // Example: request['user'] = { id: 'uuid-123', roles: ['fury', 'citizen'] }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined; // allow-secret
  }
}
