# Styx Mobile Client (The Oracle) - Ironclad Directive

## 1. Module Definition
This is the **React Native** application (iOS/Android). Its primary purpose is **Sensor Ingestion** and **Proof Capture**. It is NOT the primary financial staking interface (to avoid App Store tax/ban).

## 2. Core Mandates
1.  **Digital Exhaust Only**: Sensor ingestion must strictly focus on behavioral/communication tracking pertinent to "No Contact" breaches.
2.  **UI Redaction**: All gambling terms ("Bet", "Wager", "Pot") must be replaced with "Commitment", "Pledge", "Vault" via `LinguisticMiddleware`.
3.  **Secure Camera**: Custom Camera UI (not system picker) that overlays the verifiable Watermark and prevents Camera Roll uploads (Live Capture Only).

## 3. Architecture
- **Framework**: React Native (Expo or CLI - prefer CLI for Native Code control).
- **Navigation**: React Navigation.
- **Store**: MMKV (Encrypted Local Storage).

## 4. Native Modules
- `services/CameraModule.tsx`: The anti-cheat camera.

## 5. Deployment
- **iOS**: TestFlight -> App Store (Lifestyle/Productivity Category).
- **Android**: Internal Track -> Play Store.

## 6. Testing
- **Maestro**: For Black-box UI testing.
- **Unit**: Jest for JS logic.
