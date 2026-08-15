import { Module } from "@nestjs/common";
import { OnboardingController } from "./onboarding.controller";
import { IdentityOathService } from "./identity-oath.service";

@Module({
  controllers: [OnboardingController],
  providers: [IdentityOathService],
  // ContractsModule binds a new contract to the identity declared here.
  exports: [IdentityOathService],
})
export class OnboardingModule {}
