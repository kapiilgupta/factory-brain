'use client';

import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    Play,
    AlertCircle,
    Loader2,
    ChevronRight,
    BarChart2,
    Info,
    CheckCircle2,
    Calendar,
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
    Legend,
} from 'recharts';
import { useForecast } from '@/lib/useForecast';
import { apiRequest } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ForecastResult {
    _id: string;
    sku: string;
    forecastQty: number;
    confidencePct: number;
    method: string;
    forecastPeriod: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getNextMonth(): string {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 7); // YYYY-MM
}

function confidenceColor(pct: number): string {
    if (pct >= 80) return 'text-emerald-400';
    if (pct >= 55) return 'text-blue-400';
    return 'text-amber-400';
}

function confidenceBg(pct: number): string {
    if (pct >= 80) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    if (pct >= 55) return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
}

const BAR_COLORS = [
    '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981',
    '#f59e0b', '#ef4444', '#ec4899', '#64748b',
];

// ─── Example historical data template ────────────────────────────────────────

const EXAMPLE_DATA = JSON.stringify(
    [
        { sku: 'TSH-S-001', periods: [120, 135, 128] },
        { sku: 'TSH-M-002', periods: [200, 215, 190] },
        { sku: 'TSH-L-003', periods: [95, 102, 110] },
        { sku: 'HOD-S-004', periods: [60, 72, 68] },
        { sku: 'HOD-M-005', periods: [80, 85, 90] },
    ],
    null,
    2
);

// ─── Saved Periods Viewer ─────────────────────────────────────────────────────

