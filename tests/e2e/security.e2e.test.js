import { test, expect } from '@playwright/test';

test.describe('Security E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('https://localhost:3000');
    });

    test('should enforce HTTPS', async ({ page }) => {
        // Verify HTTPS enforcement
        expect(page.url()).toStartWith('https://');

        // Check security indicator
        const sslIndicator = await page.getByTestId('ssl-indicator');
        await expect(sslIndicator).toContainText('🔒 Secure');
    });

    test('should protect against XSS', async ({ page }) => {
        const input = await page.getByTestId('wallet-address-input');
        await input.fill('<script>alert("xss")</script>');
        
        // Verify sanitized input
        const inputValue = await input.inputValue();
        expect(inputValue).not.toContain('<script>');
        expect(inputValue).not.toContain('javascript:');
    });

    test('should implement rate limiting', async ({ page }) => {
        const input = await page.getByTestId('wallet-address-input');
        const connectButton = await page.getByTestId('connect-button');
        const validAddress = '0x1234567890123456789012345678901234567890';

        await input.fill(validAddress);

        // Attempt multiple rapid connections
        for (let i = 0; i < 101; i++) {
            await connectButton.click();
        }

        // Verify rate limit error
        const errorMessage = await page.getByTestId('error-message');
        await expect(errorMessage).toContainText('Too many requests');
    });

    test('should secure sensitive data display', async ({ page }) => {
        const input = await page.getByTestId('wallet-address-input');
        const toggleButton = await page.getByTestId('toggle-visibility');
        const validAddress = '0x1234567890123456789012345678901234567890';

        await input.fill(validAddress);

        // Verify initial state (hidden)
        expect(await input.getAttribute('type')).toBe('password');

        // Toggle visibility
        await toggleButton.click();
        expect(await input.getAttribute('type')).toBe('text');

        // Toggle back to hidden
        await toggleButton.click();
        expect(await input.getAttribute('type')).toBe('password');
    });

    test('should validate security headers', async ({ page }) => {
        const response = await page.goto('https://localhost:3000');
        const headers = response.headers();

        // Verify security headers
        expect(headers['content-security-policy']).toBeDefined();
        expect(headers['x-frame-options']).toBe('DENY');
        expect(headers['strict-transport-security']).toContain('max-age=31536000');
        expect(headers['x-content-type-options']).toBe('nosniff');
    });

    test('should enforce secure session handling', async ({ page }) => {
        const input = await page.getByTestId('wallet-address-input');
        const connectButton = await page.getByTestId('connect-button');
        const validAddress = '0x1234567890123456789012345678901234567890';

        await input.fill(validAddress);
        await connectButton.click();

        // Verify secure cookie attributes
        const cookies = await page.context().cookies();
        const sessionCookie = cookies.find(c => c.name === 'sessionId');
        
        expect(sessionCookie).toBeDefined();
        expect(sessionCookie.secure).toBe(true);
        expect(sessionCookie.httpOnly).toBe(true);
        expect(sessionCookie.sameSite).toBe('Strict');
    });

    test('should prevent invalid wallet connections', async ({ page }) => {
        const input = await page.getByTestId('wallet-address-input');
        const connectButton = await page.getByTestId('connect-button');

        // Test with invalid address
        await input.fill('invalid-address');
        await connectButton.click();

        // Verify error message
        const errorMessage = await page.getByTestId('error-message');
        await expect(errorMessage).toContainText('Invalid Ethereum address format');

        // Verify connection status remains disconnected
        const connectionStatus = await page.getByTestId('connection-status');
        await expect(connectionStatus).toContainText('Disconnected');
    });

    test('should maintain security state after navigation', async ({ page }) => {
        // Connect wallet
        const input = await page.getByTestId('wallet-address-input');
        const connectButton = await page.getByTestId('connect-button');
        const validAddress = '0x1234567890123456789012345678901234567890';

        await input.fill(validAddress);
        await connectButton.click();

        // Navigate away and back
        await page.goto('https://localhost:3000/about');
        await page.goto('https://localhost:3000');

        // Verify security state is maintained
        const connectionStatus = await page.getByTestId('connection-status');
        await expect(connectionStatus).toContainText('Connected');

        // Verify security headers are still present
        const response = await page.goto('https://localhost:3000');
        const headers = response.headers();
        expect(headers['content-security-policy']).toBeDefined();
    });
});
