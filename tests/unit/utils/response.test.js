import { jest } from '@jest/globals';
import { success, error, ErrorTypes } from '@/utils/response/index.js';

describe('Response Handler', () => {
    describe('success()', () => {
        it('should create a success response with defaults', () => {
            const response = success();
            expect(response).toEqual({
                success: true,
                message: 'Operation successful',
                data: null,
                status: 200
            });
        });

        it('should create a success response with custom data', () => {
            const data = { id: 1, name: 'Test' };
            const response = success(data);
            expect(response).toEqual({
                success: true,
                message: 'Operation successful',
                data,
                status: 200
            });
        });

        it('should create a success response with custom message and status', () => {
            const data = { id: 1 };
            const message = 'Created successfully';
            const status = 201;
            const response = success(data, message, status);
            expect(response).toEqual({
                success: true,
                message,
                data,
                status
            });
        });
    });

    describe('error()', () => {
        it('should create an error response with defaults', () => {
            const response = error();
            expect(response).toEqual({
                success: false,
                message: 'An error occurred',
                error: 'Error',
                status: 400
            });
        });

        it('should create an error response with custom message', () => {
            const message = 'Invalid input';
            const response = error(message);
            expect(response).toEqual({
                success: false,
                message,
                error: 'Error',
                status: 400
            });
        });

        it('should create an error response with custom error type and status', () => {
            const message = 'Not found';
            const errorType = ErrorTypes.NOT_FOUND;
            const status = 404;
            const response = error(message, errorType, status);
            expect(response).toEqual({
                success: false,
                message,
                error: errorType,
                status
            });
        });
    });

    describe('ErrorTypes', () => {
        it('should have all required error types', () => {
            expect(ErrorTypes).toEqual({
                VALIDATION: 'ValidationError',
                NOT_FOUND: 'NotFoundError',
                UNAUTHORIZED: 'UnauthorizedError',
                FORBIDDEN: 'ForbiddenError',
                INTERNAL: 'InternalError'
            });
        });

        it('should not be modifiable', () => {
            expect(() => {
                ErrorTypes.NEW_TYPE = 'NewError';
            }).toThrow();
        });
    });
});