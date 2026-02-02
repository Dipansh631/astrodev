import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const Astrophotography = ({ isAstroHead, isGod }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, legendary

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        // Fetch public astrophotography posts
        // We order by created_at desc
        const { data, error } = await supabase
            .from('content')
            .select('*')
            .eq('section', 'astrophotography')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching posts:', error);
        } else {
            setPosts(data || []);
        }
        setLoading(false);
    };

    const filteredPosts = posts.filter(post => {
        if (filter === 'legendary') {
            return post.tags && post.tags.includes('legendary');
        }
        return true;
    });

    return (
        <div className="w-full min-h-[60vh] animate-fade-in-up">
            <header className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-3xl font-thin uppercase tracking-[0.2em] text-white">
                        Stellar Gallery
                    </h1>
                    <p className="text-gray-400 text-sm mt-2 font-light">
                        Capturing the silent whispers of the cosmos.
                    </p>
                </div>

                <div className="flex gap-2 mt-4 md:mt-0">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-white/10 text-white border border-white/20' : 'text-gray-500 hover:text-white'}`}
                    >
                        All Shots
                    </button>
                    <button
                        onClick={() => setFilter('legendary')}
                        className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest transition-all ${filter === 'legendary' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'text-gray-600 hover:text-yellow-500/70'}`}
                    >
                        Legendary
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPosts.length > 0 ? (
                        filteredPosts.map((post) => (
                            <div key={post.id} className="group relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-500 h-80">
                                {/* Image */}
                                <img
                                    src={post.image_url}
                                    alt={post.title}
                                    onError={(e) => {
                                        console.error("Image Load Failed:", post.image_url);
                                        e.target.style.display = 'none'; // Optional: Hide broken image or show fallback
                                        // e.target.src = '/fallback_star.png';
                                    }}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />

                                {/* Overlay gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

                                {/* Legenday Badge */}
                                {post.tags && post.tags.includes('legendary') && (
                                    <div className="absolute top-4 right-4 bg-yellow-500/20 backdrop-blur-md border border-yellow-500/50 text-yellow-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                                        Legendary
                                    </div>
                                )}

                                {/* Content Info */}
                                <div className="absolute bottom-0 left-0 w-full p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">
                                        {post.title}
                                    </h3>
                                    {post.description && (
                                        <p className="text-sm text-gray-400 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity delay-100 duration-300">
                                            {post.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20">
                            <p className="text-gray-500 text-lg font-light">The void is empty... for now.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Astrophotography;
