// Test environment defaults.
//
// Several services now require their secrets/config to be present at
// construction time (no insecure hardcoded fallbacks). Provide deterministic
// test values here so unit/integration specs can instantiate them. Real
// environment values (if already set) always take precedence.
const TEST_ENV_DEFAULTS = {
  NODE_ENV: 'test',
  JWT_SECRET: 'test-jwt-secret-not-for-production',
  STYX_API_KEY_PEPPER: 'test-api-key-pepper-not-for-production',
  APP_SECRET: 'test-app-secret-not-for-production',
  ANONYMIZE_SALT: 'test-anonymize-salt-not-for-production',
  ZK_EXHAUST_SECRET: 'test-zk-exhaust-secret-not-for-production',
  STYX_WEBHOOK_SECRET: 'test-webhook-secret-not-for-production',
  STRIPE_IDENTITY_WEBHOOK_SECRET: 'test-stripe-identity-webhook-secret',
};

for (const [key, value] of Object.entries(TEST_ENV_DEFAULTS)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}
