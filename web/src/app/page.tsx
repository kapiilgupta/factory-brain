'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Layers,
  Calendar,
  Cpu,
  ShieldCheck,
  Zap,
  ArrowRight,
  ChevronRight,
  BarChart3,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* ── Navigation Header ────────────────────────────────────────────── */}
      <header className="border-b border-slate-800/80 bg-[#070b12]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Cpu size={20} />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-2">
                Factory Brain
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400">
                  v2.0
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
              >
                Go to Shop Floor Dashboard
                <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5"
                >
                  Operator Sign In
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                >
                  Start Plant Trial
                  <ArrowRight size={13} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        {/* Radial ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Autonomous Shop Floor Planning & Machine Sequencing Engine
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Run your production floor with{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              mathematical precision
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Eliminate scheduling bottlenecks, balance machine workloads, and prevent stockouts. Factory Brain unites moving average forecasting, net requirement derivation, and Jackson's EDD scheduling.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={user ? '/dashboard' : '/login'}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors shadow-xl shadow-blue-600/25"
            >
              Open Factory Dashboard
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-medium px-6 py-3 rounded-xl transition-colors"
            >
              Register Plant Facility
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
              <p className="text-2xl font-bold text-white">3-Period</p>
              <p className="text-xs text-slate-400 mt-0.5">Moving Average Forecast</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
              <p className="text-2xl font-bold text-emerald-400">Net MRP</p>
              <p className="text-xs text-slate-400 mt-0.5">Stock Shortfall Isolation</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
              <p className="text-2xl font-bold text-blue-400">EDD</p>
              <p className="text-xs text-slate-400 mt-0.5">Earliest Due Date Dispatch</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
              <p className="text-2xl font-bold text-indigo-400">15 Min</p>
              <p className="text-xs text-slate-400 mt-0.5">Automated Machine Buffers</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3-Step Pipeline Architecture ─────────────────────────────────── */}
      <section className="py-20 border-t border-slate-800/80 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">
              The Autonomous Pipeline
            </h2>
            <p className="text-3xl font-bold text-white">From Customer Demand to Machine Slots</p>
            <p className="text-sm text-slate-400 mt-3">
              Three tightly connected engines calculate raw requirements, prevent stockout alarms, and schedule physical factory lines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-5">
                  <TrendingUp size={22} />
                </div>
                <div className="text-xs font-mono text-blue-400 mb-1">STAGE 01</div>
                <h3 className="text-lg font-bold text-white mb-2">Demand Forecasting</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Computes next period expectations using a 3-period moving average with automated confidence grading (85% on 3 historical runs, 60% on 2).
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                <code>⌈(P1 + P2 + P3) / 3⌉</code>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
                  <Layers size={22} />
                </div>
                <div className="text-xs font-mono text-indigo-400 mb-1">STAGE 02</div>
                <h3 className="text-lg font-bold text-white mb-2">Net Requirement Planning</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Subtracts verified warehouse stock on hand from forecasted numbers. Any deficiency automatically synthesizes consolidated multi-size batch work orders.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                <code>Net = max(0, Forecast - Stock)</code>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
                  <Calendar size={22} />
                </div>
                <div className="text-xs font-mono text-emerald-400 mb-1">STAGE 03</div>
                <h3 className="text-lg font-bold text-white mb-2">EDD Machine Scheduling</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Applies Jackson's Earliest Due Date dispatch rule across operational lines, inserting 15-minute maintenance buffers and tracking shift utilization percentages.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                <code>Jackson's Rule + 15m Buffer</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-b from-transparent to-blue-950/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                Ready to orchestrate your factory floor?
              </h2>
              <p className="text-sm text-slate-400 mt-3 max-w-lg mx-auto">
                Sign in with demo credentials or register a custom production plant to run the planning suite.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={user ? '/dashboard' : '/login'}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/25"
                >
                  Enter Factory Brain Workspace
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/register"
                  className="w-full sm:w-auto text-xs text-slate-300 hover:text-white px-4 py-3"
                >
                  Create New Account →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Factory Brain. Autonomous Production Management Platform.</p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-slate-300">Sign In</Link>
            <Link href="/register" className="hover:text-slate-300">Register</Link>
            <Link href="/dashboard" className="hover:text-slate-300">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
