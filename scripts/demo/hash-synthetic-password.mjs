#!/usr/bin/env node
import bcrypt from "bcryptjs";

const password = process.env.STYX_DEMO_PASSWORD; // allow-secret: injected local synthetic password

if (!password) {
  throw new Error(
    "STYX_DEMO_PASSWORD is required to create synthetic demo credentials.",
  );
}

process.stdout.write(`${await bcrypt.hash(password, 10)}\n`);
