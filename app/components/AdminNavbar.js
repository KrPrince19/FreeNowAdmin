"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, MessageSquare, ExternalLink, Shield } from 'lucide-react';

export default function AdminNavbar() {
    const pathname = usePathname();

    const navItems = [
        { name: 'Overview', href: '/', icon: <LayoutDashboard size={20} /> },
        { name: 'Users', href: '/users', icon: <Users size={20} /> },
        { name: 'Feedback', href: '/feedback', icon: <MessageSquare size={20} /> },
        { name: 'Settings', href: '/settings', icon: <Shield size={20} /> },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/[0.05] h-20 flex items-center">
            <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3 pr-8 border-r border-white/10">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Shield className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-white font-black tracking-tight leading-none uppercase text-lg">FreeNow</h1>
                            <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">Admin Hub</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${pathname === item.href
                                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                                    : 'text-white/40 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {item.icon}
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>

                <Link
                    href="http://localhost:3001"
                    target="_blank"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                >
                    App <ExternalLink size={14} />
                </Link>
            </div>
        </nav>
    );
}
