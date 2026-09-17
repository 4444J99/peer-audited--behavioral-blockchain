import { Module, Global } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { AntiSybilService } from "./anti-sybil.service";
import { SecurityController } from "./security.controller";
import { RoleGuard } from "../../common/guards/role.guard";

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [SecurityController],
  providers: [AntiSybilService, RoleGuard],
  exports: [AntiSybilService],
})
export class SecurityModule {}
