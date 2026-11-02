'use client';

import useSWR from 'swr';
import { apiRequest } from './api';

const fetcher = (url: string) => apiRequest(url);

export function useInventory() {
    const { data, error, isLoading, mutate } = useSWR(
        '/api/inventory',
        fetcher,
        { revalidateOnFocus: false }
    );

    return {
        inventory: (data?.inventory ?? data ?? []) as any[],
        isLoading,
        isError: !!error,
        mutate,
    };
}

export function useInventoryAlerts() {
    const { data, error, isLoading } = useSWR(
        '/api/inventory/alerts',
        fetcher,
        { revalidateOnFocus: false, refreshInterval: 60000 }
    );

    return {
        alerts: (data?.alerts ?? data ?? []) as any[],
        isLoading,
        isError: !!error,
    };
}