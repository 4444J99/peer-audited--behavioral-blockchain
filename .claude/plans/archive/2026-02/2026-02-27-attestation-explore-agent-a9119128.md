# Styx Mobile App Attestation & Daily Check-in Flow Exploration

**Session Date**: 2026-02-27
**Status**: IN_PROGRESS
**Mode**: READ-ONLY EXPLORATION (no edits permitted)

## User Request
Explore the mobile app's attestation and daily check-in flow to understand:
- What exists vs. what's stub code vs. what's missing entirely
- Focus on Phase 1 journey: daily no-contact attestation on iOS

## Investigation Checklist

### Primary Artifacts to Examine
- [ ] **Navigation Setup** (App.tsx) - what screens are registered?
- [ ] **API Client** (ApiClient.ts) - attestation endpoints wired?
- [ ] **Mobile Screens** (screens/) - attestation/check-in screens exist?
- [ ] **Contract Detail Screen** - links to attestation?
- [ ] **Notification Service** - APNs/FCM real or stub?
- [ ] **Daily Reminder Mechanism** - anything scheduled?
- [ ] **Offline Cache** - handles attestation mutations?
- [ ] **Backend Services** (src/api/services/) - attestation endpoints

### Exploration Order
1. Read file structure from mobile directory
2. Examine App.tsx for navigation and screen registration
3. Review ApiClient.ts for endpoint definitions
4. List and categorize screens in screens/ directory
5. Search for attestation-related screens
6. Review NotificationService implementation
7. Check OfflineCache for mutation handling
8. Examine backend API services for attestation support

## Findings
(To be updated as exploration proceeds)

