'use client';

import React, { useState, useMemo } from 'react';
import {
    AlertTriangle,
    PackageCheck,
    PackageX,
    Search,
    Edit2,
    Check,
    X,
    Loader2,
    AlertCircle,
    TrendingDown,
    RefreshCw,
} from 'lucide-react';
import { useInventory, useInventoryAlerts } from '@/lib/useInventory';
import { apiRequest } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface InventoryItem {
    _id: string;
    sku: string;
    productId: { _id: string; name: string; category: string } | string;
    sizeId: string;
    quantityOnHand: number;
    reorderPoint: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getProductName(item: InventoryItem): string {
    if (typeof item.productId === 'object' && item.productId !== null) {
        return item.productId.name;
    }
    return 'Unknown Product';
}

function getStockStatus(qty: number, reorder: number): {
    label: string;
    color: string;
    dot: string;
    bg: string;
    border: string;
} {
    if (qty === 0) {
        return {
            label: 'Out of Stock',
            color: 'text-red-400',
            dot: 'bg-red-500',
            bg: 'bg-red-500/10',
            border: 'border-red-500/30',
        };
    }
    if (qty < reorder) {
        return {
            label: 'Low Stock',
            color: 'text-amber-400',
            dot: 'bg-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/30',
        };
    }
    if (qty < reorder * 2) {
        return {
            label: 'Moderate',
            color: 'text-blue-400',
            dot: 'bg-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/30',
        };
    }
    return {
        label: 'In Stock',
        color: 'text-emerald-400',
        dot: 'bg-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
    };
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function InventoryPage() {
    const { inventory, isLoading, isError, mutate } = useInventory();
    const { alerts } = useInventoryAlerts();

    // Filter
    const [filter, setFilter] = useState<'all' | 'low'>('all');
    const [search, setSearch] = useState('');

    // Inline edit state: key = item._id, value = { qty, reorder }
    const [editing, setEditing] = useState<string | null>(null);
    const [editValues, setEditValues] = useState({ qty: 0, reorder: 0 });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    // ─── Filter items ─────────────────────────────────────────────────────────

    const filtered = useMemo(() => {
        return inventory.filter((item: InventoryItem) => {
            const name = getProductName(item).toLowerCase();
            const matchSearch =
                item.sku.toLowerCase().includes(search.toLowerCase()) ||
                name.includes(search.toLowerCase());
            const matchFilter =
                filter === 'all' || item.quantityOnHand < item.reorderPoint;
            return matchSearch && matchFilter;
        });
    }, [inventory, search, filter]);

    // ─── Edit handlers ────────────────────────────────────────────────────────

    function startEdit(item: InventoryItem) {
        setEditing(item._id);
        setEditValues({ qty: item.quantityOnHand, reorder: item.reorderPoint });
        setSaveError('');
    }

    function cancelEdit() {
        setEditing(null);
        setSaveError('');
    }

    async function saveEdit(item: InventoryItem) {
        if (editValues.qty < 0 || editValues.reorder < 0) {
            setSaveError('Values cannot be negative.');
            return;
        }
        setSaving(true);
        setSaveError('');
        try {
            await apiRequest(`/api/inventory/${item.sku}`, {
                method: 'PUT',
                body: JSON.stringify({
                    quantityOnHand: editValues.qty,
                    reorderPoint: editValues.reorder,
                }),
            });
            await mutate();
            setEditing(null);
        } catch (err: unknown) {
            setSaveError(err instanceof Error ? err.message : 'Failed to save.');
        } finally {
            setSaving(false);
        }
    }

    // ─── Stats ────────────────────────────────────────────────────────────────

    const outOfStock = inventory.filter((i: InventoryItem) => i.quantityOnHand === 0).length;
    const lowStock = inventory.filter(
        (i: InventoryItem) => i.quantityOnHand > 0 && i.quantityOnHand < i.reorderPoint
    ).length;
    const healthy = inventory.filter((i: InventoryItem) => i.quantityOnHand >= i.reorderPoint).length;

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Inventory</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Track stock levels, reorder points, and low-stock alerts.
                    </p>
                </div>
                <button
                    onClick={() => mutate()}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                >
                    <RefreshCw size={14} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <PackageCheck size={18} className="text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Healthy</p>
                        <p className="text-2xl font-bold text-white">{healthy}</p>
                    </div>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={18} className="text-amber-400" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Low Stock</p>
                        <p className="text-2xl font-bold text-white">{lowStock}</p>
                    </div>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-red-500/15 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                        <PackageX size={18} className="text-red-400" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Out of Stock</p>
                        <p className="text-2xl font-bold text-white">{outOfStock}</p>
                    </div>
                </div>
            </div>

            {/* Alerts Panel — only shown when there are alerts */}
            {alerts.length > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingDown size={16} className="text-amber-400" />
                        <p className="text-sm font-semibold text-amber-400">
                            {alerts.length} item{alerts.length !== 1 ? 's' : ''} below reorder point
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {alerts.slice(0, 8).map((item: InventoryItem) => (
                            <span
                                key={item._id}
                                className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono px-2.5 py-1 rounded-full"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                {item.sku} — {item.quantityOnHand} left
                            </span>
                        ))}
                        {alerts.length > 8 && (
                            <span className="text-xs text-slate-500 self-center">
                                +{alerts.length - 8} more
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by SKU or product name..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'low'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-white'
                                }`}
                        >
                            {f === 'all' ? 'All Items' : '⚠ Low Stock Only'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
                        <Loader2 size={20} className="animate-spin" />
                        <span className="text-sm">Loading inventory...</span>
                    </div>
                ) : isError ? (
                    <div className="flex items-center justify-center py-20 gap-3 text-red-400">
                        <AlertCircle size={20} />
                        <span className="text-sm">Failed to load. Make sure the API server is running.</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <PackageCheck size={40} className="mb-3 opacity-30" />
                        <p className="text-sm font-medium">
                            {filter === 'low' ? 'No low-stock items — all good! ✅' : 'No inventory items found'}
                        </p>
                        <p className="text-xs mt-1">
                            {inventory.length === 0
                                ? 'Add a product first — inventory is auto-created per size'
                                : 'Try a different search or filter'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Save error banner */}
                        {saveError && (
                            <div className="flex items-center gap-3 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm px-5 py-3">
                                <AlertCircle size={15} className="shrink-0" />
                                {saveError}
                            </div>
                        )}
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
                                    <th className="px-5 py-3 text-left">SKU</th>
                                    <th className="px-5 py-3 text-left">Product</th>
                                    <th className="px-5 py-3 text-center">Stock (Units)</th>
                                    <th className="px-5 py-3 text-center">Reorder Point</th>
                                    <th className="px-5 py-3 text-center">Fill Level</th>
                                    <th className="px-5 py-3 text-center">Status</th>
                                    <th className="px-5 py-3 text-right">Edit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item: InventoryItem) => {
                                    const status = getStockStatus(item.quantityOnHand, item.reorderPoint);
                                    const isEditing = editing === item._id;
                                    const fillPct = item.reorderPoint > 0
                                        ? Math.min(100, Math.round((item.quantityOnHand / (item.reorderPoint * 2)) * 100))
                                        : 100;

                                    return (
                                        <tr
                                            key={item._id}
                                            className={`border-b border-slate-800/50 transition-colors ${isEditing ? 'bg-slate-800/40' : 'hover:bg-slate-800/20'
                                                }`}
                                        >
                                            {/* SKU */}
                                            <td className="px-5 py-4">
                                                <span className="font-mono text-blue-400 text-xs bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded">
                                                    {item.sku}
                                                </span>
                                            </td>

                                            {/* Product Name */}
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-white text-sm">{getProductName(item)}</p>
                                            </td>

                                            {/* Stock Qty */}
                                            <td className="px-5 py-4 text-center">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={editValues.qty}
                                                        onChange={e =>
                                                            setEditValues(v => ({
                                                                ...v,
                                                                qty: parseInt(e.target.value) || 0,
                                                            }))
                                                        }
                                                        className="w-20 bg-slate-700 border border-blue-500 text-white text-sm text-center rounded-lg px-2 py-1 focus:outline-none"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span className={`font-bold text-base ${status.color}`}>
                                                        {item.quantityOnHand}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Reorder Point */}
                                            <td className="px-5 py-4 text-center">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={editValues.reorder}
                                                        onChange={e =>
                                                            setEditValues(v => ({
                                                                ...v,
                                                                reorder: parseInt(e.target.value) || 0,
                                                            }))
                                                        }
                                                        className="w-20 bg-slate-700 border border-blue-500 text-white text-sm text-center rounded-lg px-2 py-1 focus:outline-none"
                                                    />
                                                ) : (
                                                    <span className="text-slate-300">{item.reorderPoint}</span>
                                                )}
                                            </td>

                                            {/* Fill Bar */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2 justify-center">
                                                    <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${fillPct < 25
                                                                    ? 'bg-red-500'
                                                                    : fillPct < 60
                                                                        ? 'bg-amber-400'
                                                                        : 'bg-emerald-500'
                                                                }`}
                                                            style={{ width: `${fillPct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-slate-500 w-8 text-right">
                                                        {fillPct}%
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-5 py-4 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.color} ${status.border}`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                    {status.label}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                onClick={() => saveEdit(item)}
                                                                disabled={saving}
                                                                title="Save"
                                                                className="p-1.5 rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                                                            >
                                                                {saving ? (
                                                                    <Loader2 size={14} className="animate-spin" />
                                                                ) : (
                                                                    <Check size={14} />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={cancelEdit}
                                                                title="Cancel"
                                                                className="p-1.5 rounded-md bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => startEdit(item)}
                                                            title="Edit stock"
                                                            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </>
                )}
            </div>

            {/* Footer Stats */}
            {!isLoading && inventory.length > 0 && (
                <div className="flex gap-6 text-sm text-slate-500">
                    <span>Total SKUs: <strong className="text-white">{inventory.length}</strong></span>
                    <span>Showing: <strong className="text-white">{filtered.length}</strong></span>
                    <span>Healthy: <strong className="text-emerald-400">{healthy}</strong></span>
                    <span>Low Stock: <strong className="text-amber-400">{lowStock}</strong></span>
                    <span>Out of Stock: <strong className="text-red-400">{outOfStock}</strong></span>
                </div>
            )}
        </div>
    );
}