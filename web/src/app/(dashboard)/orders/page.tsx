'use client';

import React, { useState, useMemo } from 'react';
import {
    ClipboardList,
    Play,
    CheckCircle2,
    Clock,
    XCircle,
    ChevronDown,
    ChevronUp,
    Search,
    Calendar,
    Package,
    Loader2,
    AlertCircle,
    Layers,
    Filter,
} from 'lucide-react';
import { useOrders } from '@/lib/useOrders';
import { apiRequest } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderItem {
    sizeId: string;
    sku: string;
    sizeLabel: string;
    plannedQty: number;
    machineMinutesPerUnit: number;
}

interface ProductionOrder {
    _id: string;
    orderNumber: string;
    productId: { _id: string; name: string; category: string } | null;
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
    dueDate: string;
    forecastPeriod?: string;
    items: OrderItem[];
    notes?: string;
    createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_BADGES: Record<
    ProductionOrder['status'],
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
> = {
    pending: {
        label: 'Pending',
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
        icon: <Clock size={12} />,
    },
    'in-progress': {
        label: 'In Progress',
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/20',
        icon: <Loader2 size={12} className="animate-spin" />,
    },
    completed: {
        label: 'Completed',
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
        icon: <CheckCircle2 size={12} />,
    },
    cancelled: {
        label: 'Cancelled',
        bg: 'bg-slate-700/40',
        text: 'text-slate-400',
        border: 'border-slate-700',
        icon: <XCircle size={12} />,
    },
};

// ─── Page Component ──────────────────────────────────────────────────────────

export default function ProductionOrdersPage() {
    const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
    const { orders, isLoading, isError, mutate } = useOrders(selectedTab);

    const [search, setSearch] = useState('');
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    // Generate Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [forecastPeriod, setForecastPeriod] = useState('');
    const [generating, setGenerating] = useState(false);
    const [generateResult, setGenerateResult] = useState<{ message: string; isError: boolean } | null>(null);

    // Status transition state
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // ─── Filtered by search ───────────────────────────────────────────────────

    const filtered = useMemo(() => {
        return orders.filter((o: ProductionOrder) => {
            const prodName = o.productId?.name?.toLowerCase() || '';
            const orderNum = o.orderNumber?.toLowerCase() || '';
            const query = search.toLowerCase();
            return prodName.includes(query) || orderNum.includes(query);
        });
    }, [orders, search]);

    // ─── Generate Orders from Net Requirement ─────────────────────────────────

    async function handleGenerate(e: React.FormEvent) {
        e.preventDefault();
        if (!forecastPeriod) {
            setGenerateResult({ message: 'Please select a forecast period (YYYY-MM).', isError: true });
            return;
        }

        setGenerating(true);
        setGenerateResult(null);

        try {
            const data = await apiRequest('/api/orders/generate', {
                data: { forecastPeriod },
            });
            await mutate();
            setGenerateResult({ message: data.message || 'Orders generated successfully!', isError: false });
            setTimeout(() => {
                setModalOpen(false);
                setGenerateResult(null);
            }, 1400);
        } catch (err: unknown) {
            setGenerateResult({
                message: err instanceof Error ? err.message : 'Failed to generate orders.',
                isError: true,
            });
        } finally {
            setGenerating(false);
        }
    }

    // ─── Change Status ────────────────────────────────────────────────────────

    async function handleStatusChange(orderId: string, nextStatus: string) {
        setUpdatingId(orderId);
        try {
            await apiRequest(`/api/orders/${orderId}/status`, {
                method: 'PATCH',
                data: { status: nextStatus },
            });
            await mutate();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Invalid state transition.');
        } finally {
            setUpdatingId(null);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Production Orders</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Consolidated batches derived from Net Requirement Planning (Forecast − Stock).
                    </p>
                </div>
                <button
                    onClick={() => {
                        setModalOpen(true);
                        setGenerateResult(null);
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                >
                    <Layers size={16} />
                    Run Net Requirement Engine
                </button>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                {/* Status Tabs */}
                <div className="flex gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-lg">
                    {(['all', 'pending', 'in-progress', 'completed'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setSelectedTab(tab)}
                            className={`px-3.5 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${selectedTab === tab
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            {tab.replace('-', ' ')}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-72">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search order # or product..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Orders Ledger */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-24 gap-3 text-slate-400">
                        <Loader2 size={20} className="animate-spin text-blue-500" />
                        <span className="text-sm">Loading production orders...</span>
                    </div>
                ) : isError ? (
                    <div className="flex items-center justify-center py-20 gap-3 text-red-400">
                        <AlertCircle size={20} />
                        <span className="text-sm">Failed to load orders. Verify API server is running.</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                        <ClipboardList size={42} className="mb-3 opacity-25" />
                        <p className="text-sm font-medium">No production orders found</p>
                        <p className="text-xs mt-1">
                            Click <span className="text-blue-400 font-medium">Run Net Requirement Engine</span> to generate orders from forecast.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800/60">
                        {filtered.map((order: ProductionOrder) => {
                            const badge = STATUS_BADGES[order.status];
                            const isExpanded = expandedOrder === order._id;
                            const totalUnits = order.items.reduce((acc, it) => acc + it.plannedQty, 0);
                            const totalMinutes = order.items.reduce(
                                (acc, it) => acc + it.plannedQty * (it.machineMinutesPerUnit || 0),
                                0
                            );

                            return (
                                <div key={order._id} className="transition-colors hover:bg-slate-800/20">
                                    {/* Main Row */}
                                    <div
                                        onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                                                <ClipboardList size={18} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono text-sm font-bold text-white">
                                                        {order.orderNumber}
                                                    </span>
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}
                                                    >
                                                        {badge.icon}
                                                        {badge.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-300 mt-1 font-medium">
                                                    {order.productId?.name || 'Multiple SKUs'}
                                                    <span className="text-xs text-slate-500 font-normal ml-2">
                                                        ({order.productId?.category || 'General'})
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Metrics & Actions */}
                                        <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800/60">
                                            <div className="text-left md:text-right">
                                                <p className="text-xs text-slate-500">Planned Batch</p>
                                                <p className="text-sm font-semibold text-white">{totalUnits} units</p>
                                            </div>
                                            <div className="text-left md:text-right">
                                                <p className="text-xs text-slate-500">Estimated Work</p>
                                                <p className="text-sm font-semibold text-blue-400">{Math.round(totalMinutes)} mins</p>
                                            </div>
                                            <div className="text-left md:text-right">
                                                <p className="text-xs text-slate-500">Due Date</p>
                                                <p className="text-xs font-medium text-slate-300">
                                                    {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : '—'}
                                                </p>
                                            </div>

                                            {/* Status Transition dropdown */}
                                            <div onClick={e => e.stopPropagation()} className="shrink-0">
                                                <select
                                                    value={order.status}
                                                    disabled={updatingId === order._id || order.status === 'completed'}
                                                    onChange={e => handleStatusChange(order._id, e.target.value)}
                                                    className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="in-progress">In Progress</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </div>

                                            <div className="text-slate-500">
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Line Items Detail */}
                                    {isExpanded && (
                                        <div className="px-6 pb-5 pt-2 bg-slate-950/40 border-t border-slate-800/40">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                                                Net Requirement Line Items (Size Distribution)
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                                {order.items.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col justify-between"
                                                    >
                                                        <div>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="font-semibold text-xs text-white">
                                                                    Size: {item.sizeLabel}
                                                                </span>
                                                                <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                                                                    {item.sku}
                                                                </span>
                                                            </div>
                                                            <p className="text-lg font-bold text-emerald-400 mt-1">
                                                                {item.plannedQty} <span className="text-xs font-normal text-slate-500">units</span>
                                                            </p>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 mt-2">
                                                            Cycle: {item.machineMinutesPerUnit || 0} min/unit
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal: Run Net Requirement Engine */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-1">Run Net Requirement Engine</h3>
                        <p className="text-xs text-slate-400 mb-5">
                            Calculates: <code className="text-blue-400">Net = Forecast − OnHand Stock</code>. Any shortfall automatically triggers production batches.
                        </p>

                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                                    Target Forecast Period *
                                </label>
                                <input
                                    type="month"
                                    value={forecastPeriod}
                                    onChange={e => setForecastPeriod(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            {generateResult && (
                                <div
                                    className={`p-3 rounded-lg text-xs flex items-center gap-2 ${generateResult.isError
                                            ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                                            : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                        }`}
                                >
                                    {generateResult.isError ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                                    {generateResult.message}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={generating}
                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors"
                                >
                                    {generating && <Loader2 size={14} className="animate-spin" />}
                                    {generating ? 'Calculating...' : 'Generate Orders'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}