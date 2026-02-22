# Styx iOS Native Layer (Ironclad)

## 1. Module Definition
This directory contains the **Swift** and **Objective-C** code that bridges React Native to the Apple ecosystem.

## 2. Core Mandates
1.  **HealthKit Read-Only**: Use `HKObserverQuery` and `HKAnchoredObjectQuery`.
2.  **Metadata Filtering**: Specifically check `HKMetadataKeyWasUserEntered`. If `true` (or `1`), **DISCARD** the data point.
3.  **App Store Compliance**: Ensure the `Info.plist` usage descriptions (`NSHealthShareUsageDescription`) explicitly state "To verify habit completion" and *not* "To wager money."

## 3. Build Protocol
- `pod install`: Manages dependencies.
- `xcodebuild`: Used for CI/CD compilation.

## 4. Troubleshooting
- If "Build Failed" on M1/M2 Mac: check `arm64` exclusion in Podfile or Rosetta settings.
