import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser, Public } from './current-user.decorator';
import { IS_PUBLIC_KEY } from '../../../guards/auth.guard';

describe('CurrentUser decorator', () => {
  it('should extract user from request', () => {
    // createParamDecorator stores factory in ROUTE_ARGS_METADATA
    // We test the factory function directly
    class TestController {
      testMethod(@CurrentUser() user: any) {
        return user;
      }
    }

    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'testMethod');
    // metadata is keyed by `decoratorType:paramIndex`
    const key = Object.keys(metadata)[0];
    const factory = metadata[key].factory;

    const mockUser = { id: 'user-1', email: 'test@styx.protocol' };
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
    } as unknown as ExecutionContext;

    const result = factory(undefined, ctx);
    expect(result).toEqual(mockUser);
  });

  it('should return undefined when no user on request', () => {
    class TestController2 {
      testMethod(@CurrentUser() user: any) {
        return user;
      }
    }

    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController2, 'testMethod');
    const key = Object.keys(metadata)[0];
    const factory = metadata[key].factory;

    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    const result = factory(undefined, ctx);
    expect(result).toBeUndefined();
  });
});

describe('Public decorator', () => {
  it('should set IS_PUBLIC_KEY metadata to true', () => {
    class TestController {
      @Public()
      testMethod() {}
    }

    const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, TestController.prototype.testMethod);
    expect(isPublic).toBe(true);
  });
});
