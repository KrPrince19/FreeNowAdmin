"use client";
import React, { useState, useEffect } from 'react';
import { socket } from '../../lib/socket';
import AdminNavbar from '../components/AdminNavbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, MessageCircle, Clock, Trash2, Send, Search, User, Copy, Check } from 'lucide-react';

export default function FeedbackPage() {
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [socketId, setSocketId] = useState(socket.id);

    const fetchFeedback = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/feedback');
            const data = await res.json();
            setFeedback(data);
        } catch (err) {
            console.error("Failed to fetch feedback:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedback();

        // Socket Status
        const onConnect = () => {
            const sid = socket.id;
            console.log("🛡️ FEEDBACK PAGE: Socket Connected", sid);
            setIsConnected(true);
            setSocketId(sid);
        };
        const onDisconnect = (reason) => {
            console.log("🛡️ FEEDBACK PAGE: Socket Disconnected", reason);
            setIsConnected(false);
            setSocketId(null);
        };

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        // Force connect if needed
        if (!socket.connected) socket.connect();

        // Socket Listeners for Real-time Updates
        socket.on("new-feedback", (item) => {
            console.log("📩 Socket: New Feedback Received", item);
            setFeedback(prev => [item, ...prev]);
        });

        socket.on("feedback-deleted", ({ id }) => {
            console.log("🗑️ Socket: Feedback Deleted", id);
            setFeedback(prev => prev.filter(item => item._id !== id));
        });

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("new-feedback");
            socket.off("feedback-deleted");
        };
    }, []);

    const handleDelete = async (id) => {
        setDeletingId(id);
        try {
            const res = await fetch(`http://localhost:5000/api/admin/feedback/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setFeedback(feedback.filter(item => item._id !== id));
            }
        } catch (err) {
            console.error("Failed to delete feedback:", err);
        } finally {
            setDeletingId(null);
        }
    };

    const filteredFeedback = feedback.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.message?.toLowerCase().includes(searchTerm.toLowerCase())
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
                            <h1 className="text-4xl font-black tracking-tight">Feedback Hub</h1>
                            <div className={`mt-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${isConnected
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse'
                                }`}>
                                {isConnected ? 'Live' : 'Disconnected'}
                                {socketId && <span className="opacity-40 border-l border-current pl-2 select-all font-mono lowercase">{socketId}</span>}
                            </div>
                        </div>
                        <p className="text-white/40 font-medium italic text-sm">Listening to the heartbeat of the community.</p>
                    </div>

                    <div className="relative group min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-rose-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search feedback..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3 pl-12 pr-6 outline-none focus:border-rose-500/50 focus:bg-white/5 transition-all font-bold text-sm"
                        />
                    </div>
                </motion.div>

                <div className="grid gap-6">
                    <AnimatePresence mode='popLayout'>
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="h-40 bg-white/[0.02] rounded-[2.5rem] animate-pulse" />
                            ))
                        ) : filteredFeedback.length > 0 ? (
                            filteredFeedback.map((item, idx) => (
                                <motion.div
                                    layout
                                    key={item._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group p-8 rounded-[2.5rem] border border-white/[0.03] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all flex flex-col md:flex-row gap-8 items-start"
                                >
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 group-hover:bg-rose-500/20 transition-all shrink-0">
                                        <MessageCircle size={32} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4">
                                            <div className="flex items-center gap-2">
                                                <User className="text-white/20" size={14} />
                                                <span className="text-lg font-black tracking-tight">{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Mail className="text-white/20" size={14} />
                                                <span className="text-sm font-bold text-white/40">{item.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-white/20">
                                                <Clock size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-white/60 font-medium leading-relaxed bg-white/[0.02] p-5 rounded-2xl border border-white/[0.03]">
                                            {item.message}
                                        </p>
                                    </div>

                                    <div className="flex md:flex-col gap-3 shrink-0">
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(item.email);
                                                setCopiedId(item._id);
                                                setTimeout(() => setCopiedId(null), 2000);
                                            }}
                                            title="Copy Email"
                                            className={`p-4 rounded-2xl border transition-all group/copy ${copiedId === item._id
                                                ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/20'
                                                : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white'
                                                }`}
                                        >
                                            {copiedId === item._id ? <Check size={20} /> : <Copy size={20} className="group-hover/copy:scale-110 transition-transform" />}
                                        </button>
                                        <a
                                            href={`mailto:${item.email}?subject=Regarding your FreeNow Feedback&body=Hi ${item.name},%0D%0A%0D%0AThank you for reaching out to FreeNow Support!%0D%0A%0D%0A--- Your Message ---%0D%0A${item.message}`}
                                            title="Reply via Email Client"
                                            className="p-4 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all shadow-lg shadow-indigo-500/5 group/btn"
                                        >
                                            <Send size={20} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                        </a>

                                        {confirmDeleteId === item._id ? (
                                            <div className="flex flex-col gap-2 bg-rose-500/10 p-2 rounded-2xl border border-rose-500/20">
                                                <button
                                                    onClick={() => handleDelete(item._id)}
                                                    disabled={deletingId === item._id}
                                                    className="px-4 py-2 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all"
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(null)}
                                                    className="px-4 py-2 bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmDeleteId(item._id)}
                                                title="Delete Feedback"
                                                className="p-4 rounded-2xl bg-white/5 text-white/20 border-white/5 hover:bg-rose-500/20 hover:text-rose-500 hover:border-rose-500/20 transition-all"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="py-20 text-center">
                                <p className="text-white/20 font-black uppercase tracking-[0.2em]">No feedback records found</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
