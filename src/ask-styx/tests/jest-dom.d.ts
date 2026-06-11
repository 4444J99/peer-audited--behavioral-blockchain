// Type augmentation for @testing-library/jest-dom matchers.
// Required for `tsc --noEmit` to recognize .toBeInTheDocument(),
// .toBeDisabled(), .toHaveTextContent(), etc. on vitest's `expect`.
//
// The runtime augmentation also happens via tests/setup.ts importing
// '@testing-library/jest-dom/vitest', but tsc needs a static .d.ts
// reference to apply the augmentation at type-check time.
import "@testing-library/jest-dom";
