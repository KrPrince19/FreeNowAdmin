"use client";
import React, { useState, useEffect } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import { motion } from 'framer-motion';
import { Shield, Zap, Save, Crown, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { socket } from '../../lib/socket';

export default function AdminSettings() {
    const [config, setConfig] = useState({
        eliteEnabled: true,
        pingLimit: 5,
        toggleLimit: 3
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchConfig = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/config`);
            if (res.ok) {
                const data = await res.json();
                setConfig({
                    eliteEnabled: data.eliteEnabled,
                    pingLimit: data.pingLimit,
                    toggleLimit: data.toggleLimit
                });
            }
        } catch (err) {
            console.error("Failed to fetch config:", err);
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();

        const handleConfigUpdate = (newConfig) => {
            console.log("📝 Global config updated via socket:", newConfig);
            setConfig({
                eliteEnabled: newConfig.eliteEnabled,
                pingLimit: newConfig.pingLimit,
                toggleLimit: newConfig.toggleLimit
            });
        };

        socket.on("config-update", handleConfigUpdate);
        return () => socket.off("config-update", handleConfigUpdate);
    }, []);

    const handleToggleElite = async () => {
        const newValue = !config.eliteEnabled;
        // Optimistic update
        setConfig(prev => ({ ...prev, eliteEnabled: newValue }));

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eliteEnabled: newValue })
            });
            if (res.ok) {
                toast.success(`Elite Features ${newValue ? 'Enabled' : 'Disabled'} globally!`);
            } else {
                toast.error("Failed to update Elite status");
                setConfig(prev => ({ ...prev, eliteEnabled: !newValue })); // Revert
            }
        } catch (err) {
            console.error("Toggle error:", err);
            toast.error("Connection error");
            setConfig(prev => ({ ...prev, eliteEnabled: !newValue })); // Revert
        }
    };


    const handleSaveLimits = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pingLimit: config.pingLimit,
                    toggleLimit: config.toggleLimit
                })
            });
            if (res.ok) {
                toast.success("Usage limits updated and broadcasted!");
            } else {
                toast.error("Failed to save limits");
            }
        } catch (err) {
            console.error("Save error:", err);
            toast.error("Connection error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white font-sans selection:bg-indigo-500/30">
            <Toaster position="bottom-right" />
            <AdminNavbar />

            {/* Hero Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden text-indigo-500/5">
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] blur-[120px] rounded-full bg-indigo-500/10" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] blur-[120px] rounded-full bg-rose-500/10" />
            </div>

            <main className="max-w-4xl mx-auto px-6 py-32 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="text-indigo-500" size={20} />
                        <span className="text-xs font-black uppercase tracking-[0.4em] text-white/30">System Configuration</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                        App <span className="text-indigo-500 font-black">Elite</span> Controls
                    </h1>
                </motion.div>

                <div className="grid gap-8">
                    {/* Elite Toggle */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-8 rounded-[2.5rem] border border-white/[0.05] bg-white/[0.02] backdrop-blur-3xl flex items-center justify-between"
                    >
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center shadow-inner">
                                <Crown size={32} className={config.eliteEnabled ? "text-amber-500" : "text-white/20"} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-1 italic tracking-tight">Elite Features</h3>
                                <p className="text-white/40 text-sm font-medium">Toggle all premium badges, buttons, and bypasses globally.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleToggleElite}
                            className={`p-1 rounded-2xl transition-all duration-500 ${config.eliteEnabled ? 'bg-indigo-600' : 'bg-white/5'}`}
                        >
                            {config.eliteEnabled ? <ToggleRight size={48} /> : <ToggleLeft size={48} className="text-white/20" />}
                        </button>
                    </motion.div>


                    {/* Limits Configuration */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-10 rounded-[2.5rem] border border-white/[0.05] bg-white/[0.02] backdrop-blur-3xl"
                    >
                        <div className="flex items-center gap-3 mb-10">
                            <Zap className="text-indigo-500" size={20} />
                            <h3 className="text-lg font-black uppercase tracking-widest text-white/80">Daily Usage Limits</h3>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-12">
                            {/* Ping Limit */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <label className="text-xs font-black uppercase tracking-widest text-white/30">Vibe Pings</label>
                                    <span className="text-2xl font-black text-indigo-400">{config.pingLimit}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={config.pingLimit}
                                    onChange={(e) => setConfig({ ...config, pingLimit: e.target.value })}
                                    className="w-full accent-indigo-500 bg-white/5 h-2 rounded-full appearance-none cursor-pointer"
                                />
                                <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Max allowed per free user / day</p>
                            </div>

                            {/* Toggle Limit */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <label className="text-xs font-black uppercase tracking-widest text-white/30">Visibility Toggles</label>
                                    <span className="text-2xl font-black text-rose-400">{config.toggleLimit}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="20"
                                    value={config.toggleLimit}
                                    onChange={(e) => setConfig({ ...config, toggleLimit: e.target.value })}
                                    className="w-full accent-rose-500 bg-white/5 h-2 rounded-full appearance-none cursor-pointer"
                                />
                                <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Max toggles per free user / day</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Action Area */}
                    <div className="flex justify-end mt-4">
                        <button
                            onClick={handleSaveLimits}
                            disabled={saving}
                            className={`flex items-center gap-3 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-2xl ${saving ? 'bg-white/5 text-white/20' : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:-translate-y-1 shadow-indigo-600/20'
                                }`}
                        >
                            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            {saving ? "Deploying..." : "Update Limits"}
                        </button>
                    </div>
                </div>

                {/* Status Help */}
                <div className={`mt-12 p-6 rounded-2xl border flex items-center gap-4 transition-all duration-700 ${config.eliteEnabled ? 'bg-amber-500/5 border-amber-500/10' : 'bg-white/5 border-white/5 opacity-50'}`}>
                    <Crown size={20} className={config.eliteEnabled ? 'text-amber-500' : 'text-white/20'} />
                    <p className="text-xs font-medium text-white/40 leading-relaxed">
                        {config.eliteEnabled
                            ? "Elite Shield is ACTIVE. Users can purchase memberships and enjoy unlimited features."
                            : "Elite Shield is DISABLED. All users are subject to daily limits, and premium badges are hidden app-wide."
                        }
                    </p>
                </div>
            </main>
        </div>
    );
}
