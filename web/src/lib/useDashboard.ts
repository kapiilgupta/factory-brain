'use client';

import useSWR from 'swr';
import { apiRequest } from './api';

const fetcher = (url: string) => apiRequest(url);

export function useDashboardSummary() {
    const { data, error, isLoading, mutate } = useSWR(
        '/api/dashboard/summary',
        fetcher,
        { refreshInterval: 30_000, revalidateOnFocus: true }
    );
    return {
        kpis: data?.kpis ?? null,
        loading: isLoading,
        error: error?.message ?? null,
        refresh: mutate,
    };
}

export function useProductionBreakdown() {
    const { data, error, isLoading } = useSWR(
        '/api/dashboard/production',
        fetcher,
        { refreshInterval: 60_000 }
    );
    return {
        statusBreakdown: (data?.statusBreakdown ?? []) as Array<{
            _id: string;
            orderCount: number;
            totalUnits: number;
        }>,
        recentOrders: (data?.recentOrders ?? []) as Array<{
            _id: string;
            orderNumber: string;
            status: string;
            priority: string;
            dueDate: string;
            totalUnits: number;
            productId?: { name: string; category: string };
        }>,
        loading: isLoading,
        error: error?.message ?? null,
    };
}

export function useActiveAlerts() {
    const { data, error, isLoading } = useSWR(
        '/api/dashboard/alerts',
        fetcher,
        { refreshInterval: 20_000 }
    );
    return {
        summary: data?.summary ?? null,
        alerts: (data?.alerts ?? {
            lowStock: [],
            overdueOrders: [],
            offlineMachines: [],
        }) as {
            lowStock: Array<{
                _id: string;
                sku: string;
                quantityOnHand: number;
                reorderPoint: number;
                productId?: { name: string; category: string };
            }>;
            overdueOrders: Array<{
                _id: string;
                orderNumber: string;
                status: string;
                dueDate: string;
                productId?: { name: string };
            }>;
            offlineMachines: Array<{
                _id: string;
                name: string;
                type: string;
            }>;
        },
        loading: isLoading,
        error: error?.message ?? null,
    };
}

export function useInventoryOverview() {
    const { data, error, isLoading } = useSWR(
        '/api/dashboard/inventory',
        fetcher,
        { refreshInterval: 60_000 }
    );
    return {
        items: (data?.items ?? []) as Array<{
            _id: string;
            sku: string;
            quantityOnHand: number;
            reorderPoint: number;
            fillPercentage: number;
            status: string;
            productId?: { name: string; category: string };
        }>,
        loading: isLoading,
        error: error?.message ?? null,
    };
}

export function useScheduleOverview() {
    const { data, error, isLoading } = useSWR(
        '/api/dashboard/schedule',
        fetcher,
        { refreshInterval: 30_000 }
    );
    return {
        slots: (data?.slots ?? []) as Array<{
            _id: string;
            machineName: string;
            orderNumber: string;
            durationMinutes: number;
            status: string;
            sequence: number;
        }>,
        utilization: (data?.utilization ?? []) as Array<{
            machineName: string;
            machineType: string;
            utilizationPct: number;
            scheduledMinutes: number;
            shiftMinutes: number;
            status: string;
            isOperational: boolean;
        }>,
        loading: isLoading,
        error: error?.message ?? null,
    };
}
