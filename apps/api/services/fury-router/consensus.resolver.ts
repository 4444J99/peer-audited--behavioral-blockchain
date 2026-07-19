import { Injectable } from '@nestjs/common';
import { ConsensusResolver as SharedResolver, AuditorDecision } from '../../../shared/fury-logic/index.ts';

@Injectable()
export class ConsensusResolver extends SharedResolver {}
export { AuditorDecision };
