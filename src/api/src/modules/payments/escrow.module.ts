import { Module } from "@nestjs/common";
import { Pool } from "pg";
import { testMoneyModeEnabled } from "../../config/runtime";
import { ESCROW_PROVIDER } from "../../common/interfaces/payout-provider.interface";
import { LedgerService } from "../../../services/ledger/ledger.service";
import { StripeFboService } from "../../../services/escrow/stripe.service";
import { LedgerEscrowProvider } from "./ledger-escrow.provider";
import { StripeEscrowProvider } from "./stripe-escrow.provider";

/**
 * Owns the escrow rail selection and every adapter that can sit behind it.
 *
 * One factory decides the rail from STYX_TEST_MONEY_MODE (via
 * `testMoneyModeEnabled`): test money → the ledger entry rail; real money → the
 * Stripe rail. Everything else in the app that needs escrow asks for
 * `ESCROW_PROVIDER` and is insulated from the choice.
 *
 * `StripeFboService` is provided here (and re-exported) so the Stripe rail and
 * its payout/guard relatives resolve from a single home instead of each module
 * re-declaring it.
 */
@Module({
  providers: [
    StripeFboService,
    LedgerService,
    StripeEscrowProvider,
    LedgerEscrowProvider,
    {
      provide: ESCROW_PROVIDER,
      useFactory: (
        stripe: StripeFboService,
        ledger: LedgerService,
        pool: Pool,
      ) =>
        testMoneyModeEnabled()
          ? new LedgerEscrowProvider(ledger, pool)
          : new StripeEscrowProvider(stripe),
      inject: [StripeFboService, LedgerService, Pool],
    },
  ],
  exports: [
    ESCROW_PROVIDER,
    StripeEscrowProvider,
    LedgerEscrowProvider,
    StripeFboService,
    LedgerService,
  ],
})
export class EscrowModule {}
