'use client';

import useSWR from 'swr';
import { apiRequest } from './api';

const fetcher = (url: string) => apiRequest(url);

export function useMachines() {
    const { data, error, isLoading, mutate } = useSWR(
        '/api/machines',
        fetcher,
        { revalidateOnFocus: false }
    );

    return {
        machines: (data?.machines ?? data ?? []) as any[],
        isLoading,
        isError: !!error,
        mutate,
    };
}