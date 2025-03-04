#!/usr/bin/env node

// Import necessary modules
import { program } from 'commander';
import fs from 'fs';

const STORAGE_FILE = 'wallets.json';

// Load wallets from storage
let wallets = [];
try {
  if (fs.existsSync(STORAGE_FILE)) {
    const loadedWallets = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
    // Ensure all wallets have the required properties
    wallets = loadedWallets.map(wallet => ({
      id: wallet.id,
      address: wallet.address || `0x${Math.random().toString(16).slice(2)}`,
      balance: wallet.balance || 0,
      created: wallet.created || new Date().toISOString(),
      transactions: wallet.transactions || []
    }));
  }
} catch (err) {
  console.error('Error loading wallets:', err);
}

const saveWallets = () => fs.writeFileSync(STORAGE_FILE, JSON.stringify(wallets, null, 2));

// Define the CLI commands and options
program
  .version('1.0.0')
  .description('CLI for managing wallets and users')
  .option('-a, --add <type>', 'Add a new wallet or user')
  .option('-l, --list', 'List all wallets or users')
  .option('-d, --delete <id>', 'Delete a wallet or user by ID');

// Implement the command logic
program
  .command('create-wallet')
  .description('Create a new wallet (alias for "add wallet")')
  .action(() => {
    // Generate a simple address (in real impl this would be cryptographic)
    const address = `0x${Math.random().toString(16).slice(2)}`;
    const wallet = {
      id: wallets.length + 1,
      address: address,
      balance: 0,
      created: new Date().toISOString(),
      transactions: []
    };
    console.log('Creating a new wallet...');
    wallets.push(wallet);
    saveWallets();
  });

program
  .command('add')
  .argument('<type>', 'Type of item to add (wallet or user)')
  .description('Add a new wallet or user')
  .action((type) => {
    if (type === 'wallet') {
      // Generate a simple address (in real impl this would be cryptographic)
      const address = `0x${Math.random().toString(16).slice(2)}`;
      const wallet = {
        id: wallets.length + 1,
        address: address,
        balance: 0,
        created: new Date().toISOString(),
        transactions: []
      };
      console.log(`Adding a new ${type}...`);
      wallets.push(wallet);
      saveWallets();
    }
  });

program
  .command('list')
  .description('List all wallets or users')
  .action(() => {
    console.log('Listing all wallets and users...');
    if (wallets.length === 0) {
      console.log('No wallets found.');
      return;
    }
    wallets.forEach(wallet => {
      console.log(`\nWallet ID: ${wallet.id}`);
      console.log(`Address: ${wallet.address}`);
      console.log(`Balance: ${wallet.balance}`);
      console.log(`Created: ${wallet.created}`);
      console.log(`Transactions: ${wallet.transactions.length}`);
    });
  });

program
  .command('delete <id>')
  .description('Delete a wallet or user by ID')
  .action((id) => {
    const numId = parseInt(id);
    console.log(`Deleting wallet or user with ID: ${id}...`);
    wallets = wallets.filter(w => w.id !== numId);
    saveWallets();
    console.log(`Wallet ${id} deleted successfully.`);
  });

// Parse the command line arguments
program.parse(process.argv);