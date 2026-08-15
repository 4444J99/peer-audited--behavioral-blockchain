import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { Pool } from "pg";
import {
  IDENTITY_ARCHETYPES,
  IDENTITY_OATH_CATEGORIES,
  type IdentityArchetype,
  type IdentityCopyVariant,
  composeIdentityOath,
  getIdentityArchetype,
  isIdentityOathCategory,
} from "../../../../shared/libs/identity-oath";

/** Phase-1 scope lock: the only journey with an exposed identity oath. */
export const DEFAULT_IDENTITY_OATH_CATEGORY = IDENTITY_OATH_CATEGORIES[0];

export interface IdentityOath {
  id: string;
  userId: string;
  oathCategory: string;
  archetypeId: string;
  identityLabel: string;
  pledgeCopy: string;
  copyVariant: IdentityCopyVariant;
  activatedAt: Date | null;
}

export interface IdentityOathState {
  oathCategory: string;
  /** The declaration on file, or null when the identity step is untouched. */
  oath: IdentityOath | null;
  /** True once the identity step is behind the user — what a resume reads. */
  completed: boolean;
  archetypes: readonly IdentityArchetype[];
}

@Injectable()
export class IdentityOathService {
  private readonly logger = new Logger(IdentityOathService.name);

  constructor(private readonly pool: Pool) {}

  /**
   * Resumable onboarding state. Returns the archetype catalogue alongside the
   * declaration so a client resuming mid-flow renders the same choices it was
   * offered originally without a second round trip.
   */
  async getOnboardingState(
    userId: string,
    oathCategory: string = DEFAULT_IDENTITY_OATH_CATEGORY,
  ): Promise<IdentityOathState> {
    const category = this.assertSupportedCategory(oathCategory);
    const oath = await this.findOath(userId, category);

    return {
      oathCategory: category,
      oath,
      completed: oath?.activatedAt != null,
      archetypes: IDENTITY_ARCHETYPES,
    };
  }

  /**
   * Declare (or re-declare) the identity for a journey.
   *
   * `activated_at` is preserved across a re-declaration: the user may change
   * which person they are becoming, but the moment they first committed to
   * declaring one is a fact about the account, not about the current choice.
   */
  async declare(
    userId: string,
    input: { archetypeId: string; oathCategory?: string },
  ): Promise<IdentityOath> {
    const category = this.assertSupportedCategory(
      input.oathCategory ?? DEFAULT_IDENTITY_OATH_CATEGORY,
    );
    const archetype = getIdentityArchetype(input.archetypeId);
    if (!archetype) {
      throw new BadRequestException(
        `Unknown identity archetype: ${input.archetypeId}`,
      );
    }

    // Composed server-side from the shared library so the stored pledge is the
    // one the wizard rendered — a client-supplied sentence could not be trusted
    // to match the variant it was assigned.
    const declaration = composeIdentityOath(userId, archetype);

    const {
      rows: [row],
    } = await this.pool.query(
      `INSERT INTO user_identity_oaths
         (user_id, oath_category, archetype_id, identity_label, pledge_copy, copy_variant, activated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id, oath_category) DO UPDATE
       SET archetype_id = EXCLUDED.archetype_id,
           identity_label = EXCLUDED.identity_label,
           pledge_copy = EXCLUDED.pledge_copy,
           copy_variant = EXCLUDED.copy_variant,
           activated_at = COALESCE(user_identity_oaths.activated_at, EXCLUDED.activated_at),
           updated_at = NOW()
       RETURNING *`,
      [
        userId,
        category,
        declaration.archetypeId,
        declaration.identityLabel,
        declaration.pledgeCopy,
        declaration.copyVariant,
      ],
    );

    this.logger.log(
      `User ${userId} declared identity ${declaration.archetypeId} for ${category} (variant ${declaration.copyVariant})`,
    );
    return this.mapOath(row);
  }

  /** The activated declaration a new contract in this category binds to. */
  async getActivatedOath(
    userId: string,
    oathCategory: string,
  ): Promise<IdentityOath | null> {
    if (!isIdentityOathCategory(oathCategory)) return null;
    const oath = await this.findOath(userId, oathCategory);
    return oath?.activatedAt ? oath : null;
  }

  private async findOath(
    userId: string,
    oathCategory: string,
  ): Promise<IdentityOath | null> {
    const {
      rows: [row],
    } = await this.pool.query(
      "SELECT * FROM user_identity_oaths WHERE user_id = $1 AND oath_category = $2",
      [userId, oathCategory],
    );
    return row ? this.mapOath(row) : null;
  }

  private assertSupportedCategory(oathCategory: string): string {
    if (!isIdentityOathCategory(oathCategory)) {
      throw new BadRequestException(
        `Identity oaths are not available for category ${oathCategory}`,
      );
    }
    return oathCategory;
  }

  private mapOath(row: any): IdentityOath {
    return {
      id: row.id,
      userId: row.user_id,
      oathCategory: row.oath_category,
      archetypeId: row.archetype_id,
      identityLabel: row.identity_label,
      pledgeCopy: row.pledge_copy,
      copyVariant: row.copy_variant,
      activatedAt: row.activated_at ?? null,
    };
  }
}
