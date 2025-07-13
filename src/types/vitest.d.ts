import '@testing-library/jest-dom'

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

interface CustomMatchers<R = unknown> {
  toBeInTheDocument(): R
  toHaveTextContent(text: string | RegExp): R
  toHaveClass(...classes: string[]): R
  toHaveFocus(): R
}