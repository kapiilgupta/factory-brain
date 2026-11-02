'use client';

import React, { useState, useMemo } from 'react';
import {
    Plus,
    Search,
    Package,
    Edit2,
    Trash2,
    ToggleLeft,
    ToggleRight,
    X,
    AlertCircle,
    Loader2,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { useProducts } from '@/lib/useProducts';
import { apiRequest } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SizeRow {
    sizeLabel: string;
    sku: string;
    machineMinutesPerUnit: number;
    materialQtyPerUnit: number;
}

interface Product {
    _id: string;
    name: string;
    category: string;
    isActive: boolean;
    sizes: SizeRow[];
    createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
    'Garments', 'Electronics', 'Food & Beverage',
    'Automotive', 'Furniture', 'Packaging', 'Textile', 'Other',
];

const EMPTY_SIZE: SizeRow = {
    sizeLabel: '',
    sku: '',
    machineMinutesPerUnit: 0,
    materialQtyPerUnit: 0,
};

// ─── Page Component ──────────────────────────────────────────────────────────

export default function ProductsPage() {
    const { products, isLoading, isError, mutate } = useProducts();

    // Search & filter
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    // Expanded row for size details
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // Form state
    const [form, setForm] = useState({
        name: '',
        category: 'Garments',
        sizes: [{ ...EMPTY_SIZE }] as SizeRow[],
    });

    // ─── Filtered products ────────────────────────────────────────────────────

    const filtered = useMemo(() => {
        return products.filter((p: Product) => {
            const matchSearch =
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.category.toLowerCase().includes(search.toLowerCase());
            const matchStatus =
                filterStatus === 'all' ||
                (filterStatus === 'active' && p.isActive) ||
                (filterStatus === 'inactive' && !p.isActive);
            return matchSearch && matchStatus;
        });
    }, [products, search, filterStatus]);

    // ─── Modal handlers ───────────────────────────────────────────────────────

    function openAdd() {
        setEditProduct(null);
        setForm({ name: '', category: 'Garments', sizes: [{ ...EMPTY_SIZE }] });
        setFormError('');
        setModalOpen(true);
    }

    function openEdit(p: Product) {
        setEditProduct(p);
        setForm({
            name: p.name,
            category: p.category,
            sizes: p.sizes.map(s => ({ ...s })),
        });
        setFormError('');
        setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false);
        setEditProduct(null);
        setFormError('');
    }

    // ─── Size row handlers ────────────────────────────────────────────────────

    function addSizeRow() {
        setForm(f => ({ ...f, sizes: [...f.sizes, { ...EMPTY_SIZE }] }));
    }

    function removeSizeRow(i: number) {
        setForm(f => ({ ...f, sizes: f.sizes.filter((_, idx) => idx !== i) }));
    }

    function updateSizeRow(i: number, field: keyof SizeRow, value: string) {
        setForm(f => {
            const sizes = [...f.sizes];
            sizes[i] = {
                ...sizes[i],
                [field]:
                    field === 'machineMinutesPerUnit' || field === 'materialQtyPerUnit'
                        ? parseFloat(value) || 0
                        : value,
            };
            return { ...f, sizes };
        });
    }

    // ─── Submit ───────────────────────────────────────────────────────────────

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!form.name.trim()) {
            setFormError('Product name is required.');
            return;
        }
        if (form.sizes.some(s => !s.sizeLabel.trim() || !s.sku.trim())) {
            setFormError('All size rows must have a label and SKU.');
            return;
        }
        const skus = form.sizes.map(s => s.sku.trim());
        if (new Set(skus).size !== skus.length) {
            setFormError('SKUs must be unique within a product.');
            return;
        }

        setSubmitting(true);
        setFormError('');
        try {
            if (editProduct) {
                await apiRequest(`/api/products/${editProduct._id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(form),
                });
            } else {
                await apiRequest('/api/products', {
                    method: 'POST',
                    body: JSON.stringify(form),
                });
            }
            await mutate();
            closeModal();
        } catch (err: unknown) {
            setFormError(err instanceof Error ? err.message : 'Failed to save product.');
        } finally {
            setSubmitting(false);
        }
    }

    // ─── Toggle active ────────────────────────────────────────────────────────

    async function toggleActive(p: Product) {
        try {
            await apiRequest(`/api/products/${p._id}`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive: !p.isActive }),
            });
            await mutate();
        } catch {
            alert('Failed to update status.');
        }
    }

    // ─── Delete (soft) ────────────────────────────────────────────────────────

    async function handleDelete(p: Product) {
        if (!confirm(`Soft-delete "${p.name}"? This sets it to inactive.`)) return;
        try {
            await apiRequest(`/api/products/${p._id}`, { method: 'DELETE' });
            await mutate();
        } catch {
            alert('Failed to delete product.');
        }
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Product Catalog</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Manage products, size variants, SKUs, and machine cycle times.
                    </p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
                >
                    <Plus size={16} />
                    Add Product
                </button>
            </div>

            {/* Search + Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or category..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'active', 'inactive'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${filterStatus === s
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-white'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
                        <Loader2 size={20} className="animate-spin" />
                        <span className="text-sm">Loading products...</span>
                    </div>
                ) : isError ? (
                    <div className="flex items-center justify-center py-20 gap-3 text-red-400">
                        <AlertCircle size={20} />
                        <span className="text-sm">Failed to load. Make sure the API server is running.</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <Package size={40} className="mb-3 opacity-30" />
                        <p className="text-sm font-medium">No products found</p>
                        <p className="text-xs mt-1">
                            {search ? 'Try a different search term' : 'Click "Add Product" to get started'}
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
                                <th className="px-5 py-3 text-left">Product</th>
                                <th className="px-5 py-3 text-left">Category</th>
                                <th className="px-5 py-3 text-center">Sizes</th>
                                <th className="px-5 py-3 text-center">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p: Product) => (
                                <React.Fragment key={p._id}>
                                    {/* Main Row */}
                                    <tr
                                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
                                        onClick={() =>
                                            setExpandedRow(expandedRow === p._id ? null : p._id)
                                        }
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                                                    <Package size={14} className="text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{p.name}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {p.sizes.length} size{p.sizes.length !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-300">{p.category}</td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                                                {p.sizes.length}
                                                {expandedRow === p._id ? (
                                                    <ChevronUp size={13} />
                                                ) : (
                                                    <ChevronDown size={13} />
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${p.isActive
                                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-slate-700/50 text-slate-400 border border-slate-700'
                                                    }`}
                                            >
                                                <span
                                                    className={`w-1.5 h-1.5 rounded-full ${p.isActive ? 'bg-emerald-400' : 'bg-slate-500'
                                                        }`}
                                                />
                                                {p.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div
                                                className="flex items-center justify-end gap-2"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={() => toggleActive(p)}
                                                    title={p.isActive ? 'Deactivate' : 'Activate'}
                                                    className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700/50 transition-colors"
                                                >
                                                    {p.isActive ? (
                                                        <ToggleRight size={18} className="text-emerald-400" />
                                                    ) : (
                                                        <ToggleLeft size={18} />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => openEdit(p)}
                                                    title="Edit"
                                                    className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(p)}
                                                    title="Delete"
                                                    className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Expanded Size Details Row */}
                                    {expandedRow === p._id && (
                                        <tr className="border-b border-slate-800/50 bg-slate-800/20">
                                            <td colSpan={5} className="px-8 py-4">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                                                    Size Details
                                                </p>
                                                <div className="grid grid-cols-4 gap-2 text-xs text-slate-500 font-medium mb-2 px-2">
                                                    <span>Size Label</span>
                                                    <span>SKU</span>
                                                    <span>Machine Mins / Unit</span>
                                                    <span>Material Qty / Unit</span>
                                                </div>
                                                {p.sizes.map((s, i) => (
                                                    <div
                                                        key={i}
                                                        className="grid grid-cols-4 gap-2 text-xs text-slate-300 bg-slate-800/40 rounded-lg px-2 py-2.5 mb-1.5"
                                                    >
                                                        <span className="font-semibold text-white">{s.sizeLabel}</span>
                                                        <span className="font-mono text-blue-400">{s.sku}</span>
                                                        <span>{s.machineMinutesPerUnit} min</span>
                                                        <span>{s.materialQtyPerUnit} units</span>
                                                    </div>
                                                ))}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Stats Bar */}
            {!isLoading && products.length > 0 && (
                <div className="flex gap-6 text-sm text-slate-500">
                    <span>
                        Total: <strong className="text-white">{products.length}</strong>
                    </span>
                    <span>
                        Active:{' '}
                        <strong className="text-emerald-400">
                            {products.filter((p: Product) => p.isActive).length}
                        </strong>
                    </span>
                    <span>
                        Inactive:{' '}
                        <strong className="text-slate-400">
                            {products.filter((p: Product) => !p.isActive).length}
                        </strong>
                    </span>
                </div>
            )}

            {/* ─── Add / Edit Modal ──────────────────────────────────────────── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
                            <h2 className="text-lg font-bold text-white">
                                {editProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Error Banner */}
                            {formError && (
                                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                                    <AlertCircle size={16} className="shrink-0" />
                                    {formError}
                                </div>
                            )}

                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                                        Product Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e =>
                                            setForm(f => ({ ...f, name: e.target.value }))
                                        }
                                        placeholder="e.g. Classic T-Shirt"
                                        className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                                        Category *
                                    </label>
                                    <select
                                        value={form.category}
                                        onChange={e =>
                                            setForm(f => ({ ...f, category: e.target.value }))
                                        }
                                        className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        {CATEGORIES.map(c => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Size Variants */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                        Size Variants *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addSizeRow}
                                        className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                                    >
                                        <Plus size={13} />
                                        Add Size
                                    </button>
                                </div>

                                {/* Column Labels */}
                                <div className="grid grid-cols-9 gap-2 text-xs text-slate-500 font-medium mb-2 px-1">
                                    <span className="col-span-2">Size Label</span>
                                    <span className="col-span-2">SKU</span>
                                    <span className="col-span-2">Machine Mins/Unit</span>
                                    <span className="col-span-2">Material Qty/Unit</span>
                                    <span />
                                </div>

                                <div className="space-y-2">
                                    {form.sizes.map((s, i) => (
                                        <div key={i} className="grid grid-cols-9 gap-2 items-center">
                                            <input
                                                type="text"
                                                placeholder="S / M / L"
                                                value={s.sizeLabel}
                                                onChange={e =>
                                                    updateSizeRow(i, 'sizeLabel', e.target.value)
                                                }
                                                className="col-span-2 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="TSH-S-001"
                                                value={s.sku}
                                                onChange={e =>
                                                    updateSizeRow(i, 'sku', e.target.value)
                                                }
                                                className="col-span-2 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-500 font-mono"
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                placeholder="15"
                                                value={s.machineMinutesPerUnit || ''}
                                                onChange={e =>
                                                    updateSizeRow(
                                                        i,
                                                        'machineMinutesPerUnit',
                                                        e.target.value
                                                    )
                                                }
                                                className="col-span-2 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-500"
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                placeholder="1.5"
                                                value={s.materialQtyPerUnit || ''}
                                                onChange={e =>
                                                    updateSizeRow(
                                                        i,
                                                        'materialQtyPerUnit',
                                                        e.target.value
                                                    )
                                                }
                                                className="col-span-2 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeSizeRow(i)}
                                                disabled={form.sizes.length === 1}
                                                className="flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium py-2.5 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {submitting && (
                                        <Loader2 size={15} className="animate-spin" />
                                    )}
                                    {submitting
                                        ? 'Saving...'
                                        : editProduct
                                            ? 'Save Changes'
                                            : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}