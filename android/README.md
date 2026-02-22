# Styx Android Native Layer (Ironclad)

## 1. Module Definition
This directory contains the **Kotlin** and **Java** code bridging React Native to Android Health Connect.

## 2. Core Mandates
1.  **Health Connect**: Use the modern Jetpack library, not the deprecated Google Fit REST API.
2.  **Origin Verification**: Check `DataOrigin` for every record. Only allow trusted package names (e.g., `com.google.android.apps.fitness`, `com.garmin.android`).
3.  **Background Sync**: Use WorkManager for periodic background synchronization of step counts.

## 3. Build Protocol
- `./gradlew clean build`: Standard Android build.
- **Signing**: Keystores must be injected via CI secrets, never committed.

## 4. Dependencies
- `androidx.health.connect:connect-client`
