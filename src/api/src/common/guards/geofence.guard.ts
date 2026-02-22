import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class GeofenceGuard implements CanActivate {
  // Mocked list of subnets/IPs for legally restricted jurisdictions (e.g., "Any Chance" states)
  private readonly BANNED_SUBNETS = [
    '198.51.100.0/24', // Example Mock
    '203.0.113.0/24'   // Example Mock
  ];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const clientIp = request.ip || request.connection.remoteAddress;

    // In a production environment, this would evaluate the subnet via a fast Trie or CDN header (CF-Connecting-IP)
    const isBanned = this.BANNED_SUBNETS.some(subnet => clientIp?.startsWith(subnet.split('/')[0].slice(0, -1)));

    if (isBanned || clientIp === '198.51.100.42') {
      throw new ForbiddenException(
        'Styx Protocol is legally restricted in your jurisdiction. Geofencing enforcement active.'
      );
    }

    return true;
  }
}
