import { Controller, Get, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Pool } from 'pg';
import { AuthGuard } from '../../../guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  REALM_REGISTRY,
  getRealmBySlug,
  RealmDefinition,
} from '../../../../shared/libs/realm-registry';

@ApiTags('Realms')
@Controller('realms')
export class RealmsController {
  constructor(private readonly pool: Pool) {}

  @Get()
  @ApiOperation({ summary: 'List all behavioral realms' })
  async listRealms() {
    // Realm definitions are compile-time constants; enrich with DB aggregate stats
    const statsResult = await this.pool.query(`
      SELECT realm_id, COUNT(*) AS active_contracts, COALESCE(SUM(stake_amount), 0) AS total_staked
      FROM contracts
      WHERE status IN ('ACTIVE', 'PENDING_STAKE')
      GROUP BY realm_id
    `);

    const statsMap = new Map<string, { activeContracts: number; totalStaked: number }>();
    for (const row of statsResult.rows) {
      statsMap.set(row.realm_id, {
        activeContracts: Number(row.active_contracts),
        totalStaked: Number(row.total_staked),
      });
    }

    return REALM_REGISTRY.map((realm) => ({
      id: realm.id,
      displayName: realm.displayName,
      slug: realm.slug,
      oracleType: realm.oracleType,
      tagline: realm.tagline,
      theme: realm.theme,
      stats: statsMap.get(realm.id) ?? { activeContracts: 0, totalStaked: 0 },
    }));
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get realm detail by slug' })
  async getRealmBySlug(@Param('slug') slug: string) {
    const realm = getRealmBySlug(slug);
    if (!realm) {
      throw new NotFoundException(`Realm not found: ${slug}`);
    }

    const statsResult = await this.pool.query(
      `SELECT COUNT(*) AS active_contracts, COALESCE(SUM(stake_amount), 0) AS total_staked
       FROM contracts
       WHERE realm_id = $1 AND status IN ('ACTIVE', 'PENDING_STAKE')`,
      [realm.id],
    );
    const stats = statsResult.rows[0];

    return {
      ...realm,
      stats: {
        activeContracts: Number(stats.active_contracts),
        totalStaked: Number(stats.total_staked),
      },
    };
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get(':slug/contracts')
  @ApiOperation({ summary: "Get authenticated user's contracts within a realm" })
  async getRealmContracts(
    @Param('slug') slug: string,
    @CurrentUser() user: { id: string },
  ) {
    const realm = getRealmBySlug(slug);
    if (!realm) {
      throw new NotFoundException(`Realm not found: ${slug}`);
    }

    const result = await this.pool.query(
      `SELECT id, oath_category, verification_method, stake_amount, status, duration_days, started_at, ends_at, created_at
       FROM contracts
       WHERE user_id = $1 AND realm_id = $2
       ORDER BY created_at DESC`,
      [user.id, realm.id],
    );

    return {
      realmId: realm.id,
      realmSlug: realm.slug,
      contracts: result.rows,
    };
  }
}
