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
        console.log(`API Response: ${response.url} - Status: ${response.status}`);
        
        // First check if response is OK before trying to parse JSON
        if (!response.ok) {
            // Try to parse error response as JSON if possible
            try {
                // Verify JSON content type
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    const errorMessage = errorData.message || errorData.error || `Server error: ${response.status}`;
                    console.error(`API error (${response.status}):`, errorMessage, errorData);
                    throw new Error(errorMessage);
                } else {
                    // Not JSON, use status text
                    console.error(`API error (${response.status}):`, response.statusText);
                    throw new Error(`Server error: ${response.status} ${response.statusText}`);
                }
            } catch (parseError) {
                if (parseError instanceof SyntaxError) {
                    // JSON parse error
                    console.error('Error parsing error response:', parseError);
                    throw new Error(`Server error: ${response.status}`);
                } else {
                    // Re-throw the error we created above
                    throw parseError;
                }
            }
        }
        
        // For successful responses, verify JSON content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('Invalid content type for successful response:', contentType);
            throw new Error('Server returned invalid response format');
        }

        // Parse successful response
        let data;
        try {
            data = await response.json();
            console.log('Response data:', data);
        } catch (parseError) {
            console.error('JSON parse error for successful response:', parseError);
            throw new Error('Failed to parse server response');
        }

        // Return the data for successful responses
        // Handle both formats: { data: {...} } and direct object
        return data.data || data;
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
    static async post(url, data = {}, options = {}) {
        console.log(`Making POST request to: ${url}`, data);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(options.headers || {})
                },
                body: JSON.stringify(data),
                credentials: 'include', // Always include credentials
                ...options
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error(`POST request failed to ${url}:`, error);
            throw error;
        }
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

// Export for browser environment
if (typeof window !== 'undefined') {
    window.ApiClient = ApiClient;
}

// Note: ES module export removed to fix browser compatibility