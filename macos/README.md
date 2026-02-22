# macOS Desktop Build Instructions

## Responsibilities
Configuration for building the Styx Admin Dashboard on macOS.

## Tasks for AI Engineer
1. **Entitlements**: Ensure network access is enabled for API communication.
2. **Signing**: Configure Developer ID for distribution.
3. **Icon**: Generate `.icns` from `assets/logo.png`.

## Build
`yarn tauri build --target x86_64-apple-darwin`
