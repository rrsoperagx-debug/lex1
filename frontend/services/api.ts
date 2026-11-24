/**
 * ============================================================================
 * LexPortal - Centralny Moduł Komunikacji API
 * ============================================================================
 *
 * Opis:
 * Ten plik jest sercem komunikacji frontendowej z backendowym API.
 * Zawiera generyczną funkcję `apiCall`, która hermetyzuje logikę
 * zapytań `fetch`, obsługę błędów, oraz automatyczne dołączanie
 * nagłówka autoryzacji (tokena JWT).
 *
 * Kluczowe Elementy:
 *
 * 1. `apiCall<T>`:
 *    - Generyczna, asynchroniczna funkcja do wykonywania zapytań do API.
 *    - Automatycznie pobiera token JWT z `localStorage` i dodaje go do
 *      nagłówka `Authorization`.
 *    - Standaryzuje obsługę błędów, rzucając niestandardowy `ApiError`,
 *      co ułatwia ich obsługę w komponentach.
 *    - Obsługuje odpowiedzi bez treści (204 No Content).
 *
 * 2. `ApiError`:
 *    - Niestandardowa klasa błędu, która rozszerza `Error`. Przechowuje
 *      status HTTP i dane błędu zwrócone przez API, co pozwala na
 *      bardziej szczegółową reakcję na błędy w interfejsie użytkownika.
 *
 * 3. `getErrorMessage`:
 *    - Funkcja pomocnicza do parsowania odpowiedzi o błędach z API FastAPI,
 *      które mogą mieć różne formaty (`{detail: "..."}` lub `{detail: [...]}`).
 *
 * 4. Moduły API (np. `authApi`, `casesApi`):
 *    - Eksportowane obiekty, które grupują powiązane ze sobą zapytania
 *      do API (np. logowanie, rejestracja). To podejście, podobne do SDK,
 *      czyni kod bardziej zorganizowanym i łatwiejszym w użyciu.
 *
 * Rola w Architekturze:
 * - Zapewnia pojedynczy, spójny sposób interakcji z API w całej aplikacji.
 * - Odizolowuje komponenty React od bezpośredniego użycia `fetch` i szczegółów
 *   implementacyjnych (URL, nagłówki), co ułatwia utrzymanie i refaktoryzację.
 * ============================================================================
 */
const API_URL = '/api/v1';

// --- TYPES ---

export interface ApiErrorDetail {
    msg?: string;
    message?: string;
    [key: string]: unknown;
}

export interface ApiErrorResponse {
    detail?: string | ApiErrorDetail[] | Record<string, unknown>;
}

export interface RegisterData {
    email: string;
    password: string;
    [key: string]: unknown;
}

export interface CaseData {
    title: string;
    description: string;
    client_name?: string;
    client_id_str?: string;
    case_type?: string;
    category?: string;
}

export interface MessageData {
    recipient_id: string;
    subject?: string;
    content: string;
    file_url?: string;
    file_type?: string;
}

export interface AppointmentData {
    title: string;
    date: string;
    time: string;
    type?: string;
    description?: string;
    status?: string;
}

export interface ContactData {
    subject: string;
    message: string;
    sender_name?: string;
    sender_email?: string;
}

export interface ProfileData {
    first_name?: string;
    last_name?: string;
    address?: string;
    pesel?: string;
    [key: string]: unknown;
}

export interface CaseDocument {
    id: string;
    filename: string;
    file_url: string;
    status: string;
    created_at: string;
}

export interface PasswordChangeData {
    current_password: string;
    new_password: string;
}

export interface SecurityLog {
    id: string;
    action: string;
    ip_address?: string;
    timestamp: string;
    details?: Record<string, unknown>;
    status: string;
    actor_name?: string;
}

export interface UserSettings {
    theme?: 'light' | 'dark';
    notifications_enabled?: boolean;
    language?: string;
    [key: string]: unknown;
}

// --- HELPER FUNCTIONS ---

const getErrorMessage = (errorData: unknown, fallback: string): string => {
    const detail = (errorData as ApiErrorResponse)?.detail;
    if (!detail) return fallback;
    if (typeof detail === 'string') return detail;

    if (Array.isArray(detail)) {
        const parts = detail
            .map((d: unknown) => {
                const msg = (d as ApiErrorDetail)?.msg ?? (d as ApiErrorDetail)?.message;
                if (typeof msg === 'string' && msg) return msg;
                return JSON.stringify(d);
            })
            .filter(Boolean);
        return parts.join('; ') || fallback;
    }

    if (typeof detail === 'object') {
        try {
            return JSON.stringify(detail);
        } catch {
            return fallback;
        }
    }

    return String(detail);
};

