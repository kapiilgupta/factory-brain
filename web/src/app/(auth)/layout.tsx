import React from 'react';
import Link from 'next/link';
import { Cpu, ShieldCheck } from 'lucide-react';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#090d16] flex flex-col justify-center items-center p-4 relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Header Branding */}
            <div className="mb-6 flex flex-col items-center text-center z-10">
                <Link href="/" className="flex items-center gap-3 mb-2 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 group-hover:scale-105 transition-transform">
                        <Cpu className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black text-white tracking-tight">Factory Brain</span>
                </Link>
                <p className="text-xs text-slate-400 font-medium">
                    Autonomous Manufacturing & Shop Floor Planning
                </p>
            </div>

            {/* Glassmorphic Auth Card Container */}
            <div className="w-full max-w-md bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl shadow-black/80 p-6 sm:p-8 z-10">
                {children}
            </div>

            {/* Footer Security Badge */}
            <div className="mt-8 flex items-center gap-2 text-xs text-slate-400 z-10">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Enterprise JWT & httpOnly Cookie Protection</span>
            </div>
        </div>
    );
}
