'use client';

import useSWR from 'swr';
import { apiRequest } from './api';

const fetcher = (url: string) => apiRequest(url);

export function useOrders(statusFilter?: string) {
    const url = statusFilter && statusFilter !== 'all'
        ? `/api/orders?status=${statusFilter}`
        : '/api/orders';

    const { data, error, isLoading, mutate } = useSWR(
        url,
        fetcher,
        { revalidateOnFocus: false }
    );

    return {
        orders: (data?.orders ?? data ?? []) as any[],
        isLoading,
        isError: !!error,
        mutate,
    };
}