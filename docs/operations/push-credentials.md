# Push Notification Credential Management

## Overview

Styx uses Expo Push Notifications for sending real-time notifications to users. Expo acts as a relay between our
server and the native push notification services (APNs for iOS, FCM for Android). The push dispatch system is
implemented in `src/api/src/modules/notifications/`.

## Credentials Required

| Credential | Source | Format | Rotation |
|-----------|--------|--------|----------|
| `EXPO_ACCESS_TOKEN` | Expo Application Services (EAS) Project Dashboard | `Bearer <token>` string | Every 90 days |
| `APNs Key` | Apple Developer Account → Certificates, Identifiers & Profiles | `.p8` file | Annually (or on key compromise) |
| `FCM Server Key` | Firebase Console → Project Settings → Cloud Messaging | string | Annually (or on key compromise) |

## Obtaining Credentials

### EXPO_ACCESS_TOKEN
1. Log in to [expo.dev](https://expo.dev) and navigate to your project
2. Go to Project Settings → Credentials
3. Generate a new access token with the appropriate permissions (push notification scope)
4. Copy the token immediately — it will not be shown again

### APNs Key (iOS)
1. Go to [developer.apple.com](https://developer.apple.com) → Account → Certificates, Identifiers & Profiles
2. Select "Keys" → "Create a new key"
3. Enable "Apple Push Notification service (APNs)"
4. Download the `.p8` file (one-time download only)
5. Upload the `.p8` file through Expo's credential management UI or CLI:
   ```bash
   npx eas credentials --platform ios
   ```

### FCM Server Key (Android)
1. Go to [console.firebase.google.com](https://console.firebase.google.com) → Project Settings
2. Select the "Cloud Messaging" tab
3. Copy the "Server key" (legacy) or "Firebase Cloud Messaging API" key
4. Configure in Expo via `app.json`:
   ```json
   {
     "expo": {
       "plugins": [
         [
           "expo-notifications",
           { "googleServicesFile": "./google-services.json" }
         ]
       ]
     }
   }
   ```

## Environment Variables

Add to `render.yaml` or the deployment environment:

```yaml
envVars:
  - key: EXPO_ACCESS_TOKEN
    value: ""  # Set via Render dashboard — never commit to git
  - key: EXPO_PROJECT_ID
    value: "your-expo-project-id"
```

## Storage and Rotation

- **Never commit credentials to git.** The `.p8`, `google-services.json`, and any credential files must be gitignored
  and stored in Render's encrypted environment variable store or a secret manager.
- Set a calendar reminder for credential rotation (90 days for Expo token, 1 year for APNs/FCM).
- Before rotation, verify the new credential works with a test push notification:
  ```bash
  curl -H "Content-Type: application/json" \
       -H "Authorization: Bearer $EXPO_ACCESS_TOKEN" \
       -X POST https://exp.host/--/api/v2/push/send \
       -d '{"to": "ExponentPushToken[test-token]", "title": "Test", "body": "Credential rotation test"}'
  ```

## Verification Script

Run `scripts/verify-push-setup.sh` to check that all required environment variables are set:

```bash
./scripts/verify-push-setup.sh
```

Expected output:
```
✓ EXPO_ACCESS_TOKEN is set
✓ EXPO_PROJECT_ID is set
✓ Push API endpoint reachable
```
