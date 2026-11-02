'use client';

import useSWR from 'swr';
import { apiRequest } from './api';

const fetcher = (url: string) => apiRequest(url);

export function useProducts() {
    const { data, error, isLoading, mutate } = useSWR(
        '/api/products',
        fetcher,
        { revalidateOnFocus: false }
    );

    return {
        products: (data?.products ?? data ?? []) as any[],
        isLoading,
        isError: !!error,
        mutate,
    };
}