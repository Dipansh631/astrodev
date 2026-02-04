import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const EventsManager = ({ user, isGod, isPresident }) => {
    const [events, setEvents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        registration_link: '',
        rewards: '',
        requirements: '',
        status: 'upcoming', // 'active' or 'upcoming'
        is_registration_open: true
    });
    const [editingEventId, setEditingEventId] = useState(null);

    const canHost = isGod || isPresident;

    useEffect(() => {
        fetchEvents();

        const sub = supabase.channel('public:events')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchEvents())
            .subscribe();

        return () => sub.unsubscribe();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error(error);
        } else {
            setEvents(data || []);
        }
        setLoading(false);
    };

    const handleHostClick = () => {
        setFormData({
            title: '',
            description: '',
            registration_link: '',
            rewards: '',
            requirements: '',
            status: 'upcoming',
            is_registration_open: true
        });
        setEditingEventId(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (event) => {
        setFormData({
            title: event.title,
            description: event.description || '',
            registration_link: event.registration_link || '',
            rewards: event.rewards || '',
            requirements: event.requirements || '',
            status: event.status,
            is_registration_open: event.is_registration_open
        });
        setEditingEventId(event.id);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // If setting to active, check if another event is active
        if (formData.status === 'active') {
            const currentActive = events.find(ev => ev.status === 'active' && ev.id !== editingEventId);
            if (currentActive) {
                const confirmSwitch = confirm(`"${currentActive.title}" is currently active. Do you want to replace it? The previous event will be moved to "upcoming" status.`);
                if (!confirmSwitch) return;

                // Downgrade previous active event
                await supabase.from('events').update({ status: 'upcoming' }).eq('id', currentActive.id);
            }
        }

        const payload = {
            ...formData,
            created_by: user.id
        };

        if (editingEventId) {
            const { error } = await supabase.from('events').update(payload).eq('id', editingEventId);
            if (error) alert(error.message);
            else setIsModalOpen(false);
        } else {
            const { error } = await supabase.from('events').insert([payload]);
            if (error) alert(error.message);
            else setIsModalOpen(false);
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!confirm("DANGER: This will permanently purge the mission data. Are you sure?")) return;
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (error) alert(error.message);
    };

    const handleCloseEvent = async (id) => {
        if (!confirm("Are you sure you want to close this event? It will be moved to history.")) return;
        const { error } = await supabase.from('events').update({ status: 'closed' }).eq('id', id);
        if (error) alert(error.message);
    };

    const handleToggleRegistration = async (id, currentStatus) => {
        const { error } = await supabase.from('events').update({ is_registration_open: !currentStatus }).eq('id', id);
        if (error) alert(error.message);
    };

    // Sort: Active first, then Upcoming, then Closed
    const sortedEvents = [...events].sort((a, b) => {
        const statusOrder = { 'active': 0, 'upcoming': 1, 'closed': 2 };
        return statusOrder[a.status] - statusOrder[b.status];
    });

    if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">Scanning event horizon...</div>;

    return (
        <div className="min-h-[60vh] text-white">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-thin tracking-[0.2em] uppercase text-white/90">Mission Control</h3>
                {canHost && (
                    <button
                        onClick={handleHostClick}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full font-bold uppercase tracking-wider text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all border border-white/10"
                    >
                        + Host Event
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-8">
                {sortedEvents.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
                        <p className="text-gray-500 italic">No missions currently deployed.</p>
                    </div>
                ) : (
                    sortedEvents.map(event => (
                        <div
                            key={event.id}
                            className={`relative p-8 rounded-3xl border transition-all duration-300 ${event.status === 'active'
                                ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.1)]'
                                : event.status === 'closed'
                                    ? 'bg-white/5 border-white/5 opacity-60'
                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                }`}
                        >
                            {/* Status Badge */}
                            <div className="absolute top-6 right-6 flex gap-2">
                                <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${event.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30 animate-pulse' :
                                    event.status === 'upcoming' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                        'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                    }`}>
                                    {event.status}
                                </span>
                                {event.is_registration_open ? (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                        Reg Open
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/30">
                                        Reg Closed
                                    </span>
                                )}
                            </div>

                            <div className="max-w-3xl">
                                <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                    {event.title}
                                </h2>
                                <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap mb-6">
                                    {event.description}
                                </p>

                                {(event.rewards || event.requirements) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 py-6 border-y border-white/5">
                                        {event.rewards && (
                                            <div>
                                                <h5 className="text-xs text-yellow-500 uppercase tracking-widest mb-2 font-bold">Rewards</h5>
                                                <p className="text-sm text-gray-400">{event.rewards}</p>
                                            </div>
                                        )}
                                        {event.requirements && (
                                            <div>
                                                <h5 className="text-xs text-red-400 uppercase tracking-widest mb-2 font-bold">Requirements</h5>
                                                <p className="text-sm text-gray-400">{event.requirements}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center gap-4">
                                    {event.registration_link && event.is_registration_open && (
                                        <a
                                            href={event.registration_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-8 py-3 bg-white text-black font-bold uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-colors shadow-lg"
                                        >
                                            Register Now
                                        </a>
                                    )}
                                    {event.registration_link && !event.is_registration_open && (
                                        <button disabled className="px-8 py-3 bg-white/10 text-gray-500 font-bold uppercase tracking-widest rounded-xl cursor-not-allowed">
                                            Registration Closed
                                        </button>
                                    )}

                                    {/* Admin Controls */}
                                    {canHost && (
                                        <div className="ml-auto flex gap-2">
                                            <button
                                                onClick={() => handleToggleRegistration(event.id, event.is_registration_open)}
                                                className="px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-xs hover:bg-white/10 text-gray-300"
                                            >
                                                {event.is_registration_open ? 'Close Reg' : 'Open Reg'}
                                            </button>
                                            <button
                                                onClick={() => handleEditClick(event)}
                                                className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs hover:bg-blue-500/20 text-blue-400"
                                            >
                                                Edit
                                            </button>
                                            {event.status !== 'closed' && (
                                                <button
                                                    onClick={() => handleCloseEvent(event.id)}
                                                    className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs hover:bg-yellow-500/20 text-yellow-400"
                                                >
                                                    Close Event
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteEvent(event.id)}
                                                className="px-4 py-2 bg-red-900/20 border border-red-500/20 rounded-lg text-xs hover:bg-red-500/40 text-red-500"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/20 rounded-2xl shadow-2xl flex flex-col max-h-[95vh]">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 z-10 text-gray-500 hover:text-white bg-[#0a0a0a] rounded-full p-1">✕</button>
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <h3 className="text-2xl font-bold text-white uppercase tracking-wider mb-6">
                                {editingEventId ? 'Edit Mission Protocol' : 'Initiate New Mission'}
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Event Title</label>
                                    <input
                                        required
                                        className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Operation Name..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Status</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="upcoming">Upcoming</option>
                                            <option value="active">Active (Live Now)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Registration Open?</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                            value={formData.is_registration_open}
                                            onChange={e => setFormData({ ...formData, is_registration_open: e.target.value === 'true' })}
                                        >
                                            <option value="true">Yes, Open</option>
                                            <option value="false">No, Closed</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Description</label>
                                    <textarea
                                        className="w-full h-32 bg-white/5 border border-white/20 rounded-lg p-3 text-white focus:border-blue-500 outline-none resize-none"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Briefing details..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Registration Link</label>
                                    <input
                                        type="url"
                                        className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        value={formData.registration_link}
                                        onChange={e => setFormData({ ...formData, registration_link: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Rewards (Optional)</label>
                                        <input
                                            className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                            value={formData.rewards}
                                            onChange={e => setFormData({ ...formData, rewards: e.target.value })}
                                            placeholder="Certificates, medals..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Requirements (Optional)</label>
                                        <input
                                            className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                            value={formData.requirements}
                                            onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                                            placeholder="Laptop, tools..."
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest rounded-lg hover:bg-gray-200 shadow-xl transition-all">
                                    {editingEventId ? 'Update Mission' : 'Launch Initiate'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventsManager;
