# Styx Project API Layer Exploration Plan

## Objective
Explore the Styx project monorepo to identify what's MISSING or STUB in the API layer after the recent NestJS spine was built.

## Exploration Focus Areas

### 1. GeminiClient.ts - AI Integration Stubs
- **File**: `src/api/services/intelligence/GeminiClient.ts`
- **Status**: ✅ COMPLETED
- **Findings**:
  - Only constants defined (GEMINI_MODEL_VERSION, SYSTEM_INSTRUCTION)
  - 3 unimplemented methods needed:
    1. `callGemini(prompt: string, isJson: boolean)` - Core API interaction
    2. `generateVCQuestions(slideContent: string)` - "Grill Me" feature (SL-03)
    3. `simplifyConcept(text: string)` - "ELI5" simplifier (SL-05)
  - Model: gemini-2.5-flash-preview-09-2025
  - System instruction: "You are an elite Y-Combinator level startup advisor."

### 2. Escrow Orchestration - escrow.ts Status
- **File**: `src/api/services/escrow/escrow.ts`
- **Status**: ⏳ PENDING (file not found at expected path)
- **Expected Role**: Main escrow orchestration coordinating Stripe FBO hold/capture/cancel patterns
- **Next Action**: Locate actual file or confirm it needs creation

### 3. Auth Implementation - auth.guard.ts
- **File**: `src/api/guards/auth.guard.ts`
- **Status**: ⏳ PENDING
- **Expected Content**: Mock JWT implementation, Bearer token validation
- **Importance**: Critical for understanding production auth readiness

### 4. Architecture & Roadmap - there+back-again.md
- **File**: `docs/architecture/there+back-again.md`
- **Status**: ⏳ PENDING
- **Expected Content**: 5-phase Alpha-to-Omega roadmap with validation gates
- **Importance**: Essential for understanding project phase and completion criteria

### 5. Stub Pattern Search - "Tasks for AI Engineer" Comments
- **Status**: ⏳ PENDING
- **Approach**: grep -r "Tasks for AI Engineer" across src/api/
- **Expected Files**: Multiple service files with task markers

### 6. Validation Scripts
- **Status**: ⏳ PENDING
- **Files to Check**:
  - `scripts/validation/01-phantom-money-check.ts` - Ledger balancing validation
  - `scripts/validation/02-simulator-spoof-check.ts` - Hardware oracle validation
  - `scripts/validation/03-the-full-loop.ts` - End-to-end contract lifecycle
  - `scripts/validation/04-redacted-build-check.sh` - Terminology compliance

### 7. Infrastructure Config - docker-compose.yml & .env.example
- **Status**: ⏳ PENDING
- **Purpose**: Identify infrastructure setup gaps

### 8. Mobile Workspace Status
- **Status**: ⏳ PENDING
- **Files to Check**:
  - `src/mobile/package.json` - Dependencies and scripts
  - `src/mobile/` source code overview

### 9. Desktop Workspace Status (Tauri App)
- **Status**: ⏳ PENDING
- **Components Expected**:
  - LedgerInspector
  - ExilePanel
  - MacroReview
  - B2B interface

### 10. B2B Module
- **Status**: ⏳ PENDING
- **Path**: `src/api/src/modules/b2b/`
- **Expected**: Billing and webhook services

## Key Technical Context
- **Tech Stack**: Turborepo (npm workspaces), NestJS, Next.js, React Native, Tauri
- **Core Patterns**: 
  - Double-entry ledger (PostgreSQL)
  - Hash-chained event log (SHA-256)
  - BullMQ-based Fury Router for async proof routing
  - Stripe FBO escrow model
  - Linguistic vocabulary cloaking for compliance
- **AI Integration**: Gemini 2.5 Flash for PitchDeck features
- **Behavioral Algorithms**: Loss aversion λ=1.955, integrity scoring (0-500 tiers), 6 oath categories

## Summary of Findings
(To be completed as exploration progresses)

