import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// jsdom has no IntersectionObserver — stub it so components using scroll-reveal
// effects (e.g. HomePage's useInView) don't crash on mount. Never fires callbacks;
// tests that need "in view" behavior should call the callback manually.
class IntersectionObserverStub implements IntersectionObserver {
  readonly root: Element | Document | null = null
  readonly rootMargin: string = ''
  readonly scrollMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
  disconnect(): void {}
  observe(): void {}
  unobserve(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}
globalThis.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver

// jsdom doesn't implement scrollIntoView (no real layout engine) — stub it so
// components that auto-scroll to the latest item (e.g. MessagesTab) don't crash.
Element.prototype.scrollIntoView = vi.fn()

afterEach(() => {
  cleanup()
})