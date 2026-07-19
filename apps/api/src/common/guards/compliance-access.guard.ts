import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { CompliancePolicyService } from '../../modules/compliance/compliance-policy.service';

@Injectable()
export class ComplianceAccessGuard implements CanActivate {
  constructor(private readonly compliancePolicy: CompliancePolicyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: { id?: string } }>();
    const userId = request.user?.id;

    // Fail CLOSED: this guard protects monetized/compliance-gated actions, so a
    // request without an authenticated user must be denied (AuthGuard is expected to
    // run first and populate request.user.id).
    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    const decision = await this.compliancePolicy.evaluateUserComplianceForRequest(request, userId);
    if (!decision.allowed) {
      throw new ForbiddenException({
        code: decision.code,
        message: decision.message,
        requiredMode: decision.requiredMode,
      });
    }

    return true;
  }
}
