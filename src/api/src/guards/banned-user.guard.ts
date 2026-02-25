import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Pool } from 'pg';

/**
 * BannedUserGuard: Prevents banned users from accessing protected endpoints.
 * 
 * Applied to contract creation and other mutation endpoints to ensure
 * users permanently exiled by ModerationService cannot create new contracts
 * or interact with the platform.
 * 
 * Usage in controller:
 *   @UseGuards(AuthGuard, BannedUserGuard)
 *   @Post()
 *   async createContract(@Request() req) { ... }
 */
@Injectable()
export class BannedUserGuard implements CanActivate {
  constructor(private readonly pool: Pool) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.user?.sub;

    if (!userId) {
      // No authenticated user — let AuthGuard handle this
      return true;
    }

    const result = await this.pool.query(
      'SELECT status FROM users WHERE id = $1',
      [userId],
    );

    if (result.rows.length === 0) {
      throw new ForbiddenException('User account not found.');
    }

    if (result.rows[0].status === 'BANNED') {
      throw new ForbiddenException(
        'Your account has been permanently suspended. Contact support for details.',
      );
    }

    return true;
  }
}
