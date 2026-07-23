import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { AuthGuard } from "../../../guards/auth.guard";
import { RoleGuard, Roles } from "../../common/guards/role.guard";
import { BetaWaitlistService } from "./beta-waitlist.service";
import { JoinBetaWaitlistDto } from "./dto";

@ApiTags("Beta Waitlist")
@Controller("beta-waitlist")
export class BetaWaitlistController {
  constructor(private readonly waitlist: BetaWaitlistService) {}

  // Public: the landing page and emergency asset post here. No auth — this is the
  // top of the acquisition funnel. Throttled to blunt automated signup abuse.
  @Post()
  @ApiOperation({ summary: "Join the private-beta waitlist" })
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async join(@Body() dto: JoinBetaWaitlistDto) {
    return this.waitlist.signup(dto);
  }

  // Public: confirmation link target (email or queue-confirmation flow).
  @Get("confirm")
  @ApiOperation({ summary: "Confirm a beta-waitlist signup" })
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async confirm(@Query("token") token: string) {
    const entry = await this.waitlist.confirm(token);
    return { status: entry.status, email: entry.email };
  }

  // Admin only: cohort-admission review + export.
  @Get()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles("ADMIN")
  @ApiOperation({ summary: "List beta-waitlist signups (admin)" })
  async list(
    @Query("channel") channel?: string,
    @Query("status") status?: string,
    @Query("limit") limit?: string,
  ) {
    const entries = await this.waitlist.list({
      channel,
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return { count: entries.length, entries };
  }

  // Admin only: conversion + channel-mix tracking.
  @Get("stats")
  @UseGuards(AuthGuard, RoleGuard)
  @Roles("ADMIN")
  @ApiOperation({ summary: "Beta-waitlist conversion stats (admin)" })
  async stats() {
    return this.waitlist.stats();
  }
}
