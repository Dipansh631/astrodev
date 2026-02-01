
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import SelectionMenu from './SelectionMenu';

const Dashboard = ({ user, onSignOut }) => {
    const [activeSection, setActiveSection] = useState('profile');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [viewingRank, setViewingRank] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // User Data State
    const [mockUsers, setMockUsers] = useState([
        { id: 1, email: 'dipanshumaheshwari73698@gmail.com', full_name: 'Dipanshu Maheshwari', rank: 'god' },
        { id: 2, email: 'aditi@astroclub.com', full_name: 'Aditi', rank: 'elite' },
        { id: 3, email: 'dhruv@astroclub.com', full_name: 'Dhruv', rank: 'legendary' },
        { id: 4, email: 'yash@astroclub.com', full_name: 'Yash Shakya', rank: 'epic' },
        { id: 5, email: 'sameeraj@astroclub.com', full_name: 'Sameeraj', rank: 'elite' },
        { id: 6, email: 'member@astroclub.com', full_name: 'New Member', rank: 'common' },
    ]);

    // Admin Requests State
    const [adminRequests, setAdminRequests] = useState([
        { id: 101, full_name: 'Nexus Voyager', email: 'nexus@void.com', type: 'Registration', status: 'Pending', date: '2026-02-01' },
        { id: 102, full_name: 'Karan', email: 'karan@galaxy.org', type: 'Admin Access', status: 'Pending', date: '2026-01-30' },
        { id: 103, full_name: 'Anya', email: 'anya@nebula.net', type: 'Registration', status: 'Pending', date: '2026-01-28' },
    ]);

    // Permissions
    const isPoseidon = user?.email === 'dipanshumaheshwari73698@gmail.com';
    // const isZeus = ... (Future implementation based on rank assignment)
    // const isApollo = ...

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data, error } = await supabase.from('profiles').select('*');
                if (data && data.length > 0) {
                    // Logic to merge real data would go here
                }
            } catch (e) {
                console.error("Error fetching users", e);
            }
        };
        fetchUsers();
    }, []);

    const sections = [
        { id: 'profile', label: 'My Profile' },
        // Admin Section - Only visible to Poseidon
        ...(isPoseidon ? [{ id: 'admin', label: 'Command Center' }] : []),
        { id: 'ranks', label: 'Rank Library' },
        { id: 'users', label: 'User Directory' },
        { id: 'photography', label: 'Astro Photography' },
        { id: 'events', label: 'Events & Activities' },
        { id: 'about', label: 'About Club' },
        { id: 'register', label: 'Registration' },
    ];

    const availableRanks = [
        {
            id: 'god',
            label: 'GOD',
            color: 'bg-gradient-to-r from-yellow-300 via-red-500 to-purple-600',
            text: 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-white to-yellow-200',
            border: 'border-yellow-500/50',
            shadow: 'shadow-yellow-500/40',
            desc: 'The Creator of the Cosmos.',
            req: 'Achieve total mastery and contribute to the code of the universe. No one can achieve this level except 3.',
            subCategories: [
                { name: 'Zeus', title: 'The Ruler', desc: 'Commander of the cosmic heavens', color: 'text-yellow-400' },
                { name: 'Apollo', title: 'The Visionary', desc: 'Bringer of light and truth', color: 'text-orange-400' },
                { name: 'Poseidon', title: 'The Shaper', desc: 'Master of the deep void', color: 'text-red-500' }
            ]
        },
        { id: 'elite', label: 'ELITE', color: 'bg-red-900/20', text: 'text-red-400', border: 'border-red-500/50', shadow: 'shadow-red-500/20', desc: 'The Vanguard of the Fleet.', req: 'Reserved for the President, Distinguished Alumni, and Authors of Research Papers.' },
        { id: 'legendary', label: 'LEGENDARY', color: 'bg-orange-800/20', text: 'text-orange-300', border: 'border-orange-500/50', shadow: 'shadow-orange-500/20', desc: 'A Myth Among Stars.', req: 'Held a leading post: Vice President, General Secretary, Tech/Finance/Content/Design/Web Head, or Telescope Handler.' },
        { id: 'epic', label: 'EPIC', color: 'bg-purple-900/20', text: 'text-purple-300', border: 'border-purple-500/50', shadow: 'shadow-purple-500/20', desc: 'Hero of the Void.', req: 'Awarded to Event Winners and the PR & Branding Team.' },
        { id: 'rare', label: 'RARE', color: 'bg-blue-900/20', text: 'text-blue-300', border: 'border-blue-500/50', shadow: 'shadow-blue-500/20', desc: 'Distinguished Explorer.', req: 'Participate actively in events or work under a leadership post.' },
        { id: 'common', label: 'COMMON', color: 'bg-gray-800/20', text: 'text-gray-300', border: 'border-gray-500/50', shadow: 'shadow-gray-500/20', desc: 'The Journey Begins.', req: 'Join the Astro Club.' },
        { id: 'degradation', label: 'DEGRADATION', color: 'bg-[#1a0f0f]', text: 'text-red-900 line-through opacity-70', border: 'border-red-900/30', shadow: 'shadow-black', desc: 'Fallen Star.', req: 'Violate the intergalactic treaty, violence, inactivity, or misconduct.' },
    ];

    const getUserRank = () => {
        if (user?.email === 'dipanshumaheshwari73698@gmail.com') {
            return availableRanks.find(r => r.id === 'god');
        }
        // Future: Fetch dynamic rank from user metadata or profile table
        return availableRanks.find(r => r.id === 'common');
    };

    const currentRank = getUserRank();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    const handleSectionClick = (id) => {
        setActiveSection(id);
        if (window.innerWidth < 768) {
            setIsMenuOpen(false);
        }
    }

    const handleApprove = (reqId) => {
        setAdminRequests(prev => prev.filter(r => r.id !== reqId));
        // Logic to add to users list or update DB
        alert(`Request ${reqId} Approved! (Mock Action)`);
    };

    const handleReject = (reqId) => {
        setAdminRequests(prev => prev.filter(r => r.id !== reqId));
    };

    const filteredUsers = mockUsers.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full h-full bg-transparent text-white font-sans overflow-hidden relative flex">

            {/* Toggle Button */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="fixed top-6 left-6 z-[200] p-2 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all text-2xl shadow-[0_0_15px_rgba(255,255,255,0.1)]" title={isMenuOpen ? "Close Menu" : "Open Menu"}>
                {isMenuOpen ? '✕' : '☰'}
            </button>

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 h-full w-80 z-[150] bg-white/0 backdrop-blur-xl border-r border-white/5 transform transition-transform duration-500 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col pt-28 pb-8`}>
                <div className="px-8 mb-8"><div className="text-xl font-light tracking-[0.2em] text-cyan-300 uppercase opacity-80">Content Table</div></div>
                <nav className="flex-1 w-full flex flex-col gap-6 px-6 overflow-y-auto no-scrollbar">
                    {sections.map((section) => (
                        <button key={section.id} onClick={() => handleSectionClick(section.id)} className={`w-full text-left px-6 py-2 rounded-xl text-lg tracking-wide font-light transition-all duration-300 ${activeSection === section.id ? 'text-white border-l-2 border-white pl-8 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'text-gray-400 hover:text-white hover:pl-8 border-l-2 border-transparent'}`}>
                            {section.label}
                        </button>
                    ))}
                </nav>
                <div className="w-full px-6 mt-auto">
                    <button onClick={handleSignOut} className="w-full py-3 flex items-center justify-center gap-3 border border-red-500/20 rounded-xl text-red-400/80 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/40 transition-all tracking-wider font-light">SIGN OUT</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 h-full relative overflow-y-auto no-scrollbar transition-all duration-500 ease-in-out pt-24 px-4 md:px-12 ${isMenuOpen ? 'ml-80' : 'ml-0'}`}>
                <div className={`max-w-6xl space-y-12 pb-20 transition-all duration-500 ${isMenuOpen ? 'mr-auto' : 'mx-auto'}`}>

                    <header className="flex flex-col md:flex-row items-center justify-between border-b border-white/5 pb-6">
                        <h2 className="text-3xl md:text-5xl font-thin text-white uppercase tracking-[0.2em] drop-shadow-xl glowing-text mb-4 md:mb-0 text-center md:text-left transition-all pl-12 md:pl-0">
                            {sections.find(s => s.id === activeSection)?.label}
                        </h2>
                        <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm">
                            {user?.user_metadata?.avatar_url && <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full border border-white/20" />}
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-medium text-cyan-200 tracking-wide">{user?.user_metadata?.full_name || user?.email}</p>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">{currentRank?.label || 'Explorer'}</p>
                            </div>
                        </div>
                    </header>

                    <div className="animate-fade-in-up">

                        {/* PROFILE SECTION */}
                        {activeSection === 'profile' && (
                            <div className="flex flex-col gap-12">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                    <div className="p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden group hover:border-white/20 transition-all duration-500">
                                        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none opacity-20 ${currentRank?.color.split(' ')[1]}`}></div>
                                        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                                            <div className={`w-36 h-36 rounded-full p-1 bg-gradient-to-tr shadow-2xl relative ${currentRank?.id === 'god' ? 'from-yellow-400 via-red-500 to-purple-600' : 'from-gray-700 to-gray-900'}`}>
                                                <div className="w-full h-full rounded-full overflow-hidden bg-black border-4 border-black relative">
                                                    {user?.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl">🧑‍🚀</div>}
                                                </div>
                                            </div>
                                            <div className="text-center md:text-left">
                                                <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">
                                                    {user?.email === 'dipanshumaheshwari73698@gmail.com' ? 'Dipanshu The Creator' : (user?.user_metadata?.full_name || 'Anonymous Traveler')}
                                                </h3>
                                                <p className="text-gray-400 font-mono text-sm mb-4">{user?.email}</p>
                                                {currentRank && (
                                                    <span className={`inline-flex items-center px-6 py-2 ${user?.email === 'dipanshumaheshwari73698@gmail.com' && currentRank.id === 'god' ? 'bg-red-900/20 border-red-500/50 shadow-red-500/40' : currentRank.color + ' border ' + currentRank.border + ' ' + currentRank.shadow} border rounded-full font-bold text-xs tracking-[0.2em] uppercase`}>
                                                        <span className={user?.email === 'dipanshumaheshwari73698@gmail.com' && currentRank.id === 'god' ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : currentRank.text}>
                                                            {user?.email === 'dipanshumaheshwari73698@gmail.com' && currentRank.id === 'god' ? 'POSEIDON' : currentRank.label}
                                                        </span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-10 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                                            <div className="p-4 rounded-2xl bg-black/20 text-center"><span className="block text-gray-400 text-xs uppercase tracking-widest mb-1">Joined</span><span className="text-lg font-mono text-white">{new Date(user?.created_at).toLocaleDateString()}</span></div>
                                            <div className="p-4 rounded-2xl bg-black/20 text-center"><span className="block text-gray-400 text-xs uppercase tracking-widest mb-1">Status</span><span className="text-lg font-mono text-green-400">Active</span></div>
                                        </div>
                                    </div>
                                    <div className="p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col justify-between hover:border-white/20 transition-all duration-500">
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3"><span className="w-2 h-8 bg-purple-500 rounded-full"></span>Space Log</h3>
                                            <div className="space-y-4 pl-4 border-l border-white/10 ml-1"><div className="relative pl-6 pb-2"><div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-gray-600 ring-4 ring-black"></div><p className="text-gray-400 italic">No recent missions recorded.</p></div></div>
                                        </div>
                                        <div className="mt-8">
                                            <h4 className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-6 border-b border-white/5 pb-2">Badge Collection</h4>
                                            <div className="flex gap-6">
                                                <div className="group relative"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-600/20 border border-yellow-500/30 flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 transition-all duration-300 cursor-help shadow-lg group-hover:shadow-yellow-500/20">🥚</div><div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] bg-black px-2 py-1 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">Early Bird</div></div>
                                                <div className="group relative"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-600/20 border border-purple-500/30 flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 transition-all duration-300 cursor-help shadow-lg group-hover:shadow-purple-500/20">🔭</div><div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] bg-black px-2 py-1 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">Stargazer</div></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ADMIN COMMAND CENTER */}
                        {activeSection === 'admin' && isPoseidon && (
                            <div className="space-y-8 min-h-[60vh]">
                                <div className="p-8 rounded-3xl bg-red-900/10 border border-red-500/30 backdrop-blur-md">
                                    <div className="flex items-center gap-4 mb-2">
                                        <span className="text-3xl">🔱</span>
                                        <div>
                                            <h3 className="text-2xl font-bold text-red-500 uppercase tracking-widest">Command Center</h3>
                                            <p className="text-red-400/60 text-sm">Poseidon's Restricted Access Area</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Requests Panel */}
                                <div>
                                    <h4 className="text-xl font-light text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                                        <span className="w-1.5 h-6 bg-red-500"></span> Pending Requests
                                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded ml-2">{adminRequests.length}</span>
                                    </h4>

                                    {adminRequests.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {adminRequests.map(req => (
                                                <div key={req.id} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-all group">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">{req.type}</div>
                                                            <h5 className="text-xl font-bold text-white">{req.full_name}</h5>
                                                            <p className="text-xs text-gray-500 font-mono mt-1">{req.email}</p>
                                                        </div>
                                                        <div className="text-[10px] text-gray-600 bg-gray-900 px-2 py-1 rounded">{req.date}</div>
                                                    </div>

                                                    <div className="flex gap-2 mt-6">
                                                        <button
                                                            onClick={() => handleApprove(req.id)}
                                                            className="flex-1 py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/20 transition-all font-bold text-xs uppercase tracking-wider"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(req.id)}
                                                            className="flex-1 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-all font-bold text-xs uppercase tracking-wider"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-12 rounded-3xl bg-white/5 border border-white/5 text-center flex flex-col items-center justify-center opacity-60">
                                            <span className="text-4xl mb-4 grayscale">✅</span>
                                            <p className="text-lg font-light">All clear, My Lord.</p>
                                            <p className="text-sm text-gray-500">No pending requests in the queue.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeSection === 'ranks' && (
                            <div className="p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md min-h-[60vh]">
                                <h3 className="text-2xl font-light uppercase tracking-widest text-white mb-8 border-b border-white/5 pb-4 flex justify-between items-center"><span>Rank Library</span><span className="text-xs text-gray-500 normal-case tracking-normal">Explore the hierarchy</span></h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <div className="flex flex-wrap content-start gap-4">{availableRanks.map((rank) => (<button key={rank.id} onClick={() => setViewingRank(rank)} className={`px-6 py-3 rounded-full border text-sm font-bold tracking-widest uppercase transition-all duration-300 ${viewingRank?.id === rank.id ? `${rank.color} ${rank.border} shadow-[0_0_15px_rgba(255,255,255,0.2)] scale-105 ring-2 ring-white/20` : 'bg-transparent border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300'}`}><span className={viewingRank?.id === rank.id ? rank.text : ''}>{rank.label}</span></button>))}</div>
                                    <div className="relative min-h-[300px] flex items-center justify-center">
                                        {viewingRank ? (
                                            <div className="w-full h-full p-8 bg-black/40 rounded-3xl border border-white/10 animate-fade-in-up flex flex-col items-center text-center relative overflow-hidden">
                                                <div className={`absolute inset-0 opacity-10 ${viewingRank.color} blur-3xl`}></div>
                                                <div className="relative z-10">
                                                    <div className="mb-6"><h4 className={`text-6xl font-black ${viewingRank.text} drop-shadow-2xl mb-2`}>{viewingRank.label}</h4><div className="w-24 h-1 bg-white/20 rounded-full mx-auto"></div></div>
                                                    <p className="text-gray-300 mb-10 italic font-light text-xl">"{viewingRank.desc}"</p>
                                                    {viewingRank.subCategories && (
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full px-4">
                                                            {viewingRank.subCategories.map((sub) => (
                                                                <div key={sub.name} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center hover:bg-white/10 transition-colors">
                                                                    <span className={`text-xl font-bold ${sub.color} mb-1 uppercase tracking-wider`}>{sub.name}</span>
                                                                    <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">{sub.title}</span>
                                                                    <span className="text-xs text-gray-500 italic max-w-[150px]">"{sub.desc}"</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="w-full bg-white/5 p-6 rounded-2xl border border-white/5 backdrop-blur-sm"><span className="text-xs uppercase text-blue-300 tracking-[0.2em] block mb-3 font-bold">Acquisition Criteria</span><p className="text-white font-medium text-lg leading-relaxed">{viewingRank.req}</p></div>
                                                </div>
                                            </div>
                                        ) : (<div className="text-center text-gray-500 flex flex-col items-center"><span className="text-4xl mb-4 opacity-30">❖</span><p className="font-light tracking-wide">Select a rank tag to reveal its secrets.</p></div>)}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'users' && (
                            <div className="space-y-8 min-h-[60vh]">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                                    <div><h3 className="text-2xl font-light uppercase tracking-widest text-white mb-2">User Directory</h3><p className="text-gray-400 text-sm">Search the galaxy for fellow explorers</p></div>
                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                        <div className="relative w-full md:w-64">
                                            <input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-6 py-3 rounded-full bg-black/30 border border-white/10 text-white focus:outline-none focus:border-white/30 transition-all pl-12" />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                                        </div>
                                        <button className="px-6 py-3 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 transition-all font-bold text-sm tracking-wider uppercase">Search</button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {filteredUsers.map((u) => {
                                        const uRank = u.email === 'dipanshumaheshwari73698@gmail.com' ? availableRanks.find(r => r.id === 'god') : availableRanks.find(r => r.id === u.rank) || availableRanks.find(r => r.id === 'common');
                                        const isPoseidon = u.email === 'dipanshumaheshwari73698@gmail.com';
                                        return (
                                            <div key={u.id} className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all flex flex-col md:flex-row items-center justify-between gap-6 group">
                                                <div className="flex items-center gap-6 w-full md:w-auto">
                                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-white/10 flex items-center justify-center text-xl overflow-hidden relative"><div className="absolute inset-0 bg-white/5"></div>{u.email === 'dipanshumaheshwari73698@gmail.com' ? '👑' : '🧑‍🚀'}</div>
                                                    <div><h4 className="font-bold text-white tracking-wide text-lg">{u.full_name}</h4><p className="text-xs text-gray-500 tracking-wider font-mono">{u.email}</p></div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-[0.2em] border ${isPoseidon ? 'bg-red-900/20 text-red-500 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : `${uRank.color} ${uRank.border}`}`}>
                                                        {isPoseidon ? 'POSEIDON' : uRank.label}
                                                    </span>
                                                    <div className={`w-2 h-2 rounded-full ${isPoseidon ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeSection === 'photography' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[1, 2, 3, 4, 5, 6].map((i) => (<div key={i} className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border border-white/10 hover:border-white/30 transition-all duration-500"><div className="absolute inset-0 bg-gray-900/50 animate-pulse"></div><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-300"><h4 className="font-bold text-lg text-white">Nebula Capture #{i}</h4><p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Captured by AstroClub</p></div></div>))}</div>
                        )}

                        {activeSection === 'about' && (
                            <div className="space-y-16">
                                <div className="p-10 rounded-3xl bg-gradient-to-br from-blue-900/10 to-purple-900/10 border border-white/10 backdrop-blur-md"><h3 className="text-3xl font-thin mb-6 text-blue-200 uppercase tracking-widest">Our Mission</h3><p className="text-gray-300 leading-loose text-xl font-light">To explore the cosmos from our backyard, fostering a community of dreamers, thinkers, and explorers who look up and wonder. We bridge the gap between amateur curiosity and professional astronomy through observation, education, and innovation.</p></div>
                                <div><h3 className="text-xl font-bold mb-8 text-white uppercase tracking-widest border-l-4 border-purple-500 pl-4">Crew & Alumni</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{[{ name: "Sameeraj", role: "Alumni", color: "border-red-500/20 bg-red-500/5" }, { name: "Aditi", role: "President", color: "border-yellow-500/20 bg-yellow-500/5" }, { name: "Dhruv", role: "Vice President", color: "border-orange-500/20 bg-orange-500/5" }, { name: "Dipanshu", role: "Web Head", color: "border-blue-500/20 bg-blue-500/5" }].map((member, idx) => (<div key={idx} className={`p-6 rounded-2xl backdrop-blur-sm border ${member.color} hover:bg-white/5 transition-all group flex flex-col items-center text-center`}><div className="w-20 h-20 rounded-full bg-white/10 mb-4 overflow-hidden border border-white/10 group-hover:scale-110 transition-transform duration-300"></div><h4 className="text-lg font-bold text-white mb-1">{member.name}</h4><p className="text-xs text-gray-400 uppercase tracking-widest">{member.role}</p></div>))}</div></div>
                            </div>
                        )}

                        {activeSection === 'events' && (
                            <div className="space-y-12">
                                <div className="relative p-[1px] rounded-3xl bg-gradient-to-r from-emerald-400/50 to-cyan-500/50 overflow-hidden group"><div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-cyan-500/20 blur-xl group-hover:opacity-100 transition-opacity opacity-50"></div><div className="relative bg-[#050505]/90 rounded-3xl p-8 backdrop-blur-xl h-full"><div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8"><div><div className="flex items-center gap-3 mb-4"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span><span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Active Now</span></div><h3 className="text-3xl font-bold text-white mb-4">Star Gazing Night: Orion</h3><p className="text-gray-400 max-w-2xl text-lg font-light leading-relaxed">Join us for a clear night observation of the Orion Nebula. Telescopes provided. Beginners welcome!</p></div><a href="https://forms.google.com" target="_blank" rel="noreferrer" className="px-10 py-4 bg-white text-black font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-gray-100 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] whitespace-nowrap">Register Now</a></div></div></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="p-10 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all hover:bg-white/10"><span className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4 block">Upcoming</span><h4 className="text-2xl font-bold mb-3 text-white">Solar Workshop</h4><p className="text-gray-400 text-sm leading-relaxed">Learn safe solar viewing techniques with our special filters.</p></div><div className="p-10 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all hover:bg-white/10"><span className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4 block">Planned</span><h4 className="text-2xl font-bold mb-3 text-white">Astro Quiz</h4><p className="text-gray-400 text-sm leading-relaxed">Test your knowledge against other colleges in the region.</p></div></div>
                            </div>
                        )}

                        {activeSection === 'register' && (
                            <div className="flex flex-col items-center justify-center min-h-[50vh]"><h3 className="text-3xl font-thin mb-12 tracking-[0.3em] text-center text-white/80 uppercase">Select Your Path</h3><SelectionMenu /></div>
                        )}
                    </div>
                </div>
            </main>

            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; } .glowing-text { text-shadow: 0 0 20px rgba(255,255,255,0.3); }`}</style>
        </div>
    );
};

export default Dashboard;
