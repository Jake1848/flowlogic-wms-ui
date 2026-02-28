/**
 * Custom Jest environment that extends jsdom with:
 * - TextEncoder / TextDecoder polyfills (required by react-router v7)
 * - import.meta.env stub (required by Vite-based source files)
 */
const { TestEnvironment } = require('jest-environment-jsdom');
const { TextEncoder, TextDecoder } = require('util');

class CustomTestEnvironment extends TestEnvironment {
  async setup() {
    await super.setup();

    // Polyfill TextEncoder / TextDecoder
    if (typeof this.global.TextEncoder === 'undefined') {
      this.global.TextEncoder = TextEncoder;
    }
    if (typeof this.global.TextDecoder === 'undefined') {
      this.global.TextDecoder = TextDecoder;
    }

    // Stub import.meta.env for Vite-based source files
    // This is injected into the global scope so that modules that reference
    // import.meta.env at evaluation time can fall back gracefully.
    this.global.importMetaEnv = {
      VITE_API_URL: 'http://localhost:3001',
      VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_placeholder',
      PROD: false,
      DEV: true,
      MODE: 'test',
    };
  }
}

module.exports = CustomTestEnvironment;
