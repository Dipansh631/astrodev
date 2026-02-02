import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AstroStudio = ({ user }) => {
    const [uploading, setUploading] = useState(false);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [section, setSection] = useState('astrophotography'); // 'astrophotography' or 'astro_studio'
    const [isLegendary, setIsLegendary] = useState(false);
    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        fetchStudioContent();
    }, []);

    const fetchStudioContent = async () => {
        setLoading(true);
        // Only fetch 'astro_studio' private content here, OR everything if we want to manage everything
        // Users asked for "Astro Studio" section to be accessible by gods/heads
        // Let's show the private studio content here
        const { data, error } = await supabase
            .from('content')
            .select('*')
            .eq('section', 'astro_studio')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching studio content:', error);
        else setPosts(data || []);

        setLoading(false);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!imageFile || !title) {
            alert("Please provide an image and a title.");
            return;
        }

        try {
            setUploading(true);

            // 1. Upload Image to Storage
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('astro_gallery')
                .upload(filePath, imageFile);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            // Note: Even private buckets need a way to sign URLs, but here we made the bucket public read.
            // But we restricted upload.
            const { data: { publicUrl } } = supabase.storage
                .from('astro_gallery')
                .getPublicUrl(filePath);

            // 3. Create Database Record
            const tags = [];
            if (isLegendary) tags.push('legendary');

            const { error: dbError } = await supabase
                .from('content')
                .insert([{
                    title,
                    description,
                    image_url: publicUrl,
                    section, // 'astrophotography' or 'astro_studio'
                    tags,
                    author_id: user.id
                }]);

            if (dbError) throw dbError;

            alert("Transmission Successful! Artifact archived.");

            // Reset Form
            setTitle('');
            setDescription('');
            setImageFile(null);
            setIsLegendary(false);

            // Refresh list if we added to studio
            if (section === 'astro_studio') {
                fetchStudioContent();
            }

        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full min-h-[60vh] animate-fade-in-up pb-20">
            <header className="mb-12 border-b border-white/10 pb-6">
                <h1 className="text-4xl font-thin uppercase tracking-[0.2em] text-red-400 flex items-center gap-3">
                    <span className="text-3xl">🛑</span> Astro Studio <span className="text-xs bg-red-900/40 text-red-300 px-2 py-1 rounded border border-red-500/30">Restricted Access</span>
                </h1>
                <p className="text-gray-400 mt-2 font-light">
                    Upload and manage high-clearance visual data.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                {/* UPLOAD FORM */}
                <div className="lg:col-span-1">
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md sticky top-8">
                        <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">New Transmission</h3>

                        <form onSubmit={handleUpload} className="space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-2 tracking-widest">Artifact Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-red-500/50 transition-all"
                                    placeholder="e.g. Nebula-X99"
                                />
                            </div>

                            {/* Section */}
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-2 tracking-widest">Target Sector</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSection('astrophotography')}
                                        className={`p-3 rounded-xl border text-xs font-bold transition-all ${section === 'astrophotography' ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'bg-black/20 border-white/10 text-gray-500 hover:border-white/30'}`}
                                    >
                                        Public Gallery
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSection('astro_studio')}
                                        className={`p-3 rounded-xl border text-xs font-bold transition-all ${section === 'astro_studio' ? 'bg-red-500/20 border-red-500 text-red-300' : 'bg-black/20 border-white/10 text-gray-500 hover:border-white/30'}`}
                                    >
                                        Astro Studio
                                    </button>
                                </div>
                            </div>

                            {/* Legendary Checkbox */}
                            <div>
                                <label className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5 cursor-pointer hover:bg-yellow-900/10 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={isLegendary}
                                        onChange={(e) => setIsLegendary(e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-600 text-yellow-500 focus:ring-yellow-500 bg-gray-900"
                                    />
                                    <span className={`text-sm font-bold ${isLegendary ? 'text-yellow-400' : 'text-gray-400'}`}>Mark as LEGENDARY</span>
                                </label>
                            </div>

                            {/* File Input */}
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-2 tracking-widest">Visual Data</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-2 tracking-widest">Description</label>
                                <textarea
                                    rows="4"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-red-500/50 transition-all resize-none"
                                    placeholder="Enter detailed analysis..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={uploading}
                                className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all ${uploading ? 'bg-gray-700 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200 hover:scale-[1.02]'}`}
                            >
                                {uploading ? 'Transmitting...' : 'Upload Artifact'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* STUDIO GALLERY (Private Content) */}
                <div className="lg:col-span-2 space-y-8">
                    <h3 className="text-2xl font-light text-white uppercase tracking-widest border-b border-white/5 pb-4">
                        Confidential Archives (Studio Only)
                    </h3>

                    {loading ? (
                        <div className="flex items-center justify-center h-48 opacity-50">Loading archives...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {posts.map(post => (
                                <div key={post.id} className="group relative rounded-xl overflow-hidden bg-black/40 border border-white/10">
                                    <div className="aspect-video overflow-hidden">
                                        <img src={post.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    </div>
                                    <div className="p-4">
                                        <h4 className="font-bold text-white text-lg">{post.title}</h4>
                                        <p className="text-xs text-gray-500 font-mono mt-1 mb-2">{new Date(post.created_at).toLocaleDateString()}</p>
                                        <div className="flex gap-2">
                                            {post.tags && post.tags.map(t => (
                                                <span key={t} className="text-[9px] uppercase border border-white/20 px-2 py-0.5 rounded text-gray-400">{t}</span>
                                            ))}
                                            <span className="text-[9px] uppercase border border-red-500/30 px-2 py-0.5 rounded text-red-400 bg-red-900/10">Private</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {posts.length === 0 && (
                                <div className="text-gray-500 italic text-sm">No classified artifacts found in studio.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AstroStudio;
