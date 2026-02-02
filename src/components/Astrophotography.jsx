import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const Astrophotography = ({ isAstroHead, isGod }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, legendary
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ title: '', description: '' });
    const [isSaving, setIsSaving] = useState(false);

    const isPrivileged = isAstroHead || isGod;

    useEffect(() => {
        fetchPosts();
    }, []);

    // Reset edit state when photo changes
    useEffect(() => {
        setIsEditing(false);
        if (selectedPhoto) {
            setEditData({ title: selectedPhoto.title, description: selectedPhoto.description || '' });
        }
    }, [selectedPhoto]);

    const fetchPosts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('content')
            .select('*')
            .eq('section', 'astrophotography')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching posts:', error);
        else setPosts(data || []);
        setLoading(false);
    };

    const handleDelete = async (post) => {
        if (!confirm("Are you sure you want to delete this artifact? This cannot be undone.")) return;

        try {
            const { error: dbError } = await supabase.from('content').delete().eq('id', post.id);
            if (dbError) throw dbError;

            const urlParts = post.image_url.split('astro_gallery/');
            if (urlParts.length > 1) {
                await supabase.storage.from('astro_gallery').remove([urlParts[1]]);
            }

            setPosts(prev => prev.filter(p => p.id !== post.id));
            if (selectedPhoto?.id === post.id) setSelectedPhoto(null);
            alert("Artifact removed.");

        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete: " + error.message);
        }
    };

    const handleUpdate = async () => {
        if (!editData.title.trim()) {
            alert("Title cannot be empty.");
            return;
        }

        try {
            setIsSaving(true);
            const { error } = await supabase
                .from('content')
                .update({
                    title: editData.title,
                    description: editData.description
                })
                .eq('id', selectedPhoto.id);

            if (error) throw error;

            // Update local state
            const updatedPhoto = { ...selectedPhoto, ...editData };
            setSelectedPhoto(updatedPhoto);
            setPosts(prev => prev.map(p => p.id === updatedPhoto.id ? updatedPhoto : p));
            setIsEditing(false);
            alert("Signal Parameters Updated.");

        } catch (error) {
            console.error("Update failed:", error);
            alert("Failed to update: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredPosts = posts.filter(post => {
        if (filter === 'legendary') return post.tags && post.tags.includes('legendary');
        return true;
    });

    return (
        <div className="w-full min-h-[60vh] animate-fade-in-up relative">
            <header className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-3xl font-thin uppercase tracking-[0.2em] text-white">Stellar Gallery</h1>
                    <p className="text-gray-400 text-sm mt-2 font-light">Capturing the silent whispers of the cosmos.</p>
                </div>

                <div className="flex gap-2 mt-4 md:mt-0">
                    <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-white/10 text-white border border-white/20' : 'text-gray-500 hover:text-white'}`}>All Shots</button>
                    <button onClick={() => setFilter('legendary')} className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest transition-all ${filter === 'legendary' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'text-gray-600 hover:text-yellow-500/70'}`}>Legendary</button>
                </div>
            </header>

            {loading ? (
                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPosts.length > 0 ? (
                        filteredPosts.map((post) => (
                            <div key={post.id} onClick={() => setSelectedPhoto(post)} className="group relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-500 h-80 cursor-pointer">
                                <img
                                    src={post.image_url}
                                    alt={post.title}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
                                {post.tags && post.tags.includes('legendary') && (
                                    <div className="absolute top-4 right-4 bg-yellow-500/20 backdrop-blur-md border border-yellow-500/50 text-yellow-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_10px_rgba(234,179,8,0.3)]">Legendary</div>
                                )}
                                <div className="absolute bottom-0 left-0 w-full p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">{post.title}</h3>
                                    {post.description && <p className="text-sm text-gray-400 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity delay-100 duration-300">{post.description}</p>}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20"><p className="text-gray-500 text-lg font-light">The void is empty... for now.</p></div>
                    )}
                </div>
            )}

            {/* DETAIL MODAL */}
            {selectedPhoto && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in-up" onClick={() => setSelectedPhoto(null)}>
                    <div className="max-w-6xl w-full h-[80vh] md:h-[80vh] bg-[#050505] border border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setSelectedPhoto(null)} className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-white/20 transition-all border border-white/10">✕</button>

                        <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden group p-4">
                            <img src={selectedPhoto.image_url} className="max-w-full max-h-full object-contain shadow-2xl" alt={selectedPhoto.title} />
                        </div>

                        <div className="w-full md:w-[400px] bg-[#0a0a0a] border-l border-white/10 p-8 flex flex-col overflow-y-auto">
                            <div className="mb-auto">
                                <div className="flex gap-2 mb-4 flex-wrap">
                                    {selectedPhoto.tags && selectedPhoto.tags.map(tag => <span key={tag} className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 bg-white/5 border border-white/10 rounded text-gray-400">{tag}</span>)}
                                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 bg-blue-900/10 border border-blue-500/20 rounded text-blue-400">Public Gallery</span>
                                </div>

                                {isEditing ? (
                                    <div className="space-y-4 animate-fade-in-up">
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Title</label>
                                            <input
                                                type="text"
                                                value={editData.title}
                                                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                                className="w-full bg-white/5 border border-white/20 p-2 rounded text-white text-xl font-bold focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Description</label>
                                            <textarea
                                                rows="6"
                                                value={editData.description}
                                                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                                className="w-full bg-white/5 border border-white/20 p-2 rounded text-gray-300 text-sm focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button onClick={handleUpdate} disabled={isSaving} className="flex-1 bg-blue-600/20 text-blue-400 border border-blue-500/50 py-2 rounded font-bold uppercase tracking-widest hover:bg-blue-600/30 text-xs">
                                                {isSaving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            <button onClick={() => setIsEditing(false)} disabled={isSaving} className="px-4 py-2 bg-white/5 text-gray-400 border border-white/10 rounded font-bold uppercase tracking-widest hover:bg-white/10 text-xs">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-3xl font-bold text-white mb-4 leading-tight">{selectedPhoto.title}</h2>
                                        <div className="text-xs text-gray-500 font-mono mb-8 pb-4 border-b border-white/5 flex items-center gap-2">
                                            <span>Date: {new Date(selectedPhoto.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedPhoto.description || "No description provided."}</p>
                                    </>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/5 flex gap-2">
                                {isPrivileged && !isEditing && (
                                    <>
                                        <button onClick={() => setIsEditing(true)} className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                            <span>✏️</span> Edit
                                        </button>
                                        <button onClick={() => handleDelete(selectedPhoto)} className="flex-1 py-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-500 font-bold uppercase tracking-widest hover:bg-red-500/10 transition-all flex items-center justify-center gap-2">
                                            <span>🗑️</span> Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Astrophotography;
