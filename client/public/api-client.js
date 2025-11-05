/**
 * Standardized API response handler for frontend
 */
class ApiClient {
    /**
     * Process API response and extract data
     * @param {Response} response - Fetch API response
     * @returns {Promise<any>} Processed response data
     * @throws {Error} Standardized error with message
     */
    static async handleResponse(response) {
        // Verify JSON content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned invalid response format');
        }

        const data = await response.json();

        // Check for error response
        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        // Handle both response formats:
        // 1. {data: {...}} - Return data.data
        // 2. Direct response - Return data itself
        return data.hasOwnProperty('data') ? data.data : data;
    }

    /**
     * Make a GET request
     * @param {string} url - API endpoint URL
     * @param {Object} options - Additional fetch options
     * @returns {Promise<any>} Processed response data
     */
    static async get(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Accept': 'application/json',
                ...(options.headers || {})
            }
        });
        return this.handleResponse(response);
    }

    /**
     * Make a POST request
     * @param {string} url - API endpoint URL
     * @param {Object} data - Request body data
     * @param {Object} options - Additional fetch options
     * @returns {Promise<any>} Processed response data
     */
    static async post(url, data, options = {}) {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(options.headers || {})
            },
            body: JSON.stringify(data),
            ...options
        });
        return this.handleResponse(response);
    }

    /**
     * Make a DELETE request
     * @param {string} url - API endpoint URL
     * @param {Object} options - Additional fetch options
     * @returns {Promise<any>} Processed response data
     */
    static async delete(url, options = {}) {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                ...(options.headers || {})
            },
            ...options
        });
        return this.handleResponse(response);
    }
}

// Make ApiClient available globally and ensure it's initialized
window.ApiClient = ApiClient;

// Double-check initialization when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (!window.ApiClient) {
        console.warn('ApiClient not found, reinitializing...');
        window.ApiClient = ApiClient;
    }
});