export class ApiError extends Error {
    constructor(public message: string, public status?: number, public data?: unknown) {
        super(message);
        this.name = 'ApiError';
    }
}

export const apiCall = async <T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    try {
        const sanitizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        const url = sanitizedEndpoint.startsWith('api/v1') ? `/${sanitizedEndpoint}` : `${API_URL}/${sanitizedEndpoint}`;
        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include', // Ensure cookies are sent and received
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = getErrorMessage(errorData, `Request failed with status ${response.status}`);
            throw new ApiError(errorMessage, response.status, errorData);
        }

        // Return empty object for 204 No Content
        if (response.status === 204) {
            return {} as T;
        }

        return await response.json();
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(error instanceof Error ? error.message : 'Network error');
    }
};

// --- API MODULES ---

export const authApi = {
    login: (loginData: { email: string; password: string }) => {
        const body = new URLSearchParams();
        body.append('username', loginData.email);
        body.append('password', loginData.password);

        return fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body,
            credentials: 'include',
        }).then(async res => {
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new ApiError(getErrorMessage(err, 'Login failed'), res.status, err);
            }
            return res.json();
        }).catch(err => {
            if (err instanceof ApiError) throw err;
            throw new ApiError('Login request failed');
        });
    },
    logout: () => fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' }),
    register: (userData: RegisterData) => apiCall<{ id: string; email: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    }),
    getMe: () => apiCall<ProfileData>('/users/me'),
    forgotPassword: (email: string) => apiCall('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    }),
    login2fa: (data: { email: string; code: string }) => apiCall<{ access_token: string; token_type: string; user_role: string; user_name: string }>('/auth/login/2fa', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};

export const casesApi = {
    list: <T = Record<string, unknown>>() => apiCall<T[]>('/cases/'),
    get: <T = Record<string, unknown>>(id: string) => apiCall<T>(`/cases/${id}`),
    create: <T = Record<string, unknown>>(data: CaseData) => apiCall<T>('/cases/', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: <T = Record<string, unknown>>(id: string, data: Partial<CaseData> & { status?: string }) => apiCall<T>(`/cases/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    uploadDocument: async (id: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`${API_URL}/cases/${id}/documents`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new ApiError(getErrorMessage(err, 'Upload failed'), response.status, err);
            }
            return await response.json();
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError('Upload request failed');
        }
    },
    getHistory: (id: string) => apiCall<SecurityLog[]>(`/cases/${id}/history`),
};

export const messagesApi = {
    list: <T = Record<string, unknown>>(includeArchived: boolean = false) => apiCall<T[]>(`/messages/?include_archived=${includeArchived}`),
    send: <T = Record<string, unknown>>(data: MessageData) => apiCall<T>('/messages/send', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: <T = Record<string, unknown>>(id: string, data: { is_read?: boolean; is_archived?: boolean }) => apiCall<T>(`/messages/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
};

export const appointmentsApi = {
    list: () => apiCall<Record<string, unknown>[]>('/appointments/'),
    create: (data: AppointmentData) => apiCall<Record<string, unknown>>('/appointments/', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<AppointmentData>) => apiCall<Record<string, unknown>>(`/appointments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiCall<void>(`/appointments/${id}`, {
        method: 'DELETE',
    }),
};

export const contactApi = {
    send: (data: ContactData) => apiCall<Record<string, unknown>>('/contact/', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    list: () => apiCall<Record<string, unknown>[]>('/contact/'),
};

export interface AdminUserResponse {
    id: string;
    email: string;
    full_name?: string | null;
    role: string;
    is_active: boolean;
    is_2fa_enabled: boolean;
    created_at: string;
}

export interface AdminCreateUserData {
    email: string;
    password: string;
    full_name?: string;
    role?: string;
}

export const usersApi = {
    list: () => apiCall<AdminUserResponse[]>('/users/'),
    create: (data: AdminCreateUserData) => apiCall<AdminUserResponse>('/users/', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateProfile: (data: ProfileData) => apiCall<Record<string, unknown>>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    changePassword: (data: PasswordChangeData) => apiCall<Record<string, unknown>>('/users/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    listByRole: (role: string) =>
        apiCall<Array<{ id: string; email: string; role: string; display_name: string }>>(
            `/users/by-role?role=${encodeURIComponent(role)}`
        ),
    setup2fa: () => apiCall<{ secret: string; otpauth_uri: string }>('/users/me/2fa/setup', {
        method: 'POST',
    }),
    verify2fa: (code: string) => apiCall<any>('/users/me/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ code }),
    }),
    disable2fa: (code: string) => apiCall<any>('/users/me/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ code }),
    }),
};

export const notificationsApi = {
    list: () => apiCall<Record<string, unknown>[]>('/notifications/'),
    markRead: (id: string) => apiCall<void>(`/notifications/${id}/read`, {
        method: 'POST',
    }),
    markAllRead: () => apiCall<void>('/notifications/read-all', {
        method: 'POST',
    }),
};

export const auditApi = {
    getLogs: (page: number = 1, size: number = 20) => apiCall<{ items: SecurityLog[], total: number }>(`/audit/logs?page=${page}&size=${size}`),
};

export const settingsApi = {
    getSettings: () => apiCall<UserSettings>('/settings/'),
    updateSettings: (data: UserSettings) => apiCall<UserSettings>('/settings/', {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
};

export interface PaymentStatus {
    case_id: string;
    case_status: string;
    payment_status: string | null;
    mollie_id: string | null;
    is_paid: boolean;
}

export interface PaymentInitResponse {
    id: string;
    case_id: string;
    mollie_id: string;
    amount: string;
    currency: string;
    status: string;
    checkout_url: string;
}

export const documentsApi = {
    sendToSign: (data: Record<string, unknown>) => apiCall<Record<string, unknown>>('/documents/send-to-sign', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    generate: (templateId: string, data: Record<string, unknown>, caseId?: string) => apiCall<Record<string, unknown>>('/documents/generate', {
        method: 'POST',
        body: JSON.stringify({ template_id: templateId, case_id: caseId, data }),
    }),
    download: async (id: string, filename: string) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/documents/${id}/download`, {
                credentials: 'include',
            });
            if (!response.ok) throw new Error('Download failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
            throw error;
        }
    }
};

export const legalTemplatesApi = {
    scrape: (url: string) => {
        return apiCall<{ status: string; data: any }>('/legal-templates/scrape', {
            method: 'POST',
            body: JSON.stringify({ url }),
        });
    },
    list: (limit: number = 100) => {
        return apiCall<any[]>(`/legal-templates/?limit=${limit}`);
    },
    create: (data: any) => {
        return apiCall<any>('/legal-templates/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    update: (id: string, data: any) => {
        return apiCall<any>(`/legal-templates/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
    fix: (data: { title: string; content: string; fields: any[] }) => {
        return apiCall<{ status: string; data: any }>('/legal-templates/fix', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};

export const paymentsApi = {
    /** Inicjuje płatność Mollie dla sprawy – zwraca checkout_url */
    create: (caseId: string) =>
        apiCall<PaymentInitResponse>(`/payments/create/${caseId}`, {
            method: 'POST',
        }),
    /** Polling statusu płatności dla sprawy */
    getStatus: (caseId: string) =>
        apiCall<PaymentStatus>(`/payments/status/${caseId}`),
};

export const aiApi = {
    analyzeCase: (query: string) => apiCall<any>('/ai/analyze-case', {
        method: 'POST',
        body: JSON.stringify({ query }),
    }),
};

const api = {
    get: <T = unknown>(endpoint: string, options?: RequestInit) => apiCall<T>(endpoint, { ...options, method: 'GET' }),
    post: <T = unknown>(endpoint: string, data?: unknown, options?: RequestInit) => apiCall<T>(endpoint, { ...options, method: 'POST', body: data ? JSON.stringify(data) : undefined }),
    put: <T = unknown>(endpoint: string, data?: unknown, options?: RequestInit) => apiCall<T>(endpoint, { ...options, method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
    patch: <T = unknown>(endpoint: string, data?: unknown, options?: RequestInit) => apiCall<T>(endpoint, { ...options, method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
    delete: <T = unknown>(endpoint: string, options?: RequestInit) => apiCall<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
