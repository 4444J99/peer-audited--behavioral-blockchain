# Brand Identity Propagation Map

This document establishes the canonical mapping and propagation rules for brand identity variables declared in `.env.example`.

## Canonical Brand Variables (`.env.example`)

| Variable | Description | Canonical Default |
|----------|-------------|-------------------|
| `CANONICAL_DOMAIN` | Primary Web Domain | `styx.protocol` |
| `PROJECT_NAME` | Display / Product Name | `Styx` |
| `MOBILE_BUNDLE_ID` | iOS & Android Bundle / Application ID | `com.styx.app` |
| `DEEP_LINK_SCHEME` | Mobile URL Scheme | `styx` |
| `CONTACT_EMAIL_DOMAIN` | Official Support / Legal Domain | `styx.protocol` |
| `RENDER_API_SERVICE_NAME` | API Deployment Hostname | `styx-api` |
| `RENDER_WEB_SERVICE_NAME` | Web App Hostname | `styx-web` |
| `CANONICAL_REPO_URL` | Source Repository | `https://github.com/organvm/peer-audited--behavioral-blockchain` |

## Propagation Targets Matrix

| Target File | Variables Used | Synchronization Gate |
|-------------|----------------|----------------------|
| `apps/mobile/ios/Info.plist` | `PROJECT_NAME`, `MOBILE_BUNDLE_ID`, `DEEP_LINK_SCHEME` | Xcode Build & Mobile Bundle Config |
| `apps/mobile/android/build.gradle` | `MOBILE_BUNDLE_ID`, `PROJECT_NAME` | Gradle Application ID Build |
| `render.yaml` | `RENDER_API_SERVICE_NAME`, `RENDER_WEB_SERVICE_NAME` | Infrastructure-as-Code Deploy |
| `package.json` | `PROJECT_NAME` | Monorepo Workspace Metadata |
| `docker-compose.yml` | `PROJECT_NAME`, `RENDER_API_SERVICE_NAME` | Local Orchestration Container Names |
| `docs/legal/*.md` | `CONTACT_EMAIL_DOMAIN`, `CANONICAL_DOMAIN` | Legal Compliance Documents |
| `docs/architecture/*.md` | `CANONICAL_DOMAIN`, `CANONICAL_REPO_URL` | System Documentation |

## Maintenance & Verification

When updating any brand identity binding in `.env.example`:
1. Audit all listed target files in the matrix above.
2. Update references to ensure consistency across mobile, web, deploy, and legal layers.
3. Run `npm run lint` and `npx turbo run build` to verify workspace compliance.
