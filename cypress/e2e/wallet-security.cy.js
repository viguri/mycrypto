describe('Wallet Security E2E Tests', () => {
  const validWalletAddress = '0x1234567890123456789012345678901234567890';

  beforeEach(() => {
    // Clear cookies and localStorage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('should enforce HTTPS and security headers', () => {
    // Verify HTTPS
    cy.location('protocol').should('eq', 'https:');

    // Verify security headers
    cy.request('/')
      .its('headers')
      .then((headers) => {
        expect(headers['strict-transport-security']).to.include('max-age=31536000');
        expect(headers['x-frame-options']).to.equal('DENY');
        expect(headers['x-content-type-options']).to.equal('nosniff');
        expect(headers['x-xss-protection']).to.equal('1; mode=block');
      });
  });

  it('should validate wallet address input and prevent XSS', () => {
    cy.get('[data-testid="wallet-address-input"]')
      .type('<script>alert("xss")</script>');

    // Check if XSS is prevented
    cy.get('[data-testid="wallet-address-input"]')
      .should('not.have.value', '<script>alert("xss")</script>');

    // Verify error message
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Invalid Ethereum address format');
  });

  it('should handle rate limiting in the UI', () => {
    // Attempt multiple rapid connections
    for (let i = 0; i < 101; i++) {
      cy.get('[data-testid="connect-button"]').click();
    }

    // Verify rate limit error
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Too many requests');
  });

  it('should enforce secure cookie settings', () => {
    cy.get('[data-testid="wallet-address-input"]')
      .type(validWalletAddress);
    cy.get('[data-testid="connect-button"]').click();

    // Verify secure cookie attributes
    cy.getCookie('walletSession')
      .should('exist')
      .then((cookie) => {
        expect(cookie.secure).to.be.true;
        expect(cookie.httpOnly).to.be.true;
        expect(cookie.sameSite).to.equal('strict');
      });
  });

  it('should handle secure wallet connection flow', () => {
    // Step 1: Check initial security indicator
    cy.get('[data-testid="ssl-indicator"]')
      .should('have.text', '🔒 Secure')
      .and('have.attr', 'data-secure', 'true');

    // Step 2: Enter valid wallet address
    cy.get('[data-testid="wallet-address-input"]')
      .type(validWalletAddress);

    // Step 3: Verify connect button is enabled
    cy.get('[data-testid="connect-button"]')
      .should('not.be.disabled');

    // Step 4: Connect wallet
    cy.get('[data-testid="connect-button"]').click();

    // Step 5: Verify successful connection
    cy.get('[data-testid="connection-status"]')
      .should('contain', 'Connected');

    // Step 6: Test address masking
    cy.get('[data-testid="toggle-visibility"]').click();
    cy.get('[data-testid="wallet-address-input"]')
      .should('have.attr', 'type', 'password');
  });

  it('should prevent insecure connection attempts', () => {
    // Mock insecure connection
    cy.visit('http://localhost:3000', {
      failOnStatusCode: false
    });

    // Should be redirected to HTTPS
    cy.location('protocol').should('eq', 'https:');
  });

  it('should validate payload size limits', () => {
    const largeData = 'a'.repeat(11000); // Exceeds 10KB limit

    cy.get('[data-testid="wallet-address-input"]')
      .type(validWalletAddress);
    
    // Attempt to send large payload
    cy.window().then((win) => {
      cy.stub(win, 'fetch').as('fetchStub');
      
      cy.get('[data-testid="connect-button"]').click();

      cy.get('@fetchStub').should((stub) => {
        expect(stub.args[0][1].body.length).to.be.lessThan(10240);
      });
    });
  });

  it('should implement proper logout security', () => {
    // Connect wallet first
    cy.get('[data-testid="wallet-address-input"]')
      .type(validWalletAddress);
    cy.get('[data-testid="connect-button"]').click();

    // Perform logout
    cy.get('[data-testid="logout-button"]').click();

    // Verify session is cleared
    cy.getCookie('walletSession').should('not.exist');
    cy.get('[data-testid="connection-status"]')
      .should('contain', 'Disconnected');
  });
});
