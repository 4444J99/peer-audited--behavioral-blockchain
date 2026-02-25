import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class GeofenceGuard implements CanActivate {
  // Restricted jurisdictions: Arizona (AZ), Arkansas (AR), Delaware (DE), Louisiana (LA), Maryland (MD),
  // Michigan (MI), Montana (MT), South Carolina (SC), South Dakota (SD), Tennessee (TN).
  // These states have strict "Skill Gaming" or "Fantasy Sports" regulations that Styx may not yet be compliant with.
  private readonly BLOCKED_REGIONS = ['AZ', 'AR', 'DE', 'LA', 'MD', 'MI', 'MT', 'SC', 'SD', 'TN'];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = request.ip || request.headers['x-forwarded-for'] || request.socket.remoteAddress;
    
    // In production, we would use a real GeoIP database (e.g., MaxMind).
    // For now, we simulate this by checking for a specific test header or mock behavior.
    
    // MOCK: Check for X-Simulated-Region header to test geofencing
    const simulatedRegion = request.headers['x-simulated-region'] as string;
    
    if (simulatedRegion && this.BLOCKED_REGIONS.includes(simulatedRegion)) {
         throw new ForbiddenException(`Access denied: Service not available in ${simulatedRegion}`);
    }

    // TODO: Integrate real GeoIP service
    // const geo = await this.geoService.lookup(ip);
    // if (this.BLOCKED_REGIONS.includes(geo.region)) { ... }

    return true;
  }
}
