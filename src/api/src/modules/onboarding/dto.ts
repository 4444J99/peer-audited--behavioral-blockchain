import { IsIn, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IDENTITY_ARCHETYPES,
  IDENTITY_OATH_CATEGORIES,
} from "../../../../shared/libs/identity-oath";

const ARCHETYPE_IDS = IDENTITY_ARCHETYPES.map((archetype) => archetype.id);

export class DeclareIdentityOathDto {
  @ApiProperty({
    description: "Identity archetype the user declares they are becoming",
    enum: ARCHETYPE_IDS,
    example: ARCHETYPE_IDS[0],
  })
  @IsString()
  @IsIn(ARCHETYPE_IDS)
  archetypeId!: string;

  @ApiPropertyOptional({
    description:
      "Oath category the identity belongs to (phase-1 exposes RECOVERY_NOCONTACT only)",
    enum: IDENTITY_OATH_CATEGORIES,
    example: IDENTITY_OATH_CATEGORIES[0],
  })
  @IsOptional()
  @IsString()
  @IsIn(IDENTITY_OATH_CATEGORIES as unknown as string[])
  oathCategory?: string;
}
