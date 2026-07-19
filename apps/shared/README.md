# Styx Shared Logic (The Kernel) - Ironclad Directive

## 1. Module Definition
This library contains the **Universal Truths** of the Styx universe. It is a pure TypeScript package shared between API, Web, and Mobile.

## 2. Core Mandates
1.  **Pure Functions**: No side effects. Input -> Output.
2.  **Single Source of Truth**: If a constant (e.g., `MIN_BMI`) exists here, it overrides any other definition.

## 3. Contents
- `libs/behavioral-logic.ts`: The "Physics" (Grace Days, Loss Aversion calculations).
- `libs/integrity.ts`: The Fury Accuracy algorithm.
- `types/`: DTOs, API Interfaces, Database Enums.
- `constants/`: `STYX_RULES` (e.g., Velocity Cap = 0.02).

## 4. Usage
- Import as `@styx/shared`.
- **Do not** import heavy dependencies (like React or NestJS) here. Keep it lightweight.

## 5. Testing
- **100% Coverage**: Since this is the logic kernel, every function must have exhaustive unit tests.
