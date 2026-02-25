import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare const IS_PUBLIC_KEY = "isPublic";
export declare class AuthGuard implements CanActivate {
    private readonly reflector?;
    constructor(reflector?: Reflector | undefined);
    canActivate(context: ExecutionContext): boolean;
    private extractTokenFromHeader;
}
