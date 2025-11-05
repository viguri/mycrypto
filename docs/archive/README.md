# Archived Documentation

This directory contains documentation files that have been archived because they reference outdated project structure, API endpoints, or configuration details.

## Reason for Archiving

These files were archived on March 25, 2025 as part of the project reorganization that:
1. Separated client and server code into distinct directories
2. Changed server port from 3000 to 3003
3. Updated file paths and directory structure
4. Reorganized the codebase for better maintainability

## Archived Files

- **api_testing.md**: Contained outdated API endpoint references and incorrect port numbers
- **cli_manual.md**: Referenced outdated server configuration and port numbers
- **testing.md**: Contained code examples with outdated import paths referencing the old `src/` directory structure

## Current Documentation

Please refer to the up-to-date documentation in the main `docs` directory and its subdirectories:
- API Reference: `/docs/api/reference.md`
- Security Documentation: `/docs/security/`
- Testing Guidelines: `/docs/testing/`

The logging system documentation has also been updated to reflect the new file locations:
- Logger: `server/utils/logger/index.js`
- Log storage: `server/storage/logs/`
