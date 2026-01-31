"use client";
import React, { useState, useEffect } from 'react';
import AdminNavbar from './components/AdminNavbar';
import { motion } from 'framer-motion';
import { Users, MessageSquare, Activity, Zap, Shield, Heart } from 'lucide-react';
import Link from 'next/link';
import { socket } from '../lib/socket';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    feedback: 0,
    activeRooms: 0
  });

  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(socket.connected);

  const fetchStats = async () => {
    try {
      const [usersRes, feedbackRes, roomsRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/users'),
        fetch('http://localhost:5000/api/admin/feedback'),
        fetch('http://localhost:5000/api/active-conversations')
      ]);

      const users = await usersRes.json();
      const feedback = await feedbackRes.json();
      const rooms = await roomsRes.json();

      setStats({
        users: users.length,
        feedback: feedback.length,
        activeRooms: rooms.length
      });
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Socket Status
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // Dynamic Updates
    const handleUpdate = () => {
      console.log("🔄 Dashboard Refresh Triggered via Socket");
      fetchStats();
    };

    socket.on("new-feedback", handleUpdate);
    socket.on("feedback-deleted", handleUpdate);
    socket.on("admin-user-deleted", handleUpdate);
    socket.on("users-update", handleUpdate);
    socket.on("conversation-started", handleUpdate);
    socket.on("conversation-ended", handleUpdate);

    if (!socket.connected) socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new-feedback", handleUpdate);
      socket.off("feedback-deleted", handleUpdate);
      socket.off("admin-user-deleted", handleUpdate);
      socket.off("users-update", handleUpdate);
      socket.off("conversation-started", handleUpdate);
      socket.off("conversation-ended", handleUpdate);
    };
  }, []);

  const cards = [
    { name: 'Global Users', value: stats.users, icon: <Users size={24} className="text-indigo-400" />, href: '/users', label: 'Registered' },
    { name: 'Feedback Hub', value: stats.feedback, icon: <MessageSquare size={24} className="text-rose-400" />, href: '/feedback', label: 'Unread' },
    { name: 'Live Vibe Rooms', value: stats.activeRooms, icon: <Activity size={24} className="text-emerald-400" />, label: 'Active Now' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans selection:bg-indigo-500/30">
      <AdminNavbar />

      {/* Hero Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] blur-[120px] rounded-full bg-indigo-500/10" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] blur-[120px] rounded-full bg-rose-500/10" />
      </div>

      <main className="max-w-7xl mx-auto px-6 py-32 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <Zap className="text-indigo-500" size={20} />
            <span className="text-xs font-black uppercase tracking-[0.4em] text-white/30">System Overview</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-gradient-to-r from-white via-white to-white/20 bg-clip-text text-transparent">
            Admin <span className="text-indigo-500">Pulse</span> Dashboard
          </h1>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card, idx) => (
            <motion.div
              key={card.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="p-8 rounded-[2.5rem] border border-white/[0.05] bg-white/[0.02] backdrop-blur-3xl hover:border-white/10 transition-all group relative overflow-hidden"
            >
              <div className="flex justify-between items-start relative z-10">
                <div className={`p-4 rounded-2xl bg-white/5 transition-colors group-hover:bg-white/10`}>
                  {card.icon}
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">{card.label}</div>
                  <div className="text-4xl font-black tracking-tighter">
                    {loading ? "..." : card.value}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between items-end relative z-10">
                <h3 className="text-lg font-bold text-white/80">{card.name}</h3>
                {card.href && (
                  <Link href={card.href} className="text-xs font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">
                    Manage →
                  </Link>
                )}
              </div>

              {/* Decorative accent */}
              <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all translate-y-4 group-hover:translate-y-0" />
            </motion.div>
          ))}
        </div>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 p-12 rounded-[3.5rem] border border-white/[0.03] bg-gradient-to-tr from-indigo-500/5 to-rose-500/5 backdrop-blur-3xl flex flex-col md:flex-row items-center gap-12"
        >
          <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-600/30">
            <Shield className="text-white" size={40} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-black tracking-tight mb-4">Governance Protocol</h2>
            <p className="text-white/40 font-medium max-w-xl text-sm leading-relaxed">
              Respect user anonymity while maintaining platform safety. All administrative actions are logged for security transparency. Use the feedback hub to provide personal support via email.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 px-6 py-4 rounded-2xl border border-white/5">
            <Heart className="text-rose-500 fill-rose-500" size={20} />
            <span className="text-xs font-black uppercase tracking-widest text-white/60">Community First</span>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
