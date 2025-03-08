import { jest } from '@jest/globals';

// Default mock response
const defaultResponse = {
    ok: true,
    status: 200,
    json: () => Promise.resolve({ data: 'test' }),
    headers: new Map([['content-type', 'application/json']])
};

// Create fetch mock
export const mockFetch = jest.fn(() => Promise.resolve(defaultResponse));

// Reset helper
export const resetFetchMock = () => {
    mockFetch.mockClear();
    mockFetch.mockImplementation(() => Promise.resolve(defaultResponse));
};

// Configure mock for specific responses
export const configureMockFetch = (status = 200, data = { data: 'test' }, ok = true) => {
    mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok,
        status,
        json: () => Promise.resolve(data),
        headers: new Map([['content-type', 'application/json']])
    }));
};

// Configure mock for error responses
export const configureMockFetchError = (status = 500, message = 'Internal Server Error') => {
    mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: false,
        status,
        json: () => Promise.resolve({ error: message }),
        headers: new Map([['content-type', 'application/json']])
    }));
};

export default mockFetch;