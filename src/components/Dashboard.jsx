import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import SelectionMenu from './SelectionMenu';
import { SQL_SETUP_SCRIPT, SQL_FIX_CONSTRAINT } from '../lib/databaseSetup';
import Astrophotography from './Astrophotography';
import AstroStudio from './AstroStudio';

const Dashboard = ({ user, onSignOut }) => {
    // Initialize activeSection from session storage if available
    const [activeSection, setActiveSection] = useState(() => {
        return sessionStorage.getItem('dashboardSection') || 'profile';
    });
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [viewingRank, setViewingRank] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Data State
    const [users, setUsers] = useState([]);
    const [adminRequests, setAdminRequests] = useState([]);

    // Application Wizard State
    const [isAppModalOpen, setIsAppModalOpen] = useState(false);
    const [appStep, setAppStep] = useState(1); // 1: Have Role?, 2: Form
    const [appData, setAppData] = useState({});

    // Backup Profile State (Single User)
    const [loadedProfile, setLoadedProfile] = useState(null);

    // Bio Editing State
    const [isBioEditing, setIsBioEditing] = useState(false);
    const [bioInput, setBioInput] = useState('');

    // Loading State
    const [loading, setLoading] = useState(true);

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
        { id: 'elite', label: 'ELITE', color: 'bg-red-900/20', text: 'text-red-400', border: 'border-red-500/50', shadow: 'shadow-red-500/20', desc: 'The Vanguard of the Fleet.', req: 'Reserved for the President, Distinguished Alumni, and Research Team.' },
        { id: 'legendary', label: 'LEGENDARY', color: 'bg-orange-800/20', text: 'text-orange-300', border: 'border-orange-500/50', shadow: 'shadow-orange-500/20', desc: 'A Myth Among Stars.', req: 'Held a leading post: Vice President, General Secretary, Tech/Finance/Content/Design/Web Head, or Telescope Handler.' },
        { id: 'epic', label: 'EPIC', color: 'bg-purple-900/20', text: 'text-purple-300', border: 'border-purple-500/50', shadow: 'shadow-purple-500/20', desc: 'Hero of the Void.', req: 'Awarded to Event Winners and the PR & Branding Team.' },
        { id: 'rare', label: 'RARE', color: 'bg-blue-900/20', text: 'text-blue-300', border: 'border-blue-500/50', shadow: 'shadow-blue-500/20', desc: 'Distinguished Explorer.', req: 'Participate actively in events or work under a leadership post.' },
        { id: 'common', label: 'COMMON', color: 'bg-gray-800/20', text: 'text-gray-300', border: 'border-gray-500/50', shadow: 'shadow-gray-500/20', desc: 'The Journey Begins.', req: 'Join the Astro Club.' },
        { id: 'degradation', label: 'DEGRADATION', color: 'bg-[#1a0f0f]', text: 'text-red-900 line-through opacity-70', border: 'border-red-900/30', shadow: 'shadow-black', desc: 'Fallen Star.', req: 'Violate the intergalactic treaty, violence, inactivity, or misconduct.' },
    ];

    const ROLE_OPTIONS = [
        "President", "Distinguished Alumni", "Research Team",
        "Vice President", "General Secretary",
        "Tech", "Finance", "Content", "Design", "Webdev", "Telescope Handler", "PR & Branding", "Astrophotography Head"
    ];

    const DEPARTMENTS = [
        "Tech", "Finance", "Content", "Design", "Webdev", "Telescope Handler", "PR & Branding", "Astrophotography"
    ];

    // Derived Permissions helpers
    const getUserRank = (targetUser = user) => {
        // Fallback: If targetUser is current user, try to use loadedProfile if not found in users array
        let foundUser = users.find(u => u.email === targetUser?.email);
        if (!foundUser && targetUser?.email === user?.email && loadedProfile) {
            foundUser = loadedProfile;
        }

        const rankId = foundUser?.rank || 'common';
        const rankObj = availableRanks.find(r => r.id === rankId) || availableRanks.find(r => r.id === 'common');
        return { ...rankObj, sub_rank: foundUser?.sub_rank };
    };


    // Helper to get current profile from users array OR loaded backup
    const currentProfile = users.find(u => u.id === user?.id) || loadedProfile;

    const currentRank = getUserRank(user);
    const isPoseidon = user?.email === 'dipanshumaheshwari73698@gmail.com';
    const isGod = currentRank?.id === 'god' || isPoseidon;

    // Check permissions for Astro Studio
    // User must be God OR (Department='Astrophotography' AND Rank IN ['elite', 'legendary'])
    const isAstroHead = ((currentProfile?.department === 'Astrophotography' || currentProfile?.department === 'Astrophotography Head') && (currentRank.id === 'elite' || currentRank.id === 'legendary'));
    const isAstroPrivileged = isGod || isAstroHead;

    const PROJECT_ID = 'zcrqbyszzadtdghcxpvl';

    // Init bio input when profile loads
    useEffect(() => {
        if (currentProfile?.bio) setBioInput(currentProfile.bio);
    }, [currentProfile?.bio]);

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
            if (currentProfile) setLoadedProfile(currentProfile);

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
            const { data: requests, error: reqError } = await supabase.from('admin_requests').select('*').order('created_at', { ascending: false });
            if (!reqError) setAdminRequests(requests || []);
            setLoading(false); // Data loaded
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
    // Setup Screen
    // --------------------------------------------------------------------------------
    if (setupRequired || constraintError) {
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

    // Loading Screen
    if (loading) {
        return (
            <div className="w-full h-full min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    const handleSignOut = async () => { sessionStorage.removeItem('dashboardSection'); await supabase.auth.signOut(); };
    const changeSection = (id) => { setActiveSection(id); sessionStorage.setItem('dashboardSection', id); }
    const handleSectionClick = (id) => {
        if (id === 'admin' && !isGod) { alert("You are not a god please live in to your earth"); return; }
        if (id === 'studio' && !isAstroPrivileged) { alert("Access Denied. Restricted Area."); return; }
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
        const isVerification = appData.hasRole;
        const type = isVerification ? "Role Verification" : "Job Application";
        const roleTitle = appData.position || (DEPARTMENTS.includes(appData.selectedRole) ? 'Member' : 'Officer');

        const payload = {
            user_id: user.id,
            email: user.email,
            full_name: user?.user_metadata?.full_name || 'Anonymous',
            type: type,
            status: 'Pending',
            department: appData.selectedRole,
            role_title: appData.roleTitle || roleTitle,
            request_data: appData
        };

        const { error } = await supabase.from('admin_requests').insert([payload]);

        if (error) {
            console.error(error);
            alert("Failed to submit application: " + error.message);
        } else {
            alert(isVerification ? "Verification request sent to Zeus Command Center." : `Application submitted to ${appData.selectedRole} Head.`);
            setIsAppModalOpen(false);
        }
    };

    // --------------------------------------------------------------------------------
    // Admin Handlers
    // --------------------------------------------------------------------------------
    const handleAdminRegisterRequest = async () => {
        const { error } = await supabase.from('admin_requests').insert([{
            user_id: user.id, email: user.email, full_name: user.user_metadata?.full_name || 'Anonymous',
            type: 'Admin Access', status: 'Pending'
        }]);
        if (error) alert("Failed: " + error.message);
        else { alert("Request sent to Poseidon."); setActiveSection('profile'); }
    };

    const handleApprove = async (reqId, subRank = 'Zeus') => {
        const req = adminRequests.find(r => r.id === reqId);
        if (!req) return;

        if (req.email === 'dipanshumaheshwari73698@gmail.com' && !isPoseidon) {
            alert("Thou shall not judge the Creator.");
            return;
        }

        if (req.type === 'Admin Access') {
            const { error } = await supabase.from('admin_requests').update({ status: 'Approved', approved_by: user.email }).eq('id', reqId);
            if (!error) await supabase.from('profiles').update({ rank: 'god', sub_rank: subRank }).eq('id', req.user_id);
            setAdminRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'Approved', approved_by: user.email } : r));
        } else {
            const { error } = await supabase.from('admin_requests').update({ status: 'Approved', approved_by: user.email }).eq('id', reqId);
            if (!error) {
                let newRank = 'common';
                if (req.role_title === 'Head' || req.department === 'Vice President' || req.department === 'General Secretary' || req.department === 'Astrophotography Head') newRank = 'legendary';
                else if (req.department === 'President' || req.department === 'Distinguished Alumni' || req.department === 'Research Team') newRank = 'elite';
                else if (req.role_title === 'Member') newRank = 'rare';

                await supabase.from('profiles').update({
                    rank: newRank,
                    department: req.department,
                    role_title: req.role_title
                }).eq('id', req.user_id);

                alert(`Application Approved. User set to ${newRank}.`);
                setAdminRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'Approved', approved_by: user.email } : r));
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

        // Poseidon Protection: Ensure only Poseidon can edit Poseidon or assign Poseidon rank
        if (targetUser?.email === 'dipanshumaheshwari73698@gmail.com' && !isPoseidon) { alert("Thou shall not alter the Creator."); return; }
        if (subRank === 'Poseidon' && !isPoseidon) { alert("Only the Creator can appoint a Poseidon."); return; }

        const { error } = await supabase.from('profiles').update({ rank: newRankId, sub_rank: subRank }).eq('id', userId);
        if (error) alert("Failed."); else {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, rank: newRankId, sub_rank: subRank } : u));
        }
    };

    const handleBioSave = async () => {
        if (!user) return;
        const { error } = await supabase.from('profiles').update({ bio: bioInput }).eq('id', user.id);
        if (error) {
            alert("Failed to save transmission log.");
        } else {
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, bio: bioInput } : u));
            setIsBioEditing(false);
        }
    };

    const filteredUsers = users.filter(u => u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const pendingRequests = adminRequests.filter(r => r.status === 'Pending');

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
                                    <select className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        onChange={(e) => setAppData({ ...appData, selectedRole: e.target.value })}>
                                        <option value="">-- Select --</option>
                                        {appData.hasRole ? ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>) : DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                {DEPARTMENTS.includes(appData.selectedRole) && (
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Your Position</label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="pos" value="Head" onChange={(e) => setAppData({ ...appData, roleTitle: 'Head' })} /><span className="text-sm">Head</span></label>
                                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="pos" value="Member" onChange={(e) => setAppData({ ...appData, roleTitle: 'Member' })} /><span className="text-sm">Member</span></label>
                                        </div>
                                    </div>
                                )}
                                <button onClick={handleAppSubmit} disabled={!appData.selectedRole} className="w-full py-3 bg-white text-black font-bold uppercase tracking-widest rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">Submit Application</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="fixed top-6 left-6 z-[200] p-2 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all text-2xl shadow-[0_0_15px_rgba(255,255,255,0.1)]">{isMenuOpen ? '✕' : '☰'}</button>

            <aside className={`fixed top-0 left-0 h-full w-80 z-[150] bg-white/0 backdrop-blur-xl border-r border-white/5 transform transition-transform duration-500 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col pt-28 pb-8`}>
                <div className="px-8 mb-8"><div className="text-xl font-light tracking-[0.2em] text-cyan-300 uppercase opacity-80">Content Table</div></div>
                <nav className="flex-1 w-full flex flex-col gap-6 px-6 overflow-y-auto no-scrollbar">
                    {[{ id: 'profile', label: 'My Profile' }, { id: 'admin', label: 'Command Center' }, { id: 'studio', label: 'Astro Studio' }, { id: 'ranks', label: 'Rank Library' }, { id: 'users', label: 'User Directory' }, { id: 'photography', label: 'Astro Photography' }, { id: 'events', label: 'Events & Activities' }, { id: 'about', label: 'About Club' }, { id: 'register', label: 'Registration' }].map((section) => (
                        <button key={section.id} onClick={() => handleSectionClick(section.id)} className={`w-full text-left px-6 py-2 rounded-xl text-lg tracking-wide font-light transition-all duration-300 ${activeSection === section.id ? 'text-white border-l-2 border-white pl-8 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'text-gray-400 hover:text-white hover:pl-8 border-l-2 border-transparent'} flex items-center justify-between group`}>
                            <span>{section.label}</span>
                            {section.id === 'admin' && !isGod && <span className="text-sm opacity-50 group-hover:opacity-100 transition-opacity">🔒</span>}
                            {section.id === 'studio' && !isAstroPrivileged && <span className="text-sm opacity-50 group-hover:opacity-100 transition-opacity">🚫</span>}
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
                                                    <div className="flex flex-col gap-2">
                                                        <span className={`inline-flex items-center justify-center px-6 py-2 ${currentRank.id === 'god' ? 'bg-red-900/20 border-red-500/50 shadow-red-500/40' : currentRank.color + ' border ' + currentRank.border + ' ' + currentRank.shadow} border rounded-full font-bold text-xs tracking-[0.2em] uppercase`}>
                                                            {currentRank.sub_rank ? currentRank.sub_rank : currentRank.label}
                                                        </span>
                                                        {(currentProfile?.department || currentProfile?.role_title) && (
                                                            <span className="text-[10px] text-cyan-300 uppercase tracking-widest bg-cyan-900/20 px-3 py-1 rounded-full border border-cyan-500/30">
                                                                {currentProfile?.role_title || 'Member'} @ {currentProfile?.department || 'General'}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-10 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                                            <div className="p-4 rounded-2xl bg-black/20 text-center"><span className="block text-gray-400 text-xs uppercase tracking-widest mb-1">Joined</span><span className="text-lg font-mono text-white">{new Date(user?.created_at).toLocaleDateString()}</span></div>
                                            <div className="p-4 rounded-2xl bg-black/20 text-center"><span className="block text-gray-400 text-xs uppercase tracking-widest mb-1">Status</span><span className="text-lg font-mono text-green-400">Active</span></div>
                                        </div>
                                    </div>

                                    {/* BIO & ACHIEVEMENTS */}
                                    <div className="flex flex-col gap-6">
                                        {/* Introduce Yourself */}
                                        <div className="flex-1 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:border-white/20 transition-all flex flex-col min-h-[250px]">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-xl font-bold text-white flex items-center gap-3"><span className="w-2 h-8 bg-blue-500 rounded-full"></span>Transmission Log</h3>
                                                <button onClick={() => isBioEditing ? handleBioSave() : setIsBioEditing(true)} className="text-xs uppercase font-bold tracking-wider text-blue-400 hover:text-white transition-colors">
                                                    {isBioEditing ? 'Save Log' : 'Edit Log'}
                                                </button>
                                            </div>
                                            {isBioEditing ? (
                                                <textarea
                                                    className="w-full h-full bg-black/30 border border-white/10 rounded-xl p-4 text-gray-300 focus:outline-none focus:border-blue-500/50 resize-none min-h-[150px]"
                                                    value={bioInput}
                                                    onChange={(e) => setBioInput(e.target.value)}
                                                    placeholder="Write your signal to the universe..."
                                                />
                                            ) : (
                                                <div className="space-y-4 pl-4 border-l border-white/10 ml-1 h-full">
                                                    <p className="text-gray-400 italic leading-relaxed whitespace-pre-wrap">
                                                        {currentProfile?.bio || "No transmission recorded. The galaxy awaits your story."}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Achievements Placeholder */}
                                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                                            <h4 className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-6 border-b border-white/5 pb-2">Achievement Badges</h4>
                                            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                                                <div className="group relative shrink-0"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-600/20 border border-yellow-500/30 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all duration-300 cursor-help shadow-lg">🥚</div></div>
                                                {currentRank?.id === 'god' && <div className="group relative shrink-0"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-purple-600/20 border border-red-500/30 flex items-center justify-center text-xl cursor-help shadow-lg">🔱</div></div>}
                                                {(currentProfile?.role_title === 'Head' || currentRank?.id === 'legendary') && <div className="group relative shrink-0"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 flex items-center justify-center text-xl cursor-help shadow-lg">💠</div></div>}
                                                <div className="group relative shrink-0 opacity-30"><div className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center text-xl">🔒</div></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* USER DIRECTORY SPLIT */}
                        {activeSection === 'users' && (
                            <div className="space-y-12">
                                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                                    <h3 className="text-2xl font-light text-white mb-2">User Directory</h3>
                                    <input type="text" placeholder="Search explorer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full mt-4 px-6 py-3 rounded-full bg-black/30 border border-white/10 text-white focus:outline-none focus:border-blue-500/50" />
                                </div>

                                {/* SECTION 1: MEMBERS (God to Rare, except Event Winners from Epic) */}
                                <div>
                                    <h4 className="text-xl font-light text-cyan-300 mb-6 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <span className="w-1.5 h-6 bg-cyan-500"></span> Currently Member of AstroClub
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filteredUsers.filter(u => {
                                            const r = u.rank || 'common';
                                            // God, Elite, Legendary, Rare are always members
                                            if (['god', 'elite', 'legendary', 'rare'].includes(r)) return true;
                                            // Epic: Include ONLY if PR & Branding (explicit member team from description)
                                            if (r === 'epic') {
                                                if (u.department === 'PR & Branding') return true;
                                                return false; // Assume Event Winner
                                            }
                                            return false;
                                        }).map(u => {
                                            const uRankData = getUserRank(u);
                                            return (
                                                <div key={u.id} className="p-4 rounded-xl bg-cyan-900/10 border border-cyan-500/20 flex items-center justify-between gap-4 hover:bg-cyan-900/20 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border border-white/10">
                                                            {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : '🚀'}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-white text-sm">{u.full_name}</h4>
                                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{u.role_title || u.department || 'Member'}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold border ${uRankData.color} ${uRankData.border} text-white uppercase`}>
                                                        {uRankData.sub_rank || uRankData.label}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* SECTION 2: ALL USERS (Everyone, but emphasized for Community) */}
                                <div>
                                    <h4 className="text-xl font-light text-gray-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <span className="w-1.5 h-6 bg-gray-600"></span> Galactic Community
                                    </h4>
                                    <div className="flex flex-col gap-4">
                                        {filteredUsers.map(u => {
                                            const uRankData = getUserRank(u);
                                            return (
                                                <div key={u.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden opacity-70">
                                                            {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : '👤'}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-300 text-sm">{u.full_name}</h4>
                                                            <p className="text-[10px] text-gray-600">{u.email}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold border ${uRankData.color} ${uRankData.border} text-white opacity-80 uppercase`}>
                                                        {uRankData.sub_rank || uRankData.label}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'admin' && isGod && (
                            <div className="space-y-8 min-h-[60vh]">
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
                                                            <option value="Zeus">Zeus</option>
                                                            <option value="Apollo">Apollo</option>
                                                        </select>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* RANK LIBRARY INTERACTIVE */}
                        {activeSection === 'ranks' && (
                            <div className="min-h-[60vh]">
                                {viewingRank ? (
                                    <div className="animate-fade-in-up">
                                        <button onClick={() => setViewingRank(null)} className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Library
                                        </button>

                                        <div className={`p-10 rounded-3xl bg-white/5 border ${viewingRank.border} backdrop-blur-md relative overflow-hidden`}>
                                            <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none opacity-20 ${viewingRank.color.split(' ')[1]}`}></div>

                                            <div className="relative z-10">
                                                <h3 className={`text-5xl font-bold mb-4 ${viewingRank.text} tracking-tight`}>{viewingRank.label}</h3>
                                                <p className="text-xl text-white/80 font-light tracking-wide mb-8 max-w-2xl">{viewingRank.desc}</p>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-white/10 pt-8">
                                                    <div>
                                                        <h4 className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-4">Requirements</h4>
                                                        <p className="text-gray-300 leading-relaxed">{viewingRank.req}</p>
                                                    </div>

                                                    {viewingRank.subCategories && (
                                                        <div>
                                                            <h4 className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-4">Hierarchical Structure</h4>
                                                            <div className="space-y-4">
                                                                {viewingRank.subCategories.map((sub, idx) => (
                                                                    <div key={idx} className="p-4 rounded-xl bg-black/20 border border-white/5 hover:border-white/20 transition-all">
                                                                        <div className="flex items-center justify-between mb-1">
                                                                            <span className={`font-bold ${sub.color}`}>{sub.name}</span>
                                                                            <span className="text-[10px] uppercase text-gray-500 tracking-wider">{sub.title}</span>
                                                                        </div>
                                                                        <p className="text-sm text-gray-400">{sub.desc}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-wrap gap-6 justify-center">
                                        {availableRanks.map(rank => (
                                            <div
                                                key={rank.id}
                                                onClick={() => setViewingRank(rank)}
                                                className={`p-6 border ${rank.border} rounded-2xl text-center w-64 hover:scale-105 transition-all duration-300 cursor-pointer group bg-black/20 hover:bg-white/5 relative overflow-hidden`}
                                            >
                                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${rank.color.split(' ')[1] ? rank.color.split(' ')[1].replace('bg-', 'from-') + ' to-transparent' : 'from-white to-transparent'}`}></div>
                                                <h4 className={`text-xl font-bold mb-2 ${rank.text} group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all`}>{rank.label}</h4>
                                                <p className="text-xs text-gray-400 group-hover:text-gray-300 line-clamp-2">{rank.desc}</p>
                                                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] uppercase tracking-widest text-white/50">View Details</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeSection === 'events' && <div className="text-center text-gray-500 py-20">Events Module Loading...</div>}
                        {activeSection === 'about' && <div className="text-center text-gray-500 py-20">About Module Loading...</div>}

                        {activeSection === 'photography' && <Astrophotography isAstroHead={isAstroHead} isGod={isGod} />}
                        {activeSection === 'studio' && isAstroPrivileged && <AstroStudio user={user} />}

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
