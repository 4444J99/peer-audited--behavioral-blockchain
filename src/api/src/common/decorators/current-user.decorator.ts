import { createParamDecorator, ExecutionContext, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../../../guards/auth.guard';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // AU14: fail closed. AuthGuard is not global (only ThrottlerGuard is), so a
    // handler that forgets @UseGuards(AuthGuard) would otherwise receive an
    // undefined user and operate on `undefined.id`, silently bypassing auth.
    // Throwing here guarantees a route can never run with an unauthenticated user.
    if (!request.user) {
      throw new UnauthorizedException('Authentication required');
    }
    return request.user;
  },
);

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
