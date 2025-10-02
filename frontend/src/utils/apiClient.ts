/**
 * Centralized API Client for ConnectFour Backend
 * 
 * This utility provides a consistent interface for all backend API requests,
 * ensuring proper error handling, typing, and endpoint configuration.
 */

import { myConfig } from '@/config/env';

// Generic response type for all API calls
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    status: number;
}

// API error class for better error handling
export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public response?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// Request configuration interface
interface RequestConfig {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: any;
    credentials?: RequestCredentials;
    timeout?: number;
}

// Default request configuration
const defaultConfig: RequestConfig = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    },
    credentials: 'include', // Always include cookies for session handling
    timeout: 30000, // 30 second timeout
};

/**
 * Core API request function with consistent error handling and typing
 */
async function apiRequest<T = any>(
    endpoint: string, 
    config: RequestConfig = {}
): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') 
        ? endpoint 
        : `${myConfig.BACKEND_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const requestConfig: RequestInit = {
        ...defaultConfig,
        ...config,
        headers: {
            ...defaultConfig.headers,
            ...config.headers,
        },
    };

    // Handle body serialization
    if (requestConfig.body && typeof requestConfig.body !== 'string') {
        requestConfig.body = JSON.stringify(requestConfig.body);
    }

    console.log(`[API] ${requestConfig.method} ${url}`, {
        body: requestConfig.body ? JSON.parse(requestConfig.body as string) : undefined,
        headers: requestConfig.headers
    });

    try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout || defaultConfig.timeout);

        const response = await fetch(url, {
            ...requestConfig,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        let responseData: any;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }

        console.log(`[API] ${response.status} ${url}`, responseData);

        if (!response.ok) {
            throw new ApiError(
                response.status,
                responseData?.message || responseData?.error || `HTTP ${response.status}: ${response.statusText}`,
                responseData
            );
        }

        return {
            success: true,
            data: responseData,
            status: response.status,
        };

    } catch (error) {
        console.error(`[API ERROR] ${requestConfig.method} ${url}`, error);

        if (error instanceof ApiError) {
            return {
                success: false,
                error: error.message,
                status: error.status,
                data: error.response,
            };
        }

        // Handle network errors, timeouts, etc.
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            success: false,
            error: errorMessage,
            status: 0, // 0 indicates network/client error
        };
    }
}

/**
 * Convenience methods for different HTTP verbs
 */
export const apiClient = {
    /**
     * GET request
     */
    get: <T = any>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>) => 
        apiRequest<T>(endpoint, { ...config, method: 'GET' }),

    /**
     * POST request
     */
    post: <T = any>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method'>) => 
        apiRequest<T>(endpoint, { ...config, method: 'POST', body: data }),

    /**
     * PUT request
     */
    put: <T = any>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method'>) => 
        apiRequest<T>(endpoint, { ...config, method: 'PUT', body: data }),

    /**
     * DELETE request
     */
    delete: <T = any>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>) => 
        apiRequest<T>(endpoint, { ...config, method: 'DELETE' }),

    /**
     * PATCH request
     */
    patch: <T = any>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method'>) => 
        apiRequest<T>(endpoint, { ...config, method: 'PATCH', body: data }),
};

/**
 * Specialized API methods for specific ConnectFour backend endpoints
 */

// Auth-related API calls
export const authApi = {
    login: (credentials: { usernameEmail: string; password: string; recaptchaToken?: string }) =>
        apiClient.post<{ user: any; sessionToken: string }>('/auth/login', credentials),

    register: (userData: { email: string; username: string; password: string }) =>
        apiClient.post<{ user: any; sessionToken: string }>('/auth/register', userData),

    registerStart: (userData: { email: string; username: string; password: string }) =>
        apiClient.post<{ message: string }>('/auth/register/start', userData),

    googleRegister: (token: string) =>
        apiClient.post<{ user: any; sessionToken: string }>('/auth/google/register', { token }),

    logout: () =>
        apiClient.post<{ message: string }>('/auth/logout'),

    me: () =>
        apiClient.get<{ user: any }>('/auth/me'),

    verifyEmail: (data: { jwt: string; code: string }) =>
        apiClient.post<{ user: any; sessionToken: string }>('/auth/verify-email', data),

    protectedRoute: () =>
        apiClient.get<{ user: any }>('/api/auth/protected-route'),

    isAdmin: () =>
        apiClient.get<{ isAdmin: boolean }>('/api/auth/isadmin'),
};

// Game-related API calls
export const gameApi = {
    createGame: (gameData: {
        gamemode: string | number;
        time_control: {
            base_time: number;
            increment: number;
            disadvantage?: number;
        };
        recaptchaToken?: string;
        botId?: string;
        playerColor?: string;
    }) =>
        apiClient.post<{ gameLink: string }>('/game/request', gameData),

    // Add more game-related endpoints as needed
};

// Events/Discord API calls
export const eventsApi = {
    discordCallback: (code: string) =>
        apiClient.post<{ message: string }>('/api/events/ichack25/discord', { code }),

    getLeaderboard: () =>
        apiClient.get<any[]>('/api/events/get-leaderboard'),
};

// Export the main client (ApiError is already exported above)
export default apiClient;