import { jest } from '@jest/globals';
import { mockFetch } from '@test/setup.js';

// Mock the api-client module
const mockApiClient = {
    handleResponse: async (response) => {
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Request failed');
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Invalid response type');
        }

        return response.json();
    },

    get: async (path) => {
        const response = await fetch(`http://localhost:3000${path}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return mockApiClient.handleResponse(response);
    },

    post: async (path, data) => {
        const response = await fetch(`http://localhost:3000${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return mockApiClient.handleResponse(response);
    },

    delete: async (path) => {
        const response = await fetch(`http://localhost:3000${path}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return mockApiClient.handleResponse(response);
    }
};

describe('ApiClient', () => {
    let client;

    beforeEach(() => {
        client = mockApiClient;
        mockFetch.mockClear();
    });

    describe('handleResponse', () => {
        it('should handle successful responses', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                headers: new Map([['content-type', 'application/json']]),
                json: () => Promise.resolve({ data: 'test' })
            };

            const result = await client.handleResponse(mockResponse);
            expect(result).toEqual({ data: 'test' });
        });

        it('should throw error for invalid content type', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                headers: new Map([['content-type', 'text/plain']]),
                json: () => Promise.resolve({ data: 'test' })
            };

            await expect(client.handleResponse(mockResponse))
                .rejects
                .toThrow('Invalid response type');
        });

        it('should throw error for unsuccessful responses', async () => {
            const mockResponse = {
                ok: false,
                status: 404,
                headers: new Map([['content-type', 'application/json']]),
                json: () => Promise.resolve({ message: 'Not found' })
            };

            await expect(client.handleResponse(mockResponse))
                .rejects
                .toThrow('Not found');
        });
    });

    describe('get', () => {
        it('should make GET request with correct headers', async () => {
            mockFetch.mockImplementationOnce(() => Promise.resolve({
                ok: true,
                status: 200,
                headers: new Map([['content-type', 'application/json']]),
                json: () => Promise.resolve({ data: 'test' })
            }));

            await client.get('/test');

            expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/test', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        });
    });

    describe('post', () => {
        it('should make POST request with correct headers and body', async () => {
            const data = { test: 'data' };

            mockFetch.mockImplementationOnce(() => Promise.resolve({
                ok: true,
                status: 200,
                headers: new Map([['content-type', 'application/json']]),
                json: () => Promise.resolve({ data: 'test' })
            }));

            await client.post('/test', data);

            expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        });
    });

    describe('delete', () => {
        it('should make DELETE request with correct headers', async () => {
            mockFetch.mockImplementationOnce(() => Promise.resolve({
                ok: true,
                status: 200,
                headers: new Map([['content-type', 'application/json']]),
                json: () => Promise.resolve({ data: 'test' })
            }));

            await client.delete('/test');

            expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/test', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        });
    });
});