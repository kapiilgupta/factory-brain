'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2, Zap } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(identifier, password);
        } catch (err: any) {
            setError(err.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFillDemo = () => {
        setIdentifier('manager@factorybrain.io');
        setPassword('FactoryBrain2026!');
        setError('');
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Welcome Back</h2>
                <p className="text-xs text-slate-400 mt-1">Sign in to your factory operations dashboard</p>
            </div>

            {/* Quick Fill Demo Manager Button */}
            <button
                type="button"
                onClick={handleFillDemo}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold transition-all group"
            >
                <span className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span>Quick Fill Demo Manager Credentials</span>
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/20">Demo</span>
            </button>

            {/* Error Alert */}
            {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Email or Username
                    </label>
                    <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            required
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="manager@factorybrain.io"
                            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-10 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Password
                    </label>
                    <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-10 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Authenticating...</span>
                        </>
                    ) : (
                        <>
                            <span>Sign In to Dashboard</span>
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>

            {/* Switch to Register */}
            <div className="pt-4 border-t border-slate-800 text-center">
                <p className="text-xs text-slate-400">
                    Need a company account?{' '}
                    <Link href="/register" className="text-blue-400 hover:text-blue-300 font-semibold hover:underline">
                        Register Factory
                    </Link>
                </p>
            </div>
        </div>
    );
}
