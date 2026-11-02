'use client';

import React, { useState, useMemo } from 'react';
import {
    Cpu,
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertCircle,
    Sliders,
    Power,
    Wrench,
    Clock,
    X,
} from 'lucide-react';
import { useMachines } from '@/lib/useMachines';
import { apiRequest } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Machine {
    _id: string;
    name: string;
    type: string;
    shiftMinutes: number;
    isOperational: boolean;
    notes?: string;
    createdAt: string;
}

const MACHINE_TYPES = [
    'Cutting Machine',
    'Sewing Machine',
    'CNC Router',
    'Laser Engraver',
    'Assembly Station',
    'Packaging Line',
    'Quality Inspection',
    'Press / Molding',
    'Other',
];

// ─── Page Component ──────────────────────────────────────────────────────────

export default function MachinesPage() {
    const { machines, isLoading, isError, mutate } = useMachines();

    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');

    // Modal state for Add/Edit
    const [modalOpen, setModalOpen] = useState(false);
    const [editMachine, setEditMachine] = useState<Machine | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const [form, setForm] = useState({
        name: '',
        type: 'Cutting Machine',
        shiftMinutes: 480,
        isOperational: true,
        notes: '',
    });

    // ─── Filtered Machines ────────────────────────────────────────────────────

    const filtered = useMemo(() => {
        return machines.filter((m: Machine) => {
            const matchesSearch =
                m.name.toLowerCase().includes(search.toLowerCase()) ||
                m.type.toLowerCase().includes(search.toLowerCase());
            const matchesType = filterType === 'all' || m.type === filterType;
            return matchesSearch && matchesType;
        });
    }, [machines, search, filterType]);

    // ─── Handlers ─────────────────────────────────────────────────────────────

    function openAdd() {
        setEditMachine(null);
        setForm({
            name: '',
            type: 'Cutting Machine',
            shiftMinutes: 480,
            isOperational: true,
            notes: '',
        });
        setFormError('');
        setModalOpen(true);
    }

    function openEdit(m: Machine) {
        setEditMachine(m);
        setForm({
            name: m.name,
            type: m.type,
            shiftMinutes: m.shiftMinutes,
            isOperational: m.isOperational,
            notes: m.notes || '',
        });
        setFormError('');
        setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false);
        setEditMachine(null);
        setFormError('');
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name.trim()) {
            setFormError('Machine identifier/name is required.');
            return;
        }

        setSubmitting(true);
        setFormError('');

        try {
            if (editMachine) {
                await apiRequest(`/api/machines/${editMachine._id}`, {
                    method: 'PATCH',
                    data: form,
                });
            } else {
                await apiRequest('/api/machines', {
                    method: 'POST',
                    data: form,
                });
            }
            await mutate();
            closeModal();
        } catch (err: unknown) {
            setFormError(err instanceof Error ? err.message : 'Failed to save machine.');
        } finally {
            setSubmitting(false);
        }
    }

    async function toggleOperational(m: Machine) {
        try {
            await apiRequest(`/api/machines/${m._id}`, {
                method: 'PATCH',
                data: { isOperational: !m.isOperational },
            });
            await mutate();
        } catch {
            alert('Failed to update operational status.');
        }
    }

    async function handleDelete(m: Machine) {
        if (!confirm(`Delete machine "${m.name}"? This removes it from the scheduling engine.`)) return;
        try {
            await apiRequest(`/api/machines/${m._id}`, { method: 'DELETE' });
            await mutate();
        } catch {
            alert('Failed to delete machine asset.');
        }
    }

    const operationalCount = machines.filter((m: Machine) => m.isOperational).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Plant Machines & Assets</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Register shop-floor equipment, configure daily shift capacities, and manage maintenance toggles.
                    </p>
                </div>

                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                >
                    <Plus size={16} />
                    Register Machine
                </button>
            </div>

            {/* Quick Status KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <Cpu size={18} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Total Assets</p>
                        <p className="text-2xl font-bold text-white">{machines.length}</p>
                    </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 size={18} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Online & Ready</p>
                        <p className="text-2xl font-bold text-emerald-400">{operationalCount}</p>
                    </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Wrench size={18} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Maintenance / Offline</p>
                        <p className="text-2xl font-bold text-amber-400">{machines.length - operationalCount}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search machines by name or type..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 text-xs rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-blue-500"
                    />
                </div>

                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="bg-slate-800/60 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500"
                >
                    <option value="all">All Equipment Types</option>
                    {MACHINE_TYPES.map(t => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </select>
            </div>

            {/* Machine Cards Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-24 gap-3 text-slate-400">
                    <Loader2 size={20} className="animate-spin text-blue-500" />
                    <span className="text-sm">Loading plant machines...</span>
                </div>
            ) : isError ? (
                <div className="flex items-center justify-center py-20 gap-3 text-red-400">
                    <AlertCircle size={20} />
                    <span className="text-sm">Failed to load equipment list. Verify backend API.</span>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col items-center justify-center py-24 text-slate-500">
                    <Cpu size={42} className="mb-3 opacity-25" />
                    <p className="text-sm font-medium">No machine assets found</p>
                    <p className="text-xs mt-1">
                        Click <span className="text-blue-400 font-medium">Register Machine</span> to add equipment to your production line.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((m: Machine) => (
                        <div
                            key={m._id}
                            className={`bg-slate-900/80 border rounded-xl p-5 flex flex-col justify-between transition-all ${m.isOperational
                                    ? 'border-slate-800 hover:border-slate-700'
                                    : 'border-amber-500/30 bg-amber-500/5'
                                }`}
                        >
                            <div>
                                {/* Card Header */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-9 h-9 rounded-lg flex items-center justify-center ${m.isOperational
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                }`}
                                        >
                                            <Cpu size={16} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-sm">{m.name}</h3>
                                            <p className="text-xs text-slate-400">{m.type}</p>
                                        </div>
                                    </div>

                                    {/* Operational Toggle Switch */}
                                    <button
                                        onClick={() => toggleOperational(m)}
                                        title={m.isOperational ? 'Click to set Offline' : 'Click to set Operational'}
                                        className={`p-1.5 rounded-lg border transition-colors ${m.isOperational
                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                                            }`}
                                    >
                                        <Power size={14} />
                                    </button>
                                </div>

                                {/* Shift Metric */}
                                <div className="bg-slate-950/40 rounded-lg p-3 my-3 flex items-center justify-between text-xs">
                                    <span className="text-slate-400 flex items-center gap-1.5">
                                        <Clock size={13} />
                                        Shift Capacity:
                                    </span>
                                    <span className="font-mono font-semibold text-white">
                                        {m.shiftMinutes} mins ({Math.round((m.shiftMinutes / 60) * 10) / 10} hrs)
                                    </span>
                                </div>

                                {m.notes && (
                                    <p className="text-xs text-slate-500 italic mt-1 line-clamp-2">
                                        &ldquo;{m.notes}&rdquo;
                                    </p>
                                )}
                            </div>

                            {/* Card Footer Actions */}
                            <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-800/80">
                                <span
                                    className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${m.isOperational ? 'text-emerald-400' : 'text-amber-400'
                                        }`}
                                >
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full ${m.isOperational ? 'bg-emerald-400' : 'bg-amber-400'
                                            }`}
                                    />
                                    {m.isOperational ? 'Operational' : 'Maintenance'}
                                </span>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => openEdit(m)}
                                        title="Edit configuration"
                                        className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                    >
                                        <Edit2 size={13} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(m)}
                                        title="Delete asset"
                                        className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal: Add/Edit Machine */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">
                                {editMachine ? 'Edit Machine Asset' : 'Register Plant Machine'}
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {formError && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-center gap-2">
                                    <AlertCircle size={14} />
                                    {formError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                                    Machine Identifier / Name *
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Laser Cutter Line 01"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                                        Type
                                    </label>
                                    <select
                                        value={form.type}
                                        onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                        className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-2.5 focus:outline-none focus:border-blue-500"
                                    >
                                        {MACHINE_TYPES.map(t => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                                        Shift (Mins)
                                    </label>
                                    <input
                                        type="number"
                                        min="60"
                                        step="30"
                                        value={form.shiftMinutes}
                                        onChange={e =>
                                            setForm(f => ({
                                                ...f,
                                                shiftMinutes: parseInt(e.target.value) || 480,
                                            }))
                                        }
                                        className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="operationalToggle"
                                    checked={form.isOperational}
                                    onChange={e => setForm(f => ({ ...f, isOperational: e.target.checked }))}
                                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                                />
                                <label htmlFor="operationalToggle" className="text-xs text-slate-300">
                                    Machine is operational and available for scheduling
                                </label>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                                    Maintenance Notes / Specs
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="e.g. Calibration required every 100 hours"
                                    value={form.notes}
                                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2.5 focus:outline-none focus:border-blue-500 resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors"
                                >
                                    {submitting && <Loader2 size={14} className="animate-spin" />}
                                    {submitting ? 'Saving...' : editMachine ? 'Save Changes' : 'Register Asset'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}