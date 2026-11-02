'use client';

import React, { useState, useEffect } from 'react';
import {
    Calendar as CalendarIcon,
    Play,
    Cpu,
    Clock,
    AlertCircle,
    CheckCircle2,
    Loader2,
    RefreshCw,
    Activity,
    Layers,
    Sliders,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { useSchedule, useMachineUtilization } from '@/lib/useSchedule';
import { apiRequest } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScheduleSlot {
    _id: string;
    orderNumber: string;
    machineName: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    status: 'scheduled' | 'in-progress' | 'completed' | 'delayed';
    notes?: string;
}

interface MachineUtilization {
    machineId: string;
    machineName: string;
    shiftMinutes: number;
    scheduledMinutes: number;
    utilizationPercent: number;
    status: 'idle' | 'normal' | 'high' | 'over-scheduled';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayString(): string {
    return new Date().toISOString().split('T')[0];
}

const UTILIZATION_COLORS: Record<string, string> = {
    idle: '#475569',
    normal: '#10b981',
    high: '#f59e0b',
    'over-scheduled': '#ef4444',
};

// ─── Page Component ──────────────────────────────────────────────────────────

export default function MachineSchedulePage() {
    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        setSelectedDate(getTodayString());
    }, []);

    const { slots, isLoading: loadingSlots, mutate: mutateSlots } = useSchedule(selectedDate);
    const { utilization, isLoading: loadingUtil, mutate: mutateUtil } = useMachineUtilization(selectedDate);

    // Generation state
    const [generating, setGenerating] = useState(false);
    const [genMessage, setGenMessage] = useState<{ text: string; isError: boolean } | null>(null);

    async function handleGenerateSchedule() {
        if (!selectedDate) return;
        setGenerating(true);
        setGenMessage(null);

        try {
            const res = await apiRequest('/api/schedule/generate', {
                data: { scheduleDate: selectedDate },
            });
            await Promise.all([mutateSlots(), mutateUtil()]);
            setGenMessage({
                text: res.message || 'Schedule synthesized successfully!',
                isError: false,
            });
        } catch (err: unknown) {
            setGenMessage({
                text: err instanceof Error ? err.message : 'Failed to generate schedule.',
                isError: true,
            });
        } finally {
            setGenerating(false);
        }
    }

    // Prepare horizontal BarChart data for machine capacity utilization
    const chartData = utilization.map(u => ({
        machine: u.machineName,
        utilization: u.utilizationPercent,
        scheduledMinutes: u.scheduledMinutes,
        shiftMinutes: u.shiftMinutes,
        status: u.status,
    }));

    return (
        <div className="space-y-6">
            {/* Top Bar / Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Machine Schedule & Gantt</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Earliest Due Date (EDD) dispatching engine with automated setup buffer sequencing.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Date Picker */}
                    <div className="relative">
                        <CalendarIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500 font-mono"
                        />
                    </div>

                    <button
                        onClick={handleGenerateSchedule}
                        disabled={generating || !selectedDate}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                    >
                        {generating ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                        {generating ? 'Optimizing...' : 'Run EDD Engine'}
                    </button>
                </div>
            </div>

            {/* Notification alert */}
            {genMessage && (
                <div
                    className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${genMessage.isError
                            ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        {genMessage.isError ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                        {genMessage.text}
                    </div>
                    <button onClick={() => setGenMessage(null)} className="text-slate-400 hover:text-white">
                        ✕
                    </button>
                </div>
            )}

            {/* Capacity Utilization Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Horizontal Bar Chart for Utilization */}
                <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Activity size={16} className="text-blue-400" />
                            <h2 className="text-sm font-semibold text-white">Machine Capacity Load ({selectedDate})</h2>
                        </div>
                        <span className="text-xs text-slate-500">Max Shift: 480 mins</span>
                    </div>

                    {loadingUtil ? (
                        <div className="h-56 flex items-center justify-center text-slate-500 text-xs">
                            <Loader2 size={16} className="animate-spin mr-2" /> Calculating utilization metrics...
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="h-56 flex flex-col items-center justify-center text-slate-500 text-xs">
                            <Cpu size={32} className="mb-2 opacity-30" />
                            No operational machines found for this date.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart
                                layout="vertical"
                                data={chartData}
                                margin={{ top: 10, right: 20, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                <XAxis
                                    type="number"
                                    domain={[0, (dataMax: number) => Math.max(100, Math.ceil(dataMax / 10) * 10)]}
                                    unit="%"
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                />
                                <YAxis
                                    dataKey="machine"
                                    type="category"
                                    tick={{ fill: '#e2e8f0', fontSize: 11 }}
                                    width={120}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        color: '#f8fafc',
                                    }}
                                    formatter={(val) => [`${val}%`, 'Utilized Load']}
                                />
                                <Bar dataKey="utilization" radius={[0, 4, 4, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={UTILIZATION_COLORS[entry.status] || '#3b82f6'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Legend & Shift Health */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-white mb-2">Shop-Floor Health Status</h3>
                        <p className="text-xs text-slate-400 mb-4">
                            Threshold classification per single production shift.
                        </p>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50">
                                <span className="flex items-center gap-2 text-slate-300">
                                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                                    Idle (0%)
                                </span>
                                <span className="text-slate-500">Unused Line</span>
                            </div>
                            <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                                <span className="flex items-center gap-2 text-emerald-400 font-medium">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    Normal (1% – 75%)
                                </span>
                                <span className="text-emerald-500">Optimal Load</span>
                            </div>
                            <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
                                <span className="flex items-center gap-2 text-amber-400 font-medium">
                                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                                    High (76% – 100%)
                                </span>
                                <span className="text-amber-500">Near Capacity</span>
                            </div>
                            <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
                                <span className="flex items-center gap-2 text-red-400 font-medium">
                                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                                    Over-Scheduled (&gt;100%)
                                </span>
                                <span className="text-red-500">Requires Overtime</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Algorithm: Jackson's Rule (EDD)</span>
                        <span>Buffer: 15 min gap</span>
                    </div>
                </div>
            </div>

            {/* Timeline Slot Ledger (Gantt representation) */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-white">Dispatched Time Slots</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Chronological execution line on {selectedDate}</p>
                    </div>
                    <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded">
                        {slots.length} Blocks Dispatched
                    </span>
                </div>

                {loadingSlots ? (
                    <div className="flex items-center justify-center py-20 text-slate-400 gap-2 text-sm">
                        <Loader2 size={16} className="animate-spin text-blue-500" />
                        Loading dispatched timeline...
                    </div>
                ) : slots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                        <Clock size={40} className="mb-2 opacity-25" />
                        <p className="text-sm font-medium">No production slots booked for this date</p>
                        <p className="text-xs mt-1">
                            Click <span className="text-blue-400 font-medium">Run EDD Engine</span> above to auto-dispatch pending orders.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 bg-slate-950/20">
                                    <th className="px-5 py-3 font-semibold">Machine</th>
                                    <th className="px-5 py-3 font-semibold">Production Order</th>
                                    <th className="px-5 py-3 font-semibold">Start Time</th>
                                    <th className="px-5 py-3 font-semibold">End Time</th>
                                    <th className="px-5 py-3 font-semibold">Duration</th>
                                    <th className="px-5 py-3 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                {slots.map((slot: ScheduleSlot) => (
                                    <tr key={slot._id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                                    <Cpu size={14} />
                                                </div>
                                                <span className="font-medium text-white text-xs">
                                                    {slot.machineName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="font-mono text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                                                {slot.orderNumber}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 font-mono text-xs text-slate-300">
                                            {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-5 py-3.5 font-mono text-xs text-slate-300">
                                            {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-slate-300 font-medium">
                                            {slot.durationMinutes} mins
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                {slot.status}
                                            </span>
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