import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [minerAddress, setMinerAddress] = useState('');
  const [checkAddress, setCheckAddress] = useState('');
  const [balance, setBalance] = useState(null);
  const [blockchain, setBlockchain] = useState(null);

  const API_URL = '/api'; // Using Vite's proxy configuration

  async function createTransaction() {
    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fromAddress, toAddress, amount: Number(amount) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      alert('Transaction created successfully!');
    } catch (error) {
      alert('Error creating transaction: ' + error.message);
    }
  }

  async function mineBlock() {
    try {
      const response = await fetch(`${API_URL}/mining`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ minerAddress }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      alert('Block mined successfully!');
      getBlockchain();
    } catch (error) {
      alert('Error mining block: ' + error.message);
    }
  }

  async function checkBalance() {
    try {
      const response = await fetch(`${API_URL}/wallet/${checkAddress}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setBalance(data.balance);
    } catch (error) {
      alert('Error checking balance: ' + error.message);
      setBalance(null);
    }
  }

  async function getBlockchain() {
    try {
      const response = await fetch(`${API_URL}/blockchain`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setBlockchain(data);
    } catch (error) {
      alert('Error fetching blockchain: ' + error.message);
      setBlockchain(null);
    }
  }

  useEffect(() => {
    getBlockchain();
  }, []);

  return (
    <div className="container">
      <h1>VigCoin Blockchain Explorer</h1>
      
      <div className="section">
        <h2>Create Transaction</h2>
        <input
          type="text"
          value={fromAddress}
          onChange={(e) => setFromAddress(e.target.value)}
          placeholder="From Address"
        />
        <input
          type="text"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          placeholder="To Address"
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
        />
        <button onClick={createTransaction}>Send Transaction</button>
      </div>

      <div className="section">
        <h2>Mine Block</h2>
        <input
          type="text"
          value={minerAddress}
          onChange={(e) => setMinerAddress(e.target.value)}
          placeholder="Miner Address"
        />
        <button onClick={mineBlock}>Mine Block</button>
      </div>

      <div className="section">
        <h2>Check Balance</h2>
        <input
          type="text"
          value={checkAddress}
          onChange={(e) => setCheckAddress(e.target.value)}
          placeholder="Address"
        />
        <button onClick={checkBalance}>Check Balance</button>
        {balance !== null && (
          <div className="result">Balance: {balance} VigCoins</div>
        )}
      </div>

      <div className="section">
        <h2>Blockchain Status</h2>
        <button onClick={getBlockchain}>Refresh Blockchain</button>
        {blockchain && (
          <div className="result">
            <pre>{JSON.stringify(blockchain, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
