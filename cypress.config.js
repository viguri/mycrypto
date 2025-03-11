import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'https://localhost:3000',
    setupNodeEvents(on, config) {
      // Security-focused node events
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome' && browser.isHeadless) {
          launchOptions.args.push('--disable-gpu');
          launchOptions.args.push('--no-sandbox');
          return launchOptions;
        }
      });
    },
    env: {
      // Security configuration from project settings
      maxPayloadSize: 10240, // 10KB max payload size
      rateLimitWindow: 900000, // 15 minutes
      maxRequestsPerWindow: 100,
      cookieSecureOptions: {
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
      }
    },
    // Security-focused viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,
    // Enforce HTTPS
    requestTimeout: 10000,
    responseTimeout: 30000,
    // Security headers validation
    headers: {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block'
    }
  },
});
