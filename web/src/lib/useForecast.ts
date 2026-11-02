'use client';

import useSWR from 'swr';
import { apiRequest } from './api';

const fetcher = (url: string) => apiRequest(url);

export function useForecast(period: string) {
    const { data, error, isLoading, mutate } = useSWR(
        period ? `/api/forecast?period=${period}` : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    return {
        forecasts: (data?.forecasts ?? data ?? []) as any[],
        isLoading,
        isError: !!error,
        mutate,
    };
}