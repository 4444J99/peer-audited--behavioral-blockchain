import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Request } from 'express';
import { CompliancePolicyService } from '../../modules/compliance/compliance-policy.service';

@Injectable()
export class GeofenceGuard implements CanActivate {
  private readonly logger = new Logger(GeofenceGuard.name);

  constructor(private readonly compliancePolicy: CompliancePolicyService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const decision = this.compliancePolicy.evaluateRequestPolicy(request);

    if (decision.missingLocation) {
      this.logger.warn({
        msg: 'Missing geolocation headers during geofence evaluation',
        path: request.originalUrl || request.url,
        method: request.method,
        hasCfIpState: !!request.headers['cf-ipstate'],
        hasCloudfrontViewerCountryRegion: !!request.headers['cloudfront-viewer-country-region'],
        failOpen: this.compliancePolicy.shouldFailOpenOnMissingLocation(),
      });
    }

    if (decision.overrideIgnoredInProduction) {
      this.logger.warn({
        msg: 'Ignored x-styx-state geofence override header in production',
        path: request.originalUrl || request.url,
        method: request.method,
      });
    }

    if (!decision.allowed) {
      throw new ForbiddenException({
        code: decision.code,
        message: decision.message,
        requiredMode: decision.requiredMode,
        jurisdiction: {
          state: decision.state,
          tier: decision.tier,
        },
      });
    }

    return true;
  }
}
