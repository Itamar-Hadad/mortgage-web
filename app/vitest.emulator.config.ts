/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

// Separate from vite.config.ts: these tests need a live Firestore Emulator
// (see package.json's test:firestore script), so they're node-environment
// and excluded from the default `npm test` run.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.emulator.test.ts'],
    // All these files share one live Firestore Emulator instance/project —
    // running files in parallel lets one file's clearFirestore() wipe data
    // another file is mid-test with. Force sequential execution.
    fileParallelism: false,
  },
})