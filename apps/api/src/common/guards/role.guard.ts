import { CanActivate, ExecutionContext, Injectable, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Pool } from 'pg';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly pool: Pool,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Fail closed: an unauthenticated request (AuthGuard not satisfied) must never
    // pass a role check.
    if (!user?.id) {
      throw new ForbiddenException('Authentication required');
    }

    // Read the CURRENT role and status from the DB rather than trusting the JWT
    // claim. Access tokens live ~15m, but a Fury can be demoted (fury.worker:
    // UPDATE users SET role='USER') or a user banned within that window — a stale
    // token claim would otherwise grant privileged access until expiry. Keying off
    // the verified user.id keeps role/ban changes effective immediately.
    const result = await this.pool.query(
      'SELECT role, status FROM users WHERE id = $1',
      [user.id],
    );

    if (result.rows.length === 0) {
      throw new ForbiddenException('User not found');
    }

    if (String(result.rows[0].status || '').toUpperCase() === 'BANNED') {
      throw new ForbiddenException(
        'Your account has been permanently suspended. Contact support for details.',
      );
    }

    const userRole = result.rows[0].role || 'USER';

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(`Role ${userRole} is not authorized. Required: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