function SavedPeriodViewer({
    period,
    onSelect,
    isSelected,
}: {
    period: string;
    onSelect: (p: string) => void;
    isSelected: boolean;
}) {
    return (
        <button
            onClick={() => onSelect(period)}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors ${isSelected
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
        >
            <Calendar size={13} />
            {period}
            {isSelected && <ChevronRight size={13} className="ml-auto" />}
        </button>
    );
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function ForecastPage() {
    // Period to view (already saved forecasts)
    const [viewPeriod, setViewPeriod] = useState('');
    const { forecasts, isLoading: loadingView } = useForecast(viewPeriod);

    // Generate form state
    const [genPeriod, setGenPeriod] = useState('');

    useEffect(() => {
        setGenPeriod(getNextMonth());
    }, []);
    const [historicalData, setHistoricalData] = useState(EXAMPLE_DATA);
    const [generating, setGenerating] = useState(false);
    const [genError, setGenError] = useState('');
    const [genSuccess, setGenSuccess] = useState(false);
    const [generatedResults, setGeneratedResults] = useState<ForecastResult[]>([]);

    // Saved periods (tracked locally after generation)
    const [savedPeriods, setSavedPeriods] = useState<string[]>([]);

    // ─── Generate forecast ────────────────────────────────────────────────────

    async function handleGenerate(e: React.FormEvent) {
        e.preventDefault();
        setGenError('');
        setGenSuccess(false);

        // Validate JSON
        let parsedData;
        try {
            parsedData = JSON.parse(historicalData);
        } catch {
            setGenError('Invalid JSON in historical data. Please fix and try again.');
            return;
        }

        if (!Array.isArray(parsedData) || parsedData.length === 0) {
            setGenError('Historical data must be a non-empty array.');
            return;
        }

        for (const item of parsedData) {
            if (!item.sku || !Array.isArray(item.periods) || item.periods.length === 0) {
                setGenError('Each item must have a "sku" string and a "periods" number array.');
                return;
            }
        }

        setGenerating(true);
        try {
            const result = await apiRequest('/api/forecast/generate', {
                method: 'POST',
                body: JSON.stringify({
                    forecastPeriod: genPeriod,
                    historicalData: parsedData,
                }),
            });

            const results: ForecastResult[] = result?.forecasts ?? result ?? [];
            setGeneratedResults(results);
            setGenSuccess(true);

            // Add to saved periods & auto-select it
            setSavedPeriods(prev =>
                prev.includes(genPeriod) ? prev : [genPeriod, ...prev]
            );
            setViewPeriod(genPeriod);
        } catch (err: unknown) {
            setGenError(err instanceof Error ? err.message : 'Failed to generate forecast.');
        } finally {
            setGenerating(false);
        }
    }

    // ─── Display data: prefer live view, fallback to generatedResults ─────────

    const displayData: ForecastResult[] =
        viewPeriod && forecasts.length > 0 ? forecasts : generatedResults;

    const chartData = displayData.map((f, i) => ({
        sku: f.sku,
        forecastQty: f.forecastQty,
        confidence: f.confidencePct,
        _colorIndex: i % BAR_COLORS.length,
    }));

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Demand Forecast</h1>
                <p className="text-sm text-slate-400 mt-1">
                    Generate 3-period moving average forecasts per SKU. Results feed directly into production planning.
                </p>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* ── Left Panel: Generate Form ─────────────────────────────── */}
                <div className="col-span-1 space-y-4">
                    {/* Generate Card */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp size={16} className="text-blue-400" />
                            <h2 className="text-sm font-semibold text-white">Generate Forecast</h2>
                        </div>

                        <form onSubmit={handleGenerate} className="space-y-4">
                            {/* Period Picker */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                                    Forecast Period
                                </label>
                                <input
                                    type="month"
                                    value={genPeriod}
                                    onChange={e => setGenPeriod(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            {/* Historical Data */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                        Historical Data (JSON)
                                    </label>
                                    <span title='Array of { sku, periods: [p1, p2, p3] }'>
                                        <Info size={13} className="text-slate-600 hover:text-slate-400 cursor-help transition-colors" />
                                    </span>
                                </div>
                                <textarea
                                    value={historicalData}
                                    onChange={e => setHistoricalData(e.target.value)}
                                    rows={12}
                                    spellCheck={false}
                                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-600 text-xs font-mono rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                />
                                <p className="text-xs text-slate-600 mt-1.5">
                                    Format: <code className="text-slate-500">{"[{ sku, periods: [p1,p2,p3] }]"}</code>
                                </p>
                            </div>

                            {/* Error */}
                            {genError && (
                                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-3 py-2.5">
                                    <AlertCircle size={13} className="shrink-0 mt-0.5" />
                                    {genError}
                                </div>
                            )}

                            {/* Success */}
                            {genSuccess && (
                                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg px-3 py-2.5">
                                    <CheckCircle2 size={13} className="shrink-0" />
                                    Forecast generated successfully!
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={generating}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                            >
                                {generating ? (
                                    <Loader2 size={15} className="animate-spin" />
                                ) : (
                                    <Play size={14} />
                                )}
                                {generating ? 'Generating...' : 'Generate Forecast'}
                            </button>
                        </form>
                    </div>

                    {/* Saved Periods */}
                    {savedPeriods.length > 0 && (
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                                Saved Periods
                            </p>
                            <div className="space-y-1">
                                {savedPeriods.map(p => (
                                    <SavedPeriodViewer
                                        key={p}
                                        period={p}
                                        onSelect={setViewPeriod}
                                        isSelected={viewPeriod === p}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Algorithm Info */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Algorithm
                        </p>
                        <div className="space-y-2 text-xs text-slate-400">
                            <div className="flex justify-between">
                                <span>Method</span>
                                <span className="text-white font-medium">3-Period Moving Average</span>
                            </div>
                            <div className="flex justify-between">
                                <span>3 periods → confidence</span>
                                <span className="text-emerald-400 font-medium">85%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>2 periods → confidence</span>
                                <span className="text-blue-400 font-medium">60%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>1 period → confidence</span>
                                <span className="text-amber-400 font-medium">40%</span>
                            </div>
                            <div className="pt-1 border-t border-slate-800 text-slate-500">
                                Formula: <code className="text-slate-400">⌈(p1+p2+p3) / 3⌉</code>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right Panel: Results ──────────────────────────────────── */}
                <div className="col-span-2 space-y-5">
                    {displayData.length === 0 ? (
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col items-center justify-center py-32 text-slate-500">
                            <BarChart2 size={48} className="mb-4 opacity-20" />
                            <p className="text-sm font-medium">No forecast data yet</p>
                            <p className="text-xs mt-1 text-center max-w-xs">
                                Fill in the historical data and click <strong className="text-slate-400">Generate Forecast</strong> to see results here
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Chart */}
                            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">
                                            Forecast Results
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Period: <span className="text-blue-400 font-medium">{viewPeriod || genPeriod}</span>
                                            {' · '}{displayData.length} SKUs
                                        </p>
                                    </div>
                                </div>

                                {loadingView ? (
                                    <div className="flex items-center justify-center h-48 gap-3 text-slate-400">
                                        <Loader2 size={18} className="animate-spin" />
                                        <span className="text-sm">Loading...</span>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart
                                            data={chartData}
                                            margin={{ top: 10, right: 10, left: -10, bottom: 40 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                            <XAxis
                                                dataKey="sku"
                                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                                angle={-35}
                                                textAnchor="end"
                                                interval={0}
                                            />
                                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1e293b',
                                                    border: '1px solid #334155',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    color: '#e2e8f0',
                                                }}
                                                formatter={(val) => [`${val} units`, 'Forecast Qty']}
                                            />
                                            <Legend
                                                wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                                            />
                                            <Bar dataKey="forecastQty" name="Forecast Qty" radius={[4, 4, 0, 0]}>
                                                {chartData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={BAR_COLORS[entry._colorIndex]}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>

                            {/* Results Table */}
                            <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-800">
                                    <h3 className="text-sm font-semibold text-white">SKU Breakdown</h3>
                                </div>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
                                            <th className="px-5 py-3 text-left">SKU</th>
                                            <th className="px-5 py-3 text-center">Forecast Qty</th>
                                            <th className="px-5 py-3 text-center">Confidence</th>
                                            <th className="px-5 py-3 text-center">Method</th>
                                            <th className="px-5 py-3 text-center">Confidence Bar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayData.map((f: ForecastResult, idx) => (
                                            <tr
                                                key={f._id ?? idx}
                                                className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
                                            >
                                                <td className="px-5 py-3.5">
                                                    <span
                                                        className="font-mono text-xs px-2 py-1 rounded border"
                                                        style={{
                                                            color: BAR_COLORS[idx % BAR_COLORS.length],
                                                            backgroundColor: `${BAR_COLORS[idx % BAR_COLORS.length]}18`,
                                                            borderColor: `${BAR_COLORS[idx % BAR_COLORS.length]}30`,
                                                        }}
                                                    >
                                                        {f.sku}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <span className="text-white font-bold text-base">
                                                        {f.forecastQty}
                                                    </span>
                                                    <span className="text-slate-500 text-xs ml-1">units</span>
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${confidenceBg(f.confidencePct)}`}
                                                    >
                                                        {f.confidencePct}%
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-center text-xs text-slate-400">
                                                    {f.method ?? 'Moving Average'}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2 justify-center">
                                                        <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${f.confidencePct >= 80
                                                                    ? 'bg-emerald-500'
                                                                    : f.confidencePct >= 55
                                                                        ? 'bg-blue-500'
                                                                        : 'bg-amber-400'
                                                                    }`}
                                                                style={{ width: `${f.confidencePct}%` }}
                                                            />
                                                        </div>
                                                        <span className={`text-xs w-8 text-right ${confidenceColor(f.confidencePct)}`}>
                                                            {f.confidencePct}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Table Footer */}
                                <div className="px-5 py-3 border-t border-slate-800 flex items-center gap-6 text-xs text-slate-500">
                                    <span>
                                        Total forecast:{' '}
                                        <strong className="text-white">
                                            {displayData.reduce((s, f) => s + f.forecastQty, 0)} units
                                        </strong>
                                    </span>
                                    <span>
                                        Avg confidence:{' '}
                                        <strong className={confidenceColor(
                                            Math.round(displayData.reduce((s, f) => s + f.confidencePct, 0) / displayData.length)
                                        )}>
                                            {Math.round(
                                                displayData.reduce((s, f) => s + f.confidencePct, 0) /
                                                displayData.length
                                            )}%
                                        </strong>
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}