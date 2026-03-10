import { Injectable } from '@nestjs/common';
import { HoneypotEngine as SharedEngine, HoneypotArtifact } from '../../../shared/fury-logic/index.ts';

@Injectable()
export class HoneypotService extends SharedEngine {}
export { HoneypotArtifact };
