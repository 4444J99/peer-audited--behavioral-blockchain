# Windows Desktop Build Instructions

## Responsibilities
Configuration for building the Styx Admin Dashboard on Windows.

## Tasks for AI Engineer
1. **Installer**: Configure NSIS or MSI installer via Tauri config.
2. **Signing**: Configure code signing certificate.
3. **Icon**: Generate `.ico`.

## Build
`yarn tauri build --target x86_64-pc-windows-msvc`
