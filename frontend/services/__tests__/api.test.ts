import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    apiCall,
    ApiError,
    authApi,
    casesApi,
    messagesApi,
    appointmentsApi,
    contactApi,
    usersApi,
    notificationsApi,
    auditApi,
    settingsApi
} from '../api';

// Mock fetch globally
// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        clear: () => {
            store = {};
        },
        removeItem: (key: string) => {
            delete store[key];
        },
    };
})();

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
});

global.fetch = vi.fn();

describe('api.ts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('apiCall - Happy Path', () => {
        it('should make a request with correct headers', async () => {
            const mockResponse = { data: 'test' };
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
                status: 200,
            });

            const result = await apiCall('/test');

            expect(global.fetch).toHaveBeenCalledWith('/api/v1/test', expect.objectContaining({
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                }),
            }));
            expect(result).toEqual(mockResponse);
        });

        it('should include authorization token if present', async () => {
            localStorage.setItem('token', 'fake-token');
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({}),
                status: 200,
            });

            await apiCall('/test');

            expect(global.fetch).toHaveBeenCalledWith('/api/v1/test', expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': 'Bearer fake-token',
                }),
            }));
        });

        it('should return empty object for 204 response', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                status: 204,
                json: async () => { throw new Error('No body') },
            });

            const result = await apiCall('/test');
            expect(result).toEqual({});
        });
    });

    describe('apiCall - Error Handling (Edge Cases)', () => {
        it('should throw ApiError on 400 Bad Request', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({ detail: 'Bad Request' }),
            });

            await expect(apiCall('/test')).rejects.toThrow('Bad Request');
            await expect(apiCall('/test')).rejects.toBeInstanceOf(ApiError);
        });

        it('should throw ApiError on 404 Not Found', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: false,
                status: 404,
                json: async () => ({ detail: 'Resource not found' }),
            });

            await expect(apiCall('/test')).rejects.toThrow('Resource not found');
        });

        it('should throw ApiError on 500 Internal Server Error', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: false,
                status: 500,
                json: async () => ({ detail: 'Internal Server Error' }),
            });

            await expect(apiCall('/test')).rejects.toThrow('Internal Server Error');
        });

        it('should throw "Network error" if fetch fails silently', async () => {
            (global.fetch as any).mockRejectedValue(new Error('Network failure'));

            await expect(apiCall('/test')).rejects.toThrow('Network failure');
        });

        it('should handle complex error details (array)', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({ detail: [{ msg: 'Error 1' }, { message: 'Error 2' }] }),
            });

            await expect(apiCall('/test')).rejects.toThrow('Error 1; Error 2');
        });

        it('should handle error with status property', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: false,
                status: 401,
                json: async () => ({ detail: 'Unauthorized' }),
            });

            const error = await apiCall('/test').catch(e => e);
            expect((error as any).status).toBe(401);
        });
    });

    describe('authApi', () => {
        it('login should use x-www-form-urlencoded', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ token: 'abc' }),
            });

            await authApi.login({ email: 'test@example.com', password: 'pass' });

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/auth/login'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }),
                    body: expect.any(URLSearchParams),
                })
            );
        });

        it('login should handle failure', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: false,
                status: 401,
                json: async () => ({ detail: 'Invalid credentials' }),
            });

            await expect(authApi.login({ email: 'a', password: 'b' })).rejects.toThrow('Invalid credentials');
        });

        it('register should make POST request', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ id: '123', email: 'test@test.com' }),
            });

            const result = await authApi.register({ email: 'test@test.com', password: 'password123' });

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/auth/register'),
                expect.objectContaining({ method: 'POST' })
            );
            expect(result.id).toBe('123');
        });

        it('getMe should fetch user profile', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ first_name: 'John', last_name: 'Doe' }),
            });

            const result = await authApi.getMe();
            expect(result.first_name).toBe('John');
        });
    });

    describe('casesApi', () => {
        it('list should fetch cases', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => [{ id: '1', title: 'Case 1' }],
            });

            const result = await casesApi.list();
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('1');
        });

        it('get should fetch single case', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ id: '1', title: 'Case 1' }),
            });

            const result = await casesApi.get('1');
            expect(result.id).toBe('1');
        });

        it('create should POST case data', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ id: '123', title: 'New Case' }),
            });

            const result = await casesApi.create({ title: 'New Case', description: 'Description' });
            expect(result.id).toBe('123');
        });

        it('uploadDocument should send FormData', async () => {
            const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ id: '123' }),
            });

            await casesApi.uploadDocument('123', mockFile);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/cases/123/documents'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.any(FormData),
                })
            );
        });

        it('uploadDocument should handle error', async () => {
            const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
            (global.fetch as any).mockResolvedValue({
                ok: false,
                status: 500,
                json: async () => ({ detail: 'Server error' }),
            });

            await expect(casesApi.uploadDocument('123', mockFile)).rejects.toThrow('Server error');
        });
    });

    describe('messagesApi', () => {
        it('list should fetch messages', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => [{ id: '1', subject: 'Test' }],
            });

            const result = await messagesApi.list();
            expect(result).toHaveLength(1);
        });

        it('list should support includeArchived parameter', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => [],
            });

            await messagesApi.list(true);
            expect(global.fetch).toHaveBeenCalled();
            const callUrl = (global.fetch as any).mock.calls[0][0];
            expect(callUrl).toContain('include_archived=true');
        });

        it('send should POST message data', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ success: true }),
            });

            await messagesApi.send({ recipient_id: '123', content: 'Hello' });
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/messages/send'),
                expect.objectContaining({ method: 'POST' })
            );
        });

        it('update should PATCH message', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ success: true }),
            });

            await messagesApi.update('1', { is_read: true });
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/messages/1'),
                expect.objectContaining({ method: 'PATCH' })
            );
        });
    });

    describe('appointmentsApi', () => {
        it('list should fetch appointments', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => [{ id: '1', title: 'Meeting' }],
            });

            const result = await appointmentsApi.list();
            expect(result).toHaveLength(1);
        });

        it('create should POST appointment', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ id: '123' }),
            });

            await appointmentsApi.create({ title: 'Meeting', date: '2024-01-01', time: '10:00' });
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/appointments/'),
                expect.objectContaining({ method: 'POST' })
            );
        });

        it('update should PATCH appointment', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ success: true }),
            });

            await appointmentsApi.update('1', { status: 'cancelled' });
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/appointments/1'),
                expect.objectContaining({ method: 'PATCH' })
            );
        });

        it('delete should DELETE appointment', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                status: 204,
                json: async () => ({}),
            });

            await appointmentsApi.delete('1');
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/appointments/1'),
                expect.objectContaining({ method: 'DELETE' })
            );
        });
    });

    describe('contactApi', () => {
        it('send should POST contact form', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ success: true }),
            });

            await contactApi.send({ subject: 'Help', message: 'Need help' });
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/contact/'),
                expect.objectContaining({ method: 'POST' })
            );
        });
    });

    describe('usersApi', () => {
        it('updateProfile should PATCH user data', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ success: true }),
            });

            await usersApi.updateProfile({ first_name: 'John' });
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/users/me'),
                expect.objectContaining({ method: 'PATCH' })
            );
        });

        it('changePassword should POST password change', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ success: true }),
            });

            await usersApi.changePassword({ current_password: 'old', new_password: 'new' });
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/users/change-password'),
                expect.objectContaining({ method: 'POST' })
            );
        });
    });

    describe('notificationsApi', () => {
        it('list should fetch notifications', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => [{ id: '1', message: 'Notification' }],
            });

            const result = await notificationsApi.list();
            expect(result).toHaveLength(1);
        });

        it('markRead should POST to mark as read', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({}),
            });

            await notificationsApi.markRead('1');
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/notifications/1/read'),
                expect.objectContaining({ method: 'POST' })
            );
        });
    });

    describe('auditApi', () => {
        it('getLogs should fetch audit logs with pagination', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ items: [], total: 0 }),
            });

            const result = await auditApi.getLogs(1, 20);
            expect(global.fetch).toHaveBeenCalled();
            const callUrl = (global.fetch as any).mock.calls[0][0];
            expect(callUrl).toContain('/audit/logs?page=1&size=20');
            expect(result).toHaveProperty('items');
            expect(result).toHaveProperty('total');
        });
    });

    describe('settingsApi', () => {
        it('getSettings should fetch user settings', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ theme: 'dark', notifications_enabled: true }),
            });

            const result = await settingsApi.getSettings();
            expect(result.theme).toBe('dark');
        });

        it('updateSettings should PUT settings', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ theme: 'light' }),
            });

            await settingsApi.updateSettings({ theme: 'light' });
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/settings/'),
                expect.objectContaining({ method: 'PUT' })
            );
        });
    });
});
