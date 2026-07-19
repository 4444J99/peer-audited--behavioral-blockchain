import { Injectable } from "@nestjs/common";
import {
  HoneypotEngine as SharedEngine,
  HoneypotArtifact,
} from "../../../shared/fury-logic/index.ts";

/**
 * HoneypotEngineWrapper
 *
 * Distinct from the canonical HoneypotService in services/intelligence/,
 * which is a cron-based synthetic-proof injector. This class is a thin
 * Nest-injectable subclass of the shared HoneypotEngine, suitable for
 * dependency injection into the fury-router pipeline when the router wants
 * a class-typed engine rather than the singleton functions exported by
 * shared/fury-logic.
 *
 * Restored from the deletion in PR #660. The deletion was based on a
 * "no callers" grep, but the value of the file is providing a class
 * handle to the shared engine for DI consumers; callers can be added when
 * the fury-router is refactored to use DI rather than function imports.
 */
@Injectable()
export class HoneypotEngineWrapper extends SharedEngine {}
export { HoneypotArtifact };
