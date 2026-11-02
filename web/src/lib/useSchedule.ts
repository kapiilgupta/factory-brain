'use client';

import useSWR from 'swr';
import { apiRequest } from './api';

const fetcher = (url: string) => apiRequest(url);

export function useSchedule(date: string) {
    const { data, error, isLoading, mutate } = useSWR(
        date ? `/api/schedule?date=${date}` : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    return {
        slots: (data?.slots ?? data ?? []) as any[],
        isLoading,
        isError: !!error,
        mutate,
    };
}

export function useMachineUtilization(date: string) {
    const { data, error, isLoading, mutate } = useSWR(
        date ? `/api/schedule/utilization?date=${date}` : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    return {
        utilization: (data?.utilization ?? data ?? []) as any[],
        isLoading,
        isError: !!error,
        mutate,
    };
}