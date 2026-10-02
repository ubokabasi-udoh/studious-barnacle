// Minimal typing for the Node assert module used by scripts/checks.ts, so the
// checks can run with the locally installed TypeScript (no @types/node needed).
declare module 'node:assert/strict' {
  interface StrictAssert {
    ok(value: unknown, message?: string): void
    equal(actual: unknown, expected: unknown, message?: string): void
    deepEqual(actual: unknown, expected: unknown, message?: string): void
  }
  const assert: StrictAssert
  export default assert
}
