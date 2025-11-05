#!/usr/bin/env node

import axios from 'axios';
import { program } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';

const API_URL = 'http://localhost:3000/api';

program
  .version('1.0.0')
  .description('VigCoin CLI - A command line interface for the VigCoin blockchain');

// Create a new wallet
program
  .command('create-wallet')
  .description('Create a new wallet')
  .action(async () => {
    try {
      const response = await axios.post(`${API_URL}/registration/wallet`);
      console.log('\nWallet created successfully! 🎉');
      console.log('Address:', chalk.green(response.data.data.address));
      console.log('Initial Balance:', chalk.yellow(response.data.data.balance), 'VIG');
    } catch (error) {
      console.error(chalk.red('Error creating wallet:'), error.response?.data?.message || error.message);
    }
  });

// Get wallet info
program
  .command('wallet <address>')
  .description('Get wallet information')
  .action(async (address) => {
    try {
      const response = await axios.get(`${API_URL}/registration/${address}`);
      const wallet = response.data;

      const table = new Table({
        head: [chalk.cyan('Property'), chalk.cyan('Value')],
        style: { head: [], border: [] }
      });

      table.push(
        ['Address', chalk.green(wallet.address)],
        ['Balance', chalk.yellow(wallet.balance + ' VIG')],
        ['Created At', new Date(wallet.createdAt).toLocaleString()],
        ['Transactions', wallet.transactions]
      );

      console.log('\nWallet Information:');
      console.log(table.toString());
    } catch (error) {
      console.error(chalk.red('Error getting wallet info:'), error.response?.data?.message || error.message);
    }
  });

// List all wallets
program
  .command('list-wallets')
  .description('List all wallets')
  .action(async () => {
    try {
      const response = await axios.get(`${API_URL}/registration/wallets`);
      const wallets = response.data.wallets;

      const table = new Table({
        head: [
          chalk.cyan('Address'),
          chalk.cyan('Balance'),
          chalk.cyan('Created At')
        ],
        style: { head: [], border: [] }
      });

      wallets.forEach(wallet => {
        table.push([
          chalk.green(wallet.address),
          chalk.yellow(wallet.balance + ' VIG'),
          new Date(wallet.createdAt).toLocaleString()
        ]);
      });

      console.log('\nWallets:');
      console.log(table.toString());
    } catch (error) {
      console.error(chalk.red('Error listing wallets:'), error.response?.data?.message || error.message);
    }
  });

// Send transaction
program
  .command('send <from> <to> <amount>')
  .description('Send VIG from one wallet to another')
  .action(async (from, to, amount) => {
    try {
      const response = await axios.post(`${API_URL}/transactions`, {
        from,
        to,
        amount: parseFloat(amount)
      });

      console.log('\nTransaction sent successfully! 🚀');
      console.log('From:', chalk.green(from));
      console.log('To:', chalk.green(to));
      console.log('Amount:', chalk.yellow(amount), 'VIG');
      
      // Auto-mine the transaction
      await axios.post(`${API_URL}/mining/mine`);
      console.log(chalk.green('Transaction mined! ⛏️'));
      
    } catch (error) {
      console.error(chalk.red('Error sending transaction:'), error.response?.data?.message || error.message);
    }
  });

// Mine pending transactions
program
  .command('mine')
  .description('Mine pending transactions')
  .action(async () => {
    try {
      const response = await axios.post(`${API_URL}/mining/mine`);
      console.log('\nMining successful! ⛏️');
      console.log('Block hash:', chalk.green(response.data.hash));
      console.log('Transactions mined:', chalk.yellow(response.data.transactions.length));
    } catch (error) {
      console.error(chalk.red('Error mining:'), error.response?.data?.message || error.message);
    }
  });

program.parse(process.argv);