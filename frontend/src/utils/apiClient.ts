/**
 * Simplified API Client for ConnectFour Backend
 */

import { myConfig } from '@/config/env';
import { logger } from './logger';

// Simple response type
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    status: number;
}

/**
 * Simple API request function
 */
async function apiRequest<T = any>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
): Promise<ApiResponse<T>> {
    const url = `${myConfig.BACKEND_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const config: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    };

    if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
    }

    logger.api(`${method} ${url}`, body);

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        logger.api(`${response.status} ${url}`, data);

        return {
            success: response.ok,
            data: response.ok ? data : undefined,
            error: response.ok ? undefined : (data?.message || data?.error || `HTTP ${response.status}`),
            status: response.status,
        };

    } catch (error) {
        logger.apiError(url, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
            status: 0,
        };
    }
}

/**
 * Main API interface
 */
interface ApiInterface {
    get: <T = any>(endpoint: string) => Promise<ApiResponse<T>>;
    post: <T = any>(endpoint: string, data?: any) => Promise<ApiResponse<T>>;
    put: <T = any>(endpoint: string, data?: any) => Promise<ApiResponse<T>>;
    delete: <T = any>(endpoint: string) => Promise<ApiResponse<T>>;
}

/**
 * Create API with prefix
 */
function createApi(prefix: string = ''): ApiInterface {
    return {
        get: <T = any>(path: string) => apiRequest<T>(`${prefix}${path}`, 'GET'),
        post: <T = any>(path: string, data?: any) => apiRequest<T>(`${prefix}${path}`, 'POST', data),
        put: <T = any>(path: string, data?: any) => apiRequest<T>(`${prefix}${path}`, 'PUT', data),
        delete: <T = any>(path: string) => apiRequest<T>(`${prefix}${path}`, 'DELETE'),
    };
}

/**
 * API instances
 */
export const api = createApi();
export const authApi = createApi('/auth');
export const gameApi = createApi('/game');
export const eventsApi = createApi('/api/events');

export default api;