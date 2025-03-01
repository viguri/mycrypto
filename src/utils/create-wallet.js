const CryptoService = require('../services/CryptoService');
const axios = require('axios');

async function createWallet() {
    try {
        // Generate new keypair
        const { publicKey, privateKey } = CryptoService.generateKeypair();
        console.log('\nGenerated new keypair:');
        console.log('Private Key (KEEP THIS SECRET!):', privateKey);
        console.log('Public Key:', publicKey);

        // Register the address
        const response = await axios.post('http://localhost:3000/api/register', {
            publicKey
        });

        console.log('\nRegistration successful!');
        console.log('Your wallet address:', response.data.address);
        console.log('\nStore your private key safely - you need it to sign transactions!');
        
    } catch (error) {
        console.error('Failed to create wallet:', error.response?.data || error.message);
    }
}

createWallet();