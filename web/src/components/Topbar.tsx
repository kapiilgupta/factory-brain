'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Clock, Building2 } from 'lucide-react';

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
    '/dashboard': { title: 'Executive Overview', subtitle: 'Real-time KPIs, Gantt schedule, and stock alerts' },
    '/products': { title: 'Product Catalog', subtitle: 'Configured SKUs, size matrices, and machine cycle rates' },
    '/inventory': { title: 'Inventory Ledger', subtitle: 'Stock on hand, reorder points, and warehouse status' },
    '/forecast': { title: 'Demand Forecasting', subtitle: '3-Period Moving Average projection engine' },
    '/orders': { title: 'Production Orders', subtitle: 'Consolidated batch lot runs and shop-floor routing' },
    '/schedule': { title: 'Machine Scheduling', subtitle: 'Earliest Due Date (EDD) timeline & capacity gauges' },
    '/machines': { title: 'Machine Center', subtitle: 'Workstations, shift capacity limits, and operational states' },
};

export default function Topbar() {
    const pathname = usePathname();
    const [todayStr, setTodayStr] = React.useState<string>('Live Shift');

    React.useEffect(() => {
        setTodayStr(
            new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            })
        );
    }, []);

    const currentMeta = ROUTE_TITLES[pathname] || {
        title: pathname.replace('/', '').toUpperCase() || 'Dashboard',
        subtitle: 'Factory Brain Manufacturing Operations',
    };

    return (
        <header className="h-16 bg-[#090d16]/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
            {/* Route Title & Subtitle */}
            <div>
                <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    {currentMeta.title}
                </h1>
                <p className="text-xs text-slate-400 hidden sm:block">
                    {currentMeta.subtitle}
                </p>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-4">
                {/* Plant Badge */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Plant 01 • Main Factory</span>
                </div>

                {/* Date & Shift */}
                <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{todayStr} • Shift 1</span>
                </div>

                {/* Alerts Button */}
                <button
                    className="relative p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
                    title="Active Alerts"
                    onClick={() => {
                        window.location.href = '/inventory';
                    }}
                >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-slate-900 animate-pulse"></span>
                </button>
            </div>
        </header>
    );
}
