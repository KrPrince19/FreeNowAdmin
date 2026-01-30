"use client";
import React, { useState, useEffect } from 'react';
import { socket } from '../../lib/socket';
import AdminNavbar from '../components/AdminNavbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Mail, Search, Ban, AlertTriangle, RefreshCcw, X, Send } from 'lucide-react';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingEmail, setDeletingEmail] = useState(null);
    const [confirmDeleteEmail, setConfirmDeleteEmail] = useState(null);
    const [confirmSuspendEmail, setConfirmSuspendEmail] = useState(null);
    const [confirmResetEmail, setConfirmResetEmail] = useState(null);
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [socketId, setSocketId] = useState(socket.id);

    const [warningUser, setWarningUser] = useState(null);
    const [warningMsg, setWarningMsg] = useState('');
    const [processing, setProcessing] = useState(null);

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/users');
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();

        // Socket Status
        const onConnect = () => {
            console.log("🟢 Admin Socket Connected:", socket.id);
            setIsConnected(true);
            setSocketId(socket.id);
        };
        const onDisconnect = () => {
            console.log("🔴 Admin Socket Disconnected");
            setIsConnected(false);
            setSocketId(null);
        };

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        // Force connect if needed
        if (!socket.connected) socket.connect();

        // Real-time synchronization for users
        socket.on("admin-suspension", (data) => {
            console.log("🛡️ Socket: User Suspension Sync", data);
            setUsers(prev => prev.map(u =>
                u.email === data.email ? { ...u, isSuspended: data.isSuspended } : u
            ));
        });

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("admin-suspension");
        };
    }, []);

    const handleDelete = async (email) => {
        setDeletingEmail(email);
        try {
            const res = await fetch(`http://localhost:5000/api/admin/users/${email}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setUsers(users.filter(u => u.email !== email));
            }
        } catch (err) {
            console.error("Failed to delete user:", err);
        } finally {
            setDeletingEmail(null);
        }
    };

    const toggleSuspend = async (email) => {
        setConfirmSuspendEmail(null);
        setProcessing(`suspending:${email}`);
        try {
            const res = await fetch(`http://localhost:5000/api/admin/users/${email}/suspend`, { method: 'POST' });
            if (res.ok) {
                const { isSuspended } = await res.json();
                setUsers(users.map(u => u.email === email ? { ...u, isSuspended } : u));
            }
        } catch (err) {
            console.error("Suspension failed:", err);
        } finally {
            setProcessing(null);
        }
    };

    const handleWarn = async () => {
        if (!warningUser || !warningMsg) return;
        setProcessing(`warning:${warningUser.email}`);
        try {
            const res = await fetch(`http://localhost:5000/api/admin/users/${warningUser.email}/warn`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: warningMsg })
            });
            if (res.ok) {
                setUsers(users.map(u => u.email === warningUser.email ? { ...u, systemWarning: warningMsg } : u));
                setWarningUser(null);
                setWarningMsg('');
            }
        } catch (err) {
            console.error("Warning failed:", err);
        } finally {
            setProcessing(null);
        }
    };

    const resetStats = async (email) => {
        setConfirmResetEmail(null);
        setProcessing(`resetting:${email}`);
        try {
            const res = await fetch(`http://localhost:5000/api/admin/users/${email}/reset-stats`, { method: 'POST' });
            if (res.ok) {
                setUsers(users.map(u => u.email === email ? { ...u, totalRequests: 0, matchesMade: 0 } : u));
            }
        } catch (err) {
            console.error("Reset failed:", err);
        } finally {
            setProcessing(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white font-sans">
            <AdminNavbar />

            <main className="max-w-7xl mx-auto px-6 py-32">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12"
                >
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-black tracking-tight">User Directory</h1>
                            <div className={`mt-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${isConnected
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse'
                                }`}>
                                {isConnected ? 'Live' : 'Disconnected'}
                                {socketId && <span className="opacity-40 border-l border-current pl-2 select-all font-mono lowercase">{socketId}</span>}
                            </div>
                        </div>
                        <p className="text-white/40 font-medium italic text-sm">Managing the digital heart of FreeNow.</p>
                    </div>

                    <div className="relative group min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3 pl-12 pr-6 outline-none focus:border-indigo-500/50 focus:bg-white/5 transition-all font-bold text-sm"
                        />
                    </div>
                </motion.div>

                <div className="grid gap-6">
                    <AnimatePresence mode='popLayout'>
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-white/[0.02] rounded-3xl animate-pulse" />
                            ))
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map((user, idx) => (
                                <motion.div
                                    layout
                                    key={user.email}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`group flex flex-col lg:flex-row items-center gap-6 p-6 rounded-[2.5rem] border transition-all ${user.isSuspended
                                        ? 'bg-rose-500/[0.03] border-rose-500/20 shadow-lg shadow-rose-500/5'
                                        : 'bg-white/[0.02] border-white/[0.03] hover:bg-white/[0.04] hover:border-white/10'
                                        }`}
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg ${user.isSuspended
                                        ? 'bg-rose-500 text-white shadow-rose-500/10'
                                        : 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-indigo-500/10'
                                        }`}>
                                        {user.name?.[0] || 'U'}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-black tracking-tight truncate">{user.name}</h3>
                                            {user.isSuspended && <span className="px-2 py-0.5 rounded-md bg-rose-500 text-[10px] font-black uppercase tracking-widest">Suspended</span>}
                                            {user.systemWarning && <AlertTriangle size={14} className="text-amber-500" />}
                                        </div>
                                        <p className="text-white/30 text-xs font-medium truncate flex items-center gap-2">
                                            <Mail size={12} /> {user.email}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-10 text-center px-6">
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Sessions</div>
                                            <div className="text-lg font-black text-indigo-400">{user.totalRequests || 0}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Matches</div>
                                            <div className="text-lg font-black text-rose-400">{user.matchesMade || 0}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setWarningUser(user)}
                                            className="p-3 rounded-xl bg-white/5 text-white/20 hover:bg-amber-500/20 hover:text-amber-500 transition-all border border-transparent hover:border-amber-500/20"
                                            title="Send Warning"
                                        >
                                            <AlertTriangle size={18} />
                                        </button>

                                        <div className="flex items-center gap-2">
                                            {confirmResetEmail === user.email ? (
                                                <div className="flex items-center gap-1.5 bg-indigo-500/10 p-1.5 rounded-xl border border-indigo-500/20">
                                                    <button
                                                        onClick={() => resetStats(user.email)}
                                                        className="px-3 py-1.5 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg"
                                                    >
                                                        Reset
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmResetEmail(null)}
                                                        className="px-3 py-1.5 bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-widest rounded-lg"
                                                    >
                                                        No
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setConfirmResetEmail(user.email);
                                                        setConfirmSuspendEmail(null);
                                                    }}
                                                    className="p-3 rounded-xl bg-white/5 text-white/20 hover:bg-indigo-500/20 hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-500/20"
                                                    title="Reset Stats"
                                                >
                                                    <RefreshCcw size={18} />
                                                </button>
                                            )}

                                            {confirmSuspendEmail === user.email ? (
                                                <div className="flex items-center gap-1.5 bg-rose-500/10 p-1.5 rounded-xl border border-rose-500/20">
                                                    <button
                                                        onClick={() => toggleSuspend(user.email)}
                                                        className="px-3 py-1.5 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg"
                                                    >
                                                        {user.isSuspended ? "Unsuspend" : "Suspend"}
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmSuspendEmail(null)}
                                                        className="px-3 py-1.5 bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-widest rounded-lg"
                                                    >
                                                        No
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setConfirmSuspendEmail(user.email);
                                                        setConfirmResetEmail(null);
                                                    }}
                                                    disabled={processing === `suspending:${user.email}`}
                                                    className={`p-3 rounded-xl border transition-all ${user.isSuspended
                                                        ? 'bg-rose-500 text-white border-rose-600'
                                                        : 'bg-white/5 text-white/20 hover:bg-rose-500/20 hover:text-rose-500 border-transparent hover:border-rose-500/20'
                                                        }`}
                                                    title={user.isSuspended ? "Unsuspend Account" : "Suspend Account"}
                                                >
                                                    <Ban size={18} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="ml-2 border-l border-white/10 pl-4">
                                            {confirmDeleteEmail === user.email ? (
                                                <div className="flex items-center gap-2 bg-rose-500/10 p-2 rounded-2xl border border-rose-500/20">
                                                    <button
                                                        onClick={() => handleDelete(user.email)}
                                                        disabled={deletingEmail === user.email}
                                                        className="px-4 py-2 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDeleteEmail(null)}
                                                        className="px-4 py-2 bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmDeleteEmail(user.email)}
                                                    className="p-4 rounded-2xl bg-white/5 text-white/10 hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-500/20 transition-all"
                                                    title="Permanent Delete"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="py-20 text-center">
                                <p className="text-white/20 font-black uppercase tracking-[0.2em]">No users found matching your search</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <AnimatePresence>
                {warningUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0a0a0c]/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md bg-[#121216] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative"
                        >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-transparent opacity-50" />

                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight mb-1">Send Warning</h3>
                                    <p className="text-white/30 text-xs font-bold uppercase tracking-widest">To: {warningUser.name}</p>
                                </div>
                                <button onClick={() => setWarningUser(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                    <X size={20} className="text-white/20" />
                                </button>
                            </div>

                            <textarea
                                value={warningMsg}
                                onChange={(e) => setWarningMsg(e.target.value)}
                                placeholder="Ex: Please maintain a friendly vibe. Further violations will result in suspension."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 h-32 outline-none focus:border-amber-500/50 transition-all font-medium text-sm text-white/80 placeholder:text-white/20 resize-none"
                            />

                            <div className="mt-8 flex gap-3">
                                <button
                                    onClick={handleWarn}
                                    disabled={!warningMsg || processing === `warning:${warningUser.email}`}
                                    className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-black uppercase tracking-widest text-xs py-4 rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
                                >
                                    Confirm Send <Send size={14} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
