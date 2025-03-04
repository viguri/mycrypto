const TEST_WALLET_ADDRESS = 'e56bc34a70a6262b3897cbcd02b13ebddc80058ee354f75c3f9d07ce3bd9aec0';

export { TEST_WALLET_ADDRESS };
export default {
  async generateKeyPair() {
    return TEST_WALLET_ADDRESS;
  },
  async generateBlockHash() {
    return TEST_WALLET_ADDRESS;
  },
  generateTransactionHash() {
    return TEST_WALLET_ADDRESS;
  },
  hash() {
    return TEST_WALLET_ADDRESS;
  }
};