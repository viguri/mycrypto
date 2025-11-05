# Changelog

## [1.1.0] - 2025-04-03

### Added

- Standardized API response format across all endpoints
- New ApiClient utility for frontend API interactions
- Response handler middleware for consistent API responses
- Comprehensive API documentation with response examples

### Changed

- Updated all API endpoints to use standardized response format
- Refactored frontend API calls to use new ApiClient
- Improved error handling and status code usage
- Updated frontend wallet handling to match new API format
- Enhanced documentation with standardized response examples

### Technical Details

- New `responseHandler.js` utility for consistent API responses
- ApiClient with standardized methods: get, post, delete
- Updated response format:
  ```json
  {
    "success": true/false,
    "message": "Operation message",
    "data": { ... },
    "status": HTTP_STATUS_CODE
  }
  ```
- Standardized error types and handling
- Frontend compatibility maintained while improving code structure

### Documentation

- Added new API response format documentation
- Updated all API endpoint examples
- Added Frontend utilities documentation
- Enhanced error handling documentation

## [1.0.0] - 2025-03-15

Initial release of the blockchain API

### Features

- Basic blockchain operations
- Transaction handling
- Wallet management
- Mining capabilities
- API documentation
