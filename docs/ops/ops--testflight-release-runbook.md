# TestFlight Release Runbook

Status: `repo-derived draft`
Issue: [#141](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/141)
Blocks release: `yes`
Owner: `Founder + Engineering`

## 1. Preconditions

- Apple Developer account owner known
- App Store Connect `Styx` app record exists
- distribution certificate and provisioning profile confirmed
- release branch / tag selected
- `src/mobile/eas.json` submit credentials filled outside source control

Repo-derived current state:

- iOS app bundle identifier: `com.styxprotocol.app`
- Expo app version: `1.0.0`
- native iOS marketing version: `1.0`
- native iOS build number: `1`
- fastlane currently supports only `ios build_debug` and `ios test`
- no fastlane TestFlight upload lane exists yet
- Expo/EAS defines `preview`, `beta`, and `production` Release build profiles
- repo automation for backend/web beta deploy exists in `.github/workflows/beta-promotion.yml`

## 2. Build

Record here:

- release branch:
- tag:
- app version:
- build number:
- build command:

Suggested current mobile build path:

```bash
cd src/mobile
npx eas build --platform ios --profile beta
```

If EAS is not the chosen path, record the alternative signed archive/upload workflow here.

## 3. Archive and Upload

Record here:

- archive path:
- upload method:
- uploader:
- upload timestamp:

Current gap to resolve:

- The repo does not contain a proven TestFlight upload lane.
- `src/mobile/eas.json` still has blank `appleId`, `ascAppId`, and `appleTeamId` under `submit.production`.
- Until those are configured and a real upload occurs, this runbook remains draft-only.

## 4. Post-Upload Checks

- build visible in TestFlight
- build processed successfully
- internal tester group assigned
- install confirmed on at least one secondary device

Evidence files to attach:

- `artifacts/release/evidence--app-store-connect-styx-record.png`
- `artifacts/release/evidence--testflight-build-processed.png`
- `artifacts/release/evidence--testflight-internal-testers.png`
- `artifacts/release/evidence--signing-chain.md`

## 5. Parallel Beta Environment Checks

These are not the iOS upload itself, but they are part of the same release motion.

The repo already defines a beta promotion workflow in `.github/workflows/beta-promotion.yml` that:

1. validates beta secrets
2. deploys API to Render
3. deploys web to Render
4. runs database migrations
5. runs beta smoke checks

Required beta secrets in that workflow:

- `RENDER_API_KEY`
- `RENDER_BETA_API_SERVICE_ID`
- `RENDER_BETA_WEB_SERVICE_ID`
- `BETA_API_URL`
- `BETA_DATABASE_URL`
- `BETA_WEB_URL`
- optional `BETA_ENV_LABEL`

## 6. Rollback / Failure Notes

Record here:

- failure mode:
- fix owner:
- next attempt date:
