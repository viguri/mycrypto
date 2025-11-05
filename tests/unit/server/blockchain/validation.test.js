import { jest } from '@jest/globals';
import Blockchain from '../../src/blockchain/core/Blockchain.js';
import BlockchainStorage from '../../src/storage/blockchain/BlockchainStorage.js';

describe('Blockchain Validation Tests', () => {
    let blockchain;

    beforeEach(async () => {
        // Reset blockchain storage
        const storage = new BlockchainStorage();
        await storage.saveState({
            chain: [],
            wallets: [],
            pendingTransactions: []
        });

        // Initialize blockchain with clean state
        blockchain = new Blockchain();
        await blockchain.initialize();

        // Add test wallet with initial state
        const testWallet = {
            address: 'test_wallet',
            balance: 0,
            createdAt: Date.now(),
            isMainWallet: false
        };
        await blockchain.addWallet(testWallet);

        // Ensure main wallet exists with initial state
        const mainWallet = {
            address: 'main_wallet',
            balance: 1000000,
            createdAt: Date.now(),
            isMainWallet: true
        };
        await blockchain.addWallet(mainWallet);
    });

    describe('Transaction Validation', () => {
        it('should validate a valid transaction', async () => {
            const tx = {
                from: 'main_wallet',
                to: 'test_wallet',
                amount: 100,
                isSystemTransaction: true
            };

            const result = await blockchain.createTransaction(tx);
            expect(result).toHaveProperty('hash');
            expect(result.status).toBe('pending');
        });

        it('should reject invalid transaction format', async () => {
            const tx = null;
            await expect(async () => {
                await blockchain.createTransaction(tx);
            }).rejects.toThrow('Invalid transaction format');
        });

        it('should reject missing required fields', async () => {
            const tx = { from: 'wallet1' };
            await expect(async () => {
                await blockchain.createTransaction(tx);
            }).rejects.toThrow('Missing required field');
        });

        it('should reject invalid amount', async () => {
            const tx = {
                from: 'main_wallet',
                to: 'test_wallet',
                amount: -100,
                isSystemTransaction: true
            };

            await expect(async () => {
                await blockchain.createTransaction(tx);
            }).rejects.toThrow('Invalid transaction amount');
        });

        it('should reject self-transfer', async () => {
            const tx = {
                from: 'main_wallet',
                to: 'main_wallet',
                amount: 100,
                isSystemTransaction: true
            };

            await expect(async () => {
                await blockchain.createTransaction(tx);
            }).rejects.toThrow('Self-transfer not allowed');
        });

        it('should reject direct main wallet transfer', async () => {
            const tx = {
                from: 'main_wallet',
                to: 'test_wallet',
                amount: 100
            };

            await expect(async () => {
                await blockchain.createTransaction(tx);
            }).rejects.toThrow('Direct transfers from main wallet not allowed');
        });
    });

    describe('Block Validation', () => {
        it('should validate chain after mining block', async () => {
            // Create a system transaction
            const tx = {
                from: 'main_wallet',
                to: 'test_wallet',
                amount: 100,
                isSystemTransaction: true
            };

            // Create and mine transaction
            await blockchain.createTransaction(tx);
            await blockchain.saveState();

            // Mine block and validate
            await blockchain.mineBlock();
            const isValid = await blockchain.validateChain();
            expect(isValid).toBe(true);
        });

        it('should reject invalid block index', async () => {
            const block = blockchain.getLatestBlock();
            const invalidBlock = {
                ...block,
                index: block.index + 2,
                timestamp: Date.now(),
                previousHash: block.hash
            };

            expect(() => {
                blockchain.validateBlock(invalidBlock, block);
            }).toThrow('Invalid block index');
        });

        it('should reject invalid previous hash', async () => {
            const block = blockchain.getLatestBlock();
            const invalidBlock = {
                ...block,
                index: block.index + 1,
                timestamp: Date.now(),
                previousHash: 'invalid_hash'
            };

            expect(() => {
                blockchain.validateBlock(invalidBlock, block);
            }).toThrow('Invalid previous hash');
        });

        it('should reject invalid timestamp', async () => {
            const block = blockchain.getLatestBlock();
            const invalidBlock = {
                ...block,
                index: block.index + 1,
                timestamp: block.timestamp - 1000,
                previousHash: block.hash
            };

            expect(() => {
                blockchain.validateBlock(invalidBlock, block);
            }).toThrow('Invalid block timestamp');
        });
    });

    describe('Chain Validation', () => {
        it('should validate genesis block', async () => {
            const isValid = await blockchain.validateChain();
            expect(isValid).toBe(true);
        });

        it('should validate chain with multiple blocks', async () => {
            // Get initial chain length after genesis
            const initialLength = blockchain.chain.length;
            expect(initialLength).toBe(1); // Just genesis block

            // Create and mine multiple transactions
            for (let i = 0; i < 3; i++) {
                // Create system transaction
                const tx = {
                    from: 'main_wallet',
                    to: 'test_wallet',
                    amount: 100,
                    isSystemTransaction: true
                };

                // Create transaction
                await blockchain.createTransaction(tx);

                // Mine block with this transaction
                const block = await blockchain.mineBlock();
                expect(block.index).toBe(initialLength + i);
            }

            // Validate final chain state
            const isValid = await blockchain.validateChain();
            expect(isValid).toBe(true);
            expect(blockchain.chain.length).toBe(4); // Genesis + 3 blocks
        });
    });
});
