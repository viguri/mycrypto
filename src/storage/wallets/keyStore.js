const fs = require('fs');
const path = require('path');

// Path to storage directory and file
const STORAGE_DIR = path.join(__dirname);
const STORAGE_FILE = path.join(STORAGE_DIR, 'keystore.json');

class KeyStore {
    constructor() {
        this.ensureStorageExists();
        this.store = this.load();
    }

    ensureStorageExists() {
        try {
            if (!fs.existsSync(STORAGE_DIR)) {
                fs.mkdirSync(STORAGE_DIR, { recursive: true });
            }
            if (!fs.existsSync(STORAGE_FILE)) {
                fs.writeFileSync(STORAGE_FILE, '{}', 'utf8');
            }
        } catch (error) {
            console.error('Error initializing storage:', error);
        }
    }

    load() {
        try {
            const data = fs.readFileSync(STORAGE_FILE, 'utf8');
            console.log('Loading key store from:', STORAGE_FILE);
            console.log('Raw data:', data);
            const entries = JSON.parse(data || '{}');
            const map = new Map(Object.entries(entries));
            console.log('Loaded addresses:', Array.from(map.keys()));
            return map;
        } catch (error) {
            console.error('Error loading key store:', error);
            return new Map();
        }
    }

    save() {
        try {
            const obj = {};
            for (const [key, value] of this.store.entries()) {
                obj[key] = value;
            }
            const data = JSON.stringify(obj, null, 2);
            fs.writeFileSync(STORAGE_FILE, data, 'utf8');
            console.log('Saved key store. Current addresses:', Array.from(this.store.keys()));
        } catch (error) {
            console.error('Error saving key store:', error);
        }
    }

    set(address, publicKey) {
        console.log('Registering address:', address);
        this.store.set(address, publicKey);
        this.save();
        console.log('Registration verified:', this.has(address));
    }

    get(address) {
        const publicKey = this.store.get(address);
        console.log('Retrieved public key for address:', address, publicKey ? 'found' : 'not found');
        return publicKey;
    }

    has(address) {
        const result = this.store.has(address);
        console.log('Checking address registration:', address, result ? 'registered' : 'not registered');
        return result;
    }

    list() {
        return Array.from(this.store.keys());
    }
}

// Create and export singleton instance
const keyStore = new KeyStore();
console.log('KeyStore initialized with addresses:', keyStore.list());
module.exports = keyStore;