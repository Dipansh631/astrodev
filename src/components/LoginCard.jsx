import React, { useState } from 'react';

const LoginCard = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Login attempt:", { username, password });
        if (onLogin) onLogin();
    };

    return (
        <div className="w-full max-w-md p-8 rounded-2xl backdrop-blur-lg bg-white/10 border border-white/20 shadow-xl overflow-hidden transform transition-all hover:scale-[1.01]">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

            <h2 className="text-3xl font-bold text-center text-white mb-8 tracking-wider drop-shadow-lg">
                SPACE LOGIN
            </h2>

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
            </form>

            <p className="mt-6 text-center text-gray-400 text-sm">
                Forgot your coordinates? <a href="#" className="text-blue-400 hover:text-blue-300">Reset Navigation</a>
            </p>
        </div>
    );
};

export default LoginCard;
