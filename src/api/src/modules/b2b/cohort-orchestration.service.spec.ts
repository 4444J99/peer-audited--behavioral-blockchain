import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CohortOrchestrationService } from './cohort-orchestration.service';

describe('CohortOrchestrationService (Issue #48)', () => {
  let service: CohortOrchestrationService;
  let mockPool: any;
  let mockAnonymize: any;
  let mockWebhook: any;

  beforeEach(() => {
    mockPool = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
    };
    mockAnonymize = {
      anonymizeUserId: jest.fn().mockReturnValue('anon_user_123'),
    };
    mockWebhook = {
      emitEvent: jest.fn().mockResolvedValue(true),
    };

    service = new CohortOrchestrationService(mockPool, mockAnonymize, mockWebhook);
  });

  it('creates an enterprise cohort and sets status to ENROLLING', async () => {
    const startsAt = new Date(Date.now() + 7 * 86400 * 1000).toISOString();
    const cohort = await service.createCohort('ent-1', {
      name: 'Executive Wellness Q4',
      maxParticipants: 30,
      podSize: 6,
      durationDays: 30,
      startsAt,
    });

    expect(cohort.id).toMatch(/^coh_/);
    expect(cohort.enterpriseId).toBe('ent-1');
    expect(cohort.name).toBe('Executive Wellness Q4');
    expect(cohort.status).toBe('ENROLLING');
    expect(cohort.maxParticipants).toBe(30);
    expect(mockWebhook.emitEvent).toHaveBeenCalledWith(
      'ent-1',
      'cohort.created',
      expect.objectContaining({ cohortId: cohort.id }),
    );
  });

  it('rejects cohort creation with missing or empty name', async () => {
    await expect(
      service.createCohort('ent-1', {
        name: '   ',
        startsAt: new Date().toISOString(),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('invites participants in batch and returns anonymized aliases', async () => {
    const startsAt = new Date(Date.now() + 7 * 86400 * 1000).toISOString();
    const cohort = await service.createCohort('ent-1', {
      name: 'Mindfulness Cohort',
      startsAt,
    });

    const inviteResult = await service.inviteParticipants('ent-1', cohort.id, [
      'alice@example.com',
      'bob@example.com',
    ]);

    expect(inviteResult.cohortId).toBe(cohort.id);
    expect(inviteResult.totalInvited).toBe(2);
    expect(inviteResult.invites[0].anonymizedAlias).toBe('Participant #001');
    expect(inviteResult.invites[0].inviteToken).toMatch(/^inv_/);
    expect(mockWebhook.emitEvent).toHaveBeenCalledWith(
      'ent-1',
      'cohort.participants_invited',
      { cohortId: cohort.id, count: 2 },
    );
  });

  it('enforces maximum cohort participant capacity', async () => {
    const startsAt = new Date(Date.now() + 7 * 86400 * 1000).toISOString();
    const cohort = await service.createCohort('ent-1', {
      name: 'Small Pod',
      maxParticipants: 2,
      startsAt,
    });

    await expect(
      service.inviteParticipants('ent-1', cohort.id, [
        'u1@example.com',
        'u2@example.com',
        'u3@example.com',
      ]),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows updating configuration before cohort start date', async () => {
    const startsAt = new Date(Date.now() + 7 * 86400 * 1000).toISOString();
    const cohort = await service.createCohort('ent-1', {
      name: 'Initial Name',
      maxParticipants: 20,
      startsAt,
    });

    const updated = await service.updateCohortConfig('ent-1', cohort.id, {
      name: 'Renamed Cohort',
      maxParticipants: 25,
    });

    expect(updated.name).toBe('Renamed Cohort');
    expect(updated.maxParticipants).toBe(25);
  });

  it('prohibits updating configuration after cohort has started', async () => {
    const startsAt = new Date(Date.now() - 3600 * 1000).toISOString(); // 1 hr ago
    const cohort = await service.createCohort('ent-1', {
      name: 'Active Cohort',
      startsAt,
    });

    await expect(
      service.updateCohortConfig('ent-1', cohort.id, { name: 'New Name' }),
    ).rejects.toThrow(ConflictException);
  });

  it('closes cohort enrollment successfully', async () => {
    const startsAt = new Date(Date.now() + 7 * 86400 * 1000).toISOString();
    const cohort = await service.createCohort('ent-1', {
      name: 'Closing Soon',
      startsAt,
    });

    const closed = await service.closeCohort('ent-1', cohort.id);
    expect(closed.status).toBe('CLOSED');

    await expect(
      service.inviteParticipants('ent-1', cohort.id, ['extra@example.com']),
    ).rejects.toThrow(BadRequestException);
  });

  it('provides detailed cohort stats and anonymized progress', async () => {
    const startsAt = new Date(Date.now() + 7 * 86400 * 1000).toISOString();
    const cohort = await service.createCohort('ent-1', {
      name: 'Stats Test',
      startsAt,
    });

    await service.inviteParticipants('ent-1', cohort.id, ['client@example.com']);
    const details = await service.getCohortDetails('ent-1', cohort.id);

    expect(details.cohort.id).toBe(cohort.id);
    expect(details.stats.totalInvited).toBe(1);
    expect(details.participants.length).toBe(1);
    expect(details.participants[0].alias).toBe('Participant #001');
  });
});
