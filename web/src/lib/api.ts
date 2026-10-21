const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface RequestOptions extends RequestInit {
    data?: any;
}

/**
 * Universal fetch wrapper for Factory Brain API
 * Always sends httpOnly cookies (credentials: 'include')
 */
export async function apiRequest<T = any>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { data, headers, ...customConfig } = options;

    const config: RequestInit = {
        method: data ? 'POST' : 'GET',
        credentials: 'include', // CRITICAL: Ensures browser sends and stores fb_token httpOnly cookies
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        ...customConfig,
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, config);
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        const errorMsg = result.message || `Request failed with status ${response.status}`;
        throw new Error(errorMsg);
    }

    return result;
}
