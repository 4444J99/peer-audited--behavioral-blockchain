# Styx Mobile Client (The Oracle) - Ironclad Directive

## 1. Module Definition
This is the **React Native** application (iOS/Android). Its primary purpose is **Sensor Ingestion** and **Proof Capture**. It is NOT the primary financial staking interface (to avoid App Store tax/ban).

## 2. Core Mandates
1.  **Native Bridges Only**: HealthKit and Health Connect logic must be written in Native Modules (Swift/Kotlin) to access the raw "UserEntered" metadata flags.
2.  **UI Redaction**: All gambling terms ("Bet", "Wager", "Pot") must be replaced with "Commitment", "Pledge", "Vault" via `LinguisticMiddleware`.
3.  **Secure Camera**: Custom Camera UI (not system picker) that overlays the "Weigh-in Word" and prevents Camera Roll uploads (Live Capture Only).

## 3. Architecture
- **Framework**: React Native (Expo or CLI - prefer CLI for Native Code control).
- **Navigation**: React Navigation.
- **Store**: MMKV (Encrypted Local Storage).

## 4. Native Modules
- `services/CameraModule.tsx`: The anti-cheat camera.
- `ios/HealthKitReader.swift`: The read-only pedometer.
- `android/HealthConnectReader.kt`: The Android equivalent.

## 5. Deployment
- **iOS**: TestFlight -> App Store (Health & Fitness Category).
- **Android**: Internal Track -> Play Store.

## 6. Testing
- **Maestro**: For Black-box UI testing.
- **Unit**: Jest for JS logic.
