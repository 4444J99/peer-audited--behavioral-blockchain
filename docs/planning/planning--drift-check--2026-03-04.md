# Drift Check (2026-03-04)

| ID | Claim | Expected Runtime Control | Evidence Status |
|---|---|---|---|
| DRIFT-COHORT-01 | Pod/cohort structures with participant visibility (Active/Out) | Runtime API or UI support for cohorts/pods. | EVIDENCE_FOUND |
| DRIFT-PRICING-01 | $39 MVP model ($9 fee + $30 stake) | Explicit pricing constants and plan-level handling. | EVIDENCE_FOUND |
| DRIFT-ORACLE-01 | Whoop SCORED state integration | Webhook or ingestion logic for SCORED state. | EVIDENCE_FOUND |
| DRIFT-ORACLE-02 | HealthKit manual-entry rejection (WasUserEntered) | Native bridge checks for manual-entry exclusion. | EVIDENCE_FOUND |

## Evidence Snippets

### DRIFT-COHORT-01
- `src/api/src/modules/contracts/contracts.controller.ts:46:  @Get('cohorts/:cohortId/snapshot')`
- `src/api/src/modules/contracts/contracts.controller.ts:48:  async getCohortSnapshot(`
- `src/api/src/modules/contracts/contracts.controller.ts:49:    @Param('cohortId') cohortId: string,`
- `src/api/src/modules/contracts/contracts.controller.ts:52:    return this.contractsService.getCohortSnapshot(cohortId, user.id);`
- `src/api/src/modules/contracts/contracts.service.ts:661:    const cohortId = String(dto.cohort.cohortId || '').trim();`
- `src/api/src/modules/contracts/contracts.service.ts:662:    if (!cohortId) {`
- `src/api/src/modules/contracts/contracts.service.ts:663:      throw new BadRequestException('cohort.cohortId is required when cohort metadata is provided');`
- `src/api/src/modules/contracts/contracts.service.ts:668:    const maxPodSize = dto.cohort.maxPodSize ?? DEFAULT_POD_MAX_MEMBERS;`

### DRIFT-PRICING-01
- `src/api/src/modules/contracts/dto.ts:99:  MVP_39 = 'MVP_39',`
- `src/api/src/modules/contracts/dto.ts:103:  @ApiProperty({ description: 'Pricing profile applied at contract creation', enum: PricingPlan, example: PricingPlan.MVP_39 })`
- `src/api/src/modules/contracts/dto.ts:150:    description: 'Optional pricing plan metadata (MVP_39 enforces $30 stake with $9 platform fee metadata)',`
- `src/api/src/modules/contracts/contracts.service.ts:78:const MVP_39_TOTAL_USD = 39;`
- `src/api/src/modules/contracts/contracts.service.ts:79:const MVP_39_PLATFORM_FEE_USD = 9;`
- `src/api/src/modules/contracts/contracts.service.ts:80:const MVP_39_STAKE_USD = 30;`
- `src/api/src/modules/contracts/contracts.service.ts:84:  totalEntryUsd: number;`
- `src/api/src/modules/contracts/contracts.service.ts:85:  platformFeeUsd: number;`

### DRIFT-ORACLE-01
- `src/api/src/modules/contracts/contracts.controller.ts:139:  @Post(':id/whoop/scored')`
- `src/api/src/modules/contracts/contracts.controller.ts:140:  @ApiOperation({ summary: 'Ingest Whoop SCORED state and optionally credit daily attestation' })`
- `src/api/src/modules/contracts/contracts.service.ts:1980:      throw new BadRequestException('Whoop SCORED ingestion is only available for Recovery stream contracts');`
- `src/api/src/modules/contracts/contracts.service.ts:1984:    if (state !== WhoopScoredState.SCORED) {`
- `src/api/src/modules/contracts/contracts.service.ts:1989:        source: dto.source || 'whoop-webhook',`
- `src/api/src/modules/contracts/contracts.service.ts:2011:    await this.truthLog.appendEvent('WHOOP_SCORED_STATE_RECEIVED', {`
- `src/api/src/modules/contracts/contracts.service.ts:2015:      source: dto.source || 'whoop-webhook',`
- `src/api/src/modules/contracts/dto.ts:166:  SCORED = 'SCORED',`

### DRIFT-ORACLE-02
- `src/mobile/services/HealthKitMetadataGuard.ts:2:  HKMetadataKeyWasUserEntered?: boolean | string | number | null;`
- `src/mobile/services/HealthKitMetadataGuard.ts:36:    normalizeBoolean(metadata.HKMetadataKeyWasUserEntered) ||`

