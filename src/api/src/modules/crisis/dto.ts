import { IsString, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CrisisEscalateDto {
  @ApiPropertyOptional({
    description: "Trigger text that caused the crisis detection",
    example: "I want to hurt myself",
  })
  @IsOptional()
  @IsString()
  trigger?: string;
}
