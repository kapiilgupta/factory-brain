'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    Warehouse,
    TrendingUp,
    ClipboardList,
    Calendar,
    Settings2,
    Cpu,
    LogOut,
    ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Products', href: '/products', icon: Package },
    { label: 'Inventory', href: '/inventory', icon: Warehouse },
    { label: 'Demand Forecast', href: '/forecast', icon: TrendingUp },
    { label: 'Production Orders', href: '/orders', icon: ClipboardList },
    { label: 'Machine Schedule', href: '/schedule', icon: Calendar },
    { label: 'Machines & Assets', href: '/machines', icon: Settings2 },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-[#0f172a] border-r border-slate-800 flex flex-col h-screen sticky top-0 select-none z-30">
            {/* Brand Header */}
            <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                        <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-100 tracking-tight text-base">Factory Brain</span>
                            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">v2.0</span>
                        </div>
                        <p className="text-[11px] text-slate-400">Autonomous Shop Floor</p>
                    </div>
                </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Management & Planning
                </div>

                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${isActive
                                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/5'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Icon
                                    className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                                        }`}
                                />
                                <span>{item.label}</span>
                            </div>
                            {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}
                        </Link>
                    );
                })}
            </nav>

            {/* System Status & Company Footer */}
            <div className="p-3 border-t border-slate-800 space-y-3">
                {/* Operational Pulse */}
                <div className="px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs text-slate-300 font-medium">Engine Active</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">Atlas Live</span>
                </div>

                {/* User Card */}
                <div className="px-3 py-2 rounded-lg bg-slate-800/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-semibold text-xs text-white shrink-0">
                            DM
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-200 truncate">Demo Manager</p>
                            <p className="text-[10px] text-slate-400 truncate">Apex Apparel Co.</p>
                        </div>
                    </div>
                    <button
                        title="Log out"
                        onClick={() => {
                            window.location.href = '/login';
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
