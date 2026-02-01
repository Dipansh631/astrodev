import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const LoginCard = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Login attempt:", { username, password });
        if (onLogin) onLogin();
    };

    const handleGoogleLogin = async () => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
            // Note: The actual redirect happens here, so onLogin() won't be called immediately.
            // After redirect, the session will be restored.
        } catch (error) {
            console.error('Error logging in with Google:', error.message);
            alert('Error logging in with Google. Please try again.');
        }
    };

    return (
        <div className="w-full max-w-md p-8 rounded-2xl backdrop-blur-lg bg-white/10 border border-white/20 shadow-xl overflow-hidden transform transition-all hover:scale-[1.01]">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

            <div className="flex flex-col items-center justify-center mb-8 space-y-4">
                <img
                    src="/assets/GLA_University_logo.webp"
                    alt="GLA University Logo"
                    className="w-24 h-24 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                />
                <h2 className="text-2xl md:text-3xl font-bold text-center text-white tracking-wider drop-shadow-lg uppercase">
                    Astro Club <br /> <span className="text-xl md:text-2xl text-blue-300">GLA University</span>
                </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="peer w-full px-4 py-3 bg-white/5 border border-white/30 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                        placeholder="Username"
                        autoComplete="username"
                    />
                    <label
                        htmlFor="username"
                        className="absolute left-4 -top-2.5 bg-[#242424]/0 px-1 text-sm text-blue-300 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-blue-300 peer-focus:text-sm"
                    >
                        Username
                    </label>
                </div>

                <div className="relative">
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="peer w-full px-4 py-3 bg-white/5 border border-white/30 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                        placeholder="Password"
                        autoComplete="current-password"
                    />
                    <label
                        htmlFor="password"
                        className="absolute left-4 -top-2.5 bg-[#242424]/0 px-1 text-sm text-purple-300 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-purple-300 peer-focus:text-sm"
                    >
                        Password
                    </label>
                </div>

                <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-semibold text-lg hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform transition-all active:scale-95 shadow-lg shadow-purple-500/30"
                >
                    Enter Orbit
                </button>

                <div className="flex items-center py-2">
                    <div className="flex-1 h-px bg-white/20"></div>
                    <div className="px-4 text-sm text-gray-400">or</div>
                    <div className="flex-1 h-px bg-white/20"></div>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full py-3 bg-white text-gray-900 rounded-lg flex items-center justify-center gap-3 font-semibold hover:bg-gray-100 transition-all active:scale-95 shadow-lg"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Sign in with Google
                </button>
            </form>

            <p className="mt-6 text-center text-gray-400 text-sm">
                Forgot your coordinates? <a href="#" className="text-blue-400 hover:text-blue-300">Reset Navigation</a>
            </p>
        </div>
    );
};

export default LoginCard;
