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

    if (!user?.id) {
      throw new ForbiddenException('Authentication required');
    }

    const result = await this.pool.query(
      'SELECT role FROM users WHERE id = $1',
      [user.id],
    );

    if (result.rows.length === 0) {
      throw new ForbiddenException('User not found');
    }

    const userRole = result.rows[0].role || 'USER';

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(`Role ${userRole} is not authorized. Required: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
