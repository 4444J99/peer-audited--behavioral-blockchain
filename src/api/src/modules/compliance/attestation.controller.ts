import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../../guards/auth.guard';
import {
  AppAttestAssertion,
  AppAttestRegistration,
  DeviceAttestationService,
  PlayIntegrityVerdict,
} from '../../../services/security/device-attestation.service';

@ApiTags('Device Attestation')
@Controller('attestation')
export class AttestationController {
  constructor(private readonly deviceAttestation: DeviceAttestationService) {}

  @Post('ios/keys')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Register an iOS App Attest key — the attestation object is cryptographically verified (CBOR, cert chain, nonce binding) before the credential key is stored',
  })
  async registerIosKey(@CurrentUser() user: any, @Body() body: AppAttestRegistration) {
    return this.deviceAttestation.registerIosAttestedKey(user.id, body);
  }

  @Post('ios/assertions')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Verify an iOS App Attest assertion against the stored credential key (signature + counter monotonicity)',
  })
  async verifyIosAssertion(@CurrentUser() user: any, @Body() body: AppAttestAssertion) {
    return this.deviceAttestation.verifyiOSAttestation(user.id, body);
  }

  @Post('android/verdicts')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Verify a Google Play Integrity verdict token as a signed JWS (JWKS signature, expiry, package name) before trusting its integrity verdict',
  })
  async verifyAndroidVerdict(@CurrentUser() user: any, @Body() body: PlayIntegrityVerdict) {
    return this.deviceAttestation.verifyAndroidAttestation(user.id, body);
  }

  @Post('keys/revoke')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a registered device attestation key (e.g., device compromise)' })
  async revokeKey(@CurrentUser() user: any, @Body() body: { keyId: string }) {
    if (!body || !body.keyId) {
      throw new BadRequestException('keyId is required');
    }
    await this.deviceAttestation.revokeKey(user.id, body.keyId);
    return { revoked: true, keyId: body.keyId };
  }
}
