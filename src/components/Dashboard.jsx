import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import SelectionMenu from './SelectionMenu';
import { SQL_SETUP_SCRIPT, SQL_FIX_CONSTRAINT } from '../lib/databaseSetup';

const Dashboard = ({ user, onSignOut }) => {
    // Initialize activeSection from session storage if available
    const [activeSection, setActiveSection] = useState(() => {
        return sessionStorage.getItem('dashboardSection') || 'profile';
    });
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [viewingRank, setViewingRank] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Data State (Replaces mockUsers)
    const [users, setUsers] = useState([]);
    const [adminRequests, setAdminRequests] = useState([]);

    // Application Wizard State
    const [isAppModalOpen, setIsAppModalOpen] = useState(false);
    const [appStep, setAppStep] = useState(1); // 1: Have Role?, 2: Form
    const [appData, setAppData] = useState({});

    // System State
    const [setupRequired, setSetupRequired] = useState(false);
    const [constraintError, setConstraintError] = useState(false);

    // --------------------------------------------------------------------------------
    // 2. Rank Definitions & Constants
    // --------------------------------------------------------------------------------
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

    const ROLE_OPTIONS = [
        "President", "Distinguished Alumni", "Author of Research Paper",
        "Vice President", "General Secretary",
        "Tech", "Finance", "Content", "Design", "Webdev", "Telescope Handler", "PR & Branding"
    ];

    const DEPARTMENTS = [
        "Tech", "Finance", "Content", "Design", "Webdev", "Telescope Handler", "PR & Branding"
    ];

    // Derived Permissions helpers must be after Rank Defs or inside component
    const getUserRank = (targetUser = user) => {
        const foundUser = users.find(u => u.email === targetUser?.email);
        const rankId = foundUser?.rank || 'common';
        const rankObj = availableRanks.find(r => r.id === rankId) || availableRanks.find(r => r.id === 'common');
        return { ...rankObj, sub_rank: foundUser?.sub_rank };
    };

    const currentRank = getUserRank(user);
    const isPoseidon = user?.email === 'dipanshumaheshwari73698@gmail.com';
    const isGod = currentRank?.id === 'god';
    const PROJECT_ID = 'zcrqbyszzadtdghcxpvl';

    // --------------------------------------------------------------------------------
    // 1. Fetch Data on Mount
    // --------------------------------------------------------------------------------
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            const POSEIDON_EMAIL = 'dipanshumaheshwari73698@gmail.com';
            const isPoseidonUser = user.email === POSEIDON_EMAIL;
            const updates = { id: user.id, email: user.email, full_name: user.user_metadata?.full_name || 'Anonymous', avatar_url: user.user_metadata?.avatar_url || '' };

            // A. Upsert Profile
            const { data: currentProfile, error: profileFetchError } = await supabase.from('profiles').select('*').eq('id', user.id).single();

            const isTableMissingError = (err) => err && (err.code === '42P01' || err.code === 'PGRST205' || err.message?.includes('404') || err.message?.includes('Could not find the table'));
            if (isTableMissingError(profileFetchError)) { setSetupRequired(true); return; }

            if (!currentProfile) {
                const { error: insertError } = await supabase.from('profiles').insert([{ ...updates, rank: isPoseidonUser ? 'god' : 'common', sub_rank: isPoseidonUser ? 'Poseidon' : null }]);
                if (isTableMissingError(insertError)) { setSetupRequired(true); return; }
            } else {
                if (isPoseidonUser && (currentProfile.rank !== 'god' || currentProfile.sub_rank !== 'Poseidon')) {
                    await supabase.from('profiles').update({ rank: 'god', sub_rank: 'Poseidon' }).eq('id', user.id);
                }
                if (currentProfile.avatar_url !== updates.avatar_url || currentProfile.full_name !== updates.full_name) {
                    await supabase.from('profiles').update({ avatar_url: updates.avatar_url, full_name: updates.full_name }).eq('id', user.id);
                }
            }

            // B. Fetch All Users
            const { data: allProfiles } = await supabase.from('profiles').select('*');
            if (allProfiles) setUsers(allProfiles);

            // C. Fetch Admin Requests
            // Use RLS to filter visibility automatically
            const { data: requests, error: reqError } = await supabase.from('admin_requests').select('*').order('created_at', { ascending: false });
            if (!reqError) setAdminRequests(requests || []);
        };

        fetchData();

        if (!setupRequired) {
            const profileSub = supabase.channel('public:profiles').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData()).subscribe();
            const requestSub = supabase.channel('public:admin_requests').on('postgres_changes', { event: '*', schema: 'public', table: 'admin_requests' }, () => fetchData()).subscribe();
            return () => { supabase.removeChannel(profileSub); supabase.removeChannel(requestSub); };
        }
    }, [user, setupRequired]);

    const refreshData = () => { window.location.reload(); };

    // --------------------------------------------------------------------------------
    // Setup Screen (Skipped strict DB check for brevity, kept mainly for missing table)
    // --------------------------------------------------------------------------------
    if (setupRequired || constraintError) {
        // ... (Keep existing setup component logic fully)
        const scriptToShow = constraintError ? SQL_FIX_CONSTRAINT : SQL_SETUP_SCRIPT;
        return (
            <div className="w-full h-full min-h-screen bg-black flex items-center justify-center p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-red-900/10 pointer-events-none"></div>
                <div className="max-w-4xl w-full bg-[#0a0a0a] border border-red-500/30 rounded-3xl p-10 shadow-2xl relative z-10 flex flex-col gap-6">
                    <span className="text-4xl">⚠️ System Failure</span>
                    <p>Database schema missing. Please run the SQL setup script.</p>
                    <div className="bg-white/5 p-4 rounded text-xs overflow-auto h-48">{scriptToShow}</div>
                </div>
            </div>
        );
    }

    const handleSignOut = async () => { sessionStorage.removeItem('dashboardSection'); await supabase.auth.signOut(); };
    const changeSection = (id) => { setActiveSection(id); sessionStorage.setItem('dashboardSection', id); }
    const handleSectionClick = (id) => {
        if (id === 'admin' && !isGod) { alert("You are not a god please live in to your earth"); return; }
        changeSection(id); if (window.innerWidth < 768) setIsMenuOpen(false);
    }

    // --------------------------------------------------------------------------------
    // Application Wizard Logic
    // --------------------------------------------------------------------------------
    const handleRoleApplyStart = () => {
        setAppStep(1);
        setAppData({});
        setIsAppModalOpen(true);
    };

    const handleAppStep1 = (hasRole) => {
        setAppData(prev => ({ ...prev, hasRole }));
        setAppStep(2);
    };

    const handleAppSubmit = async () => {
        // Construct Payload
        const isVerification = appData.hasRole;
        const type = isVerification ? "Role Verification" : "Job Application";
        const roleTitle = appData.position || (DEPARTMENTS.includes(appData.selectedRole) ? 'Member' : 'Officer');
        // If user selected a Department in verification, they specify Head/Member.
        // If user selected a Core Role (Pres), position is Officer.

        const payload = {
            user_id: user.id,
            email: user.email,
            full_name: user?.user_metadata?.full_name || 'Anonymous',
            type: type,
            status: 'Pending',
            department: appData.selectedRole, // Or mapped department
            role_title: appData.roleTitle || roleTitle,
            request_data: appData // Store full form data
        };

        const { error } = await supabase.from('admin_requests').insert([payload]);

        if (error) {
            console.error(error);
            alert("Failed to submit application: " + error.message);
        } else {
            alert(isVerification ?
                "Verification request sent to Zeus Command Center." :
                `Application submitted to ${appData.selectedRole} Head.`
            );
            setIsAppModalOpen(false);
        }
    };

    // --------------------------------------------------------------------------------
    // Admin Handlers
    // --------------------------------------------------------------------------------
    const handleAdminRegisterRequest = async () => {
        // ... (Keep existing logic)
        const { error } = await supabase.from('admin_requests').insert([{
            user_id: user.id, email: user.email, full_name: user.user_metadata?.full_name || 'Anonymous',
            type: 'Admin Access', status: 'Pending'
        }]);
        if (error) alert("Failed: " + error.message);
        else { alert("Request sent to Poseidon."); setActiveSection('profile'); }
    };

    const handleApprove = async (reqId, subRank = 'Zeus') => {
        // This is primarily for Admin Access requests, but can be adapted
        const req = adminRequests.find(r => r.id === reqId);
        if (!req) return;

        // If it's Role Verification or Job App, we approve slightly differently
        if (req.type === 'Admin Access') {
            // ... existing logic
            const { error } = await supabase.from('admin_requests').update({ status: 'Approved' }).eq('id', reqId);
            if (!error) await supabase.from('profiles').update({ rank: 'god', sub_rank: subRank }).eq('id', req.user_id);
            setAdminRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'Approved' } : r));
        } else {
            // Role Approval
            const { error } = await supabase.from('admin_requests').update({ status: 'Approved' }).eq('id', reqId);
            if (!error) {
                // Determine new rank based on role
                // If 'Head' -> Legendary. If 'Member' -> Rare. If 'President' -> Elite.
                let newRank = 'common';
                if (req.role_title === 'Head' || req.department === 'Vice President' || req.department === 'General Secretary') newRank = 'legendary';
                else if (req.department === 'President' || req.department === 'Distinguished Alumni') newRank = 'elite';
                else if (req.role_title === 'Member') newRank = 'rare';

                await supabase.from('profiles').update({
                    rank: newRank,
                    department: req.department,
                    role_title: req.role_title
                }).eq('id', req.user_id);

                alert(`Application Approved. User set to ${newRank}.`);
                setAdminRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'Approved' } : r));
            }
        }
    };

    const handleReject = async (reqId) => {
        const { error } = await supabase.from('admin_requests').update({ status: 'Rejected' }).eq('id', reqId);
        if (!error) setAdminRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'Rejected' } : r));
    };

    const handleAssignTag = async (userId, newRankId, subRank = null) => {
        if (!isGod) { alert("Only Gods can assign tags."); return; }
        const targetUser = users.find(u => u.id === userId);
        if (targetUser?.email === 'dipanshumaheshwari73698@gmail.com') { alert("Thou shall not alter the Creator."); return; }
        const { error } = await supabase.from('profiles').update({ rank: newRankId, sub_rank: subRank }).eq('id', userId);
        if (error) alert("Failed."); else {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, rank: newRankId, sub_rank: subRank } : u));
        }
    };

    const filteredUsers = users.filter(u => u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const pendingRequests = adminRequests.filter(r => r.status === 'Pending');

    // UI RENDER
    return (
        <div className="w-full h-full bg-transparent text-white font-sans overflow-hidden relative flex">
            {/* Modal for Application */}
            {isAppModalOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#0a0a0a] border border-white/20 p-8 rounded-2xl max-w-md w-full shadow-2xl relative">
                        <button onClick={() => setIsAppModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>

                        {appStep === 1 && (
                            <div className="text-center space-y-6">
                                <h3 className="text-2xl font-bold text-white uppercase tracking-wider">Role Verification</h3>
                                <p className="text-gray-400">Do you currently hold a position in the Astro Club?</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => handleAppStep1(true)} className="py-4 bg-green-600/20 border border-green-500/50 rounded-xl hover:bg-green-600/40 font-bold text-green-400">Yes, I do</button>
                                    <button onClick={() => handleAppStep1(false)} className="py-4 bg-blue-600/20 border border-blue-500/50 rounded-xl hover:bg-blue-600/40 font-bold text-blue-400">No, I want to apply</button>
                                </div>
                            </div>
                        )}

                        {appStep === 2 && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
                                    {appData.hasRole ? "Verify Your Position" : "Apply for Membership"}
                                </h3>

                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Select Department / Role</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        onChange={(e) => setAppData({ ...appData, selectedRole: e.target.value })}
                                    >
                                        <option value="">-- Select --</option>
                                        {appData.hasRole
                                            ? ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)
                                            : DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)
                                        }
                                    </select>
                                </div>

                                {DEPARTMENTS.includes(appData.selectedRole) && (
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Your Position</label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="pos" value="Head" onChange={(e) => setAppData({ ...appData, roleTitle: 'Head' })} />
                                                <span className="text-sm">Head</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="pos" value="Member" onChange={(e) => setAppData({ ...appData, roleTitle: 'Member' })} />
                                                <span className="text-sm">Member</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleAppSubmit}
                                    disabled={!appData.selectedRole}
                                    className="w-full py-3 bg-white text-black font-bold uppercase tracking-widest rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Submit Application
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="fixed top-6 left-6 z-[200] p-2 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all text-2xl shadow-[0_0_15px_rgba(255,255,255,0.1)]">{isMenuOpen ? '✕' : '☰'}</button>

            <aside className={`fixed top-0 left-0 h-full w-80 z-[150] bg-white/0 backdrop-blur-xl border-r border-white/5 transform transition-transform duration-500 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col pt-28 pb-8`}>
                <div className="px-8 mb-8"><div className="text-xl font-light tracking-[0.2em] text-cyan-300 uppercase opacity-80">Content Table</div></div>
                <nav className="flex-1 w-full flex flex-col gap-6 px-6 overflow-y-auto no-scrollbar">
                    {[
                        { id: 'profile', label: 'My Profile' },
                        { id: 'admin', label: 'Command Center' },
                        { id: 'ranks', label: 'Rank Library' },
                        { id: 'users', label: 'User Directory' },
                        { id: 'photography', label: 'Astro Photography' },
                        { id: 'events', label: 'Events & Activities' },
                        { id: 'about', label: 'About Club' },
                        { id: 'register', label: 'Registration' },
                    ].map((section) => (
                        <button key={section.id} onClick={() => handleSectionClick(section.id)} className={`w-full text-left px-6 py-2 rounded-xl text-lg tracking-wide font-light transition-all duration-300 ${activeSection === section.id ? 'text-white border-l-2 border-white pl-8 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'text-gray-400 hover:text-white hover:pl-8 border-l-2 border-transparent'} flex items-center justify-between group`}>
                            <span>{section.label}</span>
                            {section.id === 'admin' && !isGod && <span className="text-sm opacity-50 group-hover:opacity-100 transition-opacity">🔒</span>}
                        </button>
                    ))}
                </nav>
                <div className="w-full px-6 mt-auto"><button onClick={handleSignOut} className="w-full py-3 flex items-center justify-center gap-3 border border-red-500/20 rounded-xl text-red-400/80 hover:bg-red-500/10 tracking-wider">SIGN OUT</button></div>
            </aside>

            <main className={`flex-1 h-full relative overflow-y-auto no-scrollbar transition-all duration-500 ease-in-out pt-24 px-4 md:px-12 ${isMenuOpen ? 'ml-80' : 'ml-0'}`}>
                <div className={`max-w-6xl space-y-12 pb-20 transition-all duration-500 ${isMenuOpen ? 'mr-auto' : 'mx-auto'}`}>
                    <header className="flex flex-col md:flex-row items-center justify-between border-b border-white/5 pb-6">
                        <h2 className="text-4xl font-thin text-white uppercase tracking-[0.2em]">{activeSection === 'admin' ? 'Command Center' : activeSection}</h2>
                        <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm">
                            <div className="text-right"><p className="text-sm font-medium text-cyan-200">{user?.user_metadata?.full_name}</p><p className="text-[10px] text-gray-400 uppercase">{currentRank?.sub_rank || currentRank?.label}</p></div>
                        </div>
                    </header>

                    <div className="animate-fade-in-up">
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
                                                    <span className={`inline-flex items-center px-6 py-2 ${currentRank.id === 'god' ? 'bg-red-900/20 border-red-500/50 shadow-red-500/40' : currentRank.color + ' border ' + currentRank.border + ' ' + currentRank.shadow} border rounded-full font-bold text-xs tracking-[0.2em] uppercase`}>
                                                        {currentRank.sub_rank ? currentRank.sub_rank : currentRank.label}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Additional Profile Info */}
                                </div>
                            </div>
                        )}

                        {activeSection === 'admin' && isGod && (
                            <div className="space-y-8 min-h-[60vh]">
                                {/* Request Panel */}
                                <div>
                                    <h4 className="text-xl font-light text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                                        <span className="w-1.5 h-6 bg-red-500"></span> Pending Requests
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {pendingRequests.map(req => (
                                            <div key={req.id} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-all group">
                                                <div className="mb-4">
                                                    <div className="flex justify-between">
                                                        <div className="text-xs font-bold text-red-400 uppercase tracking-widest">{req.type}</div>
                                                        <div className="text-xs text-blue-400">{req.department}</div>
                                                    </div>
                                                    <h5 className="text-xl font-bold text-white mt-1">{req.full_name}</h5>
                                                    {req.role_title && <p className="text-sm text-yellow-500 mt-1">Applying for: {req.role_title}</p>}
                                                </div>
                                                <div className="flex gap-2 mt-4">
                                                    {/* Dynamic Actions based on Type */}
                                                    {req.type === 'Admin Access' ? (
                                                        <>
                                                            <button onClick={() => handleApprove(req.id, 'Zeus')} className="flex-1 py-2 bg-yellow-500/10 text-yellow-500 rounded border border-yellow-500/20 hover:bg-yellow-500/20 text-xs font-bold">Approve Zeus</button>
                                                            <button onClick={() => handleApprove(req.id, 'Apollo')} className="flex-1 py-2 bg-orange-500/10 text-orange-500 rounded border border-orange-500/20 hover:bg-orange-500/20 text-xs font-bold">Approve Apollo</button>
                                                        </>
                                                    ) : (
                                                        <button onClick={() => handleApprove(req.id)} className="flex-1 py-2 bg-green-500/10 text-green-500 rounded border border-green-500/20 hover:bg-green-500/20 text-xs font-bold">Approve Role</button>
                                                    )}
                                                    <button onClick={() => handleReject(req.id)} className="px-4 py-2 bg-red-500/10 text-red-500 rounded border border-red-500/20 hover:bg-red-500/20 text-xs font-bold">Reject</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Rank Managment is below */}
                                <div className="mt-12">
                                    <h4 className="text-xl font-light text-white mb-6 uppercase tracking-wider flex items-center gap-2"><span className="w-1.5 h-6 bg-red-500"></span> Manage Ranks</h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        {users.filter(u => u.email !== 'dipanshumaheshwari73698@gmail.com').map(u => (
                                            <div key={u.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <p className="text-white font-bold">{u.full_name}</p>
                                                    <p className="text-xs text-blue-400 mt-1">{u.sub_rank || u.rank?.toUpperCase()} <span className="text-gray-500">|</span> {u.role_title || u.department || 'No Role'}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <select className="bg-black/50 border border-white/20 text-white text-xs rounded p-2 focus:border-red-500 outline-none"
                                                        value={u.rank || 'common'} onChange={(e) => handleAssignTag(u.id, e.target.value, (e.target.value !== 'god' ? null : 'Zeus'))}>
                                                        {availableRanks.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                                    </select>
                                                    {u.rank === 'god' && (
                                                        <select className="bg-black/50 border border-white/20 text-yellow-500 text-xs rounded p-2" value={u.sub_rank || 'Zeus'} onChange={(e) => handleAssignTag(u.id, 'god', e.target.value)}>
                                                            <option value="Zeus">Zeus</option><option value="Apollo">Apollo</option><option value="Poseidon">Poseidon</option>
                                                        </select>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Other sections ... */}
                        {activeSection === 'ranks' && (
                            <div className="p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-wrap gap-4 justify-center">
                                {availableRanks.map(rank => <div key={rank.id} className={`p-4 border ${rank.border} rounded-xl text-center`}><h4 className={rank.text}>{rank.label}</h4><p className="text-xs text-gray-400 max-w-[200px] mt-2">{rank.desc}</p></div>)}
                            </div>
                        )}
                        {activeSection === 'users' && (
                            <div className="space-y-8">
                                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md"><h3 className="text-2xl font-light text-white mb-2">User Directory</h3>
                                    <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full mt-4 px-6 py-3 rounded-full bg-black/30 border border-white/10 text-white" />
                                </div>
                                <div className="flex flex-col gap-4">
                                    {filteredUsers.map(u => {
                                        const uRankData = getUserRank(u);
                                        return (
                                            <div key={u.id} className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">{u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : '🚀'}</div>
                                                    <div><h4 className="font-bold text-white">{u.full_name}</h4><p className="text-xs text-gray-500">{u.role_title ? `${u.role_title} @ ${u.department}` : u.email}</p></div>
                                                </div>
                                                <div className="flex items-center gap-4"><span className={`px-4 py-1.5 rounded-full text-[10px] font-bold border ${uRankData.color} ${uRankData.border} text-white`}>{uRankData.sub_rank || uRankData.label}</span></div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                        {activeSection === 'events' && <div className="text-center text-gray-500 py-20">Events Module Loading...</div>}
                        {activeSection === 'about' && <div className="text-center text-gray-500 py-20">About Module Loading...</div>}
                        {activeSection === 'photography' && <div className="text-center text-gray-500 py-20">Photography Module Loading...</div>}

                        {activeSection === 'register' && (
                            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                                <h3 className="text-3xl font-thin mb-12 tracking-[0.3em] text-center text-white/80 uppercase">Select Your Path</h3>
                                <SelectionMenu
                                    onAdminRegister={handleAdminRegisterRequest}
                                    onRoleApply={handleRoleApplyStart}
                                    isLocked={users.some(u => u.sub_rank === 'Zeus') && users.some(u => u.sub_rank === 'Apollo') && !isPoseidon}
                                    isAdmin={currentRank?.id === 'god'}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }`}</style>
        </div>
    );
};

export default Dashboard;
