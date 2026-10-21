'use client';

import React from 'react';
import {
    Package,
    ClipboardList,
    Cpu,
    AlertTriangle,
    TrendingUp,
    RefreshCw,
    CheckCircle2,
    Clock,
    XCircle,
    Loader2,
    Warehouse,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend,
} from 'recharts';
import {
    useDashboardSummary,
    useProductionBreakdown,
    useActiveAlerts,
    useInventoryOverview,
    useScheduleOverview,
} from '@/lib/useDashboard';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        'pending': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        'in-progress': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        'completed': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        'cancelled': 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        'scheduled': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
        'delayed': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    };
    const cls = map[status] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls} capitalize`}>
            {status.replace('-', ' ')}
        </span>
    );
}

function SkeletonCard() {
    return (
        <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5 animate-pulse">
            <div className="h-3 w-24 bg-slate-800 rounded mb-4" />
            <div className="h-8 w-16 bg-slate-800 rounded mb-2" />
            <div className="h-2 w-32 bg-slate-800 rounded" />
        </div>
    );
}

const UTILIZATION_COLORS: Record<string, string> = {
    idle: '#475569',
    normal: '#22c55e',
    high: '#f59e0b',
    over: '#ef4444',
};

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#22c55e', '#ef4444'];

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KpiCardProps {
    label: string;
    value: number | string;
    sublabel: string;
    icon: React.ReactNode;
    accent: string;
    loading: boolean;
}

function KpiCard({ label, value, sublabel, icon, accent, loading }: KpiCardProps) {
    if (loading) return <SkeletonCard />;
    return (
        <div className={`relative rounded-xl bg-slate-900/60 border border-slate-800 p-5 overflow-hidden group hover:border-slate-700 transition-all`}>
            {/* Subtle top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent}`} />
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
                    <p className="text-3xl font-black text-white mt-1 tabular-nums">{value ?? '—'}</p>
                    <p className="text-xs text-slate-500 mt-1">{sublabel}</p>
                </div>
                <div className={`p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-400 group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
    const { kpis, loading: kpiLoading, refresh } = useDashboardSummary();
    const { statusBreakdown, recentOrders, loading: prodLoading } = useProductionBreakdown();
    const { alerts, summary: alertSummary, loading: alertLoading } = useActiveAlerts();
    const { items: inventoryItems, loading: invLoading } = useInventoryOverview();
    const { utilization, loading: schedLoading } = useScheduleOverview();

    // Production status chart data
    const prodChartData = statusBreakdown.map((s) => ({
        name: s._id.replace('-', ' '),
        orders: s.orderCount,
        units: s.totalUnits,
    }));

    // Machine utilization data for bar chart
    const machineChartData = utilization.map((m) => ({
        name: m.machineName.length > 18 ? m.machineName.slice(0, 18) + '…' : m.machineName,
        utilization: m.utilizationPct,
        status: m.status,
    }));

    // Pie chart for alerts breakdown
    const alertPieData = alertSummary
        ? [
            { name: 'Low Stock', value: alertSummary.stockAlertsCount },
            { name: 'Overdue Orders', value: alertSummary.overdueOrdersCount },
            { name: 'Offline Machines', value: alertSummary.offlineMachinesCount },
        ].filter((d) => d.value > 0)
        : [];

    return (
        <div className="space-y-6">

            {/* ── Page Header ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white">Executive Overview</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Live factory metrics · auto-refreshes every 30s
                    </p>
                </div>
                <button
                    onClick={() => refresh()}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 hover:text-white transition-all"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                </button>
            </div>

            {/* ── KPI Cards ───────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    loading={kpiLoading}
                    label="Total Products"
                    value={kpis?.products?.total ?? 0}
                    sublabel="Active SKU families"
                    icon={<Package className="w-4 h-4" />}
                    accent="bg-gradient-to-r from-blue-500 to-blue-400"
                />
                <KpiCard
                    loading={kpiLoading}
                    label="Active Orders"
                    value={kpis?.orders?.totalActive ?? 0}
                    sublabel={`${kpis?.orders?.pending ?? 0} pending · ${kpis?.orders?.inProgress ?? 0} in-progress`}
                    icon={<ClipboardList className="w-4 h-4" />}
                    accent="bg-gradient-to-r from-indigo-500 to-indigo-400"
                />
                <KpiCard
                    loading={kpiLoading}
                    label="Machines Online"
                    value={`${kpis?.machines?.operational ?? 0}/${kpis?.machines?.total ?? 0}`}
                    sublabel={`${kpis?.machines?.offline ?? 0} offline · capacity check`}
                    icon={<Cpu className="w-4 h-4" />}
                    accent="bg-gradient-to-r from-emerald-500 to-emerald-400"
                />
                <KpiCard
                    loading={kpiLoading}
                    label="Stock Alerts"
                    value={kpis?.inventory?.lowStockAlerts ?? 0}
                    sublabel={`${kpis?.inventory?.totalUnitsOnHand ?? 0} total units on hand`}
                    icon={<AlertTriangle className="w-4 h-4" />}
                    accent="bg-gradient-to-r from-amber-500 to-amber-400"
                />
            </div>

            {/* ── Row 2: Production Chart + Alerts ────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Production Status Bar Chart */}
                <div className="lg:col-span-2 rounded-xl bg-slate-900/60 border border-slate-800 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-semibold text-white">Production Order Status</h3>
                            <p className="text-xs text-slate-400">Orders by status and unit volume</p>
                        </div>
                        <TrendingUp className="w-4 h-4 text-slate-500" />
                    </div>

                    {prodLoading ? (
                        <div className="h-48 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                        </div>
                    ) : prodChartData.length === 0 ? (
                        <div className="h-48 flex flex-col items-center justify-center text-slate-500 gap-2">
                            <ClipboardList className="w-8 h-8 opacity-30" />
                            <p className="text-xs">No production orders yet</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={prodChartData} barSize={36}>
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        color: '#e2e8f0',
                                    }}
                                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                                />
                                <Bar dataKey="orders" name="Orders" radius={[4, 4, 0, 0]}>
                                    {prodChartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Active Alerts Panel */}
                <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-semibold text-white">Active Alerts</h3>
                            <p className="text-xs text-slate-400">
                                {alertSummary?.totalAlerts ?? 0} total issues
                            </p>
                        </div>
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                    </div>

                    {alertLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-10 bg-slate-800 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : alertSummary?.totalAlerts === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 gap-2 text-emerald-400">
                            <CheckCircle2 className="w-8 h-8 opacity-60" />
                            <p className="text-xs font-medium">All systems normal</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                            {/* Low Stock Alerts */}
                            {alerts.lowStock.map((item) => (
                                <div
                                    key={item._id}
                                    className="flex items-center gap-2.5 p-2.5 rounded-lg bg-amber-500/8 border border-amber-500/20"
                                >
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-slate-200 truncate">
                                            {item.productId?.name ?? item.sku}
                                        </p>
                                        <p className="text-[10px] text-amber-400">
                                            {item.quantityOnHand} units · reorder at {item.reorderPoint}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {/* Overdue Orders */}
                            {alerts.overdueOrders.map((order) => (
                                <div
                                    key={order._id}
                                    className="flex items-center gap-2.5 p-2.5 rounded-lg bg-rose-500/8 border border-rose-500/20"
                                >
                                    <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-slate-200 truncate">
                                            {order.orderNumber}
                                        </p>
                                        <p className="text-[10px] text-rose-400">
                                            Overdue · {order.productId?.name}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {/* Offline Machines */}
                            {alerts.offlineMachines.map((machine) => (
                                <div
                                    key={machine._id}
                                    className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-500/8 border border-slate-500/20"
                                >
                                    <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-slate-200 truncate">
                                            {machine.name}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            Offline · {machine.type}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Row 3: Inventory Health + Machine Utilization ────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Inventory Health Bars */}
                <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-semibold text-white">Inventory Health</h3>
                            <p className="text-xs text-slate-400">Stock fill vs reorder threshold</p>
                        </div>
                        <Warehouse className="w-4 h-4 text-slate-500" />
                    </div>

                    {invLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="animate-pulse space-y-1">
                                    <div className="h-3 w-32 bg-slate-800 rounded" />
                                    <div className="h-2 w-full bg-slate-800 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : inventoryItems.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-slate-500 text-xs">
                            No inventory data
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {inventoryItems.map((item) => {
                                const fill = item.fillPercentage ?? 0;
                                const isLow = item.status === 'Low' || item.status === 'Critical';
                                const barColor = item.status === 'Critical'
                                    ? 'bg-rose-500'
                                    : isLow
                                        ? 'bg-amber-500'
                                        : 'bg-emerald-500';
                                return (
                                    <div key={item._id}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-slate-300 font-medium truncate max-w-[180px]">
                                                {item.sku}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400 tabular-nums">
                                                    {item.quantityOnHand} units
                                                </span>
                                                {isLow && (
                                                    <span className="text-[10px] font-semibold text-amber-400">
                                                        ⚠ LOW
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${barColor} rounded-full transition-all duration-700`}
                                                style={{ width: `${Math.min(100, fill)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Machine Utilization */}
                <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-semibold text-white">Machine Utilization</h3>
                            <p className="text-xs text-slate-400">Today's capacity usage</p>
                        </div>
                        <Cpu className="w-4 h-4 text-slate-500" />
                    </div>

                    {schedLoading ? (
                        <div className="h-44 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                        </div>
                    ) : machineChartData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-44 gap-2 text-slate-500">
                            <Cpu className="w-8 h-8 opacity-30" />
                            <p className="text-xs">No schedule for today yet</p>
                            <p className="text-[10px] text-slate-600">
                                Go to Machine Schedule → Generate Schedule
                            </p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={machineChartData} barSize={28} layout="vertical">
                                <XAxis
                                    type="number"
                                    domain={[0, 100]}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `${v}%`}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={90}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        color: '#e2e8f0',
                                    }}
                                    formatter={(val) => [`${val}%`, 'Utilization']}
                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                />
                                <Bar dataKey="utilization" radius={[0, 4, 4, 0]}>
                                    {machineChartData.map((entry, index) => (
                                        <Cell
                                            key={`util-${index}`}
                                            fill={UTILIZATION_COLORS[entry.status] ?? '#475569'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}

                    {/* Utilization Legend */}
                    {!schedLoading && machineChartData.length > 0 && (
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                            {Object.entries(UTILIZATION_COLORS).map(([key, color]) => (
                                <div key={key} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                                    <span className="capitalize">{key}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Row 4: Recent Production Orders ─────────────────────── */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-semibold text-white">Recent Production Orders</h3>
                        <p className="text-xs text-slate-400">Last 5 orders sorted by creation time</p>
                    </div>
                    <ClipboardList className="w-4 h-4 text-slate-500" />
                </div>

                {prodLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-12 bg-slate-800 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : recentOrders.length === 0 ? (
                    <div className="flex items-center justify-center h-20 text-slate-500 text-xs">
                        No production orders found
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-2 pr-4">Order #</th>
                                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-2 pr-4">Product</th>
                                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-2 pr-4">Units</th>
                                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-2 pr-4">Due Date</th>
                                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-2">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {recentOrders.map((order) => (
                                    <tr key={order._id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="py-2.5 pr-4">
                                            <span className="font-mono text-xs text-blue-400">{order.orderNumber}</span>
                                        </td>
                                        <td className="py-2.5 pr-4">
                                            <span className="text-xs text-slate-200 truncate max-w-[140px] block">
                                                {order.productId?.name ?? '—'}
                                            </span>
                                        </td>
                                        <td className="py-2.5 pr-4">
                                            <span className="text-xs text-slate-300 tabular-nums">{order.totalUnits ?? '—'}</span>
                                        </td>
                                        <td className="py-2.5 pr-4">
                                            <span className="text-xs text-slate-400 font-mono">
                                                {order.dueDate
                                                    ? new Date(order.dueDate).toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })
                                                    : '—'}
                                            </span>
                                        </td>
                                        <td className="py-2.5">
                                            <StatusBadge status={order.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}
