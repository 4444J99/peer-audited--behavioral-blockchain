# Styx Desktop Admin (The Judge) - Ironclad Directive

## 1. Module Definition
This is the **Internal Tooling** for "The Judge" (Styx Employees) and high-level dispute resolution. Built with **Electron** or **Tauri**.

## 2. Purpose
- **God Mode**: View all raw data, including metadata stripped from user view.
- **Dispute Tribunal**: The final court of appeal when a user challenges a Fury consensus.
- **User Ban Hammer**: Tools to ban malicious Furies or Fraudulent Users.

## 3. Features
- **EXIF Inspector**: Side-by-side view of image metadata.
- **Hash Collider**: Visualizing pHash matches for duplicate detection.
- **Ledger Audit**: Read-only view of the `ledger_entries` table for financial support.

## 4. Security
- **VPN Only**: This app should only function when connected to the corporate VPN/IP.
- **Audit Logs**: Every action taken by a Judge is logged to `event_log` (Who banned who?).

## 5. Testing
- **Manual QA**: This is an internal tool; automated UI tests are lower priority, but API integration must be robust.
