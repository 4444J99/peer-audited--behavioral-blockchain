import { NotFoundException } from '@nestjs/common';
import { RealmsController } from './realms.controller';
import { REALM_REGISTRY, RealmId } from '../../../../shared/libs/realm-registry';

// Mock Pool — direct instantiation to avoid NestJS DI complexity for unit tests
const mockQuery = jest.fn();
const mockPool = { query: mockQuery };

describe('RealmsController', () => {
  let controller: RealmsController;

  beforeEach(() => {
    mockQuery.mockReset();
    controller = new RealmsController(mockPool as any);
  });

  describe('GET /realms', () => {
    it('should return all 7 realms with stats', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { realm_id: 'BIOLOGICAL_HARDWARE', active_contracts: '3', total_staked: '150.00' },
        ],
      });

      const result = await controller.listRealms();

      expect(result).toHaveLength(7);
      expect(result[0].id).toBe(RealmId.BIOLOGICAL_HARDWARE);
      expect(result[0].stats.activeContracts).toBe(3);
      expect(result[0].stats.totalStaked).toBe(150);
    });

    it('should return zero stats for realms with no contracts', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await controller.listRealms();

      expect(result).toHaveLength(7);
      for (const realm of result) {
        expect(realm.stats.activeContracts).toBe(0);
        expect(realm.stats.totalStaked).toBe(0);
      }
    });

    it('should include theme colors for each realm', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await controller.listRealms();

      for (const realm of result) {
        expect(realm.theme).toBeDefined();
        expect(realm.theme.primary).toMatch(/^#[0-9a-f]{6}$/);
      }
    });
  });

  describe('GET /realms/:slug', () => {
    it('should return realm detail for valid slug', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ active_contracts: '5', total_staked: '250.00' }],
      });

      const result = await controller.getRealmBySlug('biological-hardware');

      expect(result.id).toBe(RealmId.BIOLOGICAL_HARDWARE);
      expect(result.stats.activeContracts).toBe(5);
      expect(result.slug).toBe('biological-hardware');
    });

    it('should throw NotFoundException for unknown slug', async () => {
      await expect(controller.getRealmBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should return detail for each valid slug', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ active_contracts: '0', total_staked: '0' }],
      });

      for (const realm of REALM_REGISTRY) {
        const result = await controller.getRealmBySlug(realm.slug);
        expect(result.id).toBe(realm.id);
      }
    });
  });

  describe('GET /realms/:slug/contracts', () => {
    it('should return contracts for authenticated user in realm', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 'contract-1',
            oath_category: 'BIOLOGICAL_WEIGHT',
            verification_method: 'HEALTHKIT',
            stake_amount: 50,
            status: 'ACTIVE',
            duration_days: 30,
            started_at: '2026-03-01',
            ends_at: '2026-03-31',
            created_at: '2026-03-01',
          },
        ],
      });

      const result = await controller.getRealmContracts('biological-hardware', { id: 'user-1' });

      expect(result.realmId).toBe(RealmId.BIOLOGICAL_HARDWARE);
      expect(result.contracts).toHaveLength(1);
      expect(result.contracts[0].id).toBe('contract-1');
    });

    it('should throw NotFoundException for unknown slug', async () => {
      await expect(
        controller.getRealmContracts('nonexistent', { id: 'user-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should pass user_id and realm_id to query', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await controller.getRealmContracts('cognitive-device', { id: 'user-42' });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1 AND realm_id = $2'),
        ['user-42', RealmId.COGNITIVE_DEVICE],
      );
    });
  });
});
